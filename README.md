# Desk

Plain check-in board for your active chats across **Claude**, **Codex**, and **Cursor**.

No APIs, no extensions — you add chats yourself and update status when you check in.

## Features

- Statuses as icons (click to cycle): needs approval · working · done
- **Connect** screen to wire Mac app schemes (`claude://`, `chatgpt://`, `cursor://`) or web URLs
- Per-chat Open button launches the preferred Mac app or browser link
- Optional chat deep link / URL on each row

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:3847](http://127.0.0.1:3847).

Data stays in browser `localStorage`.
