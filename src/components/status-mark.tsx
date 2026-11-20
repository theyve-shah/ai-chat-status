"use client";

import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUSES, type Status } from "@/lib/types";

const ORDER: Status[] = ["needs_approval", "working", "done"];

const STYLE: Record<
  Status,
  { wrap: string; icon: string; label: string }
> = {
  needs_approval: {
    wrap: "bg-[#fff4e5] text-[#c26a00]",
    icon: "text-[#c26a00]",
    label: "Needs approval",
  },
  working: {
    wrap: "bg-[#eaf1ff] text-[#2f5bdb]",
    icon: "text-[#2f5bdb]",
    label: "Working",
  },
  done: {
    wrap: "bg-[#e8f6ef] text-[#0f7a4d]",
    icon: "text-[#0f7a4d]",
    label: "Done",
  },
};

export function StatusMark({
  status,
  onChange,
  size = "md",
}: {
  status: Status;
  onChange?: (next: Status) => void;
  size?: "sm" | "md";
}) {
  const style = STYLE[status];
  const meta = STATUSES.find((s) => s.id === status);
  const box = size === "sm" ? "size-5" : "size-7";

  function cycle() {
    if (!onChange) return;
    const idx = ORDER.indexOf(status);
    onChange(ORDER[(idx + 1) % ORDER.length]);
  }

  const isWorking = status === "working";
  const dot = size === "sm" ? "size-1.5" : "size-2";

  return (
    <button
      type="button"
      onClick={cycle}
      disabled={!onChange}
      aria-label={
        onChange
          ? `Status: ${meta?.label ?? style.label}. Click to cycle.`
          : `Status: ${meta?.label ?? style.label}`
      }
      className={cn(
        "inline-flex items-center justify-center rounded-full transition",
        box,
        isWorking ? "bg-transparent" : style.wrap,
        onChange ? "hover:scale-105 active:scale-95" : "cursor-default",
      )}
    >
      {isWorking ? (
        <span className={cn("relative inline-flex", dot)}>
          <span className="absolute inset-0 animate-ping rounded-full bg-[#2f5bdb]/50" />
          <span
            className={cn(
              "relative rounded-full bg-[#2f5bdb]",
              dot,
            )}
          />
        </span>
      ) : status === "needs_approval" ? (
        <Circle className={cn(size === "sm" ? "size-2.5" : "size-3", style.icon)} />
      ) : (
        <Check className={cn(size === "sm" ? "size-2.5" : "size-3", style.icon)} />
      )}
    </button>
  );
}
