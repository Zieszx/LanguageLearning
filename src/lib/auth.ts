import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/config";
import type { User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  role: "user" | "admin";
  created_at: string;
}

/** Returns the current user, or null if signed out / Supabase not configured. */
export async function getUser(): Promise<User | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Loads the profile row (role, display name) for the current user. */
export async function getProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, email, display_name, role, created_at")
    .eq("id", user.id)
    .single();

  return (data as Profile | null) ?? null;
}

/** Redirects to /login unless a user is signed in. Returns the user. */
export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

/** Redirects non-admins away. Returns the admin profile. */
export async function requireAdmin(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/");
  return profile;
}
