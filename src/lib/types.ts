export type Tool = "claude" | "codex" | "cursor";
export type Kind = "chat" | "code";
export type Status = "needs_approval" | "working" | "done" | "dormant";

/** Provenance for synced / imported rows (distinct from manual adds). */
export type ChatSource =
  | "manual"
  | "cursor"
  | "claude"
  | "chatgpt"
  | "claude_code"
  | "codex"
  | "import";

export const SYNC_SOURCES: ChatSource[] = [
  "cursor",
  "claude",
  "chatgpt",
  "claude_code",
  "codex",
  "import",
];

export function isChatSource(value: unknown): value is ChatSource {
  return (
    value === "manual" ||
    value === "cursor" ||
    value === "claude" ||
    value === "chatgpt" ||
    value === "claude_code" ||
    value === "codex" ||
    value === "import"
  );
}

export type TrackedChat = {
  id: string;
  title: string;
  tool: Tool;
  kind: Kind;
  status: Status;
  note: string;
  link: string;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  /** Where this row came from. Manual by default. */
  source?: ChatSource;
  /** Stable id from an external system (e.g. Cursor agent id). */
  externalId?: string;
};

export type ChatDraft = {
  title: string;
  tool: Tool;
  kind: Kind;
  status: Status;
  note: string;
  link: string;
};

export const TOOLS: { id: Tool; label: string }[] = [
  { id: "claude", label: "Claude" },
  { id: "codex", label: "Codex" },
  { id: "cursor", label: "Cursor" },
];

export const KINDS: { id: Kind; label: string }[] = [
  { id: "chat", label: "Chat" },
  { id: "code", label: "Code" },
];

/** Sidebar + dashboard lanes (tool × kind product surfaces). */
export type ToolLaneId =
  | "claude"
  | "claude_code"
  | "chatgpt"
  | "codex"
  | "cursor";

export const TOOL_LANES: {
  id: ToolLaneId;
  tool: Tool;
  kind: Kind | null;
  label: string;
}[] = [
  { id: "claude", tool: "claude", kind: "chat", label: "Claude" },
  { id: "claude_code", tool: "claude", kind: "code", label: "Claude Code" },
  { id: "chatgpt", tool: "codex", kind: "chat", label: "ChatGPT" },
  { id: "codex", tool: "codex", kind: "code", label: "Codex" },
  { id: "cursor", tool: "cursor", kind: null, label: "Cursor" },
];

export function matchesToolLane(
  chat: Pick<TrackedChat, "tool" | "kind">,
  laneId: ToolLaneId,
): boolean {
  const lane = TOOL_LANES.find((l) => l.id === laneId);
  if (!lane) return false;
  if (chat.tool !== lane.tool) return false;
  if (lane.kind && chat.kind !== lane.kind) return false;
  return true;
}

export const STATUSES: {
  id: Status;
  label: string;
  hint: string;
}[] = [
  {
    id: "needs_approval",
    label: "Needs approval",
    hint: "Waiting on you",
  },
  {
    id: "working",
    label: "Working",
    hint: "Agent is busy",
  },
  {
    id: "done",
    label: "Done",
    hint: "Safe to close",
  },
  {
    id: "dormant",
    label: "Dormant",
    hint: "Stale / parked for later",
  },
];

export const STORAGE_KEY = "desk.chats.v4";

export function emptyDraft(overrides: Partial<ChatDraft> = {}): ChatDraft {
  return {
    title: "",
    tool: "cursor",
    kind: "code",
    status: "working",
    note: "",
    link: "",
    ...overrides,
  };
}

export function createChat(draft: ChatDraft): TrackedChat {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: draft.title.trim(),
    tool: draft.tool,
    kind: draft.kind,
    status: draft.status,
    note: draft.note.trim(),
    link: draft.link.trim(),
    createdAt: now,
    updatedAt: now,
    archived: false,
    source: "manual",
  };
}
