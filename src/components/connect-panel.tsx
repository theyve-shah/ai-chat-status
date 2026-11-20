"use client";

import { useState } from "react";
import { ToolMark } from "@/components/tool-mark";
import { Button } from "@/components/ui/button";
import {
  openHref,
  type ConnectionsState,
  type OpenPrefer,
  type ToolConnection,
} from "@/lib/connections";
import { TOOL_GUIDES } from "@/lib/tool-guides";
import { TOOLS, type Tool } from "@/lib/types";
import {
  AppWindow,
  ArrowUpRight,
  BookOpen,
  Check,
  Globe,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SyncProps = {
  configured: boolean | null;
  syncing: boolean;
  lastSyncedAt: string | null;
  lastCount: number | null;
  error: string | null;
  onSync: () => void;
};

type Props = {
  connections: ConnectionsState;
  onChange: (tool: Tool, patch: Partial<ToolConnection>) => void;
  sync: SyncProps;
};

export function ConnectPanel({ connections, onChange, sync }: Props) {
  return (
    <div className="mx-auto max-w-2xl animate-in fade-in-0 duration-300">
      <header className="mb-6">
        <h1 className="text-3xl font-medium tracking-tight text-[#111]">
          Connect
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#6b7280]">
          Cursor cloud agents sync automatically via the Cloud Agents API.
          Claude and ChatGPT have no consumer list-chats API — Open still uses
          deep links for those.
        </p>
      </header>

      <div className="space-y-4">
        <CursorSyncCard sync={sync} connection={connections.cursor} onChange={(p) => onChange("cursor", p)} />
        {TOOLS.filter((t) => t.id !== "cursor").map((tool) => (
          <ManualToolCard
            key={tool.id}
            tool={tool.id}
            connection={connections[tool.id]}
            onChange={(patch) => onChange(tool.id, patch)}
          />
        ))}
      </div>
    </div>
  );
}

function CursorSyncCard({
  sync,
  connection,
  onChange,
}: {
  sync: SyncProps;
  connection: ToolConnection;
  onChange: (patch: Partial<ToolConnection>) => void;
}) {
  const guide = TOOL_GUIDES.cursor;
  const ready = sync.configured === true;

  return (
    <section className="rounded-2xl bg-white px-4 py-4 ring-1 ring-[#e5e7eb]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <ToolMark tool="cursor" size="md" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-[#111]">Cursor</p>
              {ready ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-[#0f7a4d]">
                  <Check className="size-3" />
                  API connected
                </span>
              ) : sync.configured === false ? (
                <span className="text-[11px] text-[#b45309]">Needs API key</span>
              ) : (
                <span className="text-[11px] text-[#9ca3af]">Checking…</span>
              )}
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-[#9ca3af]">
              Lists your cloud agents from{" "}
              <code className="text-[11px]">api.cursor.com/v1/agents</code> and
              refreshes the board every 5 minutes when configured.
            </p>
          </div>
        </div>
        <a
          href="https://cursor.com/docs/cloud-agent/api/endpoints"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-xs text-[#6b7280] transition hover:bg-[#f9fafb] hover:text-[#111]"
        >
          <BookOpen className="size-3.5" />
          API docs
          <ArrowUpRight className="size-3.5" />
        </a>
      </div>

      <ol className="mt-4 space-y-2 border-t border-[#f0f0f0] pt-4">
        <li className="flex gap-2.5 text-xs leading-relaxed text-[#4b5563]">
          <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-[#111] text-[10px] font-medium text-white">
            1
          </span>
          <span>
            Create a user API key at{" "}
            <a
              href="https://cursor.com/dashboard?tab=integrations"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-[#d1d5db] underline-offset-2 hover:text-[#111]"
            >
              cursor.com/dashboard → Integrations / API Keys
            </a>
            .
          </span>
        </li>
        <li className="flex gap-2.5 text-xs leading-relaxed text-[#4b5563]">
          <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-[#111] text-[10px] font-medium text-white">
            2
          </span>
          <span>
            Set <code className="text-[11px]">DESK_CURSOR_API_KEY</code> in your
            host (Vercel / Cursor Secrets) or local <code className="text-[11px]">.env.local</code>.
          </span>
        </li>
        <li className="flex gap-2.5 text-xs leading-relaxed text-[#4b5563]">
          <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-[#111] text-[10px] font-medium text-white">
            3
          </span>
          <span>
            Tap <strong className="font-medium text-[#111]">Sync now</strong> —
            agents you start in Cursor appear on the board with live status.
          </span>
        </li>
      </ol>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={sync.onSync}
          disabled={sync.syncing}
          className="h-9 gap-1.5 rounded-full px-3.5"
        >
          {sync.syncing ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          Sync now
        </Button>
        {sync.lastSyncedAt ? (
          <span className="text-[11px] text-[#9ca3af]">
            {sync.lastCount ?? 0} agents ·{" "}
            {new Date(sync.lastSyncedAt).toLocaleTimeString()}
          </span>
        ) : null}
      </div>

      {sync.error ? (
        <p className="mt-3 text-xs leading-relaxed text-[#b45309]">{sync.error}</p>
      ) : null}

      <div className="mt-4 border-t border-[#f0f0f0] pt-3">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.12em] text-[#c0c4cc]">
          Open preference (optional)
        </p>
        <div className="flex flex-wrap gap-2">
          <PreferChip
            active={connection.connected && connection.preferred === "app"}
            onClick={() => onChange({ preferred: "app", connected: true })}
            label="Desktop app"
          />
          <PreferChip
            active={connection.connected && connection.preferred === "web"}
            onClick={() => onChange({ preferred: "web", connected: true })}
            label="Web"
          />
          <a
            href={guide.webUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-7 items-center gap-1 rounded-full bg-white px-2.5 text-[11px] text-[#6b7280] ring-1 ring-[#e5e7eb] transition hover:text-[#111]"
          >
            <Globe className="size-3" />
            Agents
          </a>
        </div>
      </div>
    </section>
  );
}

function ManualToolCard({
  tool,
  connection,
  onChange,
}: {
  tool: Tool;
  connection: ToolConnection;
  onChange: (patch: Partial<ToolConnection>) => void;
}) {
  const guide = TOOL_GUIDES[tool];
  const [tested, setTested] = useState(false);

  function prefer(next: OpenPrefer) {
    onChange({ preferred: next, connected: true });
  }

  function testDesktop() {
    onChange({ preferred: "app", connected: true });
    openHref(guide.testAppHref);
    setTested(true);
  }

  function testWeb() {
    onChange({ preferred: "web", connected: true });
    window.open(guide.webUrl, "_blank", "noopener");
    setTested(true);
  }

  return (
    <section
      className={cn(
        "rounded-2xl px-4 py-4 transition",
        connection.connected
          ? "bg-white ring-1 ring-[#e5e7eb]"
          : "bg-[#fafafa] ring-1 ring-[#efefef]",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <ToolMark tool={tool} size="md" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-[#111]">{guide.label}</p>
              <span className="text-[11px] text-[#9ca3af]">Manual only</span>
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-[#9ca3af]">
              No public consumer API to list chats. Add rows by hand; Open still
              uses deep links / web.
            </p>
          </div>
        </div>
        <a
          href={guide.docsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-xs text-[#6b7280] transition hover:bg-white hover:text-[#111]"
        >
          <BookOpen className="size-3.5" />
          Docs
        </a>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={testDesktop}
          className="h-9 gap-1.5 rounded-full px-3.5"
        >
          <AppWindow className="size-3.5" />
          Test desktop
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={testWeb}
          className="h-9 gap-1.5 rounded-full border-0 bg-white px-3.5 shadow-none ring-1 ring-[#e5e7eb]"
        >
          <Globe className="size-3.5" />
          Open {guide.webLabel}
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-[#9ca3af]">Prefer Open via</span>
        <PreferChip
          active={connection.connected && connection.preferred === "app"}
          onClick={() => prefer("app")}
          label="Desktop app"
        />
        <PreferChip
          active={connection.connected && connection.preferred === "web"}
          onClick={() => prefer("web")}
          label="Web"
        />
        {tested ? (
          <span className="text-[11px] text-[#0f7a4d]">Marked connected</span>
        ) : null}
      </div>
    </section>
  );
}

function PreferChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center rounded-full px-2.5 text-[11px] transition",
        active
          ? "bg-[#111] text-white"
          : "bg-white text-[#6b7280] ring-1 ring-[#e5e7eb] hover:text-[#111]",
      )}
    >
      {label}
    </button>
  );
}
