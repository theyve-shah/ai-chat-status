import { NextResponse } from "next/server";
import {
  claudeComplianceToTracked,
  fetchClaudeComplianceChats,
} from "@/lib/claude-compliance";

export const runtime = "nodejs";

/**
 * Sync claude.ai chats via Anthropic Compliance API (Claude Enterprise).
 * Consumer accounts: use Connect → Import Claude Code JSONL or scripts/desk-push.mjs.
 */
export async function POST() {
  const apiKey = process.env.DESK_ANTHROPIC_COMPLIANCE_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "DESK_ANTHROPIC_COMPLIANCE_KEY is not set. Claude Enterprise Compliance Access Key required — consumer Claude.ai has no list-chats API. Use Connect → drop Claude Code .jsonl or scripts/desk-push.mjs instead.",
        configured: false,
        enterpriseOnly: true,
      },
      { status: 503 },
    );
  }

  try {
    const { items } = await fetchClaudeComplianceChats(apiKey);
    const chats = items.map(claudeComplianceToTracked);
    return NextResponse.json({
      configured: true,
      syncedAt: new Date().toISOString(),
      count: chats.length,
      chats,
      pruneMissing: true,
      provider: "claude",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to sync Claude compliance chats";
    return NextResponse.json(
      { error: message, configured: true, enterpriseOnly: true },
      { status: 502 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.DESK_ANTHROPIC_COMPLIANCE_KEY?.trim()),
    enterpriseOnly: true,
    provider: "claude",
    docs: "https://platform.claude.com/docs/en/api/compliance/apps/chats/list",
    consumerPath:
      "Import ~/.claude/projects/**/*.jsonl via Connect file drop or scripts/desk-push.mjs",
  });
}
