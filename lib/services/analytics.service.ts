import { createClient } from "@/lib/supabase/server";

export interface AnalyticsSummary {
  visitsToday: number;
  visits7Days: number;
  visits30Days: number;
  visits12Months: number;
  clicksByMethod: Record<string, number>;
}

export interface VisitsByDate {
  date: string;
  mobile: number;
  desktop: number;
  tablet: number;
}

export class AnalyticsService {
  /**
   * Track a profile visit
   */
  static async trackVisit(profileId: string, fingerprint: string, deviceType?: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from("analytics_events")
      .insert({
        profile_id: profileId,
        event_type: "visit",
        visitor_fingerprint: fingerprint,
        device_type: deviceType || null,
      });

    if (error) {
      console.error("Error tracking visit:", error);
      // Don't throw - analytics failures shouldn't break user experience
    }
  }

  /**
   * Track a contact button click
   */
  static async trackContactClick(
    profileId: string,
    method: string,
    fingerprint: string
  ): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from("analytics_events")
      .insert({
        profile_id: profileId,
        event_type: "contact_click",
        contact_method: method,
        visitor_fingerprint: fingerprint,
      });

    if (error) {
      console.error("Error tracking contact click:", error);
      // Don't throw - analytics failures shouldn't break user experience
    }
  }

  /**
   * Get analytics summary for a profile with aggregations by period
   */
  static async getAnalyticsSummary(profileId: string): Promise<AnalyticsSummary> {
    const supabase = await createClient();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twelveMonthsAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Get visits for different time periods
    const [todayVisits, sevenDayVisits, thirtyDayVisits, twelveMonthVisits, clicks] =
      await Promise.all([
        // Visits today
        supabase
          .from("analytics_events")
          .select("*", { count: "exact", head: true })
          .eq("profile_id", profileId)
          .eq("event_type", "visit")
          .gte("created_at", today.toISOString()),

        // Visits last 7 days
        supabase
          .from("analytics_events")
          .select("*", { count: "exact", head: true })
          .eq("profile_id", profileId)
          .eq("event_type", "visit")
          .gte("created_at", sevenDaysAgo.toISOString()),

        // Visits last 30 days
        supabase
          .from("analytics_events")
          .select("*", { count: "exact", head: true })
          .eq("profile_id", profileId)
          .eq("event_type", "visit")
          .gte("created_at", thirtyDaysAgo.toISOString()),

        // Visits last 12 months
        supabase
          .from("analytics_events")
          .select("*", { count: "exact", head: true })
          .eq("profile_id", profileId)
          .eq("event_type", "visit")
          .gte("created_at", twelveMonthsAgo.toISOString()),

        // All contact clicks (for grouping by method)
        supabase
          .from("analytics_events")
          .select("contact_method")
          .eq("profile_id", profileId)
          .eq("event_type", "contact_click"),
      ]);

    // Group clicks by method
    const clicksByMethod: Record<string, number> = {};
    if (clicks.data) {
      for (const click of clicks.data) {
        const method = click.contact_method || "unknown";
        clicksByMethod[method] = (clicksByMethod[method] || 0) + 1;
      }
    }

    return {
      visitsToday: todayVisits.count || 0,
      visits7Days: sevenDayVisits.count || 0,
      visits30Days: thirtyDayVisits.count || 0,
      visits12Months: twelveMonthVisits.count || 0,
      clicksByMethod,
    };
  }

  /**
   * Get visits by date and device type for charts
   */
  static async getVisitsByDate(profileId: string, days: number = 90): Promise<VisitsByDate[]> {
    const supabase = await createClient();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from("analytics_events")
      .select("created_at, device_type")
      .eq("profile_id", profileId)
      .eq("event_type", "visit")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching visits by date:", error);
      return [];
    }

    // Group by date and device type
    const visitsByDate: Record<string, { mobile: number; desktop: number; tablet: number }> = {};

    for (const visit of data || []) {
      const date = new Date(visit.created_at).toISOString().split("T")[0];
      
      if (!visitsByDate[date]) {
        visitsByDate[date] = { mobile: 0, desktop: 0, tablet: 0 };
      }

      const deviceType = visit.device_type || "desktop"; // Default to desktop if not set
      if (deviceType === "mobile") {
        visitsByDate[date].mobile++;
      } else if (deviceType === "tablet") {
        visitsByDate[date].tablet++;
      } else {
        visitsByDate[date].desktop++;
      }
    }

    // Convert to array and fill missing dates with zeros
    const result: VisitsByDate[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const dateStr = date.toISOString().split("T")[0];

      result.push({
        date: dateStr,
        mobile: visitsByDate[dateStr]?.mobile || 0,
        desktop: visitsByDate[dateStr]?.desktop || 0,
        tablet: visitsByDate[dateStr]?.tablet || 0,
      });
    }

    return result;
  }
}
