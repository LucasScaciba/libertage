import { AuthServerService } from "@/lib/services/auth-server.service";
import { MediaService } from "@/lib/services/media.service";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get("profileId");

    if (!profileId) {
      return NextResponse.json(
        { error: "profileId is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: media, error } = await supabase
      .from("media")
      .select("*")
      .eq("profile_id", profileId)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ media });
  } catch (error: any) {
    console.error("Error fetching media:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch media" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await AuthServerService.requireAuth();
    const data = await request.json();

    const { profileId, type, storage_path, file_size, is_cover, sort_order } = data;

    if (!profileId || !type || !storage_path || !file_size) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify profile ownership
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("id", profileId)
      .single();

    if (!profile || profile.user_id !== user.id) {
      return NextResponse.json(
        { error: "Profile not found or unauthorized" },
        { status: 404 }
      );
    }

    // Get public URL from storage
    const { data: urlData } = supabase.storage
      .from("media")
      .getPublicUrl(storage_path);

    const public_url = urlData.publicUrl;

    // Create media record
    const media = await MediaService.createMediaRecord(profileId, {
      type,
      storage_path,
      public_url,
      file_size,
      is_cover,
      sort_order,
    });

    return NextResponse.json({ media }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating media record:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create media record" },
      { status: 500 }
    );
  }
}
