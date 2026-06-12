import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  SUPABASE_PUBLIC_KEY,
  SUPABASE_URL,
  isSupabaseConfigured,
} from "@/lib/supabase/config";

// Routes that never require a logged-in user.
const PUBLIC_PATHS = ["/login", "/auth"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/**
 * Runs before every (matched) request: refreshes the Supabase session cookie
 * and gates app routes behind authentication. If Supabase isn't configured we
 * pass everything through, so the app keeps working without auth.
 */
export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // IMPORTANT: getUser() revalidates the token with Supabase (don't trust
  // getSession() in server code).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Already signed in? Skip the login page.
  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Run on everything except static assets and the API (the chat API guards
  // itself and doesn't need a redirect response).
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.\\w+$).*)"],
};
