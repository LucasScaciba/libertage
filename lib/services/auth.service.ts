import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { createClient as createServerClient } from "@/lib/supabase/server";

export class AuthService {
  // Client-side methods
  static async signInWithGoogle() {
    const supabase = createBrowserClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
      },
    });

    if (error) throw error;
    return data;
  }

  static async signOut() {
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  // Server-side methods
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
