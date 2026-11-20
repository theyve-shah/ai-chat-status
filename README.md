# Desk

Plain check-in board for active chats across **Claude**, **Codex**, and **Cursor**.

No APIs, no extensions — you add chats yourself and update status when you check in. Built for quick looks every few hours, not constant babysitting.

![License: MIT](https://img.shields.io/badge/license-MIT-blue)

## Features

- Statuses as icons (click to cycle): needs approval · working · done · dormant
- **Connect** screen with official deep-link steps for Claude, ChatGPT/Codex, and Cursor
- Desktop deep links (`claude://`, `codex://`, `cursor://…`) or web URLs
- Per-chat Open button for the preferred desktop app or browser link
- Optional chat / agent deep link on each row
- Optional password gate for hosted deploys

## Quick start

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:3847](http://127.0.0.1:3847).

Chat + Connect data stays in your browser (`localStorage`). No database.

## How to connect tools

Desk does not sync chats via APIs. Connect only wires **Open** to each product’s documented deep links / website.

1. Open **Connect** in the left nav.
2. For each tool: install from the official download link → follow the numbered steps → **Test desktop** (or open web).
3. Prefer **Desktop app** or **Web**.
4. When adding a chat, paste the product’s chat / agent URL (or deep link). Examples:
   - Claude: `https://claude.ai/chat/<id>` or `claude://claude.ai/chat/<id>`
   - ChatGPT/Codex: `codex://threads/<id>` (⌘⌥L in the desktop app) or `https://chatgpt.com/c/<id>`
   - Cursor: `https://cursor.com/agents/bc-…`

Docs: [Claude deep links](https://support.claude.com/en/articles/14729294-open-claude-desktop-with-a-link) · [ChatGPT deep links](https://learn.chatgpt.com/docs/reference/commands#deep-links) · [Cursor deeplinks](https://cursor.com/docs/reference/deeplinks)

## Hosted deploy (Vercel)

For a public site, set these environment variables so strangers cannot open your Desk:

| Variable | Purpose |
| --- | --- |
| `DESK_PASSWORD` | Shared unlock password |
| `DESK_SESSION_SECRET` | Signs the session cookie (long random string) |

See `.env.example`. Never commit a real `.env`.

Locally, if those are unset, the app stays open for development.

## Contributing

This is a public project — PRs and issues are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

See [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)
