/**
 * Unit tests for URLValidatorService
 * 
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5
 */

import { URLValidatorService } from '../url-validator.service';

describe('URLValidatorService', () => {
  describe('validate', () => {
    it('should accept valid HTTP URLs', () => {
      const result = URLValidatorService.validate('http://example.com');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid HTTPS URLs', () => {
      const result = URLValidatorService.validate('https://example.com');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject URLs without protocol', () => {
      const result = URLValidatorService.validate('example.com');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('URL inválida. Certifique-se de incluir http:// ou https://');
    });

    it('should reject URLs with invalid protocol', () => {
      const result = URLValidatorService.validate('ftp://example.com');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('URL inválida. Certifique-se de incluir http:// ou https://');
    });

    it('should reject URLs exceeding 2048 characters', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(2048);
      const result = URLValidatorService.validate(longUrl);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('URL muito longa. O limite é de 2048 caracteres');
    });

    it('should reject URLs with javascript: protocol', () => {
      const result = URLValidatorService.validate('javascript:alert(1)');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('URL contém conteúdo potencialmente perigoso');
    });

    it('should reject URLs with data: protocol', () => {
      const result = URLValidatorService.validate('data:text/html,<script>alert(1)</script>');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('URL contém conteúdo potencialmente perigoso');
    });

    it('should reject URLs without valid domain', () => {
      const result = URLValidatorService.validate('https://invalid');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('URL inválida. O domínio não é válido');
    });

    it('should accept URLs with subdomains', () => {
      const result = URLValidatorService.validate('https://www.example.com');
      expect(result.isValid).toBe(true);
    });

    it('should accept URLs with paths and query parameters', () => {
      const result = URLValidatorService.validate('https://example.com/path?query=value');
      expect(result.isValid).toBe(true);
    });
  });

  describe('sanitize', () => {
    it('should trim whitespace from URLs', () => {
      const sanitized = URLValidatorService.sanitize('  https://example.com  ');
      expect(sanitized).toBe('https://example.com');
    });

    it('should throw error for URLs with XSS patterns', () => {
      expect(() => {
        URLValidatorService.sanitize('javascript:alert(1)');
      }).toThrow('URL contém conteúdo potencialmente perigoso');
    });

    it('should return clean URL for valid input', () => {
      const sanitized = URLValidatorService.sanitize('https://example.com');
      expect(sanitized).toBe('https://example.com');
    });
  });
});
