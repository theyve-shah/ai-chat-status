#!/usr/bin/env node
// Collect local Claude Code + Codex CLI sessions into a Desk import file.
//
// Consumer ChatGPT / Claude.ai have no list-chats API. What actually works:
//   - Claude Code → ~/.claude/projects/<project>/<session>.jsonl
//   - Codex CLI   → ~/.codex/sessions/<Y>/<M>/<D>/rollout-*.jsonl
//
// Usage:
//   node scripts/desk-push.mjs
//   node scripts/desk-push.mjs --out ~/Desktop/desk-import.json
//   node scripts/desk-push.mjs --post                 # POST to local Desk
//   node scripts/desk-push.mjs --post --url https://…
//   node scripts/desk-push.mjs --dry-run
//
// Then in Desk → Connect → drop the JSON / .jsonl, or Pull last push after --post.
//
// Env: CLAUDE_CONFIG_DIR, CODEX_HOME, DESK_URL, DESK_IMPORT_TOKEN

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const doPost = args.includes("--post");
const outIdx = args.indexOf("--out");
const urlIdx = args.indexOf("--url");
const outPath =
  (outIdx >= 0 && args[outIdx + 1]) ||
  path.join(process.cwd(), "desk-import.json");
const baseUrl =
  (urlIdx >= 0 && args[urlIdx + 1]) ||
  process.env.DESK_URL ||
  "http://127.0.0.1:3847";
const token = process.env.DESK_IMPORT_TOKEN?.trim() || "";

const claudeRoot = process.env.CLAUDE_CONFIG_DIR
  ? path.join(process.env.CLAUDE_CONFIG_DIR, "projects")
  : path.join(os.homedir(), ".claude", "projects");
const codexRoot = process.env.CODEX_HOME
  ? path.join(process.env.CODEX_HOME, "sessions")
  : path.join(os.homedir(), ".codex", "sessions");

function walkJsonl(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkJsonl(full, out);
    else if (entry.isFile() && entry.name.endsWith(".jsonl")) out.push(full);
  }
  return out;
}

function clip(text, max = 80) {
  const one = String(text).replace(/\s+/g, " ").trim();
  return one.length <= max ? one : `${one.slice(0, max - 1)}…`;
}

function parseClaude(file) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean);
  let summary = null;
  let customTitle = null;
  let firstUser = null;
  let sessionId = null;
  let cwd = null;
  let createdAt = null;
  let updatedAt = null;
  let hit = false;

  for (const line of lines) {
    let row;
    try {
      row = JSON.parse(line);
    } catch {
      continue;
    }
    const type = row.type;
    if (type === "user" || type === "assistant" || type === "summary") hit = true;
    if (row.sessionId) sessionId = row.sessionId;
    if (row.cwd) cwd = row.cwd;
    if (row.timestamp) {
      if (!createdAt) createdAt = row.timestamp;
      updatedAt = row.timestamp;
    }
    if (type === "summary" && row.summary) summary = row.summary;
    if (type === "custom-title" && row.title) customTitle = row.title;
    if (type === "user" && !firstUser) {
      const content = row.message?.content;
      const text =
        typeof content === "string"
          ? content
          : Array.isArray(content)
            ? content
                .filter((b) => b?.type === "text" && b.text)
                .map((b) => b.text)
                .join(" ")
            : "";
      if (text.trim() && !text.trim().startsWith("<")) firstUser = text.trim();
    }
  }
  if (!hit) return null;

  const base = path.basename(file, ".jsonl");
  const externalId = sessionId || base;
  const project = cwd ? path.basename(cwd) : null;
  return {
    externalId,
    title: clip(
      customTitle ||
        summary ||
        firstUser ||
        `Claude Code ${externalId.slice(0, 8)}`,
    ),
    tool: "claude",
    kind: "code",
    status: "working",
    note: [project && `Project: ${project}`, cwd, "desk-push Claude Code"]
      .filter(Boolean)
      .join(" · "),
    link: "",
    createdAt: createdAt || undefined,
    updatedAt: updatedAt || createdAt || undefined,
    source: "claude_code",
  };
}

function parseCodex(file) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean);
  let sessionId = null;
  let cwd = null;
  let firstUser = null;
  let createdAt = null;
  let updatedAt = null;
  let hasMeta = false;
  let nickname = null;

  for (const line of lines) {
    let row;
    try {
      row = JSON.parse(line);
    } catch {
      continue;
    }
    if (row.timestamp) {
      if (!createdAt) createdAt = row.timestamp;
      updatedAt = row.timestamp;
    }
    if (row.type === "session_meta") {
      hasMeta = true;
      const payload = row.payload || row;
      const meta = payload.meta || payload;
      sessionId = meta.id || meta.session_id || payload.id || sessionId;
      if (meta.cwd) cwd = meta.cwd;
      if (meta.agent_nickname) nickname = meta.agent_nickname;
    }
    if (
      row.type === "event_msg" &&
      row.payload?.type === "user_message" &&
      !firstUser
    ) {
      if (typeof row.payload.message === "string") {
        firstUser = row.payload.message;
      }
    }
  }

  const base = path.basename(file, ".jsonl");
  const m = base.match(
    /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i,
  );
  const externalId = sessionId || m?.[1] || base;
  if (!hasMeta && !m) return null;

  const project = cwd ? path.basename(cwd) : null;
  return {
    externalId,
    title: clip(nickname || firstUser || `Codex ${externalId.slice(0, 8)}`),
    tool: "codex",
    kind: "code",
    status: "working",
    note: [project && `Project: ${project}`, cwd, "desk-push Codex"]
      .filter(Boolean)
      .join(" · "),
    link: `codex://threads/${externalId}`,
    createdAt: createdAt || undefined,
    updatedAt: updatedAt || createdAt || undefined,
    source: "codex",
  };
}

const claudeFiles = walkJsonl(claudeRoot);
const codexFiles = walkJsonl(codexRoot);

const chats = [];
for (const file of claudeFiles) {
  try {
    const chat = parseClaude(file);
    if (chat) chats.push(chat);
  } catch (e) {
    console.warn("skip", file, e.message);
  }
}
for (const file of codexFiles) {
  try {
    const chat = parseCodex(file);
    if (chat) chats.push(chat);
  } catch (e) {
    console.warn("skip", file, e.message);
  }
}

console.log(
  `Claude Code: ${claudeFiles.length} file(s) under ${claudeRoot}`,
);
console.log(`Codex:       ${codexFiles.length} file(s) under ${codexRoot}`);
console.log(`Parsed:      ${chats.length} chat(s)`);

const payload = {
  source: "import",
  chats,
  generatedAt: new Date().toISOString(),
};

if (dryRun) {
  console.log(JSON.stringify({ ...payload, chats: chats.slice(0, 3) }, null, 2));
  process.exit(0);
}

fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
console.log(`Wrote ${outPath}`);

if (doPost) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/sync/import`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("POST failed:", res.status, data);
    process.exit(1);
  }
  console.log(
    `Posted ${data.count ?? chats.length} chat(s) → ${baseUrl}/api/sync/import`,
  );
  console.log("Open Desk → Connect → Pull last push");
} else {
  console.log("Open Desk → Connect → drop that file (or drop raw .jsonl sessions).");
  console.log("Or re-run with --post to stage for Pull last push.");
}
