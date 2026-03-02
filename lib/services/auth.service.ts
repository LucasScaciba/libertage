import { createClient as createBrowserClient } from "@/lib/supabase/client";

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

  static async getCurrentUserClient() {
    const supabase = createBrowserClient();
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
}
