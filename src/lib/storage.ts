"use client";

import {
  isChatSource,
  STORAGE_KEY,
  type ChatSource,
  type TrackedChat,
} from "@/lib/types";

const LEGACY_KEYS = ["desk.chats.v3", "desk.chats.v2"];

function isChat(value: unknown): value is TrackedChat {
  if (!value || typeof value !== "object") return false;
  const chat = value as TrackedChat;
  if (
    typeof chat.id !== "string" ||
    typeof chat.title !== "string" ||
    typeof chat.tool !== "string" ||
    typeof chat.kind !== "string" ||
    typeof chat.status !== "string" ||
    typeof chat.note !== "string" ||
    typeof chat.link !== "string" ||
    typeof chat.createdAt !== "string" ||
    typeof chat.updatedAt !== "string" ||
    typeof chat.archived !== "boolean"
  ) {
    return false;
  }
  if (chat.source !== undefined && !isChatSource(chat.source)) return false;
  if (chat.externalId !== undefined && typeof chat.externalId !== "string") {
    return false;
  }
  return true;
}

function readRaw(key: string): TrackedChat[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isChat);
  } catch {
    return [];
  }
}

export function loadChats(): TrackedChat[] {
  if (typeof window === "undefined") return [];
  const current = readRaw(STORAGE_KEY);
  if (current.length > 0) return current;

  for (const key of LEGACY_KEYS) {
    const legacy = readRaw(key);
    if (legacy.length > 0) {
      saveChats(legacy);
      return legacy;
    }
  }
  return [];
}

export function saveChats(chats: TrackedChat[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

function syncKey(chat: TrackedChat): string | null {
  if (chat.source && chat.source !== "manual" && chat.externalId) {
    return `${chat.source}:${chat.externalId}`;
  }
  if (chat.externalId) {
    const prefix = chat.id.includes(":")
      ? chat.id.split(":")[0]
      : chat.source ?? null;
    if (prefix && prefix !== "manual") return `${prefix}:${chat.externalId}`;
  }
  const match = /^(cursor|claude|chatgpt|claude_code|codex|import):(.+)$/.exec(
    chat.id,
  );
  return match ? `${match[1]}:${match[2]}` : null;
}

export type MergeOptions = {
  /**
   * When true (default for API polls), drop existing rows for sources present
   * in `incoming` that are missing from this batch.
   * File/import upserts should pass false.
   */
  pruneMissing?: boolean;
};

/**
 * Upsert synced rows by source:externalId.
 * Preserves manual chats and other sources not in this batch.
 */
export function mergeSyncedChats(
  existing: TrackedChat[],
  incoming: TrackedChat[],
  opts: MergeOptions = {},
): TrackedChat[] {
  const pruneMissing = opts.pruneMissing ?? true;

  const byKey = new Map<string, TrackedChat>();
  const sourcesInBatch = new Set<ChatSource>();

  for (const chat of incoming) {
    const key = syncKey(chat);
    if (!key) continue;
    const source = (chat.source ?? key.split(":")[0]) as ChatSource;
    sourcesInBatch.add(source);
    byKey.set(key, {
      ...chat,
      source,
      externalId: chat.externalId ?? key.slice(key.indexOf(":") + 1),
      id: chat.id.startsWith(`${source}:`)
        ? chat.id
        : `${source}:${chat.externalId ?? key.slice(key.indexOf(":") + 1)}`,
    });
  }

  const result: TrackedChat[] = [];
  const seen = new Set<string>();

  for (const chat of existing) {
    const key = syncKey(chat);
    if (key) {
      const source = key.split(":")[0] as ChatSource;
      const next = byKey.get(key);
      if (next) {
        seen.add(key);
        result.push({
          ...chat,
          title: next.title,
          status: next.status,
          note: next.note,
          link: next.link,
          archived: next.archived,
          updatedAt: next.updatedAt,
          tool: next.tool,
          kind: next.kind ?? chat.kind,
          source: next.source,
          externalId: next.externalId,
          id: chat.id.startsWith(`${source}:`) ? next.id : chat.id,
        });
        continue;
      }
      if (pruneMissing && sourcesInBatch.has(source)) {
        // Dropped from this source's API listing
        continue;
      }
    }
    result.push(chat);
  }

  for (const [key, chat] of byKey) {
    if (!seen.has(key)) result.push(chat);
  }

  return result.sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}
