/**
 * Resolves Supabase connection details from environment variables. We accept a
 * few common names so it works whether you provisioned classic "anon" keys or
 * the newer "publishable" keys. The URL and the browser key MUST be exposed
 * with the `NEXT_PUBLIC_` prefix so the client bundle can read them.
 */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";

export const SUPABASE_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  "";

/** True only when both pieces the browser needs are present. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLIC_KEY);
