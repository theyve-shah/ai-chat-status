"use client";

import { useState } from "react";
import { ToolMark } from "@/components/tool-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Check,
  ChevronDown,
  Globe,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  connections: ConnectionsState;
  onChange: (tool: Tool, patch: Partial<ToolConnection>) => void;
};

export function ConnectPanel({ connections, onChange }: Props) {
  const connectedCount = TOOLS.filter((t) => connections[t.id].connected).length;

  function connectAllWeb() {
    for (const tool of TOOLS) {
      onChange(tool.id, { connected: true, preferred: "web" });
    }
  }

  return (
    <div className="mx-auto max-w-2xl animate-in fade-in-0 duration-300">
      <header className="mb-6">
        <h1 className="text-3xl font-medium tracking-tight text-[#111]">
          Connect
        </h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#6b7280]">
          Desk can’t pull chats from Claude / ChatGPT / Cursor (no APIs).
          Connecting only sets where <span className="text-[#374151]">Open</span>{" "}
          goes — web is the easiest path.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={connectAllWeb}
          className="h-9 gap-1.5 rounded-full px-4"
        >
          <Globe className="size-3.5" />
          Use web for all (easiest)
        </Button>
        <p className="text-xs text-[#9ca3af]">
          {connectedCount}/3 ready · tweak any tool below
        </p>
      </div>

      <div className="space-y-3">
        {TOOLS.map((tool) => (
          <ToolConnectCard
            key={tool.id}
            tool={tool.id}
            connection={connections[tool.id]}
            onChange={(patch) => onChange(tool.id, patch)}
          />
        ))}
      </div>

      <p className="mt-6 text-xs leading-relaxed text-[#9ca3af]">
        When you add a chat, paste its URL for a deep link. Otherwise Open just
        launches the app or site you chose here.
      </p>
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
  const [advanced, setAdvanced] = useState(false);

  function useWeb() {
    onChange({ connected: true, preferred: "web" });
  }

  function useMacApp() {
    onChange({ connected: true, preferred: "app" });
    openHref(connection.appScheme || guide.scheme);
  }

  function disconnect() {
    onChange({ connected: false });
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <ToolMark tool={tool} size="md" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-[#111]">{guide.label}</p>
              {connection.connected ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-[#0f7a4d]">
                  <Check className="size-3" />
                  {connection.preferred === "web" ? "Web" : "Mac app"}
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-xs text-[#9ca3af]">{guide.blurb}</p>
          </div>
        </div>

        <a
          href={guide.installUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-xs text-[#6b7280] transition hover:bg-white hover:text-[#111]"
        >
          {guide.installLabel}
          <ArrowUpRight className="size-3.5" />
        </a>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={useWeb}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition",
            connection.connected && connection.preferred === "web"
              ? "bg-[#111] text-white"
              : "bg-white text-[#374151] ring-1 ring-[#e5e7eb] hover:bg-[#f9fafb]",
          )}
        >
          <Globe className="size-3.5" />
          Use web
        </button>
        <button
          type="button"
          onClick={useMacApp}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition",
            connection.connected && connection.preferred === "app"
              ? "bg-[#111] text-white"
              : "bg-white text-[#374151] ring-1 ring-[#e5e7eb] hover:bg-[#f9fafb]",
          )}
        >
          <AppWindow className="size-3.5" />
          Open Mac app
        </button>
        {connection.connected ? (
          <button
            type="button"
            onClick={disconnect}
            className="inline-flex h-8 items-center rounded-full px-3 text-xs text-[#9ca3af] transition hover:text-[#111]"
          >
            Disconnect
          </button>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => setAdvanced((v) => !v)}
        className="mt-3 inline-flex items-center gap-1 text-[11px] text-[#9ca3af] transition hover:text-[#6b7280]"
      >
        Advanced
        <ChevronDown
          className={cn("size-3.5 transition", advanced && "rotate-180")}
        />
      </button>

      {advanced ? (
        <div className="mt-3 grid gap-3 border-t border-[#f0f0f0] pt-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label
                htmlFor={`${tool}-scheme`}
                className="text-xs text-[#6b7280]"
              >
                Mac app scheme
              </Label>
              <Input
                id={`${tool}-scheme`}
                value={connection.appScheme}
                onChange={(e) => onChange({ appScheme: e.target.value })}
                placeholder={guide.scheme}
                className="h-9 border-0 bg-white shadow-none ring-1 ring-[#e5e7eb]"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`${tool}-web`} className="text-xs text-[#6b7280]">
                Web URL
              </Label>
              <Input
                id={`${tool}-web`}
                value={connection.webUrl}
                onChange={(e) => onChange({ webUrl: e.target.value })}
                placeholder={guide.webUrl}
                className="h-9 border-0 bg-white shadow-none ring-1 ring-[#e5e7eb]"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-8 gap-1.5 border-0 bg-white shadow-none ring-1 ring-[#e5e7eb]"
              onClick={() => openHref(connection.appScheme || guide.scheme)}
            >
              <AppWindow className="size-3.5" />
              Test Mac app
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-8 gap-1.5 border-0 bg-white shadow-none ring-1 ring-[#e5e7eb]"
              onClick={() =>
                window.open(
                  connection.webUrl || guide.webUrl,
                  "_blank",
                  "noopener",
                )
              }
            >
              <Link2 className="size-3.5" />
              Test web
            </Button>
          </div>
          <p className="text-[11px] text-[#9ca3af]">{guide.chatLinkHint}</p>
        </div>
      ) : null}
    </section>
  );
}
