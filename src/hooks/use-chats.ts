"use client";

import { useEffect, useState } from "react";
import { loadChats, saveChats } from "@/lib/storage";
import {
  SAMPLE_CHATS,
  createChat,
  type ChatDraft,
  type Status,
  type TrackedChat,
} from "@/lib/types";

export function useChats() {
  const [chats, setChats] = useState<TrackedChat[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setChats(loadChats());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveChats(chats);
  }, [chats, ready]);

  function addChat(draft: ChatDraft) {
    const next = createChat(draft);
    setChats((prev) => [next, ...prev]);
    return next;
  }

  function updateChat(id: string, patch: Partial<TrackedChat>) {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === id
          ? { ...chat, ...patch, updatedAt: new Date().toISOString() }
          : chat,
      ),
    );
  }

  function setStatus(id: string, status: Status) {
    updateChat(id, { status });
  }

  function archiveChat(id: string) {
    updateChat(id, { archived: true });
  }

  function restoreChat(id: string) {
    updateChat(id, { archived: false });
  }

  function removeChat(id: string) {
    setChats((prev) => prev.filter((chat) => chat.id !== id));
  }

  function resetSamples() {
    setChats(SAMPLE_CHATS.map((chat) => ({ ...chat })));
  }

  return {
    chats,
    ready,
    addChat,
    updateChat,
    setStatus,
    archiveChat,
    restoreChat,
    removeChat,
    resetSamples,
  };
}
