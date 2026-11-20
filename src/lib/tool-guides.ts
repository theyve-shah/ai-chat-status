import type { Tool } from "@/lib/types";

export type ToolGuide = {
  id: Tool;
  label: string;
  blurb: string;
  installLabel: string;
  installUrl: string;
  docsLabel: string;
  docsUrl: string;
  appName: string;
  /** Documented deep link used for “Test desktop app”. */
  testAppHref: string;
  webUrl: string;
  webLabel: string;
  steps: string[];
  linkExamples: string[];
  chatLinkHint: string;
};

/**
 * Steps and deep links from official docs:
 * - Claude: https://support.claude.com/en/articles/14729294-open-claude-desktop-with-a-link
 * - ChatGPT / Codex: https://learn.chatgpt.com/docs/reference/commands#deep-links
 * - Cursor: https://cursor.com/docs/reference/deeplinks
 *   + cloud agents: https://cursor.com/agents/<bcId>
 */
export const TOOL_GUIDES: Record<Tool, ToolGuide> = {
  claude: {
    id: "claude",
    label: "Claude",
    blurb:
      "Claude Desktop registers the claude:// scheme for chat, Code, and Cowork.",
    installLabel: "Download Claude Desktop",
    installUrl: "https://claude.ai/download",
    docsLabel: "Claude deep-link docs",
    docsUrl:
      "https://support.claude.com/en/articles/14729294-open-claude-desktop-with-a-link",
    appName: "Claude Desktop",
    testAppHref: "claude://claude.ai/new?q=Hello%20from%20Desk",
    webUrl: "https://claude.ai",
    webLabel: "claude.ai",
    steps: [
      "Install Claude Desktop from claude.ai/download (Mac, Windows, or Linux).",
      "Open Claude once and sign in so the claude:// handler is registered.",
      "In Desk, tap Test desktop — allow the browser to open Claude. You should land on a new chat with “Hello from Desk” prefilled.",
      "When tracking a chat: copy the URL from claude.ai (…/chat/<uuid>) or paste a deep link like claude://claude.ai/chat/<uuid>.",
      "For Claude Code sessions use claude://code/new (optional ?q=…&folder=/absolute/path).",
    ],
    linkExamples: [
      "https://claude.ai/chat/<conversation-id>",
      "claude://claude.ai/chat/<conversation-id>",
      "claude://code/new?q=…&folder=/Users/you/repo",
    ],
    chatLinkHint:
      "Paste a claude.ai/chat/… URL or claude://claude.ai/chat/… deep link. Desk converts https chat URLs to claude:// when you prefer the desktop app.",
  },
  codex: {
    id: "codex",
    label: "ChatGPT / Codex",
    blurb:
      "The ChatGPT desktop app opens Codex threads with the codex:// scheme (⌘⌥L copies a deep link).",
    installLabel: "Download ChatGPT desktop",
    installUrl: "https://openai.com/chatgpt/download/",
    docsLabel: "ChatGPT deep-link docs",
    docsUrl: "https://learn.chatgpt.com/docs/reference/commands#deep-links",
    appName: "ChatGPT desktop",
    testAppHref: "codex://threads/new",
    webUrl: "https://chatgpt.com",
    webLabel: "chatgpt.com",
    steps: [
      "Install the ChatGPT desktop app from openai.com/chatgpt/download (this is the app that hosts Codex).",
      "Open the app, sign in, and open Codex (⌃3) at least once.",
      "In Desk, tap Test desktop — allow the browser to open ChatGPT. You should get a new local thread (codex://threads/new).",
      "In a thread, press ⌘⌥L (Copy chat deep link) to copy codex://threads/<thread-id>, then paste that into Desk when you Add a chat.",
      "Web threads also work: paste https://chatgpt.com/c/<id> or a share link and prefer Web on this card.",
    ],
    linkExamples: [
      "codex://threads/<thread-id>",
      "codex://threads/new",
      "https://chatgpt.com/c/<id>",
    ],
    chatLinkHint:
      "Best: paste the deep link from ⌘⌥L (codex://threads/…). Web chatgpt.com/c/… links open in the browser when you prefer Web.",
  },
  cursor: {
    id: "cursor",
    label: "Cursor",
    blurb:
      "Cloud agents live at cursor.com/agents/<id>. Desktop also supports cursor:// prompt / background-agent deep links.",
    installLabel: "Download Cursor",
    installUrl: "https://cursor.com/download",
    docsLabel: "Cursor deeplink docs",
    docsUrl: "https://cursor.com/docs/reference/deeplinks",
    appName: "Cursor",
    testAppHref:
      "cursor://anysphere.cursor-deeplink/prompt?text=Hello%20from%20Desk",
    webUrl: "https://cursor.com/agents",
    webLabel: "cursor.com/agents",
    steps: [
      "Install Cursor from cursor.com/download and sign in.",
      "For cloud agents: open cursor.com/agents in the browser (or Agents in the app).",
      "In Desk, tap Test desktop — Cursor should open with “Hello from Desk” prefilled in chat (you still confirm before send).",
      "When tracking a cloud agent, copy the URL from the address bar: https://cursor.com/agents/bc-… and paste it into Desk.",
      "Desk can also open desktop form: cursor://anysphere.cursor-deeplink/background-agent?bcId=bc-… (same agent, permission-gated).",
    ],
    linkExamples: [
      "https://cursor.com/agents/bc-…",
      "cursor://anysphere.cursor-deeplink/background-agent?bcId=bc-…",
      "cursor://anysphere.cursor-deeplink/prompt?text=…",
    ],
    chatLinkHint:
      "Paste https://cursor.com/agents/bc-… from the agents page. Desk maps that to the desktop background-agent deep link when you prefer the app.",
  },
};
