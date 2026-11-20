import { NextResponse } from "next/server";
import {
  chatgptComplianceToTracked,
  fetchChatgptComplianceConversations,
} from "@/lib/chatgpt-compliance";

export const runtime = "nodejs";

/**
 * Sync ChatGPT conversations via Enterprise Compliance API.
 * Consumer ChatGPT/Codex: drop Codex rollout JSONL or use scripts/desk-push.mjs.
 * Note: OpenAI Conversations API has no list endpoint; Chat Completions list
 * only returns store:true API calls — not chatgpt.com history.
 */
export async function POST() {
  const apiKey = process.env.DESK_OPENAI_COMPLIANCE_KEY?.trim();
  const workspaceId = process.env.DESK_OPENAI_WORKSPACE_ID?.trim();

  if (!apiKey || !workspaceId) {
    return NextResponse.json(
      {
        error:
          "Set DESK_OPENAI_COMPLIANCE_KEY and DESK_OPENAI_WORKSPACE_ID (ChatGPT Enterprise/Edu). Consumer ChatGPT has no list-chats API — import Codex ~/.codex/sessions rollouts via Connect or scripts/desk-push.mjs.",
        configured: false,
        enterpriseOnly: true,
      },
      { status: 503 },
    );
  }

  try {
    const { items } = await fetchChatgptComplianceConversations(
      apiKey,
      workspaceId,
    );
    const chats = items.map(chatgptComplianceToTracked);
    return NextResponse.json({
      configured: true,
      syncedAt: new Date().toISOString(),
      count: chats.length,
      chats,
      pruneMissing: true,
      provider: "chatgpt",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to sync ChatGPT compliance conversations";
    return NextResponse.json(
      { error: message, configured: true, enterpriseOnly: true },
      { status: 502 },
    );
  }
}

export async function GET() {
  const configured = Boolean(
    process.env.DESK_OPENAI_COMPLIANCE_KEY?.trim() &&
      process.env.DESK_OPENAI_WORKSPACE_ID?.trim(),
  );
  return NextResponse.json({
    configured,
    enterpriseOnly: true,
    provider: "chatgpt",
    docs: "https://developers.openai.com/cookbook/examples/chatgpt/compliance_api/logs_platform",
    consumerPath:
      "Import ~/.codex/sessions/**/rollout-*.jsonl via Connect file drop or scripts/desk-push.mjs",
  });
}
