/**
 * Unit tests for IconDetectorService
 * 
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11
 */

import { IconDetectorService } from '../icon-detector.service';

describe('IconDetectorService', () => {
  describe('detectIcon', () => {
    it('should detect Instagram icon for instagram.com', () => {
      const icon = IconDetectorService.detectIcon('https://instagram.com/user');
      expect(icon).toBe('instagram');
    });

    it('should detect Instagram icon for instagram.com.br', () => {
      const icon = IconDetectorService.detectIcon('https://instagram.com.br/user');
      expect(icon).toBe('instagram');
    });

    it('should detect Instagram icon for www.instagram.com', () => {
      const icon = IconDetectorService.detectIcon('https://www.instagram.com/user');
      expect(icon).toBe('instagram');
    });

    it('should detect WhatsApp icon for whatsapp.com', () => {
      const icon = IconDetectorService.detectIcon('https://whatsapp.com');
      expect(icon).toBe('whatsapp');
    });

    it('should detect WhatsApp icon for wa.me', () => {
      const icon = IconDetectorService.detectIcon('https://wa.me/5511999999999');
      expect(icon).toBe('whatsapp');
    });

    it('should detect WhatsApp icon for api.whatsapp.com', () => {
      const icon = IconDetectorService.detectIcon('https://api.whatsapp.com/send?phone=5511999999999');
      expect(icon).toBe('whatsapp');
    });

    it('should detect LinkedIn icon for linkedin.com', () => {
      const icon = IconDetectorService.detectIcon('https://linkedin.com/in/user');
      expect(icon).toBe('linkedin');
    });

    it('should detect Facebook icon for facebook.com', () => {
      const icon = IconDetectorService.detectIcon('https://facebook.com/user');
      expect(icon).toBe('facebook');
    });

    it('should detect Facebook icon for fb.com', () => {
      const icon = IconDetectorService.detectIcon('https://fb.com/user');
      expect(icon).toBe('facebook');
    });

    it('should detect Twitter icon for twitter.com', () => {
      const icon = IconDetectorService.detectIcon('https://twitter.com/user');
      expect(icon).toBe('twitter');
    });

    it('should detect Twitter icon for x.com', () => {
      const icon = IconDetectorService.detectIcon('https://x.com/user');
      expect(icon).toBe('twitter');
    });

    it('should detect YouTube icon for youtube.com', () => {
      const icon = IconDetectorService.detectIcon('https://youtube.com/@channel');
      expect(icon).toBe('youtube');
    });

    it('should detect YouTube icon for youtu.be', () => {
      const icon = IconDetectorService.detectIcon('https://youtu.be/video123');
      expect(icon).toBe('youtube');
    });

    it('should detect TikTok icon for tiktok.com', () => {
      const icon = IconDetectorService.detectIcon('https://tiktok.com/@user');
      expect(icon).toBe('tiktok');
    });

    it('should detect GitHub icon for github.com', () => {
      const icon = IconDetectorService.detectIcon('https://github.com/user');
      expect(icon).toBe('github');
    });

    it('should return default link icon for unknown domains', () => {
      const icon = IconDetectorService.detectIcon('https://example.com');
      expect(icon).toBe('link');
    });

    it('should return default link icon for custom domains', () => {
      const icon = IconDetectorService.detectIcon('https://mywebsite.com.br');
      expect(icon).toBe('link');
    });

    it('should handle URLs with paths and query parameters', () => {
      const icon = IconDetectorService.detectIcon('https://instagram.com/user?ref=profile');
      expect(icon).toBe('instagram');
    });

    it('should return default link icon for invalid URLs', () => {
      const icon = IconDetectorService.detectIcon('not-a-url');
      expect(icon).toBe('link');
    });
  });
});
