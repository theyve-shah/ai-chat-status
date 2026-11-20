import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Tool } from "@/lib/types";

function ClaudeLogo({ className }: { className?: string }) {
  // Anthropic-style starburst
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M12 2.2 13.1 9l6.7-2.1-4.6 5.1 5.1 4.6-6.9-1.4L12 21.8l-1.4-6.6-6.9 1.4 5.1-4.6L4.2 6.9 10.9 9 12 2.2Z"
      />
    </svg>
  );
}

function CodexLogo({ className }: { className?: string }) {
  // OpenAI-style blossom
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M22.28 9.82a5.98 5.98 0 0 0-5.15-5.1 6.02 6.02 0 0 0-7.5-3.03A6.01 6.01 0 0 0 4.1 5.1 5.98 5.98 0 0 0 .72 9.82a6.02 6.02 0 0 0 1.98 6.35 5.99 5.99 0 0 0 2.1 5.53 6.02 6.02 0 0 0 7.2.2 5.99 5.99 0 0 0 7.2-.2 6.01 6.01 0 0 0 2.1-5.53 6.02 6.02 0 0 0 1.98-6.35ZM12 16.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Z"
      />
    </svg>
  );
}

function CursorLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M4.8 3.2c-.6-.3-1.3.3-1.1 1l4.9 14.8c.3.8 1.4.7 1.6-.1l2-5.7 5.7-2c.8-.3.9-1.3.1-1.6L4.8 3.2Z"
      />
    </svg>
  );
}

const MARK: Record<
  Tool,
  {
    Logo: (props: { className?: string }) => ReactNode;
    className: string;
    title: string;
  }
> = {
  claude: {
    Logo: ClaudeLogo,
    className: "bg-[#f3ebe3] text-[#d97757]",
    title: "Claude",
  },
  codex: {
    Logo: CodexLogo,
    className: "bg-[#ecfdf3] text-[#10a37f]",
    title: "Codex",
  },
  cursor: {
    Logo: CursorLogo,
    className: "bg-[#111] text-white",
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
  const Logo = mark.Logo;
  return (
    <span
      aria-label={mark.title}
      className={cn(
        "inline-flex items-center justify-center rounded-full",
        mark.className,
        size === "sm" ? "size-5" : "size-7",
      )}
    >
      <Logo className={size === "sm" ? "size-3" : "size-3.5"} />
    </span>
  );
}
