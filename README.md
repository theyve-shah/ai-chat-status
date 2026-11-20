# Desk

Plain check-in board for your active chats across **Claude**, **Codex**, and **Cursor**.

No APIs, no extensions — you add chats yourself and update status when you check in.

## Features

- Statuses as icons (click to cycle): needs approval · working · done
- **Connect** screen with install links + step-by-step setup for Claude, Codex/ChatGPT, and Cursor
- Mac app schemes (`claude://`, `chatgpt://`, `cursor://`) or web URLs
- Per-chat Open button launches the preferred Mac app or browser link
- Optional chat deep link / URL on each row

## How to connect

1. Open **Connect** in the left nav (or the home banner).
2. For each tool: install the Mac app → tap **Connect** → **Test Mac app** once (allow the browser prompt).
3. Prefer **Mac app** or **Web**.
4. When adding a chat on Desk, paste that chat’s URL if you want Open to jump to the exact thread; otherwise Open launches the app/site.

## Auth (required on Vercel)

Desk is gated by a shared password so strangers cannot open your Connect settings.

Set these on Vercel (Project → Settings → Environment Variables):

- `DESK_PASSWORD` — your private password
- `DESK_SESSION_SECRET` — long random string used to sign the session cookie

Locally, if those are unset, the app stays open for development.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:3847](http://127.0.0.1:3847).

Chat + Connect data stays in browser `localStorage` (no database). Auth only locks the page.
