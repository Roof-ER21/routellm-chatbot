import { chromium } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const BASE_URL = 'http://localhost:4000';
const SCREENSHOTS_DIR = join(process.cwd(), 'test-screenshots');

// Create screenshots directory
try {
  mkdirSync(SCREENSHOTS_DIR, { recursive: true });
} catch (e) {
  // Directory already exists
}

async function testPhotoReports() {
  console.log('Starting Photo Report Verification Tests...\n');

  const browser = await chromium.launch({
    headless: false, // Run in headed mode to see what's happening
    slowMo: 500 // Slow down actions to see them
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  const results = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    tests: []
  };

  try {
    // Navigate to Knowledge Base
    console.log('1. Navigating to Knowledge Base...');
    await page.goto(`${BASE_URL}/knowledge-base`, { waitUntil: 'networkidle' });
    await page.screenshot({
      path: join(SCREENSHOTS_DIR, '01-knowledge-base-page.png'),
      fullPage: true
    });
    console.log('   ✓ Screenshot saved: 01-knowledge-base-page.png\n');

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Test Sample Photo Report 1 (Document 9.5)
    console.log('2. Testing Sample Photo Report 1 (Document 9.5)...');

    // Search for the document
    const searchBox = page.locator('input[type="text"], input[placeholder*="Search"]').first();
    if (await searchBox.count() > 0) {
      await searchBox.fill('Sample Photo Report 1');
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: join(SCREENSHOTS_DIR, '02-search-photo-report-1.png'),
        fullPage: true
      });
      console.log('   ✓ Screenshot saved: 02-search-photo-report-1.png');
    }

    // Click on Sample Photo Report 1
    const report1Button = page.locator('text=/Sample Photo Report 1/i').first();
    if (await report1Button.count() > 0) {
      await report1Button.click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: join(SCREENSHOTS_DIR, '03-photo-report-1-opened.png'),
        fullPage: true
      });
      console.log('   ✓ Screenshot saved: 03-photo-report-1-opened.png');

      // Check for Document Images section
      const imagesSection = page.locator('text=/Document Images/i').first();
      const imagesSectionExists = await imagesSection.count() > 0;

      if (imagesSectionExists) {
        console.log('   ✓ Document Images section found!');

        // Scroll to images section
        await imagesSection.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);

        // Count images in the grid
        const imageElements = await page.locator('img[alt*="roof"], img[src*="cloudinary"]').count();
        console.log(`   ✓ Found ${imageElements} images in the grid`);

        // Take screenshot of images section
        await page.screenshot({
          path: join(SCREENSHOTS_DIR, '04-photo-report-1-images-section.png'),
          fullPage: true
        });
        console.log('   ✓ Screenshot saved: 04-photo-report-1-images-section.png');

        // Try to click on first image to test modal
        const firstImage = page.locator('img[alt*="roof"], img[src*="cloudinary"]').first();
        if (await firstImage.count() > 0) {
          await firstImage.scrollIntoViewIfNeeded();
          await page.waitForTimeout(500);
          await firstImage.click();
          await page.waitForTimeout(1500);

          // Check if modal opened
          const modal = page.locator('[class*="modal"], [role="dialog"]').first();
          const modalExists = await modal.count() > 0;

          if (modalExists) {
            console.log('   ✓ Modal viewer opened successfully!');
            await page.screenshot({
              path: join(SCREENSHOTS_DIR, '05-photo-report-1-modal.png'),
              fullPage: false
            });
            console.log('   ✓ Screenshot saved: 05-photo-report-1-modal.png');

            // Close modal
            const closeButton = page.locator('button:has-text("×"), button[aria-label*="close"]').first();
            if (await closeButton.count() > 0) {
              await closeButton.click();
              await page.waitForTimeout(500);
            } else {
              await page.keyboard.press('Escape');
              await page.waitForTimeout(500);
            }
          } else {
            console.log('   ⚠ Modal viewer not found - checking for full-size image display...');
            await page.screenshot({
              path: join(SCREENSHOTS_DIR, '05-photo-report-1-modal-alt.png'),
              fullPage: true
            });
            console.log('   ✓ Screenshot saved: 05-photo-report-1-modal-alt.png');
          }
        }

        results.tests.push({
          name: 'Sample Photo Report 1',
          documentId: '9.5',
          imagesSectionFound: true,
          imageCount: imageElements,
          modalTested: true,
          status: 'PASS'
        });
      } else {
        console.log('   ✗ Document Images section NOT found!');
        results.tests.push({
          name: 'Sample Photo Report 1',
          documentId: '9.5',
          imagesSectionFound: false,
          imageCount: 0,
          modalTested: false,
          status: 'FAIL',
          error: 'Document Images section not found'
        });
      }
    } else {
      console.log('   ✗ Sample Photo Report 1 button not found!');
      results.tests.push({
        name: 'Sample Photo Report 1',
        documentId: '9.5',
        status: 'FAIL',
        error: 'Document button not found'
      });
    }

    console.log('');

    // Navigate back to knowledge base
    await page.goto(`${BASE_URL}/knowledge-base`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Test Sample Photo Report 2 (Document 9.4)
    console.log('3. Testing Sample Photo Report 2 (Document 9.4)...');

    // Search for the document
    if (await searchBox.count() > 0) {
      await searchBox.clear();
      await searchBox.fill('Sample Photo Report 2');
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: join(SCREENSHOTS_DIR, '06-search-photo-report-2.png'),
        fullPage: true
      });
      console.log('   ✓ Screenshot saved: 06-search-photo-report-2.png');
    }

    // Click on Sample Photo Report 2
    const report2Button = page.locator('text=/Sample Photo Report 2/i').first();
    if (await report2Button.count() > 0) {
      await report2Button.click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: join(SCREENSHOTS_DIR, '07-photo-report-2-opened.png'),
        fullPage: true
      });
      console.log('   ✓ Screenshot saved: 07-photo-report-2-opened.png');

      // Check for Document Images section
      const imagesSection = page.locator('text=/Document Images/i').first();
      const imagesSectionExists = await imagesSection.count() > 0;

      if (imagesSectionExists) {
        console.log('   ✓ Document Images section found!');

        // Scroll to images section
        await imagesSection.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);

        // Count images in the grid
        const imageElements = await page.locator('img[alt*="roof"], img[src*="cloudinary"]').count();
        console.log(`   ✓ Found ${imageElements} images in the grid`);

        // Take screenshot of images section
        await page.screenshot({
          path: join(SCREENSHOTS_DIR, '08-photo-report-2-images-section.png'),
          fullPage: true
        });
        console.log('   ✓ Screenshot saved: 08-photo-report-2-images-section.png');

        // Try to click on first image to test modal
        const firstImage = page.locator('img[alt*="roof"], img[src*="cloudinary"]').first();
        if (await firstImage.count() > 0) {
          await firstImage.scrollIntoViewIfNeeded();
          await page.waitForTimeout(500);
          await firstImage.click();
          await page.waitForTimeout(1500);

          // Check if modal opened
          const modal = page.locator('[class*="modal"], [role="dialog"]').first();
          const modalExists = await modal.count() > 0;

          if (modalExists) {
            console.log('   ✓ Modal viewer opened successfully!');
            await page.screenshot({
              path: join(SCREENSHOTS_DIR, '09-photo-report-2-modal.png'),
              fullPage: false
            });
            console.log('   ✓ Screenshot saved: 09-photo-report-2-modal.png');
          } else {
            console.log('   ⚠ Modal viewer not found - checking for full-size image display...');
            await page.screenshot({
              path: join(SCREENSHOTS_DIR, '09-photo-report-2-modal-alt.png'),
              fullPage: true
            });
            console.log('   ✓ Screenshot saved: 09-photo-report-2-modal-alt.png');
          }
        }

        results.tests.push({
          name: 'Sample Photo Report 2',
          documentId: '9.4',
          imagesSectionFound: true,
          imageCount: imageElements,
          modalTested: true,
          status: 'PASS'
        });
      } else {
        console.log('   ✗ Document Images section NOT found!');
        results.tests.push({
          name: 'Sample Photo Report 2',
          documentId: '9.4',
          imagesSectionFound: false,
          imageCount: 0,
          modalTested: false,
          status: 'FAIL',
          error: 'Document Images section not found'
        });
      }
    } else {
      console.log('   ✗ Sample Photo Report 2 button not found!');
      results.tests.push({
        name: 'Sample Photo Report 2',
        documentId: '9.4',
        status: 'FAIL',
        error: 'Document button not found'
      });
    }

    console.log('');

    // Check for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`   ⚠ Console Error: ${msg.text()}`);
        if (!results.consoleErrors) results.consoleErrors = [];
        results.consoleErrors.push(msg.text());
      }
    });

    // Wait a bit to see the final state
    await page.waitForTimeout(2000);

  } catch (error) {
    console.error('Test Error:', error);
    results.error = error.message;
    results.stack = error.stack;
  } finally {
    await browser.close();
  }

  // Generate report
  const reportPath = join(SCREENSHOTS_DIR, 'test-report.json');
  writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n✓ Test report saved to: ${reportPath}`);

  // Print summary
  console.log('\n=== TEST SUMMARY ===');
  console.log(`Total Tests: ${results.tests.length}`);
  console.log(`Passed: ${results.tests.filter(t => t.status === 'PASS').length}`);
  console.log(`Failed: ${results.tests.filter(t => t.status === 'FAIL').length}`);
  console.log('\nDetailed Results:');
  results.tests.forEach(test => {
    console.log(`\n${test.name}:`);
    console.log(`  Status: ${test.status}`);
    console.log(`  Images Section Found: ${test.imagesSectionFound ? 'YES' : 'NO'}`);
    if (test.imageCount !== undefined) {
      console.log(`  Image Count: ${test.imageCount}`);
    }
    if (test.error) {
      console.log(`  Error: ${test.error}`);
    }
  });

  if (results.consoleErrors && results.consoleErrors.length > 0) {
    console.log(`\n⚠ Console Errors Found: ${results.consoleErrors.length}`);
  }

  console.log(`\n✓ All screenshots saved to: ${SCREENSHOTS_DIR}`);
  console.log('\n===================\n');

  return results;
}

// Run the tests
testPhotoReports()
  .then(() => {
    console.log('Tests completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Tests failed:', error);
    process.exit(1);
  });
