import { normalizeImportChat, type ImportChatInput } from "@/lib/sync-types";
import type { TrackedChat } from "@/lib/types";

type JsonLine = Record<string, unknown>;

function parseJsonl(text: string): JsonLine[] {
  const rows: JsonLine[] = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        rows.push(parsed as JsonLine);
      }
    } catch {
      // skip malformed lines
    }
  }
  return rows;
}

function clip(text: string, max = 80): string {
  const one = text.replace(/\s+/g, " ").trim();
  if (one.length <= max) return one;
  return `${one.slice(0, max - 1)}…`;
}

function extractUserText(content: unknown): string | null {
  if (typeof content === "string") {
    const t = content.trim();
    return t || null;
  }
  if (!Array.isArray(content)) return null;
  const parts: string[] = [];
  for (const block of content) {
    if (!block || typeof block !== "object") continue;
    const b = block as Record<string, unknown>;
    if (b.type === "text" && typeof b.text === "string") parts.push(b.text);
    if (typeof b.text === "string" && !b.type) parts.push(b.text);
  }
  const joined = parts.join(" ").trim();
  return joined || null;
}

function basenameHint(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? filename;
  return base.replace(/\.jsonl(\.zst)?$/i, "");
}

/**
 * Parse a Claude Code session transcript (.jsonl under ~/.claude/projects).
 */
export function parseClaudeCodeSession(
  text: string,
  filename = "session.jsonl",
): TrackedChat | null {
  const rows = parseJsonl(text);
  if (rows.length === 0) return null;

  let summary: string | null = null;
  let customTitle: string | null = null;
  let firstUser: string | null = null;
  let sessionId: string | null = null;
  let cwd: string | null = null;
  let createdAt: string | null = null;
  let updatedAt: string | null = null;
  let looksLikeClaude = false;

  for (const row of rows) {
    const type = typeof row.type === "string" ? row.type : "";
    if (
      type === "user" ||
      type === "assistant" ||
      type === "summary" ||
      type === "custom-title"
    ) {
      looksLikeClaude = true;
    }

    if (typeof row.sessionId === "string" && row.sessionId) {
      sessionId = row.sessionId;
    }
    if (typeof row.cwd === "string" && row.cwd) cwd = row.cwd;
    if (typeof row.timestamp === "string") {
      if (!createdAt) createdAt = row.timestamp;
      updatedAt = row.timestamp;
    }

    if (type === "summary" && typeof row.summary === "string") {
      summary = row.summary;
    }
    if (type === "custom-title" && typeof row.title === "string") {
      customTitle = row.title;
    }
    if (type === "user" && !firstUser) {
      const message = row.message as Record<string, unknown> | undefined;
      const text = extractUserText(message?.content);
      // Skip tool_result-only user lines
      if (text && !text.startsWith("<") && text.length > 1) {
        firstUser = text;
      }
    }
  }

  if (!looksLikeClaude) return null;

  const fromFile = basenameHint(filename);
  const uuidFromFile = /^[0-9a-f-]{36}$/i.test(fromFile) ? fromFile : null;
  const externalId = sessionId || uuidFromFile || fromFile;
  if (!externalId) return null;

  const project =
    cwd?.split(/[/\\]/).filter(Boolean).pop() ?? null;
  const title =
    clip(customTitle || summary || firstUser || `Claude Code ${externalId.slice(0, 8)}`) ||
    "Claude Code session";

  const noteParts = [
    project ? `Project: ${project}` : null,
    cwd ? cwd : null,
    "Imported from Claude Code JSONL",
  ].filter(Boolean);

  const input: ImportChatInput = {
    externalId,
    title,
    tool: "claude",
    kind: "code",
    status: "working",
    note: noteParts.join(" · "),
    link: "",
    createdAt: createdAt ?? undefined,
    updatedAt: updatedAt ?? createdAt ?? undefined,
    source: "claude_code",
  };

  return normalizeImportChat(input, { source: "claude_code" });
}

/**
 * Parse a Codex CLI rollout JSONL (~/.codex/sessions/.../rollout-*.jsonl).
 */
export function parseCodexRollout(
  text: string,
  filename = "rollout.jsonl",
): TrackedChat | null {
  const rows = parseJsonl(text);
  if (rows.length === 0) return null;

  let sessionId: string | null = null;
  let cwd: string | null = null;
  let firstUser: string | null = null;
  let createdAt: string | null = null;
  let updatedAt: string | null = null;
  let hasSessionMeta = false;
  let agentNickname: string | null = null;

  for (const row of rows) {
    const type = typeof row.type === "string" ? row.type : "";
    if (typeof row.timestamp === "string") {
      if (!createdAt) createdAt = row.timestamp;
      updatedAt = row.timestamp;
    }

    if (type === "session_meta") {
      hasSessionMeta = true;
      const payload = (row.payload ?? row) as Record<string, unknown>;
      const meta = (payload.meta ?? payload) as Record<string, unknown>;
      const id =
        (typeof meta.id === "string" && meta.id) ||
        (typeof meta.session_id === "string" && meta.session_id) ||
        (typeof payload.id === "string" && payload.id) ||
        null;
      if (id) sessionId = id;
      if (typeof meta.cwd === "string") cwd = meta.cwd;
      if (typeof meta.agent_nickname === "string") {
        agentNickname = meta.agent_nickname;
      }
    }

    if (type === "event_msg") {
      const payload = row.payload as Record<string, unknown> | undefined;
      if (payload?.type === "user_message" && !firstUser) {
        if (typeof payload.message === "string" && payload.message.trim()) {
          firstUser = payload.message.trim();
        }
      }
    }

    if (type === "response_item" && !firstUser) {
      const payload = row.payload as Record<string, unknown> | undefined;
      if (payload?.type === "message" && payload.role === "user") {
        const content = payload.content;
        if (Array.isArray(content)) {
          for (const block of content) {
            if (!block || typeof block !== "object") continue;
            const b = block as Record<string, unknown>;
            const text =
              (typeof b.text === "string" && b.text) ||
              (b.type === "input_text" && typeof b.text === "string"
                ? b.text
                : null);
            if (text?.trim()) {
              firstUser = text.trim();
              break;
            }
          }
        }
      }
    }
  }

  // Filename: rollout-<ts>-<uuid>.jsonl
  const base = basenameHint(filename);
  const fileUuid = base.match(
    /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i,
  )?.[1];

  if (!hasSessionMeta && !fileUuid && !sessionId) {
    // Might still be Claude — let Claude parser try first elsewhere
    return null;
  }

  const externalId = sessionId || fileUuid || base;
  if (!externalId) return null;

  const project = cwd?.split(/[/\\]/).filter(Boolean).pop() ?? null;
  const title =
    clip(
      agentNickname ||
        firstUser ||
        `Codex ${externalId.slice(0, 8)}`,
    ) || "Codex session";

  const input: ImportChatInput = {
    externalId,
    title,
    tool: "codex",
    kind: "code",
    status: "working",
    note: [
      project ? `Project: ${project}` : null,
      cwd || null,
      "Imported from Codex rollout JSONL",
    ]
      .filter(Boolean)
      .join(" · "),
    link: `codex://threads/${externalId}`,
    createdAt: createdAt ?? undefined,
    updatedAt: updatedAt ?? createdAt ?? undefined,
    source: "codex",
  };

  return normalizeImportChat(input, { source: "codex" });
}

/** Detect format and parse one session file. */
export function parseSessionFile(
  text: string,
  filename: string,
): TrackedChat | null {
  const lower = filename.toLowerCase();
  if (lower.includes("rollout") || lower.endsWith(".jsonl.zst")) {
    return parseCodexRollout(text, filename) ?? parseClaudeCodeSession(text, filename);
  }
  // Prefer Claude Code for plain .jsonl (UUID filenames)
  return (
    parseClaudeCodeSession(text, filename) ?? parseCodexRollout(text, filename)
  );
}

/**
 * Parse a Desk import JSON blob: `{ chats: [...] }` or a bare chat array.
 */
export function parseDeskImportJson(text: string): TrackedChat[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return [];
  }

  const chatsRaw = Array.isArray(parsed)
    ? parsed
    : parsed &&
        typeof parsed === "object" &&
        Array.isArray((parsed as { chats?: unknown }).chats)
      ? ((parsed as { chats: ImportChatInput[] }).chats)
      : null;

  if (!chatsRaw) return [];

  const out: TrackedChat[] = [];
  for (const raw of chatsRaw) {
    if (!raw || typeof raw !== "object") continue;
    const chat = normalizeImportChat(raw as ImportChatInput, {
      source: "import",
    });
    if (chat) out.push(chat);
  }
  return out;
}
