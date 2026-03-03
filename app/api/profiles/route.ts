import { AuthServerService } from "@/lib/services/auth-server.service";
import { ProfileService } from "@/lib/services/profile.service";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const user = await AuthServerService.requireAuth();
    const data = await request.json();

    // Validate required fields
    const requiredFields = [
      "display_name",
      "slug",
      "short_description",
      "long_description",
      "city",
    ];

    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Set default category if not provided
    if (!data.category) {
      data.category = "general";
    }

    // Set default region if not provided (extract from city or use default)
    if (!data.region) {
      // Try to extract state from city string (e.g., "São Paulo - SP" -> "SP")
      const cityParts = data.city.split(" - ");
      data.region = cityParts.length > 1 ? cityParts[1] : "BR";
    }

    // Validate short_description length
    if (data.short_description.length > 160) {
      return NextResponse.json(
        { error: "Short description must be 160 characters or less" },
        { status: 400 }
      );
    }

    const profile = await ProfileService.createProfile(user.id, data);

    return NextResponse.json({ profile }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating profile:", error);
    
    if (error.message?.includes("duplicate key")) {
      return NextResponse.json(
        { error: "This slug is already taken" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create profile" },
      { status: 500 }
    );
  }
}
