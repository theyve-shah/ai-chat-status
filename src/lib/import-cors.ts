/**
 * CORS helpers for POST /api/sync/import so the Desk Sync browser extension
 * (and other local tools) can push from a different origin.
 *
 * Cookies from Anthropic/OpenAI are never involved — only Desk's own bearer
 * token (optional) authenticates the push.
 */

const LOCAL_ORIGINS = new Set([
  "http://127.0.0.1:3847",
  "http://localhost:3847",
  "http://127.0.0.1:3000",
  "http://localhost:3000",
]);

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (origin.startsWith("chrome-extension://")) return true;
  if (origin.startsWith("moz-extension://")) return true;
  if (LOCAL_ORIGINS.has(origin)) return true;
  // Same-host Desk UI talking to itself is fine; reflect carefully.
  try {
    const u = new URL(origin);
    if (u.protocol === "http:" || u.protocol === "https:") {
      if (u.hostname === "127.0.0.1" || u.hostname === "localhost") {
        return true;
      }
    }
  } catch {
    return false;
  }
  // Hosted Desk: allow the request Origin when it matches the page URL's host
  // is handled by same-origin fetch; for extensions we already allow chrome-*.
  // Optionally allow DESK_CORS_ORIGINS=https://desk.example.com,chrome-extension://id
  const extra = process.env.DESK_CORS_ORIGINS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (extra?.includes(origin) || extra?.includes("*")) return true;
  return false;
}

export function corsHeadersFor(request: Request): HeadersInit {
  const origin = request.headers.get("origin");
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
  if (origin && isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers.Vary = "Origin";
  }
  return headers;
}

export function withCors(request: Request, response: Response): Response {
  const extra = corsHeadersFor(request);
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(extra)) {
    headers.set(k, v);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
