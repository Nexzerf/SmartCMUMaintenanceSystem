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

  if (pathname === "/logout") return NextResponse.next();

  if (pathname === "/login") {
    if (session) return NextResponse.redirect(new URL(ROLE_HOME[session.role], req.url));
    return NextResponse.next();
  }

  if (!session) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const url = new URL("/login", req.url);
    if (token) url.searchParams.set("expired", "1");
    const res = NextResponse.redirect(url);
    if (token) res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  if (pathname === "/") return NextResponse.redirect(new URL(ROLE_HOME[session.role], req.url));

  const rule = ROLE_PREFIXES.find(([prefix]) => pathname === prefix || pathname.startsWith(prefix + "/"));
  if (rule && rule[1] !== session.role) {
    return NextResponse.redirect(new URL(ROLE_HOME[session.role], req.url));
  }

  const res = NextResponse.next();
  if (!PASSIVE_PATHS.includes(pathname)) {
    // Sliding idle timeout: every active request extends the session by 30 minutes.
    res.cookies.set(SESSION_COOKIE, await signSession(session), sessionCookieOptions);
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|seed/|uploads/|fonts/|.*\.(?:png|jpg|jpeg|svg|webp|woff2?)$).*)"],
};
