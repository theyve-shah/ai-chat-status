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
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  connections: ConnectionsState;
  onChange: (tool: Tool, patch: Partial<ToolConnection>) => void;
};

export function ConnectPanel({ connections, onChange }: Props) {
  const connectedCount = TOOLS.filter((t) => connections[t.id].connected).length;

  return (
    <div className="mx-auto max-w-2xl animate-in fade-in-0 duration-300">
      <header className="mb-6">
        <h1 className="text-3xl font-medium tracking-tight text-[#111]">
          Connect
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#6b7280]">
          Desk does not sync chats. Connecting wires{" "}
          <span className="text-[#374151]">Open</span> to each product’s real
          desktop deep links or website — steps below match official docs.
        </p>
        <p className="mt-2 text-xs text-[#9ca3af]">
          {connectedCount}/3 ready
        </p>
      </header>

      <div className="space-y-4">
        {TOOLS.map((tool) => (
          <ToolConnectCard
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

function ToolConnectCard({
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
              {connection.connected ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-[#0f7a4d]">
                  <Check className="size-3" />
                  {connection.preferred === "web" ? "Web" : "Desktop"}
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-[#9ca3af]">
              {guide.blurb}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <a
            href={guide.installUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-1 rounded-full bg-white px-2.5 text-xs text-[#374151] ring-1 ring-[#e5e7eb] transition hover:bg-[#f9fafb]"
          >
            {guide.installLabel}
            <ArrowUpRight className="size-3.5" />
          </a>
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
      </div>

      <ol className="mt-4 space-y-2 border-t border-[#f0f0f0] pt-4">
        {guide.steps.map((step, index) => (
          <li
            key={step}
            className="flex gap-2.5 text-xs leading-relaxed text-[#4b5563]"
          >
            <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-[#111] text-[10px] font-medium text-white">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      <div className="mt-3 rounded-xl bg-[#f8f8f8] px-3 py-2.5">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#c0c4cc]">
          Paste into Desk when adding a chat
        </p>
        <ul className="mt-1.5 space-y-1">
          {guide.linkExamples.map((example) => (
            <li key={example}>
              <code className="break-all text-[11px] text-[#6b7280]">
                {example}
              </code>
            </li>
          ))}
        </ul>
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
        {connection.connected ? (
          <button
            type="button"
            onClick={() => onChange({ connected: false })}
            className="text-[11px] text-[#9ca3af] transition hover:text-[#111]"
          >
            Disconnect
          </button>
        ) : null}
        {tested ? (
          <span className="text-[11px] text-[#0f7a4d]">
            Marked connected after test
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-[#9ca3af]">
        {guide.chatLinkHint}
      </p>
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
