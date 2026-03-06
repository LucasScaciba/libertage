import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createClient();
    const { slug } = await params;

    // Fetch profile with published status only
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(`
        *,
        profile_verifications(status, verified_at, expires_at)
      `)
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Profile not found" } },
        { status: 404 }
      );
    }

    // Add verification status
    const verification = profile.profile_verifications?.[0];
    const isVerified = verification?.status === 'verified' && 
                      new Date(verification.expires_at) > new Date();
    profile.is_verified = isVerified;
    profile.verified_at = isVerified ? verification.verified_at : null;
    delete profile.profile_verifications;

    // Fetch media from new processing pipeline
    const { data: mediaData } = await supabase
      .from("media_processing")
      .select("*")
      .eq("profile_id", profile.id)
      .eq("status", "ready") // Only show processed media
      .order("sort_order", { ascending: true });

    // Media is already in the correct format with public URLs (bucket is public)
    const media = mediaData || [];

    // Fetch availability
    const { data: availability } = await supabase
      .from("availability")
      .select("*")
      .eq("profile_id", profile.id)
      .order("weekday", { ascending: true });

    // Fetch features
    const { data: profileFeatures } = await supabase
      .from("profile_features")
      .select("feature_id, features(id, group_name, feature_name, display_order)")
      .eq("profile_id", profile.id);

    const features = profileFeatures?.map((pf: any) => pf.features) || [];

    // Fetch pricing packages from profile JSONB field
    const pricing_packages = profile.pricing_packages || [];

    // Fetch external links from profile JSONB field
    const external_links = profile.external_links || [];

    // Remove phone_number from response for privacy
    const { phone_number, ...profileWithoutPhone } = profile as any;

    return NextResponse.json({
      profile: profileWithoutPhone,
      media: media || [],
      availability: availability || [],
      features,
      pricing_packages,
      external_links,
    });
  } catch (error) {
    console.error("Error fetching public profile:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch profile" } },
      { status: 500 }
    );
  }
}
