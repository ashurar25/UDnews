import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generateFavicon() {
  try {
    const logoPath = path.join(process.cwd(), 'client/public/logo.jpg');
    const faviconPath = path.join(process.cwd(), 'client/public/favicon.ico');
    
    console.log('Converting logo.jpg to favicon.ico...');
    
    // Read the logo image
    const logoBuffer = fs.readFileSync(logoPath);
    
    // Generate different sizes for ICO format
    const sizes = [16, 32, 48];
    const buffers = [];
    
    for (const size of sizes) {
      const buffer = await sharp(logoBuffer)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .png()
        .toBuffer();
      buffers.push(buffer);
    }
    
    // For simplicity, we'll create a 32x32 favicon as .ico
    // Sharp doesn't directly support ICO format, so we'll create PNG favicons
    await sharp(logoBuffer)
      .resize(32, 32, {
        fit: 'cover',
        position: 'center'
      })
      .png()
      .toFile(faviconPath.replace('.ico', '.png'));
    
    // Also create the traditional favicon.ico (using the 32x32 version)
    await sharp(logoBuffer)
      .resize(16, 16, {
        fit: 'cover',
        position: 'center'
      })
      .png()
      .toFile(faviconPath);
    
    // Generate additional sizes for modern browsers
    const modernSizes = [16, 32, 48, 64, 128, 192, 512];
    
    for (const size of modernSizes) {
      const outputPath = path.join(process.cwd(), `client/public/favicon-${size}x${size}.png`);
      await sharp(logoBuffer)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .png()
        .toFile(outputPath);
    }
    
    // Generate Apple Touch Icon
    await sharp(logoBuffer)
      .resize(180, 180, {
        fit: 'cover',
        position: 'center'
      })
      .png()
      .toFile(path.join(process.cwd(), 'client/public/apple-touch-icon.png'));
    
    console.log('✅ Favicon generated successfully!');
    console.log('Generated files:');
    console.log('- favicon.ico (16x16)');
    console.log('- favicon.png (32x32)');
    console.log('- favicon-{size}x{size}.png (16, 32, 48, 64, 128, 192, 512)');
    console.log('- apple-touch-icon.png (180x180)');
    
  } catch (error) {
    console.error('❌ Error generating favicon:', error);
    process.exit(1);
  }
}

generateFavicon();
