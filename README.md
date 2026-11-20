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

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:3847](http://127.0.0.1:3847).

Data stays in browser `localStorage`.
