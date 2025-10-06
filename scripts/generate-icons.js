/**
 * Icon Generator Script for The Roof Docs
 * Generates all required iOS icons and splash screens
 *
 * Prerequisites:
 * npm install sharp
 *
 * Usage:
 * node scripts/generate-icons.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Egyptian theme colors
const COLORS = {
  red: '#8B0000',
  gold: '#D4AF37',
  black: '#000000',
  white: '#FFFFFF'
};

// Output directory
const OUTPUT_DIR = path.join(__dirname, '..', 'public');

// Icon sizes for iOS
const ICON_SIZES = [
  { name: 'apple-touch-icon', size: 180, desc: 'iPhone (180x180)' },
  { name: 'apple-touch-icon-152x152', size: 152, desc: 'iPad (152x152)' },
  { name: 'apple-touch-icon-167x167', size: 167, desc: 'iPad Pro (167x167)' },
  { name: 'apple-touch-icon-180x180', size: 180, desc: 'iPhone (180x180)' },
  { name: 'icon-192', size: 192, desc: 'Android/PWA (192x192)' },
  { name: 'icon-512', size: 512, desc: 'Android/PWA (512x512)' }
];

// Splash screen sizes for iOS devices
const SPLASH_SIZES = [
  { name: 'splash-iphone-14-pro-max', width: 430, height: 932, desc: 'iPhone 14 Pro Max' },
  { name: 'splash-iphone-14-pro', width: 393, height: 852, desc: 'iPhone 14 Pro' },
  { name: 'splash-iphone-13-pro-max', width: 428, height: 926, desc: 'iPhone 13 Pro Max' },
  { name: 'splash-iphone-13-pro', width: 390, height: 844, desc: 'iPhone 13 Pro' },
  { name: 'splash-iphone-x', width: 375, height: 812, desc: 'iPhone X/XS/11 Pro' },
  { name: 'splash-ipad-pro-12.9', width: 1024, height: 1366, desc: 'iPad Pro 12.9"' },
  { name: 'splash-ipad-pro-11', width: 834, height: 1194, desc: 'iPad Pro 11"' },
  { name: 'splash-ipad-air', width: 834, height: 1112, desc: 'iPad Air' },
  { name: 'splash-ipad', width: 768, height: 1024, desc: 'iPad' }
];

/**
 * Generate icon with Egyptian eye symbol
 */
async function generateIcon(size, filename) {
  console.log(`Generating ${filename} (${size}x${size})...`);

  // Calculate sizes for the Egyptian eye design
  const padding = Math.floor(size * 0.15);
  const eyeSize = size - (padding * 2);
  const centerX = size / 2;
  const centerY = size / 2;

  // Create SVG for Egyptian eye with hieroglyphic style
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <!-- Background circle with gradient -->
      <defs>
        <radialGradient id="bgGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style="stop-color:${COLORS.black};stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1a1a1a;stop-opacity:1" />
        </radialGradient>
        <radialGradient id="eyeGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style="stop-color:${COLORS.gold};stop-opacity:1" />
          <stop offset="100%" style="stop-color:#B8860B;stop-opacity:1" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <!-- Background -->
      <circle cx="${centerX}" cy="${centerY}" r="${size / 2}" fill="url(#bgGradient)"/>

      <!-- Outer gold ring -->
      <circle cx="${centerX}" cy="${centerY}" r="${eyeSize / 2.2}"
              fill="none" stroke="${COLORS.gold}" stroke-width="${size * 0.02}"
              opacity="0.6" filter="url(#glow)"/>

      <!-- Eye of Horus inspired design -->
      <!-- Main eye shape -->
      <ellipse cx="${centerX}" cy="${centerY}" rx="${eyeSize / 3}" ry="${eyeSize / 4.5}"
               fill="none" stroke="${COLORS.gold}" stroke-width="${size * 0.025}"
               filter="url(#glow)"/>

      <!-- Pupil -->
      <circle cx="${centerX}" cy="${centerY}" r="${eyeSize / 12}"
              fill="url(#eyeGradient)" filter="url(#glow)"/>

      <!-- Top eyelid -->
      <path d="M ${centerX - eyeSize / 3} ${centerY}
               Q ${centerX} ${centerY - eyeSize / 4} ${centerX + eyeSize / 3} ${centerY}"
            fill="none" stroke="${COLORS.gold}" stroke-width="${size * 0.025}"
            stroke-linecap="round" filter="url(#glow)"/>

      <!-- Bottom eyelid -->
      <path d="M ${centerX - eyeSize / 3} ${centerY}
               Q ${centerX} ${centerY + eyeSize / 4.5} ${centerX + eyeSize / 3} ${centerY}"
            fill="none" stroke="${COLORS.gold}" stroke-width="${size * 0.025}"
            stroke-linecap="round" filter="url(#glow)"/>

      <!-- Eye tail (right) -->
      <path d="M ${centerX + eyeSize / 3} ${centerY}
               L ${centerX + eyeSize / 2.5} ${centerY + eyeSize / 8}"
            stroke="${COLORS.gold}" stroke-width="${size * 0.02}"
            stroke-linecap="round" filter="url(#glow)"/>

      <!-- Eye accent (left) -->
      <path d="M ${centerX - eyeSize / 3} ${centerY}
               L ${centerX - eyeSize / 2.5} ${centerY}"
            stroke="${COLORS.gold}" stroke-width="${size * 0.02}"
            stroke-linecap="round" filter="url(#glow)"/>

      <!-- Inner red accent -->
      <circle cx="${centerX}" cy="${centerY}" r="${eyeSize / 24}"
              fill="${COLORS.red}" opacity="0.8" filter="url(#glow)"/>
    </svg>
  `;

  // Generate PNG from SVG
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(path.join(OUTPUT_DIR, filename));

  console.log(`✓ Generated ${filename}`);
}

/**
 * Generate splash screen with Egyptian theme
 */
async function generateSplashScreen(width, height, filename) {
  console.log(`Generating ${filename} (${width}x${height})...`);

  const centerX = width / 2;
  const centerY = height / 2;
  const logoSize = Math.min(width, height) * 0.3;

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="splashBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style="stop-color:${COLORS.black};stop-opacity:1" />
          <stop offset="100%" style="stop-color:#000000;stop-opacity:1" />
        </radialGradient>
        <radialGradient id="logoGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style="stop-color:${COLORS.gold};stop-opacity:1" />
          <stop offset="100%" style="stop-color:#B8860B;stop-opacity:1" />
        </radialGradient>
        <filter id="splashGlow">
          <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <!-- Background -->
      <rect width="${width}" height="${height}" fill="${COLORS.black}"/>

      <!-- Subtle pattern -->
      <pattern id="hieroglyphPattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="100" y2="100" stroke="${COLORS.gold}" stroke-width="0.5" opacity="0.05"/>
        <line x1="100" y1="0" x2="0" y2="100" stroke="${COLORS.gold}" stroke-width="0.5" opacity="0.05"/>
      </pattern>
      <rect width="${width}" height="${height}" fill="url(#hieroglyphPattern)"/>

      <!-- Central logo - Eye of Horus -->
      <circle cx="${centerX}" cy="${centerY}" r="${logoSize / 2}"
              fill="none" stroke="${COLORS.gold}" stroke-width="3"
              opacity="0.4" filter="url(#splashGlow)"/>

      <ellipse cx="${centerX}" cy="${centerY}" rx="${logoSize / 3}" ry="${logoSize / 4.5}"
               fill="none" stroke="${COLORS.gold}" stroke-width="4" filter="url(#splashGlow)"/>

      <circle cx="${centerX}" cy="${centerY}" r="${logoSize / 12}"
              fill="url(#logoGradient)" filter="url(#splashGlow)"/>

      <path d="M ${centerX - logoSize / 3} ${centerY}
               Q ${centerX} ${centerY - logoSize / 4} ${centerX + logoSize / 3} ${centerY}"
            fill="none" stroke="${COLORS.gold}" stroke-width="4"
            stroke-linecap="round" filter="url(#splashGlow)"/>

      <path d="M ${centerX - logoSize / 3} ${centerY}
               Q ${centerX} ${centerY + logoSize / 4.5} ${centerX + logoSize / 3} ${centerY}"
            fill="none" stroke="${COLORS.gold}" stroke-width="4"
            stroke-linecap="round" filter="url(#splashGlow)"/>

      <circle cx="${centerX}" cy="${centerY}" r="${logoSize / 24}"
              fill="${COLORS.red}" opacity="0.9" filter="url(#splashGlow)"/>

      <!-- App name -->
      <text x="${centerX}" y="${centerY + logoSize}"
            font-family="Arial, sans-serif" font-size="${logoSize / 8}"
            font-weight="bold" text-anchor="middle"
            fill="${COLORS.gold}" opacity="0.9" filter="url(#splashGlow)">
        THE ROOF DOCS
      </text>

      <!-- Tagline -->
      <text x="${centerX}" y="${centerY + logoSize + logoSize / 6}"
            font-family="Arial, sans-serif" font-size="${logoSize / 12}"
            text-anchor="middle" fill="${COLORS.gold}" opacity="0.6">
        Ancient Wisdom, Modern Protection
      </text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .resize(width, height)
    .png()
    .toFile(path.join(OUTPUT_DIR, filename));

  console.log(`✓ Generated ${filename}`);
}

/**
 * Main execution
 */
async function main() {
  console.log('\n🏛️  The Roof Docs - Icon Generator');
  console.log('Egyptian Theme (Red/Gold/Black)\n');

  try {
    // Check if Sharp is installed
    try {
      require.resolve('sharp');
    } catch (e) {
      console.error('❌ Sharp is not installed. Please run: npm install sharp');
      process.exit(1);
    }

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Generate icons
    console.log('📱 Generating app icons...\n');
    for (const icon of ICON_SIZES) {
      await generateIcon(icon.size, `${icon.name}.png`);
    }

    // Generate splash screens
    console.log('\n🖼️  Generating splash screens...\n');
    for (const splash of SPLASH_SIZES) {
      await generateSplashScreen(splash.width, splash.height, `${splash.name}.png`);
    }

    console.log('\n✅ All icons and splash screens generated successfully!');
    console.log(`📁 Output directory: ${OUTPUT_DIR}\n`);

    // List generated files
    console.log('Generated files:');
    const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.png'));
    files.forEach(file => {
      const stats = fs.statSync(path.join(OUTPUT_DIR, file));
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`  - ${file} (${sizeKB} KB)`);
    });

    console.log('\n🎉 Ready for iOS testing!\n');

  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateIcon, generateSplashScreen };
