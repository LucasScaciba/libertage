import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/audit-logs - List audit logs (admin only)
 * Validates: Requirements 20.5, 20.6
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin role
    await requireRole("admin");

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    const supabase = await createClient();

    let query = supabase
      .from("audit_logs")
      .select(`
        *,
        actor:users!audit_logs_actor_user_id_fkey(name, email)
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    // Filter by action type
    if (action) {
      query = query.eq("action", action);
    }

    // Filter by date range
    if (startDate) {
      query = query.gte("created_at", startDate);
    }
    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data || []);
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
          message: error.message || "Failed to fetch audit logs",
        },
      },
      { status: 500 }
    );
  }
}
