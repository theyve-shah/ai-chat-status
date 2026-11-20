"use client";

import { useMemo, useState } from "react";
import { ChatFormDialog } from "@/components/chat-form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChats } from "@/hooks/use-chats";
import { formatExact, formatRelative } from "@/lib/time";
import { cn } from "@/lib/utils";
import {
  KINDS,
  STATUSES,
  TOOLS,
  type ChatDraft,
  type Kind,
  type Status,
  type Tool,
  type TrackedChat,
} from "@/lib/types";
import { Archive, ExternalLink, Pencil, Plus, RotateCcw } from "lucide-react";

type ToolFilter = "all" | Tool;
type KindFilter = "all" | Kind;

const STATUS_DOT: Record<Status, string> = {
  needs_approval: "bg-[#d97706]",
  working: "bg-[#2563eb]",
  done: "bg-[#059669]",
};

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
    resetSamples,
  } = useChats();

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
      .filter((chat) => (toolFilter === "all" ? true : chat.tool === toolFilter))
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
    return {
      all: active.length,
      needs_approval: active.filter((c) => c.status === "needs_approval").length,
      working: active.filter((c) => c.status === "working").length,
      done: active.filter((c) => c.status === "done").length,
      archived: chats.filter((c) => c.archived).length,
    };
  }, [chats]);

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

  return (
    <div className="min-h-screen bg-[radial-gradient(120%_80%_at_0%_0%,#e8eef5_0%,#f7f8f8_42%,#eef1f3_100%)] text-[#1a1a1a]">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col md:flex-row">
        <aside className="border-b border-[#e4e4e1] bg-[#fbfbfa]/80 px-4 py-5 backdrop-blur md:w-56 md:border-r md:border-b-0 md:px-5">
          <div className="mb-8">
            <p className="font-[family-name:var(--font-display)] text-2xl tracking-tight">
              Desk
            </p>
            <p className="mt-1 text-sm text-[#6b6b66]">
              Check-in board for active agent chats.
            </p>
          </div>

          <nav className="space-y-1">
            <FilterButton
              active={toolFilter === "all"}
              onClick={() => setToolFilter("all")}
              label="All tools"
              count={counts.all}
            />
            {TOOLS.map((tool) => (
              <FilterButton
                key={tool.id}
                active={toolFilter === tool.id}
                onClick={() => setToolFilter(tool.id)}
                label={tool.label}
                count={
                  chats.filter((c) => !c.archived && c.tool === tool.id).length
                }
              />
            ))}
          </nav>

          <div className="mt-8 space-y-1">
            <p className="px-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#8a8a84]">
              Type
            </p>
            <FilterButton
              active={kindFilter === "all"}
              onClick={() => setKindFilter("all")}
              label="All"
            />
            {KINDS.map((kind) => (
              <FilterButton
                key={kind.id}
                active={kindFilter === kind.id}
                onClick={() => setKindFilter(kind.id)}
                label={kind.label}
              />
            ))}
          </div>

          <div className="mt-8 space-y-2">
            <button
              type="button"
              onClick={() => setShowArchived((v) => !v)}
              className="px-2 text-sm text-[#6b6b66] transition hover:text-[#1a1a1a]"
            >
              {showArchived
                ? "Hide archived"
                : `Archived (${counts.archived})`}
            </button>
            <button
              type="button"
              onClick={resetSamples}
              className="flex items-center gap-1.5 px-2 text-sm text-[#6b6b66] transition hover:text-[#1a1a1a]"
            >
              <RotateCcw className="size-3.5" />
              Reset sample data
            </button>
          </div>
        </aside>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight md:text-4xl">
                Active chats
              </h1>
              <p className="mt-1 text-sm text-[#6b6b66]">
                {ready
                  ? `${counts.needs_approval} need you · ${counts.working} working · ${counts.done} done`
                  : "Loading…"}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search title or note"
                className="h-9 w-full border-[#e4e4e1] bg-white/80 sm:w-56"
              />
              <Button onClick={() => openCreate("working")} className="gap-1.5">
                <Plus className="size-4" />
                Add chat
              </Button>
            </div>
          </header>

          {!ready ? (
            <div className="rounded-xl border border-dashed border-[#d8d8d3] bg-white/50 px-4 py-16 text-center text-sm text-[#6b6b66]">
              Loading your desk…
            </div>
          ) : showArchived ? (
            <StatusSection
              title="Archived"
              hint="Hidden from the live board"
              chats={visible}
              empty="No archived chats."
              onStatus={setStatus}
              onEdit={openEdit}
              onArchive={restoreChat}
              archiveLabel="Restore"
              onRemove={removeChat}
            />
          ) : (
            <div className="space-y-8">
              {STATUSES.map((status) => {
                const group = visible.filter((c) => c.status === status.id);
                return (
                  <StatusSection
                    key={status.id}
                    title={status.label}
                    hint={status.hint}
                    status={status.id}
                    chats={group}
                    empty={`Nothing ${status.label.toLowerCase()}.`}
                    onAdd={() => openCreate(status.id)}
                    onStatus={setStatus}
                    onEdit={openEdit}
                    onArchive={archiveChat}
                    archiveLabel="Archive"
                    onRemove={removeChat}
                  />
                );
              })}
            </div>
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

function FilterButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition",
        active
          ? "bg-[#ecece7] text-[#1a1a1a]"
          : "text-[#5c5c57] hover:bg-[#f0f0eb] hover:text-[#1a1a1a]",
      )}
    >
      <span>{label}</span>
      {typeof count === "number" ? (
        <span className="font-mono text-xs text-[#8a8a84]">{count}</span>
      ) : null}
    </button>
  );
}

function StatusSection({
  title,
  hint,
  status,
  chats,
  empty,
  onAdd,
  onStatus,
  onEdit,
  onArchive,
  archiveLabel,
  onRemove,
}: {
  title: string;
  hint: string;
  status?: Status;
  chats: TrackedChat[];
  empty: string;
  onAdd?: () => void;
  onStatus: (id: string, status: Status) => void;
  onEdit: (chat: TrackedChat) => void;
  onArchive: (id: string) => void;
  archiveLabel: string;
  onRemove: (id: string) => void;
}) {
  return (
    <section className="animate-in fade-in-0 duration-300">
      <div className="mb-2 flex items-center justify-between gap-3 border-b border-[#e4e4e1] pb-2">
        <div className="flex items-center gap-2">
          {status ? (
            <span
              className={cn("size-2.5 rounded-full", STATUS_DOT[status])}
              aria-hidden
            />
          ) : null}
          <h2 className="text-sm font-medium tracking-tight">{title}</h2>
          <span className="font-mono text-xs text-[#8a8a84]">{chats.length}</span>
          <span className="hidden text-xs text-[#8a8a84] sm:inline">{hint}</span>
        </div>
        {onAdd ? (
          <button
            type="button"
            onClick={onAdd}
            className="text-xs text-[#6b6b66] transition hover:text-[#1a1a1a]"
          >
            + Add
          </button>
        ) : null}
      </div>

      {chats.length === 0 ? (
        <p className="px-1 py-4 text-sm text-[#8a8a84]">{empty}</p>
      ) : (
        <ul className="divide-y divide-[#ecece7] overflow-hidden rounded-xl border border-[#e4e4e1] bg-white/70">
          {chats.map((chat) => (
            <ChatRow
              key={chat.id}
              chat={chat}
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
  onStatus,
  onEdit,
  onArchive,
  archiveLabel,
  onRemove,
}: {
  chat: TrackedChat;
  onStatus: (id: string, status: Status) => void;
  onEdit: (chat: TrackedChat) => void;
  onArchive: (id: string) => void;
  archiveLabel: string;
  onRemove: (id: string) => void;
}) {
  const toolLabel = TOOLS.find((t) => t.id === chat.tool)?.label ?? chat.tool;
  const kindLabel = KINDS.find((k) => k.id === chat.kind)?.label ?? chat.kind;

  return (
    <li className="group grid gap-3 px-3 py-3 transition hover:bg-[#fafaf8] sm:grid-cols-[1fr_auto] sm:items-center sm:gap-4 sm:px-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium tracking-tight">
            {chat.title}
          </p>
          <span className="rounded-md bg-[#f0f0eb] px-1.5 py-0.5 text-[11px] text-[#5c5c57]">
            {toolLabel}
          </span>
          <span className="rounded-md bg-[#f0f0eb] px-1.5 py-0.5 text-[11px] text-[#5c5c57]">
            {kindLabel}
          </span>
        </div>
        {chat.note ? (
          <p className="mt-1 line-clamp-2 text-sm text-[#6b6b66]">{chat.note}</p>
        ) : null}
        <p
          className="mt-1 font-mono text-[11px] text-[#9a9a94]"
          title={`${formatExact(chat.updatedAt)} IST`}
        >
          Updated {formatRelative(chat.updatedAt)} · IST
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <select
          aria-label={`Status for ${chat.title}`}
          className="h-8 rounded-md border border-[#e4e4e1] bg-white px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-[#cfcfc8]"
          value={chat.status}
          onChange={(e) => onStatus(chat.id, e.target.value as Status)}
        >
          {STATUSES.map((status) => (
            <option key={status.id} value={status.id}>
              {status.label}
            </option>
          ))}
        </select>
        {chat.link ? (
          <a
            href={chat.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex size-8 items-center justify-center rounded-md border border-[#e4e4e1] text-[#5c5c57] transition hover:bg-[#f0f0eb]"
            aria-label="Open link"
          >
            <ExternalLink className="size-3.5" />
          </a>
        ) : null}
        <button
          type="button"
          onClick={() => onEdit(chat)}
          className="inline-flex size-8 items-center justify-center rounded-md border border-[#e4e4e1] text-[#5c5c57] transition hover:bg-[#f0f0eb]"
          aria-label="Edit"
        >
          <Pencil className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onArchive(chat.id)}
          className="inline-flex size-8 items-center justify-center rounded-md border border-[#e4e4e1] text-[#5c5c57] transition hover:bg-[#f0f0eb]"
          aria-label={archiveLabel}
          title={archiveLabel}
        >
          <Archive className="size-3.5" />
        </button>
        {chat.archived ? (
          <button
            type="button"
            onClick={() => onRemove(chat.id)}
            className="h-8 rounded-md px-2 text-xs text-[#a14a3a] transition hover:bg-[#f8ece9]"
          >
            Delete
          </button>
        ) : null}
      </div>
    </li>
  );
}
