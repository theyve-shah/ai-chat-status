"use client";

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
  Link2,
  MonitorSmartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  connections: ConnectionsState;
  onChange: (tool: Tool, patch: Partial<ToolConnection>) => void;
};

export function ConnectPanel({ connections, onChange }: Props) {
  const connectedCount = TOOLS.filter((t) => connections[t.id].connected).length;

  return (
    <div className="mx-auto max-w-3xl animate-in fade-in-0 duration-300">
      <header className="mb-8">
        <h1 className="text-3xl font-medium tracking-tight text-[#111]">
          Connect
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#6b7280]">
          Desk does not sync with APIs. Connecting means: install the Mac app,
          flip Connect on, then Open on a chat launches that app (or its web
          site). Paste a specific chat URL on a row when you want a deep jump.
        </p>
      </header>

      <ol className="mb-8 grid gap-3 sm:grid-cols-3">
        {[
          {
            n: "1",
            title: "Install",
            body: "Claude, ChatGPT (Codex), and Cursor Mac apps.",
          },
          {
            n: "2",
            title: "Connect",
            body: "Turn each tool on below and test Open once.",
          },
          {
            n: "3",
            title: "Link chats",
            body: "When adding a row, paste that chat’s URL if you have it.",
          },
        ].map((step) => (
          <li
            key={step.n}
            className="rounded-2xl bg-[#fafafa] px-4 py-3 ring-1 ring-[#efefef]"
          >
            <p className="text-[11px] font-medium tracking-[0.14em] text-[#c0c4cc]">
              STEP {step.n}
            </p>
            <p className="mt-1 text-sm font-medium text-[#111]">{step.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-[#6b7280]">
              {step.body}
            </p>
          </li>
        ))}
      </ol>

      <p className="mb-4 text-xs text-[#9ca3af]">
        {connectedCount}/3 tools connected
      </p>

      <div className="space-y-4">
        {TOOLS.map((tool) => {
          const conn = connections[tool.id];
          return (
            <ToolConnectCard
              key={tool.id}
              tool={tool.id}
              connection={conn}
              onChange={(patch) => onChange(tool.id, patch)}
            />
          );
        })}
      </div>

      <div className="mt-8 space-y-2 text-xs leading-relaxed text-[#9ca3af]">
        <p>
          First Open from Safari/Chrome will ask permission to launch the app —
          choose Allow / Open.
        </p>
        <p>
          Defaults: Claude <code className="text-[#6b7280]">claude://</code> ·
          Codex/ChatGPT <code className="text-[#6b7280]">chatgpt://</code> ·
          Cursor <code className="text-[#6b7280]">cursor://</code>. Change the
          scheme only if your install uses a different one.
        </p>
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

  return (
    <section
      className={cn(
        "rounded-2xl px-5 py-5 transition",
        connection.connected
          ? "bg-white ring-1 ring-[#e5e7eb]"
          : "bg-transparent ring-1 ring-dashed ring-[#e5e7eb]",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <ToolMark tool={tool} size="md" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#111]">{guide.label}</p>
            <p className="mt-1 text-xs leading-relaxed text-[#6b7280]">
              {guide.blurb}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={guide.installUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-1 rounded-full bg-[#f3f4f6] px-3 text-xs text-[#374151] transition hover:bg-[#e5e7eb]"
          >
            {guide.installLabel}
            <ArrowUpRight className="size-3.5" />
          </a>
          <button
            type="button"
            onClick={() => onChange({ connected: !connection.connected })}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition",
              connection.connected
                ? "bg-[#111] text-white"
                : "bg-[#111] text-white hover:bg-[#222]",
            )}
          >
            {connection.connected ? (
              <>
                <Check className="size-3.5" />
                Connected
              </>
            ) : (
              "Connect"
            )}
          </button>
        </div>
      </div>

      <ol className="mt-4 space-y-1.5 border-t border-[#f0f0f0] pt-4">
        {guide.steps.map((step, index) => (
          <li key={step} className="flex gap-2 text-xs leading-relaxed text-[#6b7280]">
            <span className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-[#f3f4f6] text-[10px] text-[#9ca3af]">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      {connection.connected ? (
        <div className="mt-5 grid gap-4">
          <div className="flex flex-wrap gap-2">
            <PreferChip
              active={connection.preferred === "app"}
              onClick={() => onChange({ preferred: "app" as OpenPrefer })}
              icon={<AppWindow className="size-3.5" />}
              label={`Open ${guide.appName} app`}
            />
            <PreferChip
              active={connection.preferred === "web"}
              onClick={() => onChange({ preferred: "web" as OpenPrefer })}
              icon={<MonitorSmartphone className="size-3.5" />}
              label="Open web"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor={`${tool}-scheme`} className="text-xs text-[#6b7280]">
                Mac app scheme
              </Label>
              <Input
                id={`${tool}-scheme`}
                value={connection.appScheme}
                onChange={(e) => onChange({ appScheme: e.target.value })}
                placeholder={guide.scheme}
                className="h-9 border-0 bg-[#f9fafb] shadow-none ring-1 ring-[#e5e7eb]"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`${tool}-web`} className="text-xs text-[#6b7280]">
                Web fallback
              </Label>
              <Input
                id={`${tool}-web`}
                value={connection.webUrl}
                onChange={(e) => onChange({ webUrl: e.target.value })}
                placeholder={guide.webUrl}
                className="h-9 border-0 bg-[#f9fafb] shadow-none ring-1 ring-[#e5e7eb]"
              />
            </div>
          </div>

          <p className="text-xs text-[#9ca3af]">{guide.chatLinkHint}</p>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-8 gap-1.5 border-0 bg-[#f3f4f6] shadow-none"
              onClick={() => openHref(connection.appScheme || guide.scheme)}
            >
              <AppWindow className="size-3.5" />
              Test Mac app
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-8 gap-1.5 border-0 bg-[#f3f4f6] shadow-none"
              onClick={() =>
                window.open(connection.webUrl || guide.webUrl, "_blank", "noopener")
              }
            >
              <Link2 className="size-3.5" />
              Test web
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function PreferChip({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs transition",
        active
          ? "bg-[#111] text-white"
          : "bg-[#f3f4f6] text-[#4b5563] hover:bg-[#e5e7eb]",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
