
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

export class ImageOptimizer {
  private static readonly UPLOAD_DIR = 'server/public/uploads';
  private static readonly MAX_WIDTH = 1200;
  private static readonly QUALITY = 80;

  static async ensureUploadDir(): Promise<void> {
    try {
      await fs.access(this.UPLOAD_DIR);
    } catch {
      await fs.mkdir(this.UPLOAD_DIR, { recursive: true });
    }
  }

  static async optimizeImage(
    inputBuffer: Buffer,
    filename: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'jpeg' | 'png' | 'webp';
    } = {}
  ): Promise<string> {
    await this.ensureUploadDir();

    const {
      width = this.MAX_WIDTH,
      quality = this.QUALITY,
      format = 'webp'
    } = options;

    const outputFilename = `${Date.now()}-${filename.replace(/\.[^/.]+$/, '')}.${format}`;
    const outputPath = path.join(this.UPLOAD_DIR, outputFilename);

    await sharp(inputBuffer)
      .resize(width, null, {
        withoutEnlargement: true,
        fit: 'inside'
      })
      .toFormat(format, { quality })
      .toFile(outputPath);

    return `/uploads/${outputFilename}`;
  }

  static async generateThumbnail(
    inputBuffer: Buffer,
    filename: string,
    size: number = 300
  ): Promise<string> {
    await this.ensureUploadDir();

    const thumbnailFilename = `thumb-${Date.now()}-${filename.replace(/\.[^/.]+$/, '')}.webp`;
    const thumbnailPath = path.join(this.UPLOAD_DIR, thumbnailFilename);

    await sharp(inputBuffer)
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      })
      .toFormat('webp', { quality: 70 })
      .toFile(thumbnailPath);

    return `/uploads/${thumbnailFilename}`;
  }

  static async deleteImage(imagePath: string): Promise<void> {
    try {
      const fullPath = path.join('server/public', imagePath);
      await fs.unlink(fullPath);
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  }
}
