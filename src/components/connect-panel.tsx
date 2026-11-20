"use client";

import { useCallback, useRef, useState } from "react";
import { ToolMark } from "@/components/tool-mark";
import { Button } from "@/components/ui/button";
import type { ProviderSyncStatus } from "@/hooks/use-provider-sync";
import {
  openHref,
  type ConnectionsState,
  type OpenPrefer,
  type ToolConnection,
} from "@/lib/connections";
import {
  parseDeskImportJson,
  parseSessionFile,
} from "@/lib/parse-sessions";
import { TOOL_GUIDES } from "@/lib/tool-guides";
import type { Tool, TrackedChat } from "@/lib/types";
import {
  AppWindow,
  ArrowUpRight,
  BookOpen,
  Check,
  FileUp,
  Globe,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SyncCardProps = ProviderSyncStatus & {
  onSync: () => void;
};

type Props = {
  connections: ConnectionsState;
  onChange: (tool: Tool, patch: Partial<ToolConnection>) => void;
  cursorSync: SyncCardProps;
  claudeSync: SyncCardProps;
  chatgptSync: SyncCardProps;
  onImportChats: (chats: TrackedChat[]) => void;
};

export function ConnectPanel({
  connections,
  onChange,
  cursorSync,
  claudeSync,
  chatgptSync,
  onImportChats,
}: Props) {
  return (
    <div className="mx-auto max-w-2xl animate-in fade-in-0 duration-300">
      <header className="mb-6">
        <h1 className="text-3xl font-medium tracking-tight text-[#111]">
          Connect
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#6b7280]">
          Cursor syncs from its Cloud Agents API. Claude and ChatGPT consumer
          apps have no list-chats API — use local session import (works) or
          Enterprise Compliance keys (optional).
        </p>
      </header>

      <div className="space-y-4">
        <CursorSyncCard
          sync={cursorSync}
          connection={connections.cursor}
          onChange={(p) => onChange("cursor", p)}
        />
        <ClaudeCard
          sync={claudeSync}
          connection={connections.claude}
          onChange={(p) => onChange("claude", p)}
          onImportChats={onImportChats}
        />
        <ChatgptCard
          sync={chatgptSync}
          connection={connections.codex}
          onChange={(p) => onChange("codex", p)}
          onImportChats={onImportChats}
        />
        <ImportDropCard onImportChats={onImportChats} />
      </div>
    </div>
  );
}

function CursorSyncCard({
  sync,
  connection,
  onChange,
}: {
  sync: SyncCardProps;
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
              Lists cloud agents from{" "}
              <code className="text-[11px]">api.cursor.com/v1/agents</code> and
              refreshes every minute when configured.
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
          <Step n={1} />
          <span>
            Create a user API key at{" "}
            <a
              href="https://cursor.com/dashboard?tab=integrations"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-[#d1d5db] underline-offset-2 hover:text-[#111]"
            >
              cursor.com/dashboard → API Keys
            </a>
            .
          </span>
        </li>
        <li className="flex gap-2.5 text-xs leading-relaxed text-[#4b5563]">
          <Step n={2} />
          <span>
            Set <code className="text-[11px]">DESK_CURSOR_API_KEY</code> in
            your host or <code className="text-[11px]">.env.local</code>.
          </span>
        </li>
        <li className="flex gap-2.5 text-xs leading-relaxed text-[#4b5563]">
          <Step n={3} />
          <span>
            Tap <strong className="font-medium text-[#111]">Sync now</strong> —
            agents appear on the board with live status.
          </span>
        </li>
      </ol>

      <SyncActions sync={sync} />
      <OpenPreferRow connection={connection} onChange={onChange} guide={guide} />
    </section>
  );
}

function ClaudeCard({
  sync,
  connection,
  onChange,
  onImportChats,
}: {
  sync: SyncCardProps;
  connection: ToolConnection;
  onChange: (patch: Partial<ToolConnection>) => void;
  onImportChats: (chats: TrackedChat[]) => void;
}) {
  const guide = TOOL_GUIDES.claude;

  return (
    <section className="rounded-2xl bg-white px-4 py-4 ring-1 ring-[#e5e7eb]">
      <CardHeader
        tool="claude"
        title="Claude"
        badge={
          sync.configured ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-[#0f7a4d]">
              <Check className="size-3" />
              Enterprise key
            </span>
          ) : (
            <span className="text-[11px] text-[#9ca3af]">
              Import · optional Enterprise
            </span>
          )
        }
        blurb="claude.ai has no consumer list API. Claude Code sessions on disk sync for real; Enterprise Compliance can list org chats."
        docsUrl="https://platform.claude.com/docs/en/api/compliance/apps/chats/list"
        docsLabel="Compliance docs"
      />

      <div className="mt-4 space-y-3 border-t border-[#f0f0f0] pt-4">
        <PathBlock title="A · Claude Code (consumer — works)">
          <p>
            Sessions live at{" "}
            <code className="text-[11px]">~/.claude/projects/**/*.jsonl</code>.
            Drop those files below, or run{" "}
            <code className="text-[11px]">
              node scripts/desk-push.mjs --post
            </code>{" "}
            then <strong className="font-medium text-[#111]">Pull last push</strong>.
          </p>
        </PathBlock>
        <PathBlock title="B · Claude Enterprise Compliance (optional)">
          <p>
            Set{" "}
            <code className="text-[11px]">DESK_ANTHROPIC_COMPLIANCE_KEY</code>{" "}
            (Compliance Access Key with{" "}
            <code className="text-[11px]">read:compliance_user_data</code>), then
            Sync. Not available on Free/Pro consumer plans.
          </p>
        </PathBlock>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={sync.onSync}
          disabled={sync.syncing || sync.configured === false}
          className="h-9 gap-1.5 rounded-full px-3.5"
          title={
            sync.configured
              ? "Sync Enterprise compliance chats"
              : "Needs DESK_ANTHROPIC_COMPLIANCE_KEY"
          }
        >
          {sync.syncing ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          Sync Enterprise
        </Button>
        <PullLastPushButton onImportChats={onImportChats} />
        {sync.lastSyncedAt ? (
          <span className="text-[11px] text-[#9ca3af]">
            {sync.lastCount ?? 0} chats ·{" "}
            {new Date(sync.lastSyncedAt).toLocaleTimeString()}
          </span>
        ) : null}
      </div>
      {sync.error && sync.configured !== false ? (
        <p className="mt-3 text-xs leading-relaxed text-[#b45309]">{sync.error}</p>
      ) : sync.configured === false ? (
        <p className="mt-3 text-xs leading-relaxed text-[#9ca3af]">
          No Enterprise key — use file drop / desk-push for Claude Code.
        </p>
      ) : null}

      <DesktopTestRow
        connection={connection}
        onChange={onChange}
        guide={guide}
      />
    </section>
  );
}

function ChatgptCard({
  sync,
  connection,
  onChange,
  onImportChats,
}: {
  sync: SyncCardProps;
  connection: ToolConnection;
  onChange: (patch: Partial<ToolConnection>) => void;
  onImportChats: (chats: TrackedChat[]) => void;
}) {
  const guide = TOOL_GUIDES.codex;

  return (
    <section className="rounded-2xl bg-white px-4 py-4 ring-1 ring-[#e5e7eb]">
      <CardHeader
        tool="codex"
        title="ChatGPT / Codex"
        badge={
          sync.configured ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-[#0f7a4d]">
              <Check className="size-3" />
              Enterprise key
            </span>
          ) : (
            <span className="text-[11px] text-[#9ca3af]">
              Import · optional Enterprise
            </span>
          )
        }
        blurb="chatgpt.com has no consumer list API. OpenAI Conversations API cannot list threads. Codex CLI rollouts on disk sync for real; Enterprise Compliance can list workspace chats."
        docsUrl="https://developers.openai.com/cookbook/examples/chatgpt/compliance_api/logs_platform"
        docsLabel="Compliance docs"
      />

      <div className="mt-4 space-y-3 border-t border-[#f0f0f0] pt-4">
        <PathBlock title="A · Codex CLI (consumer — works)">
          <p>
            Rollouts live at{" "}
            <code className="text-[11px]">
              ~/.codex/sessions/**/rollout-*.jsonl
            </code>
            . Drop them below, or{" "}
            <code className="text-[11px]">
              node scripts/desk-push.mjs --post
            </code>{" "}
            → Pull last push.
          </p>
        </PathBlock>
        <PathBlock title="B · ChatGPT Enterprise Compliance (optional)">
          <p>
            Set{" "}
            <code className="text-[11px]">DESK_OPENAI_COMPLIANCE_KEY</code> +{" "}
            <code className="text-[11px]">DESK_OPENAI_WORKSPACE_ID</code>, then
            Sync. Requires ChatGPT Enterprise/Edu — not Plus/Team consumer.
          </p>
        </PathBlock>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={sync.onSync}
          disabled={sync.syncing || sync.configured === false}
          className="h-9 gap-1.5 rounded-full px-3.5"
        >
          {sync.syncing ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          Sync Enterprise
        </Button>
        <PullLastPushButton onImportChats={onImportChats} />
        {sync.lastSyncedAt ? (
          <span className="text-[11px] text-[#9ca3af]">
            {sync.lastCount ?? 0} chats ·{" "}
            {new Date(sync.lastSyncedAt).toLocaleTimeString()}
          </span>
        ) : null}
      </div>
      {sync.error && sync.configured !== false ? (
        <p className="mt-3 text-xs leading-relaxed text-[#b45309]">{sync.error}</p>
      ) : sync.configured === false ? (
        <p className="mt-3 text-xs leading-relaxed text-[#9ca3af]">
          No Enterprise keys — use Codex rollout import / desk-push.
        </p>
      ) : null}

      <DesktopTestRow
        connection={connection}
        onChange={onChange}
        guide={guide}
      />
    </section>
  );
}

function ImportDropCard({
  onImportChats,
}: {
  onImportChats: (chats: TrackedChat[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paste, setPaste] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const ingestFiles = useCallback(
    async (files: FileList | File[]) => {
      setBusy(true);
      setError(null);
      setMessage(null);
      try {
        const list = Array.from(files);
        const chats: TrackedChat[] = [];
        for (const file of list) {
          const text = await file.text();
          if (
            file.name.endsWith(".json") &&
            !file.name.endsWith(".jsonl")
          ) {
            chats.push(...parseDeskImportJson(text));
          } else {
            const one = parseSessionFile(text, file.name);
            if (one) chats.push(one);
          }
        }
        if (chats.length === 0) {
          setError(
            "No sessions parsed. Drop Claude Code .jsonl, Codex rollout-*.jsonl, or desk-import.json.",
          );
          return;
        }
        onImportChats(chats);
        setMessage(`Imported ${chats.length} chat(s) onto the board.`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Import failed");
      } finally {
        setBusy(false);
      }
    },
    [onImportChats],
  );

  function applyPaste() {
    setError(null);
    setMessage(null);
    const chats = parseDeskImportJson(paste);
    if (chats.length === 0) {
      setError('Paste JSON like { "chats": [{ "title", "externalId", ... }] }');
      return;
    }
    onImportChats(chats);
    setMessage(`Imported ${chats.length} chat(s) from paste.`);
    setPaste("");
  }

  return (
    <section className="rounded-2xl bg-white px-4 py-4 ring-1 ring-[#e5e7eb]">
      <div className="flex items-start gap-2.5">
        <span className="inline-flex size-8 items-center justify-center rounded-lg bg-[#f3f4f6] text-[#6b7280]">
          <FileUp className="size-4" />
        </span>
        <div>
          <p className="text-sm font-medium text-[#111]">Import sessions</p>
          <p className="mt-0.5 text-xs leading-relaxed text-[#9ca3af]">
            Drop Claude Code / Codex JSONL, or a{" "}
            <code className="text-[11px]">desk-import.json</code> from{" "}
            <code className="text-[11px]">scripts/desk-push.mjs</code>. Parsed
            in your browser — nothing uploaded to Anthropic/OpenAI.
          </p>
        </div>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) {
            void ingestFiles(e.dataTransfer.files);
          }
        }}
        className={cn(
          "mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed px-4 py-8 text-center transition",
          dragOver
            ? "border-[#111] bg-[#fafafa]"
            : "border-[#e5e7eb] bg-[#fafafa]",
        )}
      >
        <p className="text-xs text-[#6b7280]">
          Drop <code className="text-[11px]">.jsonl</code> or{" "}
          <code className="text-[11px]">.json</code> here
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="mt-3 h-8 gap-1.5 rounded-full border-0 bg-white px-3 text-xs shadow-none ring-1 ring-[#e5e7eb]"
        >
          {busy ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <FileUp className="size-3.5" />
          )}
          Choose files
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".jsonl,.json,application/json,text/plain"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void ingestFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <div className="mt-3">
        <textarea
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          placeholder='Paste import JSON: { "chats": [...] }'
          rows={3}
          className="w-full resize-y rounded-xl border-0 bg-[#f5f5f5] px-3 py-2 text-xs text-[#111] shadow-none outline-none ring-0 placeholder:text-[#c0c4cc] focus-visible:ring-1 focus-visible:ring-[#d1d5db]"
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={applyPaste}
            className="h-8 rounded-full border-0 bg-white px-3 text-xs shadow-none ring-1 ring-[#e5e7eb]"
          >
            Apply paste
          </Button>
          <PullLastPushButton onImportChats={onImportChats} />
        </div>
      </div>

      {message ? (
        <p className="mt-3 text-xs text-[#0f7a4d]">{message}</p>
      ) : null}
      {error ? (
        <p className="mt-3 text-xs text-[#b45309]">{error}</p>
      ) : null}
    </section>
  );
}

function PullLastPushButton({
  onImportChats,
}: {
  onImportChats: (chats: TrackedChat[]) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function pull() {
    setBusy(true);
    try {
      const res = await fetch("/api/sync/import?pull=1", { cache: "no-store" });
      const data = (await res.json()) as {
        chats?: TrackedChat[];
        error?: string;
      };
      if (!res.ok) {
        window.alert(data.error ?? "Nothing staged yet");
        return;
      }
      const chats = data.chats ?? [];
      onImportChats(chats);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => void pull()}
      disabled={busy}
      className="h-9 gap-1.5 rounded-full border-0 bg-[#f5f5f5] px-3.5 shadow-none"
    >
      {busy ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <RefreshCw className="size-3.5" />
      )}
      Pull last push
    </Button>
  );
}

function CardHeader({
  tool,
  title,
  badge,
  blurb,
  docsUrl,
  docsLabel,
}: {
  tool: Tool;
  title: string;
  badge: React.ReactNode;
  blurb: string;
  docsUrl: string;
  docsLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-2.5">
        <ToolMark tool={tool} size="md" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-[#111]">{title}</p>
            {badge}
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-[#9ca3af]">
            {blurb}
          </p>
        </div>
      </div>
      <a
        href={docsUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-xs text-[#6b7280] transition hover:bg-[#f9fafb] hover:text-[#111]"
      >
        <BookOpen className="size-3.5" />
        {docsLabel}
        <ArrowUpRight className="size-3.5" />
      </a>
    </div>
  );
}

function PathBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#c0c4cc]">
        {title}
      </p>
      <div className="mt-1 text-xs leading-relaxed text-[#4b5563]">
        {children}
      </div>
    </div>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-[#111] text-[10px] font-medium text-white">
      {n}
    </span>
  );
}

function SyncActions({ sync }: { sync: SyncCardProps }) {
  return (
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
      {sync.error ? (
        <p className="basis-full text-xs leading-relaxed text-[#b45309]">
          {sync.error}
        </p>
      ) : null}
    </div>
  );
}

function OpenPreferRow({
  connection,
  onChange,
  guide,
}: {
  connection: ToolConnection;
  onChange: (patch: Partial<ToolConnection>) => void;
  guide: (typeof TOOL_GUIDES)[Tool];
}) {
  return (
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
          {guide.webLabel}
        </a>
      </div>
    </div>
  );
}

function DesktopTestRow({
  connection,
  onChange,
  guide,
}: {
  connection: ToolConnection;
  onChange: (patch: Partial<ToolConnection>) => void;
  guide: (typeof TOOL_GUIDES)[Tool];
}) {
  const [tested, setTested] = useState(false);

  function prefer(next: OpenPrefer) {
    onChange({ preferred: next, connected: true });
  }

  return (
    <div className="mt-4 border-t border-[#f0f0f0] pt-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => {
            prefer("app");
            openHref(guide.testAppHref);
            setTested(true);
          }}
          className="h-8 gap-1.5 rounded-full px-3 text-xs"
        >
          <AppWindow className="size-3.5" />
          Test desktop
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            prefer("web");
            window.open(guide.webUrl, "_blank", "noopener");
            setTested(true);
          }}
          className="h-8 gap-1.5 rounded-full border-0 bg-white px-3 text-xs shadow-none ring-1 ring-[#e5e7eb]"
        >
          <Globe className="size-3.5" />
          Open {guide.webLabel}
        </Button>
        <PreferChip
          active={connection.connected && connection.preferred === "app"}
          onClick={() => prefer("app")}
          label="Prefer app"
        />
        <PreferChip
          active={connection.connected && connection.preferred === "web"}
          onClick={() => prefer("web")}
          label="Prefer web"
        />
        {tested ? (
          <span className="text-[11px] text-[#0f7a4d]">Marked connected</span>
        ) : null}
      </div>
    </div>
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
