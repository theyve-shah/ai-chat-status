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
import { TOOLS, type Tool } from "@/lib/types";
import { AppWindow, Check, Link2, MonitorSmartphone } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  connections: ConnectionsState;
  onChange: (tool: Tool, patch: Partial<ToolConnection>) => void;
};

export function ConnectPanel({ connections, onChange }: Props) {
  return (
    <div className="mx-auto max-w-3xl animate-in fade-in-0 duration-300">
      <header className="mb-8">
        <h1 className="text-3xl font-medium tracking-tight text-[#111]">
          Connect
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#6b7280]">
          Point Desk at your Mac apps so Open launches Claude, ChatGPT/Codex, or
          Cursor from the browser. Turn a tool on, pick App vs Web, then test.
        </p>
      </header>

      <div className="space-y-4">
        {TOOLS.map((tool) => {
          const conn = connections[tool.id];
          return (
            <ToolConnectCard
              key={tool.id}
              tool={tool.id}
              label={tool.label}
              connection={conn}
              onChange={(patch) => onChange(tool.id, patch)}
            />
          );
        })}
      </div>

      <p className="mt-8 text-xs leading-relaxed text-[#9ca3af]">
        Mac tip: the browser will ask to open the desktop app the first time.
        Default schemes — Claude <code className="text-[#6b7280]">claude://</code>
        , Codex/ChatGPT <code className="text-[#6b7280]">chatgpt://</code>,
        Cursor <code className="text-[#6b7280]">cursor://</code>. Override if
        your install uses something else.
      </p>
    </div>
  );
}

function ToolConnectCard({
  tool,
  label,
  connection,
  onChange,
}: {
  tool: Tool;
  label: string;
  connection: ToolConnection;
  onChange: (patch: Partial<ToolConnection>) => void;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl px-5 py-5 transition",
        connection.connected
          ? "bg-white/80 ring-1 ring-[#e5e7eb]/90"
          : "bg-transparent ring-1 ring-dashed ring-[#e5e7eb]",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ToolMark tool={tool} size="md" />
          <div>
            <p className="text-sm font-medium text-[#111]">{label}</p>
            <p className="text-xs text-[#9ca3af]">
              {connection.connected ? "Connected" : "Not connected"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange({ connected: !connection.connected })}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition",
            connection.connected
              ? "bg-[#111] text-white"
              : "bg-[#f3f4f6] text-[#374151] hover:bg-[#e5e7eb]",
          )}
        >
          {connection.connected ? (
            <>
              <Check className="size-3.5" />
              On
            </>
          ) : (
            "Connect"
          )}
        </button>
      </div>

      {connection.connected ? (
        <div className="mt-5 grid gap-4">
          <div className="flex flex-wrap gap-2">
            <PreferChip
              active={connection.preferred === "app"}
              onClick={() => onChange({ preferred: "app" as OpenPrefer })}
              icon={<AppWindow className="size-3.5" />}
              label="Mac app"
            />
            <PreferChip
              active={connection.preferred === "web"}
              onClick={() => onChange({ preferred: "web" as OpenPrefer })}
              icon={<MonitorSmartphone className="size-3.5" />}
              label="Web"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor={`${tool}-scheme`} className="text-xs text-[#6b7280]">
                App scheme
              </Label>
              <Input
                id={`${tool}-scheme`}
                value={connection.appScheme}
                onChange={(e) => onChange({ appScheme: e.target.value })}
                placeholder="cursor://"
                className="h-9 border-0 bg-[#f9fafb] shadow-none ring-1 ring-[#e5e7eb]"
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
                placeholder="https://"
                className="h-9 border-0 bg-[#f9fafb] shadow-none ring-1 ring-[#e5e7eb]"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-8 gap-1.5 border-0 bg-[#f3f4f6] shadow-none"
              onClick={() => openHref(connection.appScheme)}
            >
              <AppWindow className="size-3.5" />
              Test Mac app
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-8 gap-1.5 border-0 bg-[#f3f4f6] shadow-none"
              onClick={() => window.open(connection.webUrl, "_blank", "noopener")}
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
