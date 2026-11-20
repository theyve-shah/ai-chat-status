import type { TrackedChat } from "@/lib/types";

export type ClaudeComplianceChat = {
  id: string;
  name?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  href?: string;
  model?: string | null;
  project_id?: string | null;
};

const ANTHROPIC_VERSION = "2026-10-21";

export function claudeComplianceToTracked(
  chat: ClaudeComplianceChat,
): TrackedChat {
  const createdAt = chat.created_at ?? new Date().toISOString();
  const updatedAt = chat.updated_at ?? createdAt;
  const deleted = Boolean(chat.deleted_at);
  const title =
    (chat.name && chat.name.trim()) ||
    (deleted ? "Deleted Claude chat" : `Claude ${chat.id.slice(0, 12)}`);

  return {
    id: `claude:${chat.id}`,
    title,
    tool: "claude",
    kind: "chat",
    status: deleted ? "dormant" : "working",
    note: [
      chat.model ? `Model: ${chat.model}` : null,
      chat.project_id ? `Project: ${chat.project_id}` : null,
      "Synced via Anthropic Compliance API",
    ]
      .filter(Boolean)
      .join(" · "),
    link: chat.href || `https://claude.ai/chat/${chat.id.replace(/^claude_chat_/, "")}`,
    createdAt,
    updatedAt,
    archived: deleted,
    source: "claude",
    externalId: chat.id,
  };
}

/**
 * List claude.ai chats via Anthropic Compliance API (Enterprise only).
 * Docs: https://platform.claude.com/docs/en/api/compliance/apps/chats/list
 */
export async function fetchClaudeComplianceChats(apiKey: string): Promise<{
  items: ClaudeComplianceChat[];
}> {
  const items: ClaudeComplianceChat[] = [];
  let afterId: string | undefined;

  for (let page = 0; page < 10; page++) {
    const url = new URL("https://api.anthropic.com/v1/compliance/apps/chats");
    url.searchParams.set("order_by", "updated_at");
    url.searchParams.set("limit", "100");
    if (afterId) url.searchParams.set("after_id", afterId);

    const res = await fetch(url, {
      headers: {
        "anthropic-version": ANTHROPIC_VERSION,
        Authorization: `Bearer ${apiKey}`,
        "x-api-key": apiKey,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Anthropic Compliance ${res.status}: ${text.slice(0, 240) || res.statusText}`,
      );
    }

    const data = (await res.json()) as {
      data?: ClaudeComplianceChat[];
      has_more?: boolean;
      last_id?: string | null;
    };

    items.push(...(data.data ?? []));
    if (!data.has_more || !data.last_id) break;
    afterId = data.last_id;
  }

  return { items };
}
