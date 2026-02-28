import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Store user data in users table
      const { error: upsertError } = await supabase.from("users").upsert({
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata.full_name || data.user.email!.split("@")[0],
        avatar_url: data.user.user_metadata.avatar_url,
        updated_at: new Date().toISOString(),
      });

      if (upsertError) {
        console.error("Error upserting user:", upsertError);
      }

      // Check onboarding status
      const { data: userData } = await supabase
        .from("users")
        .select("onboarding_completed")
        .eq("id", data.user.id)
        .single();

      // Redirect based on onboarding status
      if (!userData?.onboarding_completed) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      return NextResponse.redirect(`${origin}/portal`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
