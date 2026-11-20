import { cn } from "@/lib/utils";
import type { Tool } from "@/lib/types";

const MARK: Record<
  Tool,
  { letter: string; className: string; title: string }
> = {
  claude: {
    letter: "C",
    className: "bg-[#f3ebe3] text-[#8a5a2b]",
    title: "Claude",
  },
  codex: {
    letter: "X",
    className: "bg-[#e8f0ea] text-[#2f6b45]",
    title: "Codex",
  },
  cursor: {
    letter: "⌘",
    className: "bg-[#ececf1] text-[#2f2f38]",
    title: "Cursor",
  },
};

export function ToolMark({
  tool,
  size = "sm",
}: {
  tool: Tool;
  size?: "sm" | "md";
}) {
  const mark = MARK[tool];
  return (
    <span
      title={mark.title}
      aria-label={mark.title}
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium",
        mark.className,
        size === "sm" ? "size-6 text-[11px]" : "size-8 text-sm",
      )}
    >
      {mark.letter}
    </span>
  );
}
