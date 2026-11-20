# Desk

Plain check-in board for active chats across **Claude**, **Codex**, and **Cursor**.

Cursor cloud agents sync from the [Cloud Agents API](https://cursor.com/docs/cloud-agent/api/endpoints). For **Claude.ai** and **ChatGPT.com** on Pro, use the **Desk Sync** browser extension (automatic, stays in your browser login). Claude Code / Codex CLI file import and optional Enterprise Compliance APIs remain available.

![License: MIT](https://img.shields.io/badge/license-MIT-blue)

## Features

- **Cursor auto-sync** via `DESK_CURSOR_API_KEY` (Sync now + 60s refresh when configured)
- **Pro automatic Claude / ChatGPT sync** via the Desk Sync Chrome extension (`extension/`)
- **Claude Code / Codex import** — drop `.jsonl` sessions or run `scripts/desk-push.mjs`
- **Enterprise Compliance** (optional) for org workspace chat lists
- **Push import API** — `POST /api/sync/import` for the extension / Shortcuts / Raycast / local helpers
- Statuses as icons (click to cycle): needs approval · working · done · dormant
- Desktop deep links (`claude://`, `codex://`, `cursor://…`) or web URLs
- Optional password gate for hosted deploys

## Quick start

```bash
npm install
cp .env.example .env.local   # optional: add DESK_CURSOR_API_KEY
npm run dev
```

Open [http://127.0.0.1:3847](http://127.0.0.1:3847).

Chat + Connect prefs stay in your browser (`localStorage`). No database.

## Pro automatic sync (Claude.ai + ChatGPT.com)

No manual Add, no paste links, no cookies on the Desk server.

1. Open `chrome://extensions` → Developer mode → **Load unpacked** → select this repo’s `extension/` folder.
2. Extension options → set Desk URL to your Desk (e.g. `http://127.0.0.1:3847`) → optional `DESK_IMPORT_TOKEN`.
3. Stay logged into [claude.ai](https://claude.ai) and/or [chatgpt.com](https://chatgpt.com) in that browser.
4. Sync runs on a timer (and when you open those sites). Desk auto-pulls the import buffer onto the board while open.
5. See Connect → Claude / ChatGPT for the same steps in-app.

This uses unofficial private list endpoints from your **browser session** only. Experimental; may break when those sites change; not affiliated with Anthropic or OpenAI. Details: [`extension/README.md`](extension/README.md).

## What syncs (honest map)

| Tool | Pro / consumer auto path | Enterprise API | Notes |
| --- | --- | --- | --- |
| **Cursor** | Cloud Agents API (`DESK_CURSOR_API_KEY`) | — | Official |
| **Claude** | Desk Sync extension (claude.ai session in browser) · Claude Code JSONL secondary | Compliance Access Key → `DESK_ANTHROPIC_COMPLIANCE_KEY` | Messages API does **not** list chat.ai history |
| **ChatGPT / Codex** | Desk Sync extension (chatgpt.com session) · Codex CLI rollouts secondary | Compliance key + workspace | OpenAI Conversations API has **no list** for chatgpt.com threads |

## Claude Code + Codex (file import)

1. Use the tools that write local transcripts:
   - Claude Code → `~/.claude/projects/<project>/<session>.jsonl`
   - Codex CLI → `~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl`
2. In Desk → **Connect** → drop those `.jsonl` files (or a `desk-import.json`).
3. Or from the repo:

```bash
node scripts/desk-push.mjs              # writes desk-import.json
node scripts/desk-push.mjs --post       # stages on the Desk server
```

After `--post` (or an extension sync), Desk auto-pulls while open; Connect → **Pull last push** still works.

Optional: set `DESK_IMPORT_TOKEN` and send `Authorization: Bearer …` when posting to a hosted Desk.

## Enterprise Compliance (optional)

### Claude

1. Claude Enterprise org → enable Compliance API → create a Compliance Access Key with `read:compliance_user_data`.
2. Set `DESK_ANTHROPIC_COMPLIANCE_KEY`.
3. Connect → Claude → **Sync Enterprise**.

Docs: [List chats](https://platform.claude.com/docs/en/api/compliance/apps/chats/list)

### ChatGPT

1. ChatGPT Enterprise/Edu workspace → Compliance / Admin key with conversation read scope.
2. Set `DESK_OPENAI_COMPLIANCE_KEY` and `DESK_OPENAI_WORKSPACE_ID`.
3. Connect → ChatGPT → **Sync Enterprise**.

Endpoint: `GET https://api.chatgpt.com/v1/compliance/workspaces/{id}/conversations`

## Cursor sync

1. Create a user API key at [cursor.com/dashboard](https://cursor.com/dashboard?tab=integrations) → Integrations / API Keys.
2. Set `DESK_CURSOR_API_KEY` in `.env.local` (local) or your host’s secrets (deploy).
3. Open Desk → **Sync** (or Connect → **Sync now**).

## Hosted deploy

Set these environment variables (see `.env.example`). Never commit a real `.env`.

| Variable | Purpose |
| --- | --- |
| `DESK_PASSWORD` | Shared unlock password |
| `DESK_SESSION_SECRET` | Signs the session cookie (long random string) |
| `DESK_CURSOR_API_KEY` | Cursor user API key for agent sync |
| `DESK_IMPORT_TOKEN` | Optional bearer for `POST /api/sync/import` |
| `DESK_CORS_ORIGINS` | Optional extra allowed Origins for import CORS (comma-separated) |
| `DESK_ANTHROPIC_COMPLIANCE_KEY` | Claude Enterprise Compliance Access Key |
| `DESK_OPENAI_COMPLIANCE_KEY` | ChatGPT Enterprise Compliance key |
| `DESK_OPENAI_WORKSPACE_ID` | ChatGPT Enterprise workspace id |

Hosted Vercel cannot watch `~/.claude` / `~/.codex` on your laptop — use the extension, file drop, `desk-push` + auto-pull, or Enterprise APIs.

## API routes

| Route | Role |
| --- | --- |
| `POST /api/sync/cursor` | List Cursor cloud agents |
| `POST /api/sync/claude` | List Claude.ai chats (Enterprise Compliance) |
| `POST /api/sync/chatgpt` | List ChatGPT conversations (Enterprise Compliance) |
| `POST /api/sync/import` | Accept pushed `{ chats: [...], merge?: true }`; stages for auto-pull |
| `GET /api/sync/import?pull=1` | Return last staged import (Connect / board auto-pull) |
| `OPTIONS /api/sync/import` | CORS preflight for the browser extension |

## Contributing

This is a public project — PRs and issues are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

See [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)
