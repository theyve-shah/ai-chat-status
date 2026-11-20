"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TrackedChat } from "@/lib/types";

export type ProviderId = "cursor" | "claude" | "chatgpt";

export type ProviderSyncStatus = {
  configured: boolean | null;
  syncing: boolean;
  lastSyncedAt: string | null;
  lastCount: number | null;
  error: string | null;
  enterpriseOnly?: boolean;
};

type SyncResponse = {
  configured?: boolean;
  syncedAt?: string;
  count?: number;
  chats?: TrackedChat[];
  error?: string;
  pruneMissing?: boolean;
  enterpriseOnly?: boolean;
};

type MergeFn = (
  chats: TrackedChat[],
  opts?: { pruneMissing?: boolean },
) => void;

function storageKey(provider: ProviderId) {
  return `desk.${provider}-sync.v1`;
}

function loadLastSync(provider: ProviderId): Pick<
  ProviderSyncStatus,
  "lastSyncedAt" | "lastCount"
> {
  if (typeof window === "undefined") {
    return { lastSyncedAt: null, lastCount: null };
  }
  try {
    const raw = window.localStorage.getItem(storageKey(provider));
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

function saveLastSync(
  provider: ProviderId,
  lastSyncedAt: string,
  lastCount: number,
) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    storageKey(provider),
    JSON.stringify({ lastSyncedAt, lastCount }),
  );
}

const AUTO_REFRESH_MS = 60_000;

export function useProviderSync(
  provider: ProviderId,
  onMerge: MergeFn,
  opts: { autoRefresh?: boolean } = {},
) {
  const autoRefresh = opts.autoRefresh ?? provider === "cursor";
  const onMergeRef = useRef(onMerge);
  onMergeRef.current = onMerge;

  const [status, setStatus] = useState<ProviderSyncStatus>(() => ({
    configured: null,
    syncing: false,
    ...loadLastSync(provider),
    error: null,
  }));

  const refreshConfigured = useCallback(async () => {
    try {
      const res = await fetch(`/api/sync/${provider}`, { cache: "no-store" });
      const data = (await res.json()) as SyncResponse;
      setStatus((prev) => ({
        ...prev,
        configured: Boolean(data.configured),
        enterpriseOnly: data.enterpriseOnly,
      }));
      return Boolean(data.configured);
    } catch {
      setStatus((prev) => ({ ...prev, configured: false }));
      return false;
    }
  }, [provider]);

  const sync = useCallback(async () => {
    setStatus((prev) => ({ ...prev, syncing: true, error: null }));
    try {
      const res = await fetch(`/api/sync/${provider}`, { method: "POST" });
      const data = (await res.json()) as SyncResponse;

      if (!res.ok) {
        setStatus((prev) => ({
          ...prev,
          syncing: false,
          configured: data.configured ?? prev.configured,
          enterpriseOnly: data.enterpriseOnly ?? prev.enterpriseOnly,
          error: data.error ?? `Sync failed (${res.status})`,
        }));
        return { ok: false as const, error: data.error ?? "Sync failed" };
      }

      const chats = data.chats ?? [];
      onMergeRef.current(chats, {
        pruneMissing: data.pruneMissing ?? true,
      });
      const syncedAt = data.syncedAt ?? new Date().toISOString();
      const count = data.count ?? chats.length;
      saveLastSync(provider, syncedAt, count);
      setStatus({
        configured: true,
        syncing: false,
        lastSyncedAt: syncedAt,
        lastCount: count,
        error: null,
        enterpriseOnly: data.enterpriseOnly,
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
  }, [provider]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await refreshConfigured();
      if (cancelled || !ok) return;
      if (provider === "cursor") await sync();
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshConfigured, sync, provider]);

  useEffect(() => {
    if (!autoRefresh || status.configured !== true) return;
    const id = window.setInterval(() => {
      void sync();
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [autoRefresh, status.configured, sync]);

  return {
    ...status,
    status,
    sync,
    syncNow: sync,
    refreshConfigured,
  };
}
