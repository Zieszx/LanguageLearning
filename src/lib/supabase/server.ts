import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_PUBLIC_KEY, SUPABASE_URL } from "./config";

/**
 * Server-side Supabase client bound to the request's cookies. In Next 16
 * `cookies()` is async, so this helper is async too. Safe to call in Server
 * Components, Route Handlers and Server Actions.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // `setAll` can be called from a Server Component, where setting
          // cookies throws. The proxy refreshes the session, so this is safe
          // to ignore here.
        }
      },
    },
  });
}
