import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { ReportService } from "@/lib/services/report.service";

/**
 * GET /api/admin/reports - List reports (admin/moderator)
 * Validates: Requirements 18.1, 18.4
 */
export async function GET(request: NextRequest) {
  try {
    // Require moderator or admin role
    await requireRole("moderator");

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as any;
    const profile_id = searchParams.get("profile_id") as any;

    // List reports with filters
    const reports = await ReportService.listReports({
      status,
      profile_id,
    });

    return NextResponse.json(reports);
  } catch (error: any) {
    if (error.message.includes("Authentication required")) {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        },
        { status: 401 }
      );
    }

    if (error.message.includes("Insufficient permissions")) {
      return NextResponse.json(
        {
          error: {
            code: "FORBIDDEN",
            message: "Insufficient permissions. Admin or moderator role required.",
          },
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: error.message || "Failed to fetch reports",
        },
      },
      { status: 500 }
    );
  }
}
