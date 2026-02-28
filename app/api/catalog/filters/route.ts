import { CatalogService } from "@/lib/services/catalog.service";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [categories, cities, regions] = await Promise.all([
      CatalogService.getCategories(),
      CatalogService.getCities(),
      CatalogService.getRegions(),
    ]);

    return NextResponse.json({
      categories,
      cities,
      regions,
    });
  } catch (error: any) {
    console.error("Error fetching filters:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch filters" },
      { status: 500 }
    );
  }
}
