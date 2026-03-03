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
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from("users")
        .select("id, onboarding_completed")
        .eq("id", data.user.id)
        .single();

      const isNewUser = !existingUser;

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

      // For new users: onboarding → plans → profile
      if (isNewUser) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      // For existing users: check if they have completed onboarding
      const { data: userData } = await supabase
        .from("users")
        .select("onboarding_completed")
        .eq("id", data.user.id)
        .single();

      if (!userData?.onboarding_completed) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      // Check if user has active subscription
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", data.user.id)
        .eq("status", "active")
        .single();

      // If no active subscription, redirect to plans
      if (!subscription) {
        return NextResponse.redirect(`${origin}/portal/plans`);
      }

      return NextResponse.redirect(`${origin}/portal`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
