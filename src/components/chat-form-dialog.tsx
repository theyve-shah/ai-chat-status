"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TOOL_GUIDES } from "@/lib/tool-guides";
import {
  KINDS,
  STATUSES,
  TOOLS,
  emptyDraft,
  type ChatDraft,
  type Kind,
  type Status,
  type Tool,
  type TrackedChat,
} from "@/lib/types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: TrackedChat | null;
  defaultStatus?: Status;
  onSubmit: (draft: ChatDraft) => void;
};

const fieldClass =
  "h-9 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40";

export function ChatFormDialog({
  open,
  onOpenChange,
  initial,
  defaultStatus = "working",
  onSubmit,
}: Props) {
  const [draft, setDraft] = useState<ChatDraft>(
    emptyDraft({ status: defaultStatus }),
  );

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setDraft({
        title: initial.title,
        tool: initial.tool,
        kind: initial.kind,
        status: initial.status,
        note: initial.note,
        link: initial.link,
      });
      return;
    }
    setDraft(emptyDraft({ status: defaultStatus }));
  }, [open, initial, defaultStatus]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!draft.title.trim()) return;
    onSubmit(draft);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-0 bg-white shadow-xl ring-1 ring-[#ececec] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium tracking-tight">
            {initial ? "Edit chat" : "Add chat"}
          </DialogTitle>
          <DialogDescription>
            Paste the chat / agent URL from that product so Open can jump
            straight there.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="What is this chat about?"
              autoFocus
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="tool">Tool</Label>
              <select
                id="tool"
                className={fieldClass}
                value={draft.tool}
                onChange={(e) =>
                  setDraft({ ...draft, tool: e.target.value as Tool })
                }
              >
                {TOOLS.map((tool) => (
                  <option key={tool.id} value={tool.id}>
                    {tool.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="kind">Type</Label>
              <select
                id="kind"
                className={fieldClass}
                value={draft.kind}
                onChange={(e) =>
                  setDraft({ ...draft, kind: e.target.value as Kind })
                }
              >
                {KINDS.map((kind) => (
                  <option key={kind.id} value={kind.id}>
                    {kind.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              className={fieldClass}
              value={draft.status}
              onChange={(e) =>
                setDraft({ ...draft, status: e.target.value as Status })
              }
            >
              {STATUSES.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              value={draft.note}
              onChange={(e) => setDraft({ ...draft, note: e.target.value })}
              placeholder="What should you remember next check-in?"
              rows={3}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="link">Chat / agent link</Label>
            <Input
              id="link"
              value={draft.link}
              onChange={(e) => setDraft({ ...draft, link: e.target.value })}
              placeholder={TOOL_GUIDES[draft.tool].linkExamples[0]}
            />
            <p className="text-[11px] leading-relaxed text-[#9ca3af]">
              {TOOL_GUIDES[draft.tool].chatLinkHint}
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
