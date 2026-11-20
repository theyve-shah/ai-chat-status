export type Tool = "claude" | "codex" | "cursor";
export type Kind = "chat" | "code";
export type Status = "needs_approval" | "working" | "done";

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
];

export const STORAGE_KEY = "desk.chats.v1";

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
];
