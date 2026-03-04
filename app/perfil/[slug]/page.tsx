import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SEOMetaGenerator } from "@/lib/services/seo-meta-generator";
import PublicProfileClient from "./PublicProfileClient";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  // Remove @ symbol if present
  const cleanSlug = slug.startsWith('@') ? slug.substring(1) : slug;

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("slug", cleanSlug)
    .eq("status", "published")
    .single();

  if (!profile) {
    return {
      title: "Perfil não encontrado — Libertage",
    };
  }

  // Fetch cover image
  const { data: media } = await supabase
    .from("media")
    .select("public_url")
    .eq("profile_id", profile.id)
    .eq("is_cover", true)
    .single();

  const coverImageUrl = media?.public_url || null;

  // Generate meta tags
  const metaTags = SEOMetaGenerator.generateMetaTags(profile, coverImageUrl);

  return {
    title: metaTags.title,
    description: metaTags.description,
    alternates: {
      canonical: metaTags.canonical,
    },
    openGraph: {
      type: 'profile',
      title: metaTags.openGraph.title,
      description: metaTags.openGraph.description,
      images: [metaTags.openGraph.image],
      url: metaTags.openGraph.url,
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTags.twitter.title,
      description: metaTags.twitter.description,
      images: [metaTags.twitter.image],
    },
  };
}

/**
 * Public Profile Page (Server Component)
 * 
 * Renders the public profile page with SEO optimization.
 * Uses Server-Side Rendering for better SEO and social sharing.
 */
export default async function PublicProfilePage({ params }: PageProps) {
  const { slug } = await params;

  // Remove @ symbol if present
  const cleanSlug = slug.startsWith('@') ? slug.substring(1) : slug;

  // Render client component with slug
  return <PublicProfileClient slug={cleanSlug} />;
}
