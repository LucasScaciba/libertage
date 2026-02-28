import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { ReportService } from "@/lib/services/report.service";

/**
 * PATCH /api/admin/reports/:id - Update report status (admin/moderator)
 * Validates: Requirements 18.4
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require moderator or admin role
    const user = await requireRole("moderator");

    const { id } = await params;
    const body = await request.json();

    // Validate status
    const validStatuses = ["new", "under_review", "resolved", "dismissed"];
    if (!body.status || !validStatuses.includes(body.status)) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Valid status is required",
          },
        },
        { status: 400 }
      );
    }

    // Update report status
    const report = await ReportService.updateReportStatus(
      id,
      body.status,
      user.id
    );

    return NextResponse.json(report);
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
          message: error.message || "Failed to update report",
        },
      },
      { status: 500 }
    );
  }
}
