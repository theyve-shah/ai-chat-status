import { TOOL_GUIDES } from "@/lib/tool-guides";
import type { Tool, TrackedChat } from "@/lib/types";

export type OpenPrefer = "app" | "web";

export type ToolConnection = {
  connected: boolean;
  preferred: OpenPrefer;
  /** Unused for open resolution now — kept for saved prefs compatibility. */
  appScheme: string;
  webUrl: string;
};

export type ConnectionsState = Record<Tool, ToolConnection>;

export const CONNECTIONS_KEY = "desk.connections.v2";

export const DEFAULT_CONNECTIONS: ConnectionsState = {
  claude: {
    connected: false,
    preferred: "app",
    appScheme: TOOL_GUIDES.claude.testAppHref,
    webUrl: TOOL_GUIDES.claude.webUrl,
  },
  codex: {
    connected: false,
    preferred: "app",
    appScheme: TOOL_GUIDES.codex.testAppHref,
    webUrl: TOOL_GUIDES.codex.webUrl,
  },
  cursor: {
    connected: false,
    preferred: "app",
    appScheme: TOOL_GUIDES.cursor.testAppHref,
    webUrl: TOOL_GUIDES.cursor.webUrl,
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

/** Map a pasted https URL to a documented desktop deep link when possible. */
export function httpsToAppDeepLink(
  tool: Tool,
  link: string,
): string | null {
  const trimmed = link.trim();
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) return null;

  try {
    const url = new URL(trimmed);

    if (tool === "claude") {
      const host = url.hostname.replace(/^www\./, "");
      if (host !== "claude.ai") return null;
      const chat = url.pathname.match(/^\/chat\/([^/]+)/);
      if (chat) return `claude://claude.ai/chat/${chat[1]}`;
      const project = url.pathname.match(/^\/project\/([^/]+)/);
      if (project) return `claude://claude.ai/project/${project[1]}`;
      const code = url.pathname.match(/^\/code\/?(.*)/);
      if (code) return `claude://code/${code[1] || "new"}`;
      return "claude://claude.ai/new";
    }

    if (tool === "codex") {
      const host = url.hostname.replace(/^www\./, "");
      if (host === "chatgpt.com" || host === "chat.openai.com") {
        const thread = url.pathname.match(/^\/c\/([^/]+)/);
        if (thread) return `codex://threads/${thread[1]}`;
      }
      return null;
    }

    if (tool === "cursor") {
      const host = url.hostname.replace(/^www\./, "");
      if (host !== "cursor.com" && host !== "www.cursor.com") return null;
      const agent = url.pathname.match(/^\/agents\/(bc-[^/?#]+)/);
      if (agent) {
        return `cursor://anysphere.cursor-deeplink/background-agent?bcId=${agent[1]}`;
      }
      return null;
    }
  } catch {
    return null;
  }

  return null;
}

export function resolveOpenTargets(
  chat: Pick<TrackedChat, "tool" | "link">,
  connection: ToolConnection,
): OpenTargets {
  const guide = TOOL_GUIDES[chat.tool];
  const link = chat.link.trim();
  const isCustomScheme = Boolean(link) && !/^https?:\/\//i.test(link);
  const isHttp = /^https?:\/\//i.test(link);

  const mappedApp = isHttp ? httpsToAppDeepLink(chat.tool, link) : null;

  const appHref = isCustomScheme
    ? link
    : mappedApp || connection.appScheme || guide.testAppHref;

  const webHref = isHttp
    ? link
    : connection.webUrl || guide.webUrl;

  return {
    appHref,
    webHref,
    chatHref: link || null,
  };
}

export function openHref(href: string): void {
  if (!href) return;
  window.location.href = href;
}
