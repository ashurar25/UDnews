const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateFavicon() {
  try {
    const logoPath = path.join(__dirname, 'client/public/logo.jpg');
    const publicDir = path.join(__dirname, 'client/public');
    
    console.log('Converting logo.jpg to favicon files...');
    
    // Read the logo image
    const logoBuffer = fs.readFileSync(logoPath);
    
    // Generate favicon.ico (16x16)
    await sharp(logoBuffer)
      .resize(16, 16, {
        fit: 'cover',
        position: 'center'
      })
      .png()
      .toFile(path.join(publicDir, 'favicon.ico'));
    
    // Generate favicon.png (32x32)
    await sharp(logoBuffer)
      .resize(32, 32, {
        fit: 'cover',
        position: 'center'
      })
      .png()
      .toFile(path.join(publicDir, 'favicon.png'));
    
    // Generate additional sizes for modern browsers
    const sizes = [16, 32, 48, 64, 128, 192, 512];
    
    for (const size of sizes) {
      await sharp(logoBuffer)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .png()
        .toFile(path.join(publicDir, `favicon-${size}x${size}.png`));
    }
    
    // Generate Apple Touch Icon
    await sharp(logoBuffer)
      .resize(180, 180, {
        fit: 'cover',
        position: 'center'
      })
      .png()
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));
    
    console.log('✅ Favicon generated successfully!');
    console.log('Generated files:');
    console.log('- favicon.ico (16x16 PNG)');
    console.log('- favicon.png (32x32)');
    console.log('- favicon-{size}x{size}.png (multiple sizes)');
    console.log('- apple-touch-icon.png (180x180)');
    
  } catch (error) {
    console.error('❌ Error generating favicon:', error);
    process.exit(1);
  }
}

generateFavicon();
