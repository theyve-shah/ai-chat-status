"use client";

import { STORAGE_KEY, type ChatSource, type TrackedChat } from "@/lib/types";

const LEGACY_KEYS = ["desk.chats.v3", "desk.chats.v2"];

function isChatSource(value: unknown): value is ChatSource {
  return value === "manual" || value === "cursor";
}

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

function syncedExternalId(chat: TrackedChat): string | null {
  if (chat.source === "cursor" && chat.externalId) return chat.externalId;
  if (chat.externalId && chat.id.startsWith("cursor:")) return chat.externalId;
  const match = /^cursor:(.+)$/.exec(chat.id);
  return match?.[1] ?? null;
}

/**
 * Upsert API rows by externalId (source=cursor).
 * Preserves manual chats. Overwrites status/title/link/note/archived from API.
 */
export function mergeSyncedChats(
  existing: TrackedChat[],
  incoming: TrackedChat[],
): TrackedChat[] {
  const byExternal = new Map<string, TrackedChat>();
  for (const chat of incoming) {
    const externalId = chat.externalId ?? syncedExternalId(chat);
    if (!externalId) continue;
    byExternal.set(externalId, {
      ...chat,
      source: "cursor",
      externalId,
    });
  }

  const result: TrackedChat[] = [];
  const seen = new Set<string>();

  for (const chat of existing) {
    const externalId = syncedExternalId(chat);
    if (externalId) {
      const next = byExternal.get(externalId);
      if (next) {
        seen.add(externalId);
        result.push({
          ...chat,
          title: next.title,
          status: next.status,
          note: next.note,
          link: next.link,
          archived: next.archived,
          updatedAt: next.updatedAt,
          tool: "cursor",
          kind: next.kind ?? chat.kind,
          source: "cursor",
          externalId,
          // Prefer stable cursor: id from API when local already used that form
          id: chat.id.startsWith("cursor:") ? next.id : chat.id,
        });
      }
      // Dropped from API → remove
      continue;
    }
    result.push(chat);
  }

  for (const [externalId, chat] of byExternal) {
    if (!seen.has(externalId)) result.push(chat);
  }

  return result.sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}
