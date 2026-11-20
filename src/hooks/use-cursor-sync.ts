"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TrackedChat } from "@/lib/types";

const LAST_SYNC_KEY = "desk.cursor-sync.v1";
const AUTO_REFRESH_MS = 60_000;

export type CursorSyncStatus = {
  configured: boolean | null;
  syncing: boolean;
  lastSyncedAt: string | null;
  lastCount: number | null;
  error: string | null;
};

type SyncResponse = {
  configured?: boolean;
  syncedAt?: string;
  count?: number;
  chats?: TrackedChat[];
  error?: string;
};

function loadLastSync(): Pick<
  CursorSyncStatus,
  "lastSyncedAt" | "lastCount"
> {
  if (typeof window === "undefined") {
    return { lastSyncedAt: null, lastCount: null };
  }
  try {
    const raw = window.localStorage.getItem(LAST_SYNC_KEY);
    if (!raw) return { lastSyncedAt: null, lastCount: null };
    const parsed = JSON.parse(raw) as {
      lastSyncedAt?: string;
      lastCount?: number;
    };
    return {
      lastSyncedAt: parsed.lastSyncedAt ?? null,
      lastCount: parsed.lastCount ?? null,
    };
  } catch {
    return { lastSyncedAt: null, lastCount: null };
  }
}

function saveLastSync(lastSyncedAt: string, lastCount: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    LAST_SYNC_KEY,
    JSON.stringify({ lastSyncedAt, lastCount }),
  );
}

export function useCursorSync(onMerge: (chats: TrackedChat[]) => void) {
  const onMergeRef = useRef(onMerge);
  onMergeRef.current = onMerge;

  const [status, setStatus] = useState<CursorSyncStatus>(() => ({
    configured: null,
    syncing: false,
    ...loadLastSync(),
    error: null,
  }));

  const refreshConfigured = useCallback(async () => {
    try {
      const res = await fetch("/api/sync/cursor", { cache: "no-store" });
      const data = (await res.json()) as SyncResponse;
      setStatus((prev) => ({
        ...prev,
        configured: Boolean(data.configured),
      }));
      return Boolean(data.configured);
    } catch {
      setStatus((prev) => ({ ...prev, configured: false }));
      return false;
    }
  }, []);

  const sync = useCallback(async () => {
    setStatus((prev) => ({ ...prev, syncing: true, error: null }));
    try {
      const res = await fetch("/api/sync/cursor", { method: "POST" });
      const data = (await res.json()) as SyncResponse;

      if (!res.ok) {
        setStatus((prev) => ({
          ...prev,
          syncing: false,
          configured: data.configured ?? prev.configured,
          error: data.error ?? `Sync failed (${res.status})`,
        }));
        return { ok: false as const, error: data.error ?? "Sync failed" };
      }

      const chats = data.chats ?? [];
      onMergeRef.current(chats);
      const syncedAt = data.syncedAt ?? new Date().toISOString();
      const count = data.count ?? chats.length;
      saveLastSync(syncedAt, count);
      setStatus({
        configured: true,
        syncing: false,
        lastSyncedAt: syncedAt,
        lastCount: count,
        error: null,
      });
      return { ok: true as const, count };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Sync request failed";
      setStatus((prev) => ({
        ...prev,
        syncing: false,
        error: message,
      }));
      return { ok: false as const, error: message };
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await refreshConfigured();
      if (cancelled || !ok) return;
      await sync();
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshConfigured, sync]);

  useEffect(() => {
    if (status.configured !== true) return;
    const id = window.setInterval(() => {
      void sync();
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [status.configured, sync]);

  return {
    ...status,
    status,
    sync,
    syncNow: sync,
    refreshConfigured,
  };
}
