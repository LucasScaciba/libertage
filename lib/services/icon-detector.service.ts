/**
 * IconDetectorService
 * 
 * Detects appropriate icon based on URL domain.
 * Supports popular social media platforms and returns default icon for unknown domains.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11
 */

export type IconKey = 
  | 'instagram'
  | 'whatsapp'
  | 'linkedin'
  | 'facebook'
  | 'twitter'
  | 'youtube'
  | 'tiktok'
  | 'github'
  | 'link';

export class IconDetectorService {
  /**
   * Map of domain patterns to icon keys
   */
  private static readonly DOMAIN_ICON_MAP: Record<string, IconKey> = {
    'instagram.com': 'instagram',
    'instagram.com.br': 'instagram',
    'whatsapp.com': 'whatsapp',
    'wa.me': 'whatsapp',
    'api.whatsapp.com': 'whatsapp',
    'linkedin.com': 'linkedin',
    'facebook.com': 'facebook',
    'fb.com': 'facebook',
    'twitter.com': 'twitter',
    'x.com': 'twitter',
    'youtube.com': 'youtube',
    'youtu.be': 'youtube',
    'tiktok.com': 'tiktok',
    'github.com': 'github',
  };

  /**
   * Detect icon key from URL domain
   * Returns 'link' as default for unknown domains
   */
  static detectIcon(url: string): IconKey {
    try {
      const domain = this.extractDomain(url);
      
      // Check exact match first
      if (domain in this.DOMAIN_ICON_MAP) {
        return this.DOMAIN_ICON_MAP[domain];
      }

      // Check if domain ends with any known domain (for subdomains)
      for (const [knownDomain, iconKey] of Object.entries(this.DOMAIN_ICON_MAP)) {
        if (domain.endsWith(`.${knownDomain}`) || domain === knownDomain) {
          return iconKey;
        }
      }

      // Default to 'link' for unknown domains
      return 'link';
    } catch {
      // If URL parsing fails, return default icon
      return 'link';
    }
  }

  /**
   * Extract domain from URL
   */
  private static extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.toLowerCase();
    } catch {
      throw new Error('Invalid URL');
    }
  }
}
