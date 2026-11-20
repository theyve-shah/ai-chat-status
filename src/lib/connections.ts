import type { Tool, TrackedChat } from "@/lib/types";

export type OpenPrefer = "app" | "web";

export type ToolConnection = {
  connected: boolean;
  preferred: OpenPrefer;
  appScheme: string;
  webUrl: string;
};

export type ConnectionsState = Record<Tool, ToolConnection>;

export const CONNECTIONS_KEY = "desk.connections.v1";

export const DEFAULT_CONNECTIONS: ConnectionsState = {
  claude: {
    connected: false,
    preferred: "app",
    appScheme: "claude://",
    webUrl: "https://claude.ai",
  },
  codex: {
    connected: false,
    preferred: "app",
    appScheme: "chatgpt://",
    webUrl: "https://chatgpt.com",
  },
  cursor: {
    connected: false,
    preferred: "app",
    appScheme: "cursor://",
    webUrl: "https://cursor.com",
  },
};

export function loadConnections(): ConnectionsState {
  if (typeof window === "undefined") return structuredClone(DEFAULT_CONNECTIONS);
  try {
    const raw = window.localStorage.getItem(CONNECTIONS_KEY);
    if (!raw) return structuredClone(DEFAULT_CONNECTIONS);
    const parsed = JSON.parse(raw) as Partial<ConnectionsState>;
    return {
      claude: { ...DEFAULT_CONNECTIONS.claude, ...parsed.claude },
      codex: { ...DEFAULT_CONNECTIONS.codex, ...parsed.codex },
      cursor: { ...DEFAULT_CONNECTIONS.cursor, ...parsed.cursor },
    };
  } catch {
    return structuredClone(DEFAULT_CONNECTIONS);
  }
}

export function saveConnections(state: ConnectionsState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(state));
}

export type OpenTargets = {
  appHref: string;
  webHref: string;
  chatHref: string | null;
};

function normalizeScheme(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return trimmed;
  if (/^[a-z][a-z0-9+.-]*:$/i.test(trimmed)) return `${trimmed}//`;
  if (/^[a-z][a-z0-9+.-]*:\/?$/i.test(trimmed)) {
    return trimmed.endsWith("://") ? trimmed : `${trimmed.replace(/:?\/?$/, "")}://`;
  }
  return trimmed;
}

export function resolveOpenTargets(
  chat: Pick<TrackedChat, "tool" | "link">,
  connection: ToolConnection,
): OpenTargets {
  const appHref =
    normalizeScheme(connection.appScheme) ||
    DEFAULT_CONNECTIONS[chat.tool].appScheme;
  const link = chat.link.trim();
  const isCustomScheme = Boolean(link) && !/^https?:\/\//i.test(link);
  const isHttp = /^https?:\/\//i.test(link);

  return {
    appHref: isCustomScheme ? link : appHref,
    webHref: isHttp ? link : connection.webUrl || DEFAULT_CONNECTIONS[chat.tool].webUrl,
    chatHref: link || null,
  };
}

export function openHref(href: string): void {
  if (!href) return;
  window.location.href = href;
}
