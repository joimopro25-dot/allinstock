const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, 'public', 'logo.svg');

// Android icon sizes (in pixels) for different densities
const androidSizes = [
  { name: 'mipmap-ldpi', size: 36 },
  { name: 'mipmap-mdpi', size: 48 },
  { name: 'mipmap-hdpi', size: 72 },
  { name: 'mipmap-xhdpi', size: 96 },
  { name: 'mipmap-xxhdpi', size: 144 },
  { name: 'mipmap-xxxhdpi', size: 192 }
];

async function generateIcons() {
  console.log('📱 Generating Android app icons...\n');

  // Read SVG file
  const svgBuffer = fs.readFileSync(svgPath);

  // First, generate 1024x1024 icon for Play Store
  const playStoreDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'play-store');
  if (!fs.existsSync(playStoreDir)) {
    fs.mkdirSync(playStoreDir, { recursive: true });
  }

  await sharp(svgBuffer)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(playStoreDir, 'icon-1024.png'));
  console.log('✅ Generated Play Store icon (1024x1024)');

  // Generate Android launcher icons for all densities
  for (const { name, size } of androidSizes) {
    const outputDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res', name);

    // Create directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate ic_launcher.png
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, 'ic_launcher.png'));

    // Generate ic_launcher_foreground.png (foreground layer for adaptive icons)
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, 'ic_launcher_foreground.png'));

    // Generate ic_launcher_round.png (round icon)
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, 'ic_launcher_round.png'));

    console.log(`✅ Generated ${name} icons (${size}x${size})`);
  }

  console.log('\n🎉 All icons generated successfully!');
  console.log('\n📍 Icons location:');
  console.log('   - android/app/src/main/res/mipmap-*/');
  console.log('   - android/app/src/main/play-store/icon-1024.png');
}

generateIcons().catch(err => {
  console.error('❌ Error generating icons:', err);
  process.exit(1);
});
