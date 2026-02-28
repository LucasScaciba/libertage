import { createClient } from "@/lib/supabase/server";
import type { Report } from "@/types";

interface CreateReportInput {
  profile_id: string;
  reporter_user_id?: string | null;
  reporter_fingerprint?: string | null;
  reason: "inappropriate_content" | "fake_profile" | "spam" | "other";
  details: string;
}

interface ReportFilters {
  status?: "new" | "under_review" | "resolved" | "dismissed";
  profile_id?: string;
}

export class ReportService {
  /**
   * Submit a new report (anonymous with fingerprint or authenticated)
   * Validates: Requirements 17.1, 17.2, 17.3, 17.4, 17.5, 17.7
   */
  static async submitReport(data: CreateReportInput): Promise<Report> {
    const supabase = await createClient();

    // Validate required fields
    if (!data.reason || !data.details || data.details.trim() === "") {
      throw new Error("Reason and details are required");
    }

    // Check rate limit before submission
    if (data.reporter_fingerprint) {
      const canSubmit = await this.canSubmitReport(data.reporter_fingerprint);
      if (!canSubmit) {
        throw new Error("Rate limit exceeded. Maximum 5 reports per hour.");
      }
    }

    const { data: report, error } = await supabase
      .from("reports")
      .insert({
        profile_id: data.profile_id,
        reporter_user_id: data.reporter_user_id || null,
        reporter_fingerprint: data.reporter_fingerprint || null,
        reason: data.reason,
        details: data.details,
        status: "new",
      })
      .select()
      .single();

    if (error) throw error;
    return report;
  }

  /**
   * Check if a fingerprint can submit a report (rate limit check)
   * Validates: Requirements 17.6, 22.2
   */
  static async canSubmitReport(fingerprint: string): Promise<boolean> {
    const supabase = await createClient();

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const { data, error } = await supabase
      .from("reports")
      .select("id")
      .eq("reporter_fingerprint", fingerprint)
      .gte("created_at", oneHourAgo.toISOString());

    if (error) throw error;

    return (data?.length || 0) < 5;
  }

  /**
   * List reports with filters
   * Validates: Requirements 18.1, 18.2
   */
  static async listReports(filters: ReportFilters = {}): Promise<Report[]> {
    const supabase = await createClient();

    let query = supabase
      .from("reports")
      .select(`
        *,
        profile:profiles(display_name, slug),
        reporter:users!reports_reporter_user_id_fkey(name, email),
        reviewer:users!reports_reviewed_by_fkey(name, email)
      `)
      .order("created_at", { ascending: false });

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.profile_id) {
      query = query.eq("profile_id", filters.profile_id);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Update report status
   * Validates: Requirements 18.4
   */
  static async updateReportStatus(
    reportId: string,
    status: "new" | "under_review" | "resolved" | "dismissed",
    reviewerId: string
  ): Promise<Report> {
    const supabase = await createClient();

    const { data: report, error } = await supabase
      .from("reports")
      .update({
        status,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", reportId)
      .select()
      .single();

    if (error) throw error;

    // Create audit log
    await supabase.from("audit_logs").insert({
      actor_user_id: reviewerId,
      action: "report_status_updated",
      target_type: "report",
      target_id: reportId,
      metadata: { new_status: status },
    });

    return report;
  }
}
