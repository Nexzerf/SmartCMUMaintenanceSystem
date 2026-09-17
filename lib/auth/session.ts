// Session token helpers. Edge-compatible (used by middleware and server code).
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@/lib/status";

export const SESSION_COOKIE = "cmu_session";
export const IDLE_TIMEOUT_SECONDS = 30 * 60;

export type SessionPayload = { uid: string; role: Role; username: string };

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be set (at least 32 characters)");
  return new TextEncoder().encode(s);
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${IDLE_TIMEOUT_SECONDS}s`)
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (typeof payload.uid !== "string" || typeof payload.role !== "string") return null;
    return { uid: payload.uid, role: payload.role as Role, username: String(payload.username ?? "") };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: IDLE_TIMEOUT_SECONDS,
};
