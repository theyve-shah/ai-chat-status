import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "desk_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function requireEnv(name: string): string {
  const value = process.env[name]?.trim() ?? "";
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

export function isAuthConfigured(): boolean {
  return Boolean(process.env.DESK_PASSWORD?.trim() && process.env.DESK_SESSION_SECRET?.trim());
}

export function passwordMatches(candidate: string): boolean {
  const expected = process.env.DESK_PASSWORD ?? "";
  if (!expected || !candidate) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function sign(payload: string): string {
  const secret = requireEnv("DESK_SESSION_SECRET");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSessionToken(): string {
  const issuedAt = Date.now().toString(36);
  const payload = `desk.v1.${issuedAt}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token || !isAuthConfigured()) return false;
  const parts = token.split(".");
  if (parts.length !== 4) return false;
  const [ns, ver, issuedAt, signature] = parts;
  if (ns !== "desk" || ver !== "v1" || !issuedAt || !signature) return false;
  const payload = `${ns}.${ver}.${issuedAt}`;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  if (!timingSafeEqual(a, b)) return false;

  const issuedMs = Number.parseInt(issuedAt, 36);
  if (!Number.isFinite(issuedMs)) return false;
  return Date.now() - issuedMs < MAX_AGE_SECONDS * 1000;
}

export function sessionCookieOptions(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}
