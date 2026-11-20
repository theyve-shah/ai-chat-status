# Desk

Plain check-in board for active chats across **Claude**, **Codex**, and **Cursor**.

Cursor cloud agents sync from the [Cloud Agents API](https://cursor.com/docs/cloud-agent/api/endpoints). Claude.ai and ChatGPT.com have **no consumer list-chats API** — Desk syncs what actually works: local Claude Code / Codex CLI session files, plus optional Enterprise Compliance APIs.

![License: MIT](https://img.shields.io/badge/license-MIT-blue)

## Features

- **Cursor auto-sync** via `DESK_CURSOR_API_KEY` (Sync now + 60s refresh when configured)
- **Claude Code / Codex import** — drop `.jsonl` sessions or run `scripts/desk-push.mjs`
- **Enterprise Compliance** (optional) for Claude.ai and ChatGPT workspace chat lists
- **Push import API** — `POST /api/sync/import` for Shortcuts / Raycast / local helpers
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

## What syncs (honest map)

| Tool | Consumer auto path | Enterprise API | What does **not** work |
| --- | --- | --- | --- |
| **Cursor** | Cloud Agents API (`DESK_CURSOR_API_KEY`) | — | — |
| **Claude** | Claude Code JSONL under `~/.claude/projects/` → Connect drop / `desk-push` | Compliance Access Key → `DESK_ANTHROPIC_COMPLIANCE_KEY` lists claude.ai chats | Anthropic Messages API does **not** list chat.ai history |
| **ChatGPT / Codex** | Codex CLI rollouts under `~/.codex/sessions/` → Connect drop / `desk-push` | Compliance key + workspace → `DESK_OPENAI_COMPLIANCE_KEY` + `DESK_OPENAI_WORKSPACE_ID` | OpenAI Conversations API has **no list**; Chat Completions list is only `store:true` API calls — not chatgpt.com |

## Claude Code + Codex (consumer setup)

1. Use the tools that write local transcripts:
   - Claude Code → `~/.claude/projects/<project>/<session>.jsonl`
   - Codex CLI → `~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl`
2. In Desk → **Connect** → drop those `.jsonl` files (or a `desk-import.json`).
3. Or from the repo:

```bash
node scripts/desk-push.mjs              # writes desk-import.json
node scripts/desk-push.mjs --post       # stages on the Desk server
```

After `--post`, open Connect → **Pull last push**.

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
| `DESK_ANTHROPIC_COMPLIANCE_KEY` | Claude Enterprise Compliance Access Key |
| `DESK_OPENAI_COMPLIANCE_KEY` | ChatGPT Enterprise Compliance key |
| `DESK_OPENAI_WORKSPACE_ID` | ChatGPT Enterprise workspace id |

Hosted Vercel cannot watch `~/.claude` / `~/.codex` on your laptop — use file drop, `desk-push` + Pull last push, or Enterprise APIs.

## API routes

| Route | Role |
| --- | --- |
| `POST /api/sync/cursor` | List Cursor cloud agents |
| `POST /api/sync/claude` | List Claude.ai chats (Enterprise Compliance) |
| `POST /api/sync/chatgpt` | List ChatGPT conversations (Enterprise Compliance) |
| `POST /api/sync/import` | Accept pushed `{ chats: [...] }`; stages for Pull last push |
| `GET /api/sync/import?pull=1` | Return last staged import for Connect |

## Contributing

This is a public project — PRs and issues are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

See [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)
