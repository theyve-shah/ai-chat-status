"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TrackedChat } from "@/lib/types";

const POLL_MS = 20_000;
const STORAGE_KEY = "desk.import-pull.v1";

type MergeFn = (
  chats: TrackedChat[],
  opts?: { pruneMissing?: boolean },
) => void;

function loadSeenSyncedAt(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveSeenSyncedAt(syncedAt: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, syncedAt);
}

/**
 * Auto-pull staged chats from POST /api/sync/import (extension / desk-push)
 * onto the board while Desk is open — no manual "Pull last push" required.
 */
export function useImportPull(onMerge: MergeFn) {
  const onMergeRef = useRef(onMerge);
  onMergeRef.current = onMerge;
  const [lastPulledAt, setLastPulledAt] = useState<string | null>(null);
  const [lastCount, setLastCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pull = useCallback(async (opts?: { force?: boolean }) => {
    try {
      const res = await fetch("/api/sync/import?pull=1", { cache: "no-store" });
      if (res.status === 404) {
        setError(null);
        return { ok: false as const, empty: true };
      }
      const data = (await res.json()) as {
        chats?: TrackedChat[];
        syncedAt?: string;
        count?: number;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? `Pull failed (${res.status})`);
        return { ok: false as const, empty: false };
      }
      const syncedAt = data.syncedAt ?? "";
      const seen = loadSeenSyncedAt();
      if (!opts?.force && syncedAt && syncedAt === seen) {
        return { ok: true as const, skipped: true, count: data.count ?? 0 };
      }
      const chats = data.chats ?? [];
      if (chats.length > 0) {
        onMergeRef.current(chats, { pruneMissing: false });
      }
      if (syncedAt) saveSeenSyncedAt(syncedAt);
      setLastPulledAt(syncedAt || new Date().toISOString());
      setLastCount(data.count ?? chats.length);
      setError(null);
      return { ok: true as const, count: chats.length };
    } catch (e) {
      const message = e instanceof Error ? e.message : "Import pull failed";
      setError(message);
      return { ok: false as const, empty: false };
    }
  }, []);

  useEffect(() => {
    void pull();
    const id = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      void pull();
    }, POLL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") void pull();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [pull]);

  return { pull, lastPulledAt, lastCount, error };
}
