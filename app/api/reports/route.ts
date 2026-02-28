import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ReportService } from "@/lib/services/report.service";

/**
 * POST /api/reports - Submit a report (public, with rate limiting)
 * Validates: Requirements 17.1, 17.6, 22.2
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Get current user (if authenticated)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get fingerprint from request (should be sent by client)
    const fingerprint = body.fingerprint || null;

    // Validate required fields
    if (!body.profile_id || !body.reason || !body.details) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Profile ID, reason, and details are required",
          },
        },
        { status: 400 }
      );
    }

    // Submit report
    const report = await ReportService.submitReport({
      profile_id: body.profile_id,
      reporter_user_id: user?.id || null,
      reporter_fingerprint: fingerprint,
      reason: body.reason,
      details: body.details,
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error: any) {
    if (error.message.includes("Rate limit")) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: error.message,
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": "3600", // 1 hour in seconds
          },
        }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: error.message || "Failed to submit report",
        },
      },
      { status: 500 }
    );
  }
}
