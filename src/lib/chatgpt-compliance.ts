import type { TrackedChat } from "@/lib/types";

export type ChatgptComplianceConversation = {
  id: string;
  title?: string;
  created_at?: number;
  last_active_at?: number;
  workspace_id?: string;
  user_email?: string;
};

function unixToIso(value?: number): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return new Date().toISOString();
  }
  // API may return seconds or ms
  const ms = value < 1e12 ? value * 1000 : value;
  return new Date(ms).toISOString();
}

export function chatgptComplianceToTracked(
  conv: ChatgptComplianceConversation,
): TrackedChat {
  const createdAt = unixToIso(conv.created_at);
  const updatedAt = unixToIso(conv.last_active_at ?? conv.created_at);
  const title =
    (conv.title && conv.title.trim()) || `ChatGPT ${conv.id.slice(0, 8)}`;

  return {
    id: `chatgpt:${conv.id}`,
    title,
    tool: "codex",
    kind: "chat",
    status: "working",
    note: [
      conv.user_email ? conv.user_email : null,
      "Synced via ChatGPT Enterprise Compliance API",
    ]
      .filter(Boolean)
      .join(" · "),
    link: `https://chatgpt.com/c/${conv.id}`,
    createdAt,
    updatedAt,
    archived: false,
    source: "chatgpt",
    externalId: conv.id,
  };
}

/**
 * List ChatGPT workspace conversations (Enterprise / Edu Compliance API).
 * Base: https://api.chatgpt.com/v1/compliance/workspaces/{id}/conversations
 */
export async function fetchChatgptComplianceConversations(
  apiKey: string,
  workspaceId: string,
): Promise<{ items: ChatgptComplianceConversation[] }> {
  const items: ChatgptComplianceConversation[] = [];
  let after: string | undefined;

  for (let page = 0; page < 10; page++) {
    const url = new URL(
      `https://api.chatgpt.com/v1/compliance/workspaces/${encodeURIComponent(workspaceId)}/conversations`,
    );
    url.searchParams.set("limit", "100");
    if (after) url.searchParams.set("after", after);

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `ChatGPT Compliance ${res.status}: ${text.slice(0, 240) || res.statusText}`,
      );
    }

    const data = (await res.json()) as {
      data?: ChatgptComplianceConversation[];
      has_more?: boolean;
      last_id?: string | null;
    };

    items.push(...(data.data ?? []));
    if (!data.has_more || !data.last_id) break;
    after = data.last_id;
  }

  return { items };
}
