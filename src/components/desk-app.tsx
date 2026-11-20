"use client";

import { useMemo, useState } from "react";
import { ChatFormDialog } from "@/components/chat-form-dialog";
import { ConnectPanel } from "@/components/connect-panel";
import { StatusMark } from "@/components/status-mark";
import { ToolMark } from "@/components/tool-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChats } from "@/hooks/use-chats";
import { useConnections } from "@/hooks/use-connections";
import { useProviderSync } from "@/hooks/use-provider-sync";
import {
  DEFAULT_CONNECTIONS,
  openHref,
  resolveOpenTargets,
  type ToolConnection,
} from "@/lib/connections";
import { formatRelative } from "@/lib/time";
import { cn } from "@/lib/utils";
import {
  KINDS,
  STATUSES,
  TOOL_LANES,
  TOOLS,
  matchesToolLane,
  type ChatDraft,
  type Kind,
  type Status,
  type Tool,
  type ToolLaneId,
  type TrackedChat,
} from "@/lib/types";
import {
  AppWindow,
  Archive,
  Code2,
  ExternalLink,
  Home,
  LayoutGrid,
  Link2,
  LogOut,
  MessageSquare,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";

type View = "board" | "connect";
type ToolFilter = "all" | ToolLaneId;
type KindFilter = "all" | Kind;

const ACTIVE_STATUSES: Status[] = ["needs_approval", "working"];

export function DeskApp() {
  const {
    chats,
    ready,
    addChat,
    updateChat,
    setStatus,
    archiveChat,
    restoreChat,
    removeChat,
    mergeFromSync,
  } = useChats();
  const { connections, ready: connectionsReady, updateTool } = useConnections();
  const cursorSync = useProviderSync("cursor", mergeFromSync, {
    autoRefresh: true,
  });
  const claudeSync = useProviderSync("claude", mergeFromSync, {
    autoRefresh: false,
  });
  const chatgptSync = useProviderSync("chatgpt", mergeFromSync, {
    autoRefresh: false,
  });

  function importChats(chats: TrackedChat[]) {
    mergeFromSync(chats, { pruneMissing: false });
  }

  const [view, setView] = useState<View>("board");
  const [toolFilter, setToolFilter] = useState<ToolFilter>("all");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TrackedChat | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<Status>("working");

  const visible = useMemo(() => {
    return chats
      .filter((chat) => (showArchived ? chat.archived : !chat.archived))
      .filter((chat) =>
        toolFilter === "all" ? true : matchesToolLane(chat, toolFilter),
      )
      .filter((chat) => (kindFilter === "all" ? true : chat.kind === kindFilter))
      .filter((chat) => {
        if (!query.trim()) return true;
        const hay = `${chat.title} ${chat.note}`.toLowerCase();
        return hay.includes(query.trim().toLowerCase());
      })
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
  }, [chats, toolFilter, kindFilter, query, showArchived]);

  const counts = useMemo(() => {
    const active = chats.filter((c) => !c.archived);
    const live = active.filter((c) => ACTIVE_STATUSES.includes(c.status));
    const byLane = Object.fromEntries(
      TOOL_LANES.map((lane) => [
        lane.id,
        active.filter((c) => matchesToolLane(c, lane.id)).length,
      ]),
    ) as Record<ToolLaneId, number>;
    const liveByLane = Object.fromEntries(
      TOOL_LANES.map((lane) => [
        lane.id,
        live.filter((c) => matchesToolLane(c, lane.id)).length,
      ]),
    ) as Record<ToolLaneId, number>;

    return {
      all: active.length,
      needs_approval: active.filter((c) => c.status === "needs_approval")
        .length,
      working: active.filter((c) => c.status === "working").length,
      done: active.filter((c) => c.status === "done").length,
      dormant: active.filter((c) => c.status === "dormant").length,
      archived: chats.filter((c) => c.archived).length,
      connected: connections
        ? TOOLS.filter((t) => connections[t.id].connected).length
        : 0,
      byLane,
      liveByLane,
      liveTotal: live.length,
    };
  }, [chats, connections]);

  function openCreate(status: Status = "working") {
    setEditing(null);
    setDefaultStatus(status);
    setDialogOpen(true);
  }

  function openEdit(chat: TrackedChat) {
    setEditing(chat);
    setDefaultStatus(chat.status);
    setDialogOpen(true);
  }

  function handleSubmit(draft: ChatDraft) {
    if (editing) {
      updateChat(editing.id, draft);
      return;
    }
    addChat(draft);
  }

  function selectLane(lane: ToolFilter) {
    setView("board");
    setShowArchived(false);
    setToolFilter(lane);
  }

  const connState = connections ?? DEFAULT_CONNECTIONS;

  return (
    <div className="min-h-screen bg-white text-[#111]">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col md:flex-row">
        <aside className="px-1.5 py-2 md:sticky md:top-0 md:flex md:h-screen md:w-12 md:flex-col md:items-center md:px-1 md:py-3 lg:w-40 lg:items-stretch lg:px-2">
          <div className="mb-2 flex items-center gap-1.5 px-1 lg:mb-3">
            <span className="inline-flex size-6 items-center justify-center rounded-md bg-[#111] text-[10px] font-semibold text-white">
              D
            </span>
            <div className="hidden lg:block">
              <p className="text-[13px] font-medium leading-none tracking-tight">
                Desk
              </p>
              <p className="mt-0.5 text-[9px] text-[#9ca3af]">check-in</p>
            </div>
          </div>

          <nav className="flex gap-0 md:flex-col">
            <NavItem
              active={view === "board" && !showArchived}
              onClick={() => {
                setView("board");
                setShowArchived(false);
              }}
              icon={<Home className="size-3.5" />}
              label="Home"
            />
            <NavItem
              active={view === "connect"}
              onClick={() => setView("connect")}
              icon={<Link2 className="size-3.5" />}
              label="Connect"
              badge={counts.connected}
            />
          </nav>

          <div className="mt-3 hidden flex-col gap-0 lg:flex">
            <p className="px-1 pb-0.5 text-[8px] font-medium uppercase tracking-[0.14em] text-[#c0c4cc]">
              Tools
            </p>
            <NavItem
              active={view === "board" && toolFilter === "all"}
              onClick={() => selectLane("all")}
              icon={<LayoutGrid className="size-3.5" />}
              label="All"
              badge={counts.all}
            />
            {TOOL_LANES.map((lane) => (
              <NavItem
                key={lane.id}
                active={view === "board" && toolFilter === lane.id}
                onClick={() => selectLane(lane.id)}
                icon={
                  <ToolMark
                    tool={lane.tool}
                    kind={lane.kind ?? "chat"}
                  />
                }
                label={lane.label}
                badge={counts.byLane[lane.id]}
                connected={connState[lane.tool].connected}
              />
            ))}
          </div>

          <div className="mt-3 hidden flex-col gap-0 lg:flex">
            <p className="px-1 pb-0.5 text-[8px] font-medium uppercase tracking-[0.14em] text-[#c0c4cc]">
              Type
            </p>
            <NavItem
              active={kindFilter === "all"}
              onClick={() => setKindFilter("all")}
              icon={<LayoutGrid className="size-3.5" />}
              label="All"
            />
            <NavItem
              active={kindFilter === "chat"}
              onClick={() => setKindFilter("chat")}
              icon={<MessageSquare className="size-3.5" />}
              label="Chat"
            />
            <NavItem
              active={kindFilter === "code"}
              onClick={() => setKindFilter("code")}
              icon={<Code2 className="size-3.5" />}
              label="Code"
            />
          </div>

          <div className="mt-auto hidden space-y-0 pt-3 lg:block">
            <NavItem
              active={showArchived}
              onClick={() => {
                setView("board");
                setShowArchived((v) => !v);
              }}
              icon={<Archive className="size-3.5" />}
              label="Archive"
              badge={counts.archived}
            />
            <button
              type="button"
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.href = "/login";
              }}
              className="flex w-full items-center gap-1.5 rounded-md px-1 py-1 text-left text-[11px] text-[#9ca3af] transition hover:text-[#111]"
            >
              <LogOut className="size-3" />
              Sign out
            </button>
          </div>
        </aside>

        <main className="flex-1 px-4 pb-16 pt-4 md:px-8 md:pt-8 lg:px-10">
          {view === "connect" && connectionsReady ? (
            <ConnectPanel
              connections={connState}
              onChange={updateTool}
              onImportChats={importChats}
              cursorSync={{
                configured: cursorSync.configured,
                syncing: cursorSync.syncing,
                lastSyncedAt: cursorSync.lastSyncedAt,
                lastCount: cursorSync.lastCount,
                error: cursorSync.error,
                onSync: () => {
                  void cursorSync.sync();
                },
              }}
              claudeSync={{
                configured: claudeSync.configured,
                syncing: claudeSync.syncing,
                lastSyncedAt: claudeSync.lastSyncedAt,
                lastCount: claudeSync.lastCount,
                error: claudeSync.error,
                enterpriseOnly: claudeSync.enterpriseOnly,
                onSync: () => {
                  void claudeSync.sync();
                },
              }}
              chatgptSync={{
                configured: chatgptSync.configured,
                syncing: chatgptSync.syncing,
                lastSyncedAt: chatgptSync.lastSyncedAt,
                lastCount: chatgptSync.lastCount,
                error: chatgptSync.error,
                enterpriseOnly: chatgptSync.enterpriseOnly,
                onSync: () => {
                  void chatgptSync.sync();
                },
              }}
            />
          ) : (
            <>
              <header className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-1.5">
                    <StatusMark status="needs_approval" size="sm" />
                    <span className="text-[11px] tabular-nums text-[#9ca3af]">
                      {counts.needs_approval}
                    </span>
                    <StatusMark status="working" size="sm" />
                    <span className="text-[11px] tabular-nums text-[#9ca3af]">
                      {counts.working}
                    </span>
                    <StatusMark status="done" size="sm" />
                    <span className="text-[11px] tabular-nums text-[#9ca3af]">
                      {counts.done}
                    </span>
                    <StatusMark status="dormant" size="sm" />
                    <span className="text-[11px] tabular-nums text-[#9ca3af]">
                      {counts.dormant}
                    </span>
                    {cursorSync.lastSyncedAt ? (
                      <span className="ml-1 text-[11px] text-[#c0c4cc]">
                        · Cursor synced{" "}
                        {new Date(
                          cursorSync.lastSyncedAt,
                        ).toLocaleTimeString()}
                      </span>
                    ) : null}
                  </div>
                  <h1 className="text-3xl font-medium tracking-tight md:text-[2rem]">
                    {showArchived ? "Archive" : "Active chats"}
                  </h1>
                  {cursorSync.error ? (
                    <p className="mt-1 max-w-md text-xs text-[#b45309]">
                      {cursorSync.error}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-[#9ca3af]" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search"
                      className="h-9 w-full !rounded-full border-0 bg-[#f5f5f5] pl-9 shadow-none ring-0 focus-visible:ring-1 focus-visible:ring-[#d1d5db] sm:w-52"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      void cursorSync.sync();
                    }}
                    disabled={cursorSync.syncing}
                    className="h-9 gap-1.5 rounded-full border-0 bg-[#f5f5f5] px-3.5 shadow-none"
                    title="Sync Cursor cloud agents"
                  >
                    {cursorSync.syncing ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="size-3.5" />
                    )}
                    Sync
                  </Button>
                  <Button
                    onClick={() => openCreate("working")}
                    className="h-9 gap-1.5 rounded-full px-4"
                  >
                    <Plus className="size-4" />
                    Add
                  </Button>
                </div>
              </header>

              {!connectionsReady || !ready ? (
                <div className="py-20 text-center text-sm text-[#9ca3af]">
                  Loading…
                </div>
              ) : showArchived ? (
                <StatusSection
                  title="Archived"
                  chats={visible}
                  empty="Nothing archived."
                  connections={connState}
                  onStatus={setStatus}
                  onEdit={openEdit}
                  onArchive={restoreChat}
                  archiveLabel="Restore"
                  onRemove={removeChat}
                />
              ) : (
                <div className="space-y-8">
                  <ActiveDashboard
                    liveTotal={counts.liveTotal}
                    liveByLane={counts.liveByLane}
                    selected={toolFilter}
                    onSelect={selectLane}
                  />

                  {counts.all === 0 ? (
                    <EmptyBoard
                      onConnect={() => setView("connect")}
                      onSync={() => {
                        void cursorSync.sync();
                      }}
                      syncing={cursorSync.syncing}
                      configured={cursorSync.configured}
                      onAdd={() => openCreate("working")}
                    />
                  ) : (
                    STATUSES.map((status) => {
                      const group = visible.filter(
                        (c) => c.status === status.id,
                      );
                      return (
                        <StatusSection
                          key={status.id}
                          title={status.label}
                          status={status.id}
                          chats={group}
                          empty="—"
                          connections={connState}
                          onAdd={() => openCreate(status.id)}
                          onStatus={setStatus}
                          onEdit={openEdit}
                          onArchive={archiveChat}
                          archiveLabel="Archive"
                          onRemove={removeChat}
                        />
                      );
                    })
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <ChatFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        defaultStatus={defaultStatus}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

function EmptyBoard({
  onConnect,
  onSync,
  syncing,
  configured,
  onAdd,
}: {
  onConnect: () => void;
  onSync: () => void;
  syncing: boolean;
  configured: boolean | null;
  onAdd: () => void;
}) {
  return (
    <div className="rounded-2xl px-1 py-16 text-center">
      <p className="text-sm font-medium text-[#111]">No chats yet</p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-[#9ca3af]">
        Sync Cursor from the API, import Claude Code / Codex sessions, or add
        chats manually.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <Button
          type="button"
          onClick={configured === false ? onConnect : onSync}
          disabled={syncing}
          className="h-9 gap-1.5 rounded-full px-4"
        >
          {syncing ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <RefreshCw className="size-3.5" />
          )}
          {configured === false ? "Set API key" : "Sync Cursor"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onConnect}
          className="h-9 rounded-full px-4"
        >
          <Link2 className="size-3.5" />
          Connect
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onAdd}
          className="h-9 gap-1.5 rounded-full px-4"
        >
          <Plus className="size-4" />
          Add manually
        </Button>
      </div>
    </div>
  );
}

function ActiveDashboard({
  liveTotal,
  liveByLane,
  selected,
  onSelect,
}: {
  liveTotal: number;
  liveByLane: Record<ToolLaneId, number>;
  selected: ToolFilter;
  onSelect: (lane: ToolFilter) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={() => onSelect("all")}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs transition",
          selected === "all"
            ? "bg-[#111] text-white"
            : "bg-[#f5f5f5] text-[#6b7280] hover:bg-[#efefef] hover:text-[#111]",
        )}
      >
        <span className="font-medium tabular-nums">{liveTotal}</span>
        <span className="opacity-70">live</span>
      </button>
      {TOOL_LANES.map((lane) => {
        const n = liveByLane[lane.id];
        const active = selected === lane.id;
        return (
          <button
            key={lane.id}
            type="button"
            onClick={() => onSelect(lane.id)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full px-2 text-xs transition",
              active
                ? "bg-[#f3f4f6] text-[#111] ring-1 ring-[#e5e7eb]"
                : "text-[#9ca3af] hover:bg-[#f7f7f7] hover:text-[#111]",
            )}
            aria-label={`${lane.label}: ${n} active`}
          >
            <ToolMark tool={lane.tool} kind={lane.kind ?? "chat"} />
            <span className="font-medium tabular-nums">{n}</span>
          </button>
        );
      })}
    </div>
  );
}

function NavItem({
  active,
  onClick,
  icon,
  label,
  badge,
  connected,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  connected?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "group relative flex items-center gap-1.5 rounded-md px-1 py-0.5 text-sm transition",
        active ? "text-[#111]" : "text-[#9ca3af] hover:text-[#111]",
      )}
    >
      <span className="relative inline-flex size-6 shrink-0 items-center justify-center">
        {icon}
        {connected ? (
          <span className="absolute top-0 right-0 size-1 rounded-full bg-[#10b981]" />
        ) : null}
      </span>
      <span className="hidden flex-1 truncate text-left text-xs lg:inline">
        {label}
      </span>
      {typeof badge === "number" ? (
        <span className="hidden text-[10px] tabular-nums text-[#c0c4cc] lg:inline">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function StatusSection({
  title,
  status,
  chats,
  empty,
  connections,
  onAdd,
  onStatus,
  onEdit,
  onArchive,
  archiveLabel,
  onRemove,
}: {
  title: string;
  status?: Status;
  chats: TrackedChat[];
  empty: string;
  connections: Record<Tool, ToolConnection>;
  onAdd?: () => void;
  onStatus: (id: string, status: Status) => void;
  onEdit: (chat: TrackedChat) => void;
  onArchive: (id: string) => void;
  archiveLabel: string;
  onRemove: (id: string) => void;
}) {
  return (
    <section className="animate-in fade-in-0 duration-300">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {status ? <StatusMark status={status} size="sm" /> : null}
          <h2 className="text-sm font-medium text-[#374151]">{title}</h2>
          <span className="text-xs tabular-nums text-[#c0c4cc]">
            {chats.length}
          </span>
        </div>
        {onAdd ? (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex size-7 items-center justify-center rounded-full text-[#9ca3af] transition hover:bg-[#f3f4f6] hover:text-[#111]"
            aria-label={`Add to ${title}`}
          >
            <Plus className="size-4" />
          </button>
        ) : null}
      </div>

      {chats.length === 0 ? (
        <p className="px-1 py-5 text-sm text-[#d1d5db]">{empty}</p>
      ) : (
        <ul className="space-y-1.5">
          {chats.map((chat) => (
            <ChatRow
              key={chat.id}
              chat={chat}
              connection={connections[chat.tool]}
              onStatus={onStatus}
              onEdit={onEdit}
              onArchive={onArchive}
              archiveLabel={archiveLabel}
              onRemove={onRemove}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function ChatRow({
  chat,
  connection,
  onStatus,
  onEdit,
  onArchive,
  archiveLabel,
  onRemove,
}: {
  chat: TrackedChat;
  connection: ToolConnection;
  onStatus: (id: string, status: Status) => void;
  onEdit: (chat: TrackedChat) => void;
  onArchive: (id: string) => void;
  archiveLabel: string;
  onRemove: (id: string) => void;
}) {
  const targets = resolveOpenTargets(chat, connection);
  const kindIcon =
    chat.kind === "code" ? (
      <Code2 className="size-3.5" />
    ) : (
      <MessageSquare className="size-3.5" />
    );

  function openPreferred() {
    if (connection.preferred === "web") {
      window.open(targets.webHref, "_blank", "noopener");
      return;
    }
    openHref(targets.appHref);
  }

  return (
    <li className="group rounded-2xl bg-[#fafafa] px-3 py-2.5 ring-1 ring-[#efefef] transition hover:bg-[#f7f7f7] hover:ring-[#e5e7eb] sm:px-4">
      <div className="flex items-start gap-3 sm:items-center">
        <ToolMark tool={chat.tool} kind={chat.kind} size="md" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium tracking-tight text-[#111]">
              {chat.title}
            </p>
            <StatusMark
              status={chat.status}
              size="sm"
              onChange={(next) => onStatus(chat.id, next)}
            />
            <span
              aria-label={KINDS.find((k) => k.id === chat.kind)?.label}
              className="inline-flex size-5 items-center justify-center text-[#9ca3af]"
            >
              {kindIcon}
            </span>
          </div>
          {chat.note ? (
            <p className="mt-0.5 line-clamp-1 text-sm text-[#6b7280]">
              {chat.note}
            </p>
          ) : null}
          <p className="mt-0.5 text-[11px] text-[#c0c4cc]">
            {formatRelative(chat.updatedAt)}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-0.5">
          <IconAction
            label={
              connection.preferred === "app"
                ? `Open ${TOOLS.find((t) => t.id === chat.tool)?.label} Mac app`
                : "Open in browser"
            }
            onClick={openPreferred}
          >
            {connection.preferred === "app" ? (
              <AppWindow className="size-3.5" />
            ) : (
              <ExternalLink className="size-3.5" />
            )}
          </IconAction>

          {targets.chatHref ? (
            <a
              href={targets.chatHref}
              target={
                /^https?:\/\//i.test(targets.chatHref) ? "_blank" : undefined
              }
              rel="noreferrer"
              className="inline-flex size-8 items-center justify-center rounded-full text-[#9ca3af] transition hover:bg-white hover:text-[#111]"
              aria-label="Open saved chat link"
            >
              <Link2 className="size-3.5" />
            </a>
          ) : null}

          <IconAction label="Edit" onClick={() => onEdit(chat)}>
            <Pencil className="size-3.5" />
          </IconAction>
          <IconAction label={archiveLabel} onClick={() => onArchive(chat.id)}>
            <Archive className="size-3.5" />
          </IconAction>
          {chat.archived ? (
            <IconAction label="Delete" onClick={() => onRemove(chat.id)}>
              <Trash2 className="size-3.5 text-[#b45353]" />
            </IconAction>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function IconAction({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex size-8 items-center justify-center rounded-full text-[#9ca3af] transition hover:bg-white hover:text-[#111]"
    >
      {children}
    </button>
  );
}
