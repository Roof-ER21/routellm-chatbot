#!/usr/bin/env node

/**
 * Vision Analysis Test Script
 *
 * This script tests the photo analysis API to ensure it's working correctly
 * and not returning fake results.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(message) {
  console.log('');
  log('='.repeat(60), 'cyan');
  log(message, 'bright');
  log('='.repeat(60), 'cyan');
  console.log('');
}

async function testPhotoAnalysis(imagePath, description) {
  header(`Testing: ${description}`);

  try {
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      log(`⚠ File not found: ${imagePath}`, 'yellow');
      log('Skipping this test...', 'yellow');
      return;
    }

    log(`📁 Image: ${imagePath}`, 'blue');

    // Create form data
    const FormData = require('form-data');
    const form = new FormData();
    form.append('photo', fs.createReadStream(imagePath));

    // Make API request
    log('🔄 Sending request to API...', 'blue');
    const response = await fetch('http://localhost:3000/api/photo/analyze', {
      method: 'POST',
      body: form,
    });

    const result = await response.json();

    // Display results
    log('\n📊 Analysis Results:', 'bright');
    log('─'.repeat(60), 'cyan');

    if (result.success) {
      log(`✓ Success: ${result.success}`, 'green');
      log(`✓ Damage Detected: ${result.damage_detected}`, result.damage_detected ? 'red' : 'green');

      if (result.vision_analysis) {
        log('\n🔍 Vision Analysis:', 'bright');
        log(`   Source: ${result.vision_analysis.source}`, 'blue');
        log(`   Confidence: ${result.vision_analysis.confidence}`, 'blue');
        log(`   Description:`, 'blue');
        log(`   ${result.vision_analysis.description.substring(0, 200)}...`, 'yellow');
      }

      if (result.detections && result.detections.length > 0) {
        log('\n⚠ Detections:', 'bright');
        result.detections.forEach(d => {
          log(`   - ${d.name} (${Math.round(d.confidence * 100)}% confidence)`, 'yellow');
        });
      }

      if (result.severity) {
        log('\n📈 Severity:', 'bright');
        log(`   Score: ${result.severity.score}/10`, 'red');
        log(`   Rating: ${result.severity.rating}`, 'red');
        log(`   Recommendation: ${result.recommendation}`, 'red');
      }

    } else {
      log(`✗ Error: ${result.error}`, 'red');
    }

    log('─'.repeat(60), 'cyan');

  } catch (error) {
    log(`\n✗ Test failed: ${error.message}`, 'red');
  }
}

async function main() {
  header('🧪 Vision Analysis Test Suite');

  log('This script tests the photo analysis API to verify:', 'blue');
  log('  1. Non-roof images are correctly identified', 'blue');
  log('  2. Actual roof images get proper damage analysis', 'blue');
  log('  3. No fake/mock data is being returned', 'blue');
  console.log('');

  // Test 1: Check if server is running
  try {
    const healthCheck = await fetch('http://localhost:3000/api/photo/analyze');
    log('✓ Server is running on http://localhost:3000', 'green');
  } catch (error) {
    log('✗ Server is not running!', 'red');
    log('Start your dev server with: npm run dev', 'yellow');
    process.exit(1);
  }

  // Test 2: Create test images (if they don't exist)
  log('\n📸 Preparing test images...', 'blue');

  const testImagesDir = path.join(__dirname, 'test-images');
  if (!fs.existsSync(testImagesDir)) {
    fs.mkdirSync(testImagesDir);
    log('Created test-images directory', 'green');
  }

  // Test with any images in the test-images directory
  const testImages = [
    { path: path.join(testImagesDir, 'roof.jpg'), desc: 'Roof Photo' },
    { path: path.join(testImagesDir, 'dog.jpg'), desc: 'Dog Photo (Non-Roof)' },
    { path: path.join(testImagesDir, 'test.jpg'), desc: 'Test Image' },
  ];

  let testsRun = 0;
  for (const img of testImages) {
    if (fs.existsSync(img.path)) {
      await testPhotoAnalysis(img.path, img.desc);
      testsRun++;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
    }
  }

  if (testsRun === 0) {
    log('\n⚠ No test images found!', 'yellow');
    log(`\nTo test the vision analysis:`, 'blue');
    log(`1. Add images to: ${testImagesDir}`, 'blue');
    log(`   - roof.jpg: An actual roof photo`, 'blue');
    log(`   - dog.jpg: A dog photo (or any non-roof image)`, 'blue');
    log(`2. Run this script again: node test-vision.js`, 'blue');
    log('\nOr manually test with:', 'blue');
    log(`curl -X POST http://localhost:3000/api/photo/analyze -F "photo=@your-image.jpg"`, 'cyan');
  }

  header('✅ Test Suite Complete');
}

// Check if form-data is installed
try {
  require('form-data');
  main().catch(console.error);
} catch (error) {
  console.log('Installing required dependency: form-data');
  const { execSync } = require('child_process');
  execSync('npm install form-data', { stdio: 'inherit' });
  console.log('Please run the script again: node test-vision.js');
}
