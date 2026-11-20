"use client";

import { Check, Circle, LoaderCircle } from "lucide-react";
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
}: {
  status: Status;
  onChange?: (next: Status) => void;
}) {
  const style = STYLE[status];
  const meta = STATUSES.find((s) => s.id === status);

  function cycle() {
    if (!onChange) return;
    const idx = ORDER.indexOf(status);
    onChange(ORDER[(idx + 1) % ORDER.length]);
  }

  const Icon =
    status === "needs_approval"
      ? Circle
      : status === "working"
        ? LoaderCircle
        : Check;

  return (
    <button
      type="button"
      onClick={cycle}
      disabled={!onChange}
      title={`${meta?.label ?? style.label} — click to change`}
      aria-label={`Status: ${meta?.label ?? style.label}. Click to cycle.`}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-full transition",
        style.wrap,
        onChange ? "hover:scale-105 active:scale-95" : "cursor-default",
      )}
    >
      <Icon
        className={cn(
          "size-3.5",
          style.icon,
          status === "working" && "animate-spin [animation-duration:2.4s]",
        )}
      />
    </button>
  );
}

export function StatusLegend() {
  return (
    <div className="flex items-center gap-3">
      {ORDER.map((status) => (
        <div key={status} className="flex items-center gap-1.5">
          <StatusMark status={status} />
          <span className="sr-only">{STYLE[status].label}</span>
        </div>
      ))}
    </div>
  );
}
