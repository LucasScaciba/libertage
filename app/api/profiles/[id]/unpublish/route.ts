import { AuthService } from "@/lib/services/auth.service";
import { ProfileService } from "@/lib/services/profile.service";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin role
    const user = await AuthService.requireRole("admin");
    const profileId = params.id;

    await ProfileService.unpublishProfile(profileId, user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error unpublishing profile:", error);
    
    if (error.message === "Forbidden") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to unpublish profile" },
      { status: 500 }
    );
  }
}
