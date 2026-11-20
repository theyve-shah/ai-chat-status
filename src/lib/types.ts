export type Tool = "claude" | "codex" | "cursor";
export type Kind = "chat" | "code";
export type Status = "needs_approval" | "working" | "done" | "dormant";

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

export const STORAGE_KEY = "desk.chats.v2";

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
  };
}

export const SAMPLE_CHATS: TrackedChat[] = [
  {
    id: "sample-1",
    title: "Checkout flow redesign",
    tool: "cursor",
    kind: "code",
    status: "needs_approval",
    note: "Diff ready — confirm copy on CTA",
    link: "https://cursor.com/agents",
    createdAt: "2026-11-20T06:00:00.000Z",
    updatedAt: "2026-11-20T08:40:00.000Z",
    archived: false,
  },
  {
    id: "sample-2",
    title: "Founder pulse research notes",
    tool: "claude",
    kind: "chat",
    status: "working",
    note: "Still summarizing competitor decks",
    link: "https://claude.ai",
    createdAt: "2026-11-20T05:30:00.000Z",
    updatedAt: "2026-11-20T08:10:00.000Z",
    archived: false,
  },
  {
    id: "sample-3",
    title: "API route auth hardening",
    tool: "codex",
    kind: "code",
    status: "working",
    note: "Writing tests for edge cases",
    link: "https://chatgpt.com",
    createdAt: "2026-11-20T04:15:00.000Z",
    updatedAt: "2026-11-20T07:55:00.000Z",
    archived: false,
  },
  {
    id: "sample-4",
    title: "Landing page hero rewrite",
    tool: "cursor",
    kind: "chat",
    status: "done",
    note: "Merged this morning",
    link: "cursor://",
    createdAt: "2026-11-19T14:00:00.000Z",
    updatedAt: "2026-11-20T03:20:00.000Z",
    archived: false,
  },
  {
    id: "sample-5",
    title: "Pricing page copy experiments",
    tool: "claude",
    kind: "chat",
    status: "dormant",
    note: "Parked after last sprint — revisit next quarter",
    link: "https://claude.ai",
    createdAt: "2026-10-28T09:00:00.000Z",
    updatedAt: "2026-11-02T12:00:00.000Z",
    archived: false,
  },
  {
    id: "sample-6",
    title: "Legacy webhook cleanup",
    tool: "codex",
    kind: "code",
    status: "dormant",
    note: "No activity in weeks — leave until on-call asks",
    link: "https://chatgpt.com",
    createdAt: "2026-10-12T16:00:00.000Z",
    updatedAt: "2026-10-25T18:30:00.000Z",
    archived: false,
  },
];
