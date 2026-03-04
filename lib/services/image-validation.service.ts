import sharp from 'sharp';

export class ImageValidationService {
  private static readonly ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
  private static readonly MAX_SIZE_MB = 10;
  private static readonly MAX_SIZE_BYTES = ImageValidationService.MAX_SIZE_MB * 1024 * 1024;

  /**
   * Validate image format
   */
  static validateImageFormat(file: File): boolean {
    return ImageValidationService.ALLOWED_FORMATS.includes(file.type);
  }

  /**
   * Validate image size
   */
  static validateImageSize(file: File): boolean {
    return file.size <= ImageValidationService.MAX_SIZE_BYTES;
  }

  /**
   * Compress and optimize image
   */
  static async compressImage(file: File, maxWidth: number = 1920): Promise<Buffer> {
    const buffer = Buffer.from(await file.arrayBuffer());

    const compressed = await sharp(buffer)
      .resize(maxWidth, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({
        quality: 85,
        progressive: true,
      })
      .toBuffer();

    return compressed;
  }

  /**
   * Get image metadata
   */
  static async getImageMetadata(file: File): Promise<{
    width: number;
    height: number;
    format: string;
    size: number;
  }> {
    const buffer = Buffer.from(await file.arrayBuffer());
    const metadata = await sharp(buffer).metadata();

    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: file.size,
    };
  }

  /**
   * Validate all image requirements
   */
  static async validateImage(file: File): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Check format
    if (!this.validateImageFormat(file)) {
      errors.push('Formato de imagem inválido. Use JPEG, PNG ou WebP.');
    }

    // Check size
    if (!this.validateImageSize(file)) {
      errors.push(`Imagem muito grande. Tamanho máximo: ${this.MAX_SIZE_MB}MB.`);
    }

    // Check if it's a valid image
    try {
      await this.getImageMetadata(file);
    } catch (error) {
      errors.push('Arquivo de imagem corrompido ou inválido.');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create a thumbnail from image
   */
  static async createThumbnail(file: File, size: number = 200): Promise<Buffer> {
    const buffer = Buffer.from(await file.arrayBuffer());

    const thumbnail = await sharp(buffer)
      .resize(size, size, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({
        quality: 80,
      })
      .toBuffer();

    return thumbnail;
  }
}
