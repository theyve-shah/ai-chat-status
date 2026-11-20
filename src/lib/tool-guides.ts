import type { Tool } from "@/lib/types";

export type ToolGuide = {
  id: Tool;
  label: string;
  blurb: string;
  installLabel: string;
  installUrl: string;
  appName: string;
  scheme: string;
  webUrl: string;
  steps: string[];
  chatLinkHint: string;
};

export const TOOL_GUIDES: Record<Tool, ToolGuide> = {
  claude: {
    id: "claude",
    label: "Claude",
    blurb: "Claude desktop app on Mac (covers Claude chat + Claude Code sessions you track by hand).",
    installLabel: "Get Claude for Mac",
    installUrl: "https://claude.ai/download",
    appName: "Claude",
    scheme: "claude://",
    webUrl: "https://claude.ai",
    steps: [
      "Install Claude for Mac from claude.ai/download.",
      "Tap Connect on this card, keep Mac app selected.",
      "Hit Test Mac app — allow the browser to open Claude.",
      "When you add a Desk chat, paste the Claude chat URL if you have one.",
    ],
    chatLinkHint: "Paste a claude.ai chat URL, or leave blank to just open the Claude app.",
  },
  codex: {
    id: "codex",
    label: "Codex",
    blurb: "Codex runs through ChatGPT — use the ChatGPT Mac app (or chatgpt.com) to jump back in.",
    installLabel: "Get ChatGPT for Mac",
    installUrl: "https://openai.com/chatgpt/download/",
    appName: "ChatGPT",
    scheme: "chatgpt://",
    webUrl: "https://chatgpt.com",
    steps: [
      "Install ChatGPT for Mac (Codex lives there / on the web).",
      "Tap Connect, prefer Mac app unless you only use the browser.",
      "Test Mac app — confirm the browser may open ChatGPT.",
      "Paste a chatgpt.com / Codex thread URL on each Desk row when you have one.",
    ],
    chatLinkHint: "Paste a ChatGPT or Codex thread URL when you can.",
  },
  cursor: {
    id: "cursor",
    label: "Cursor",
    blurb: "Cursor desktop app for Agent / Chat sessions you are tracking on Desk.",
    installLabel: "Get Cursor",
    installUrl: "https://cursor.com/download",
    appName: "Cursor",
    scheme: "cursor://",
    webUrl: "https://cursor.com",
    steps: [
      "Install Cursor from cursor.com/download.",
      "Tap Connect and keep Mac app selected.",
      "Test Mac app — allow opening Cursor from the browser.",
      "Paste a cursor.com/agents link or leave blank to open the Cursor app.",
    ],
    chatLinkHint: "Paste a Cursor agent / chat URL when you have one.",
  },
};
