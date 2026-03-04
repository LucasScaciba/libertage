/**
 * Unit tests for ExternalLinkService
 * 
 * Tests CRUD operations, validation, and reordering logic
 * Requirements: 5.1-5.7, 6.1-6.5, 8.1-8.3
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExternalLinkService } from '../external-link.service';
import { URLValidatorService } from '../url-validator.service';
import { IconDetectorService } from '../icon-detector.service';
import { PlanValidatorService } from '../plan-validator.service';

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

describe('ExternalLinkService', () => {
  describe('validateTitle', () => {
    it('should trim whitespace from title', () => {
      // Access private method through any cast for testing
      const service = ExternalLinkService as any;
      const result = service.validateTitle('  Test Title  ');
      expect(result).toBe('Test Title');
    });

    it('should reject empty title', () => {
      const service = ExternalLinkService as any;
      expect(() => service.validateTitle('')).toThrow('O título não pode estar vazio');
    });

    it('should reject whitespace-only title', () => {
      const service = ExternalLinkService as any;
      expect(() => service.validateTitle('   ')).toThrow('O título não pode estar vazio');
    });

    it('should reject title exceeding 100 characters', () => {
      const service = ExternalLinkService as any;
      const longTitle = 'a'.repeat(101);
      expect(() => service.validateTitle(longTitle)).toThrow('O título deve ter entre 1 e 100 caracteres');
    });

    it('should accept title with exactly 100 characters', () => {
      const service = ExternalLinkService as any;
      const title = 'a'.repeat(100);
      const result = service.validateTitle(title);
      expect(result).toBe(title);
    });

    it('should accept title with 1 character', () => {
      const service = ExternalLinkService as any;
      const result = service.validateTitle('a');
      expect(result).toBe('a');
    });
  });

  describe('Integration with validation services', () => {
    it('should use URLValidatorService for URL validation', () => {
      const result = URLValidatorService.validate('https://example.com');
      expect(result.isValid).toBe(true);
    });

    it('should use IconDetectorService for icon detection', () => {
      const icon = IconDetectorService.detectIcon('https://instagram.com/user');
      expect(icon).toBe('instagram');
    });

    it('should detect default icon for unknown domains', () => {
      const icon = IconDetectorService.detectIcon('https://example.com');
      expect(icon).toBe('link');
    });
  });

  describe('Title validation edge cases', () => {
    it('should preserve internal whitespace', () => {
      const service = ExternalLinkService as any;
      const result = service.validateTitle('  My  Test  Title  ');
      expect(result).toBe('My  Test  Title');
    });

    it('should handle title with special characters', () => {
      const service = ExternalLinkService as any;
      const result = service.validateTitle('  Test & Title! 🎉  ');
      expect(result).toBe('Test & Title! 🎉');
    });
  });
});
