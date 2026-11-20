# Desk

Plain check-in board for active chats across **Claude**, **Codex**, and **Cursor**.

No APIs, no extensions — you add chats yourself and update status when you check in. Built for quick looks every few hours, not constant babysitting.

![License: MIT](https://img.shields.io/badge/license-MIT-blue)

## Features

- Statuses as icons (click to cycle): needs approval · working · done
- **Connect** screen with install links + step-by-step setup for Claude, Codex/ChatGPT, and Cursor
- Mac app schemes (`claude://`, `chatgpt://`, `cursor://`) or web URLs
- Per-chat Open button for the preferred Mac app or browser link
- Optional chat deep link / URL on each row
- Optional password gate for hosted deploys

## Quick start

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:3847](http://127.0.0.1:3847).

Chat + Connect data stays in your browser (`localStorage`). No database.

## How to connect tools

1. Open **Connect** in the left nav (or the home banner).
2. For each tool: install the Mac app → tap **Connect** → **Test Mac app** once (allow the browser prompt).
3. Prefer **Mac app** or **Web**.
4. When adding a chat, paste that chat’s URL if you want Open to jump to the exact thread.

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
