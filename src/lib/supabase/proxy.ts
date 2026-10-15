import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/today",
  "/tasks",
  "/habits",
  "/review",
  "/rescue",
  "/settings",
  "/focus",
  "/brain-dump",
  "/voice",
  "/rewards",
  "/onboarding",
];

/** Pages for people who haven't signed in yet; signed-in (non-guest) visitors are sent on to the app. */
const SIGNED_OUT_ONLY = ["/login", "/signup", "/forgot-password"];

function matches(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** A redirect that still carries any session cookies refreshed during this request. */
function redirectTo(url: URL, from: NextResponse) {
  const response = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
  return response;
}

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // Supabase isn't configured yet. Let every page render (they explain the setup).
    return response;
  }

  const { pathname, search } = request.nextUrl;
  const isProtected = matches(pathname, PROTECTED_PREFIXES);

  // No auth cookie means no session to refresh: skip the Supabase round trip entirely.
  const hasAuthCookie = request.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));
  if (!hasAuthCookie) {
    if (!isProtected) return response;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // Verifies the JWT locally (and refreshes it when it has expired) instead of a network call per request.
  let claims: { sub?: string; is_anonymous?: boolean } | null = null;
  try {
    const { data } = await supabase.auth.getClaims();
    claims = data?.claims ?? null;
  } catch {
    claims = null; // Treated as signed out; the next request will try again.
  }
  const signedIn = Boolean(claims?.sub);

  if (isProtected && !signedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", `${pathname}${search}`);
    return redirectTo(url, response);
  }

  if (signedIn && claims?.is_anonymous !== true && matches(pathname, SIGNED_OUT_ONLY)) {
    const url = request.nextUrl.clone();
    url.pathname = "/today";
    url.search = "";
    return redirectTo(url, response);
  }

  return response;
}
