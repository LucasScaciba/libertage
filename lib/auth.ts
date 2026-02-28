import { createClient } from "@/lib/supabase/server";
import type { User } from "@/types";

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .single();

  return user;
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  return user;
}

/**
 * Require specific role - throws if user doesn't have required role
 * Validates: Requirements 19.1, 19.2, 19.3, 19.4, 19.5, 19.6
 */
export async function requireRole(
  role: "admin" | "moderator"
): Promise<User> {
  const user = await requireAuth();

  // Admin has access to everything
  if (user.role === "admin") {
    return user;
  }

  // Check if user has the required role
  if (role === "moderator" && user.role === "moderator") {
    return user;
  }

  throw new Error("Insufficient permissions");
}

/**
 * Check if user has admin role
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === "admin";
}

/**
 * Check if user has moderator or admin role
 */
export async function isModerator(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === "moderator" || user?.role === "admin";
}
