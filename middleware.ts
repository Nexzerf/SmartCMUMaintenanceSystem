import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, sessionCookieOptions, signSession, verifySession } from "@/lib/auth/session";
import { ROLE_HOME, type Role } from "@/lib/status";

const ROLE_PREFIXES: [string, Role][] = [
  ["/admin", "admin"],
  ["/tech", "technician"],
  ["/home", "reporter"],
  ["/request", "reporter"],
  ["/history", "reporter"],
  ["/notifications", "reporter"],
  ["/profile", "reporter"],
];

// Background requests that must not count as user activity for the idle timeout.
const PASSIVE_PATHS = ["/api/pulse"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);

  // Public: clears a stale cookie / reports deployment readiness without leaking values.
  if (pathname === "/logout" || pathname === "/api/health") return NextResponse.next();

  if (pathname === "/login") {
    if (session) return NextResponse.redirect(new URL(ROLE_HOME[session.role], req.url));
    return NextResponse.next();
  }

  if (!session) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const url = new URL("/login", req.url);
    // no-store below: a redirect to /login must not be cached for other visitors either.
    if (token) url.searchParams.set("expired", "1");
    const res = NextResponse.redirect(url);
    res.headers.set("Cache-Control", "private, no-store");
    res.headers.set("Netlify-CDN-Cache-Control", "no-store");
    if (token) res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  if (pathname === "/") return NextResponse.redirect(new URL(ROLE_HOME[session.role], req.url));

  const rule = ROLE_PREFIXES.find(([prefix]) => pathname === prefix || pathname.startsWith(prefix + "/"));
  if (rule && rule[1] !== session.role) {
    return NextResponse.redirect(new URL(ROLE_HOME[session.role], req.url));
  }

  const res = NextResponse.next();
  // Signed-in pages are per-user: never let a CDN or proxy reuse them for someone else.
  res.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
  res.headers.set("Netlify-CDN-Cache-Control", "no-store");
  if (!PASSIVE_PATHS.includes(pathname)) {
    // Sliding idle timeout: every active request extends the session by 30 minutes.
    res.cookies.set(SESSION_COOKIE, await signSession(session), sessionCookieOptions);
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|seed/|uploads/|fonts/|.*\.(?:png|jpg|jpeg|svg|webp|woff2?)$).*)"],
};
