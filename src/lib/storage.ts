"use client";

import {
  SAMPLE_CHATS,
  STORAGE_KEY,
  type TrackedChat,
} from "@/lib/types";

function isChat(value: unknown): value is TrackedChat {
  if (!value || typeof value !== "object") return false;
  const chat = value as TrackedChat;
  return (
    typeof chat.id === "string" &&
    typeof chat.title === "string" &&
    typeof chat.tool === "string" &&
    typeof chat.kind === "string" &&
    typeof chat.status === "string" &&
    typeof chat.note === "string" &&
    typeof chat.link === "string" &&
    typeof chat.createdAt === "string" &&
    typeof chat.updatedAt === "string" &&
    typeof chat.archived === "boolean"
  );
}

export function loadChats(): TrackedChat[] {
  if (typeof window === "undefined") return SAMPLE_CHATS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_CHATS));
      return SAMPLE_CHATS;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SAMPLE_CHATS;
    const chats = parsed.filter(isChat);
    return chats.length > 0 ? chats : SAMPLE_CHATS;
  } catch {
    return SAMPLE_CHATS;
  }
}

export function saveChats(chats: TrackedChat[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}
