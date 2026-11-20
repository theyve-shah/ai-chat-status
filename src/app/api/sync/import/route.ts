import { NextResponse } from "next/server";
import { assertImportAuthorized } from "@/lib/import-auth";
import { readImportBuffer, writeImportBuffer } from "@/lib/import-buffer";
import { corsHeadersFor, withCors } from "@/lib/import-cors";
import {
  normalizeImportPayload,
  type ImportPayload,
} from "@/lib/sync-types";

export const runtime = "nodejs";

type ImportBody = ImportPayload & { merge?: boolean };

/**
 * Push chats from scripts/desk-push.mjs, Shortcuts, Raycast, or the Desk Sync
 * browser extension.
 *
 * POST body: { tool?, source?, merge?, chats: [{ title, externalId, ... }] }
 * Optional auth: Authorization: Bearer $DESK_IMPORT_TOKEN
 *
 * Stores the last payload in .desk-last-import.json so Connect / the board
 * can pull (Desk auto-polls while open). Extension CORS: chrome-extension://
 * and localhost origins are reflected; never accepts Anthropic/OpenAI cookies.
 */
export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeadersFor(request),
  });
}

export async function POST(request: Request) {
  const denied = assertImportAuthorized(request);
  if (denied) return withCors(request, denied);

  let body: ImportBody;
  try {
    body = (await request.json()) as ImportBody;
  } catch {
    return withCors(
      request,
      NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
    );
  }

  const { chats, error } = normalizeImportPayload(body);
  if (error) {
    return withCors(
      request,
      NextResponse.json({ error }, { status: 400 }),
    );
  }
  if (chats.length === 0) {
    return withCors(
      request,
      NextResponse.json(
        { error: "No valid chats in payload (need title + externalId)" },
        { status: 400 },
      ),
    );
  }

  const buffer = await writeImportBuffer(chats, {
    merge: Boolean(body.merge),
  });

  return withCors(
    request,
    NextResponse.json({
      ok: true,
      syncedAt: buffer.syncedAt,
      count: buffer.count,
      chats: buffer.chats,
      pruneMissing: false,
      hint: "Desk auto-pulls this buffer while open; Connect → Pull last push still works.",
    }),
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("pull") === "1") {
    const buffer = await readImportBuffer();
    if (!buffer) {
      return withCors(
        request,
        NextResponse.json(
          {
            error:
              "No pushed import yet. Run the Desk Sync extension, or: node scripts/desk-push.mjs --post",
            configured: true,
          },
          { status: 404 },
        ),
      );
    }
    return withCors(
      request,
      NextResponse.json({
        ...buffer,
        pruneMissing: false,
        configured: true,
      }),
    );
  }

  const buffer = await readImportBuffer();
  return withCors(
    request,
    NextResponse.json({
      configured: true,
      requiresToken: Boolean(process.env.DESK_IMPORT_TOKEN?.trim()),
      provider: "import",
      lastCount: buffer?.count ?? null,
      lastSyncedAt: buffer?.syncedAt ?? null,
      docs: "POST { chats: [...], merge?: true } then GET ?pull=1 from Connect / auto-pull",
    }),
  );
}
