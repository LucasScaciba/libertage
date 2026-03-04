/**
 * URLValidatorService
 * 
 * Validates and sanitizes URLs for external links.
 * Ensures URLs have valid protocol, domain, and are safe from XSS attacks.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export class URLValidatorService {
  private static readonly MAX_URL_LENGTH = 2048;
  private static readonly VALID_PROTOCOLS = ['http:', 'https:'];
  private static readonly XSS_PATTERNS = [
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /file:/i,
    /about:/i,
  ];

  /**
   * Validate URL format and security
   * Checks protocol, domain, length, and XSS patterns
   */
  static validate(url: string): ValidationResult {
    // Check URL length
    if (url.length > this.MAX_URL_LENGTH) {
      return {
        isValid: false,
        error: 'URL muito longa. O limite é de 2048 caracteres',
      };
    }

    // Check for XSS patterns
    if (this.containsXSS(url)) {
      return {
        isValid: false,
        error: 'URL contém conteúdo potencialmente perigoso',
      };
    }

    // Check protocol
    if (!this.hasValidProtocol(url)) {
      return {
        isValid: false,
        error: 'URL inválida. Certifique-se de incluir http:// ou https://',
      };
    }

    // Check domain
    if (!this.hasValidDomain(url)) {
      return {
        isValid: false,
        error: 'URL inválida. O domínio não é válido',
      };
    }

    return { isValid: true };
  }

  /**
   * Sanitize URL to prevent XSS
   * Returns sanitized URL or throws if URL is dangerous
   */
  static sanitize(url: string): string {
    // Remove any whitespace
    const trimmed = url.trim();

    // Check for XSS patterns
    if (this.containsXSS(trimmed)) {
      throw new Error('URL contém conteúdo potencialmente perigoso');
    }

    return trimmed;
  }

  /**
   * Check if URL has valid protocol (http or https)
   */
  private static hasValidProtocol(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return this.VALID_PROTOCOLS.includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Check if URL has valid domain
   */
  private static hasValidDomain(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;

      // Check if hostname exists and is not empty
      if (!hostname || hostname.length === 0) {
        return false;
      }

      // Check if hostname has at least one dot (e.g., example.com)
      // or is localhost (for development)
      if (!hostname.includes('.') && hostname !== 'localhost') {
        return false;
      }

      // Check if hostname has valid characters
      // Domain names can contain letters, numbers, hyphens, and dots
      const domainRegex = /^[a-zA-Z0-9.-]+$/;
      if (!domainRegex.test(hostname)) {
        return false;
      }

      // Check if hostname doesn't start or end with a dot or hyphen
      if (hostname.startsWith('.') || hostname.endsWith('.') ||
          hostname.startsWith('-') || hostname.endsWith('-')) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if URL contains XSS patterns
   */
  private static containsXSS(url: string): boolean {
    return this.XSS_PATTERNS.some(pattern => pattern.test(url));
  }
}
