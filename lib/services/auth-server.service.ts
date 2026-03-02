import { createClient as createServerClient } from "@/lib/supabase/server";

export class AuthServerService {
  static async getCurrentUser() {
    const supabase = await createServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) return null;

    // Get user data from users table
    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    return userData;
  }

  static async requireAuth() {
    const user = await this.getCurrentUser();
    if (!user) {
      throw new Error("Unauthorized");
    }
    return user;
  }

  static async requireRole(role: "admin" | "moderator") {
    const user = await this.requireAuth();
    if (user.role !== role && user.role !== "admin") {
      throw new Error("Forbidden");
    }
    return user;
  }

  static async checkOnboardingStatus(userId: string) {
    const supabase = await createServerClient();
    const { data } = await supabase
      .from("users")
      .select("onboarding_completed")
      .eq("id", userId)
      .single();

    return data?.onboarding_completed || false;
  }
}
