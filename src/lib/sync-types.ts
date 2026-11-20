import {
  isChatSource,
  type ChatSource,
  type Kind,
  type Status,
  type Tool,
  type TrackedChat,
} from "@/lib/types";

/** Loose chat shape accepted by POST /api/sync/import and file drop. */
export type ImportChatInput = {
  id?: string;
  externalId?: string;
  title: string;
  tool?: Tool;
  kind?: Kind;
  status?: Status;
  note?: string;
  link?: string;
  createdAt?: string;
  updatedAt?: string;
  archived?: boolean;
  source?: ChatSource;
};

export type ImportPayload = {
  tool?: Tool;
  source?: ChatSource;
  chats: ImportChatInput[];
};

const STATUSES: Status[] = [
  "needs_approval",
  "working",
  "done",
  "dormant",
];

const TOOLS: Tool[] = ["claude", "codex", "cursor"];
const KINDS: Kind[] = ["chat", "code"];

function asStatus(value: unknown, fallback: Status): Status {
  return typeof value === "string" && STATUSES.includes(value as Status)
    ? (value as Status)
    : fallback;
}

function asTool(value: unknown, fallback: Tool): Tool {
  return typeof value === "string" && TOOLS.includes(value as Tool)
    ? (value as Tool)
    : fallback;
}

function asKind(value: unknown, fallback: Kind): Kind {
  return typeof value === "string" && KINDS.includes(value as Kind)
    ? (value as Kind)
    : fallback;
}

function defaultToolForSource(source: ChatSource): Tool {
  if (source === "cursor") return "cursor";
  if (source === "claude" || source === "claude_code") return "claude";
  return "codex";
}

function defaultKindForSource(source: ChatSource): Kind {
  if (source === "claude_code" || source === "codex" || source === "cursor") {
    return "code";
  }
  return "chat";
}

/**
 * Normalize an import/API chat into a TrackedChat with stable id + externalId.
 */
export function normalizeImportChat(
  raw: ImportChatInput,
  defaults: { source: ChatSource; tool?: Tool },
): TrackedChat | null {
  const title = (raw.title ?? "").trim();
  if (!title) return null;

  const source: ChatSource =
    raw.source && isChatSource(raw.source) ? raw.source : defaults.source;
  const externalId = (
    raw.externalId ??
    raw.id?.replace(new RegExp(`^${source}:`), "") ??
    ""
  ).trim();
  if (!externalId) return null;

  const tool = asTool(
    raw.tool ?? defaults.tool,
    defaultToolForSource(source),
  );
  const kind = asKind(raw.kind, defaultKindForSource(source));
  const createdAt = raw.createdAt ?? new Date().toISOString();
  const updatedAt = raw.updatedAt ?? createdAt;

  return {
    id: `${source}:${externalId}`,
    title,
    tool,
    kind,
    status: asStatus(raw.status, "working"),
    note: (raw.note ?? "").trim(),
    link: (raw.link ?? "").trim(),
    createdAt,
    updatedAt,
    archived: Boolean(raw.archived),
    source,
    externalId,
  };
}

export function normalizeImportPayload(
  body: ImportPayload,
): { chats: TrackedChat[]; error?: string } {
  if (!body || !Array.isArray(body.chats)) {
    return { chats: [], error: "Body must include chats: []" };
  }

  const source: ChatSource =
    body.source && isChatSource(body.source) ? body.source : "import";
  const chats: TrackedChat[] = [];

  for (const raw of body.chats) {
    const chat = normalizeImportChat(raw, {
      source,
      tool: body.tool,
    });
    if (chat) chats.push(chat);
  }

  return { chats };
}
