import { NextResponse } from "next/server";
import { assertImportAuthorized } from "@/lib/import-auth";
import { readImportBuffer, writeImportBuffer } from "@/lib/import-buffer";
import {
  normalizeImportPayload,
  type ImportPayload,
} from "@/lib/sync-types";

export const runtime = "nodejs";

/**
 * Push chats from scripts/desk-push.mjs, Shortcuts, Raycast, or an extension.
 *
 * POST body: { tool?, source?, chats: [{ title, externalId, ... }] }
 * Optional auth: Authorization: Bearer $DESK_IMPORT_TOKEN
 *
 * Stores the last payload in .desk-last-import.json so Connect can "Pull last push".
 * (Board data still lives in the browser localStorage.)
 */
export async function POST(request: Request) {
  const denied = assertImportAuthorized(request);
  if (denied) return denied;

  let body: ImportPayload;
  try {
    body = (await request.json()) as ImportPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { chats, error } = normalizeImportPayload(body);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }
  if (chats.length === 0) {
    return NextResponse.json(
      { error: "No valid chats in payload (need title + externalId)" },
      { status: 400 },
    );
  }

  const buffer = await writeImportBuffer(chats);

  return NextResponse.json({
    ok: true,
    syncedAt: buffer.syncedAt,
    count: buffer.count,
    chats: buffer.chats,
    pruneMissing: false,
    hint: "In Desk → Connect → Pull last push to merge into the board.",
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("pull") === "1") {
    const buffer = await readImportBuffer();
    if (!buffer) {
      return NextResponse.json(
        {
          error:
            "No pushed import yet. Run: node scripts/desk-push.mjs --post",
          configured: true,
        },
        { status: 404 },
      );
    }
    return NextResponse.json({
      ...buffer,
      pruneMissing: false,
      configured: true,
    });
  }

  const buffer = await readImportBuffer();
  return NextResponse.json({
    configured: true,
    requiresToken: Boolean(process.env.DESK_IMPORT_TOKEN?.trim()),
    provider: "import",
    lastCount: buffer?.count ?? null,
    lastSyncedAt: buffer?.syncedAt ?? null,
    docs: "POST { chats: [...] } then GET ?pull=1 from Connect",
  });
}
