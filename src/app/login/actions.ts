"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export interface AuthState {
  error?: string;
  message?: string;
}

function safeNext(next: FormDataEntryValue | null): string {
  const value = typeof next === "string" ? next : "/";
  // Only allow internal paths to avoid open-redirects.
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isSupabaseConfigured) {
    return { error: "Sign-in isn't configured yet. Add your Supabase keys." };
  }
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  redirect(next);
}

export async function signup(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!isSupabaseConfigured) {
    return { error: "Sign-up isn't configured yet. Add your Supabase keys." };
  }
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("display_name") ?? "").trim();

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName || email.split("@")[0] } },
  });
  if (error) return { error: error.message };

  // If email confirmation is required, there's no active session yet.
  if (!data.session) {
    return {
      message: "Check your email to confirm your account, then sign in.",
    };
  }

  redirect("/");
}
