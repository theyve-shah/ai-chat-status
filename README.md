# Desk

Plain check-in board for active chats across **Claude**, **Codex**, and **Cursor**.

Cursor cloud agents sync from the [Cloud Agents API](https://cursor.com/docs/cloud-agent/api/endpoints). Claude and ChatGPT have no consumer list-chats API — add those manually. Built for quick looks every few hours, not constant babysitting.

![License: MIT](https://img.shields.io/badge/license-MIT-blue)

## Features

- **Cursor auto-sync** via `DESK_CURSOR_API_KEY` (Sync now + 60s refresh when configured)
- Statuses as icons (click to cycle): needs approval · working · done · dormant
- **Connect** screen: API sync for Cursor; deep-link Open prefs for Claude / ChatGPT
- Desktop deep links (`claude://`, `codex://`, `cursor://…`) or web URLs
- Per-chat Open button for the preferred desktop app or browser link
- Optional password gate for hosted deploys

## Quick start

```bash
npm install
cp .env.example .env.local   # optional: add DESK_CURSOR_API_KEY
npm run dev
```

Open [http://127.0.0.1:3847](http://127.0.0.1:3847).

Chat + Connect prefs stay in your browser (`localStorage`). No database.

## Cursor sync

1. Create a user API key at [cursor.com/dashboard](https://cursor.com/dashboard?tab=integrations) → Integrations / API Keys.
2. Set `DESK_CURSOR_API_KEY` in `.env.local` (local) or your host’s secrets (deploy).
3. Open Desk → **Sync** (or Connect → **Sync now**). Agents you start in Cursor appear on the board with live status.

Manual Claude / ChatGPT rows are preserved; synced Cursor rows upsert by agent id.

## How to connect tools

| Tool | Sync | Open |
| --- | --- | --- |
| Cursor | Cloud Agents API (`DESK_CURSOR_API_KEY`) | Web agents URL or desktop deep link |
| Claude | Manual add only (no consumer list API) | `claude://` / claude.ai |
| ChatGPT / Codex | Manual add only (no consumer list API) | `codex://` / chatgpt.com |

Docs: [Claude deep links](https://support.claude.com/en/articles/14729294-open-claude-desktop-with-a-link) · [ChatGPT deep links](https://learn.chatgpt.com/docs/reference/commands#deep-links) · [Cursor Cloud Agents API](https://cursor.com/docs/cloud-agent/api/endpoints) · [Cursor deeplinks](https://cursor.com/docs/reference/deeplinks)

## Hosted deploy

Set these environment variables (see `.env.example`). Never commit a real `.env`.

| Variable | Purpose |
| --- | --- |
| `DESK_PASSWORD` | Shared unlock password |
| `DESK_SESSION_SECRET` | Signs the session cookie (long random string) |
| `DESK_CURSOR_API_KEY` | Cursor user API key for agent sync |

Locally, if the password vars are unset, the app stays open for development.

## Contributing

This is a public project — PRs and issues are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

See [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)
