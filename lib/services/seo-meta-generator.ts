import { Profile } from "@/types";

export interface OpenGraphTags {
  type: string;
  title: string;
  description: string;
  image: string;
  url: string;
}

export interface TwitterCardTags {
  card: string;
  title: string;
  description: string;
  image: string;
}

export interface MetaTags {
  title: string;
  description: string;
  canonical: string;
  openGraph: OpenGraphTags;
  twitter: TwitterCardTags;
}

/**
 * SEOMetaGenerator Service
 * 
 * Responsável por gerar meta tags para otimização de SEO e compartilhamento social.
 * 
 * Gera:
 * - Open Graph tags (Facebook, LinkedIn, etc.)
 * - Twitter Card tags
 * - Canonical URL
 * - Title e description tags
 */
export class SEOMetaGenerator {
  private static readonly DEFAULT_IMAGE = "/libertage-logo.svg";
  private static readonly SITE_NAME = "Libertage";

  /**
   * Gera todas as meta tags para um perfil
   * @param profile - Dados do perfil
   * @param coverImageUrl - URL da imagem de capa (opcional)
   */
  static generateMetaTags(
    profile: Omit<Profile, 'phone_number'>,
    coverImageUrl: string | null = null
  ): MetaTags {
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_BASE_URL || 'https://libertage.com';

    const profileUrl = `${baseUrl}/perfil/@${profile.slug}`;
    const imageUrl = coverImageUrl || `${baseUrl}${this.DEFAULT_IMAGE}`;

    // Generate title
    const title = `${profile.display_name} — ${this.SITE_NAME}`;

    // Generate description (use short_description, fallback to truncated long_description)
    const description = profile.short_description || 
      (profile.long_description.length > 160 
        ? `${profile.long_description.substring(0, 157)}...`
        : profile.long_description);

    return {
      title,
      description,
      canonical: profileUrl,
      openGraph: {
        type: 'profile',
        title,
        description,
        image: imageUrl,
        url: profileUrl,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        image: imageUrl,
      },
    };
  }

  /**
   * Gera apenas as Open Graph tags
   */
  static generateOpenGraphTags(
    profile: Omit<Profile, 'phone_number'>,
    coverImageUrl: string | null = null
  ): OpenGraphTags {
    const metaTags = this.generateMetaTags(profile, coverImageUrl);
    return metaTags.openGraph;
  }

  /**
   * Gera apenas as Twitter Card tags
   */
  static generateTwitterCardTags(
    profile: Omit<Profile, 'phone_number'>,
    coverImageUrl: string | null = null
  ): TwitterCardTags {
    const metaTags = this.generateMetaTags(profile, coverImageUrl);
    return metaTags.twitter;
  }

  /**
   * Gera a canonical URL para um perfil
   */
  static generateCanonicalUrl(slug: string): string {
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_BASE_URL || 'https://libertage.com';

    return `${baseUrl}/perfil/@${slug}`;
  }
}
