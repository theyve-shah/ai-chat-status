import { timingSafeEqual } from "crypto";

/**
 * Optional shared secret for POST /api/sync/import (local helpers → hosted Desk).
 * When unset, import is allowed (dev / open local). When set, require Bearer token.
 */
export function assertImportAuthorized(request: Request): Response | null {
  const expected = process.env.DESK_IMPORT_TOKEN?.trim();
  if (!expected) return null;

  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  const provided = match?.[1]?.trim() ?? "";

  if (!provided || provided.length !== expected.length) {
    return Response.json(
      {
        error:
          "Unauthorized. Set Authorization: Bearer <DESK_IMPORT_TOKEN> to push chats.",
      },
      { status: 401 },
    );
  }

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (!timingSafeEqual(a, b)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  return null;
}
