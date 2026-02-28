import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/users/:id/ban - Ban user (admin only)
 * Validates: Requirements 18.7, 20.3
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin role (not moderator)
    const actor = await requireRole("admin");

    const { id: userId } = await params;
    const body = await request.json();
    const reason = body.reason || "No reason provided";

    const supabase = await createClient();

    // Update user status to banned
    const { error: updateError } = await supabase
      .from("users")
      .update({ status: "banned" })
      .eq("id", userId);

    if (updateError) throw updateError;

    // Create audit log
    const { error: auditError } = await supabase.from("audit_logs").insert({
      actor_user_id: actor.id,
      action: "user_banned",
      target_type: "user",
      target_id: userId,
      metadata: { reason },
    });

    if (auditError) throw auditError;

    return NextResponse.json({
      success: true,
      message: "User banned successfully",
    });
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
            message: "Insufficient permissions. Admin role required.",
          },
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: error.message || "Failed to ban user",
        },
      },
      { status: 500 }
    );
  }
}
