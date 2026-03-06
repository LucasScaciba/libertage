import sharp from "sharp";

/**
 * Watermark Engine Service
 * 
 * Applies watermarks to images and videos for content protection.
 * Uses diagonal text overlay with configurable opacity.
 */

export interface WatermarkOptions {
  text: string;
  opacity: number; // 0.0 to 1.0
  position: "diagonal" | "center" | "bottom-right";
}

export class WatermarkEngine {
  private platformName = "dezaire"; // Platform watermark text
  private defaultOpacity = 0.12; // 12% opacity (between 10-15%)

  /**
   * Apply watermark to an image buffer
   * @param imageBuffer - Input image as Buffer
   * @param options - Watermark configuration options
   * @returns Watermarked image as Buffer
   */
  async applyToImage(
    imageBuffer: Buffer,
    options?: Partial<WatermarkOptions>
  ): Promise<Buffer> {
    try {
      // Get image metadata
      const metadata = await sharp(imageBuffer).metadata();
      const width = metadata.width!;
      const height = metadata.height!;

      // Merge options with defaults
      const watermarkOptions: WatermarkOptions = {
        text: options?.text || this.platformName,
        opacity: options?.opacity || this.defaultOpacity,
        position: options?.position || "diagonal",
      };

      // Create watermark SVG
      const watermarkSvg = this.createDiagonalTextSVG(
        watermarkOptions.text,
        width,
        height,
        watermarkOptions.opacity
      );

      // Composite watermark onto image
      const watermarkedBuffer = await sharp(imageBuffer)
        .composite([
          {
            input: Buffer.from(watermarkSvg),
            blend: "over",
          },
        ])
        .toBuffer();

      return watermarkedBuffer;
    } catch (error) {
      console.error("[WatermarkEngine] Failed to apply watermark:", error);
      throw new Error(`Failed to apply watermark: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Create diagonal text SVG for watermark
   * @param text - Watermark text
   * @param width - Image width
   * @param height - Image height
   * @param opacity - Watermark opacity (0.0 to 1.0)
   * @returns SVG string
   */
  private createDiagonalTextSVG(
    text: string,
    width: number,
    height: number,
    opacity: number
  ): string {
    // Calculate font size based on image dimensions
    // Use 1/20th of the smaller dimension
    const fontSize = Math.min(width, height) / 20;
    
    // Diagonal angle (-45 degrees)
    const angle = -45;
    
    // Calculate center point for rotation
    const centerX = width / 2;
    const centerY = height / 2;

    // Create repeating pattern for better coverage
    const spacing = fontSize * 8; // Space between repeated text
    const repetitions = Math.ceil(Math.max(width, height) / spacing) + 2;
    
    // Generate multiple text elements in a diagonal pattern
    const textElements: string[] = [];
    
    for (let i = -repetitions; i <= repetitions; i++) {
      for (let j = -repetitions; j <= repetitions; j++) {
        const x = centerX + (i * spacing);
        const y = centerY + (j * spacing);
        
        textElements.push(`
          <text
            x="${x}"
            y="${y}"
            font-size="${fontSize}"
            font-family="Arial, sans-serif"
            font-weight="bold"
            fill="white"
            opacity="${opacity}"
            text-anchor="middle"
            dominant-baseline="middle"
            transform="rotate(${angle} ${x} ${y})"
          >
            ${this.escapeXml(text)}
          </text>
        `);
      }
    }

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow">
            <feDropShadow dx="2" dy="2" stdDeviation="2" flood-opacity="0.3"/>
          </filter>
        </defs>
        <g filter="url(#shadow)">
          ${textElements.join("")}
        </g>
      </svg>
    `;
  }

  /**
   * Create centered text SVG for watermark
   * @param text - Watermark text
   * @param width - Image width
   * @param height - Image height
   * @param opacity - Watermark opacity (0.0 to 1.0)
   * @returns SVG string
   */
  private createCenteredTextSVG(
    text: string,
    width: number,
    height: number,
    opacity: number
  ): string {
    const fontSize = Math.min(width, height) / 15;
    
    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow">
            <feDropShadow dx="2" dy="2" stdDeviation="2" flood-opacity="0.3"/>
          </filter>
        </defs>
        <text
          x="50%"
          y="50%"
          font-size="${fontSize}"
          font-family="Arial, sans-serif"
          font-weight="bold"
          fill="white"
          opacity="${opacity}"
          text-anchor="middle"
          dominant-baseline="middle"
          filter="url(#shadow)"
        >
          ${this.escapeXml(text)}
        </text>
      </svg>
    `;
  }

  /**
   * Create bottom-right positioned text SVG for watermark
   * @param text - Watermark text
   * @param width - Image width
   * @param height - Image height
   * @param opacity - Watermark opacity (0.0 to 1.0)
   * @returns SVG string
   */
  private createBottomRightTextSVG(
    text: string,
    width: number,
    height: number,
    opacity: number
  ): string {
    const fontSize = Math.min(width, height) / 25;
    const padding = fontSize;
    
    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow">
            <feDropShadow dx="1" dy="1" stdDeviation="1" flood-opacity="0.5"/>
          </filter>
        </defs>
        <text
          x="${width - padding}"
          y="${height - padding}"
          font-size="${fontSize}"
          font-family="Arial, sans-serif"
          font-weight="bold"
          fill="white"
          opacity="${opacity}"
          text-anchor="end"
          dominant-baseline="alphabetic"
          filter="url(#shadow)"
        >
          ${this.escapeXml(text)}
        </text>
      </svg>
    `;
  }

  /**
   * Escape XML special characters
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  /**
   * Get FFmpeg drawtext filter for video watermarking
   * @param text - Watermark text
   * @param opacity - Watermark opacity (0.0 to 1.0)
   * @returns FFmpeg filter string
   */
  getFFmpegDrawtextFilter(
    text: string = this.platformName,
    opacity: number = this.defaultOpacity
  ): string {
    // Escape special characters for FFmpeg
    const escapedText = text.replace(/:/g, "\\:").replace(/'/g, "\\'");
    
    // Calculate font size as percentage of video height
    const fontSizeExpression = "h/20";
    
    // Position: center of video
    const xExpression = "(w-text_w)/2";
    const yExpression = "(h-text_h)/2";
    
    // Angle: -45 degrees (diagonal)
    const angle = "-45*PI/180";
    
    // Alpha channel for opacity (0-1 scale)
    const alpha = opacity;

    return `drawtext=text='${escapedText}':fontsize=${fontSizeExpression}:fontcolor=white@${alpha}:x=${xExpression}:y=${yExpression}:angle=${angle}:shadowcolor=black@0.3:shadowx=2:shadowy=2`;
  }
}

// Export singleton instance
export const watermarkEngine = new WatermarkEngine();
