"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from "./config";

/** Browser-side Supabase client (uses the public/anon key). */
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
}
