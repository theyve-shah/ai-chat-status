# Desk

Plain check-in board for your active chats across **Claude**, **Codex**, and **Cursor**.

No APIs, no extensions, no MCP — you add chats yourself and update status when you check in.

## Statuses

- **Needs approval** — waiting on you
- **Working** — agent is busy
- **Done** — safe to close

Each chat also tracks tool (Claude / Codex / Cursor) and type (Chat / Code).

## Run locally

```bash
npm install
npm run dev -- -p 3847
```

Open [http://127.0.0.1:3847](http://127.0.0.1:3847).

Data is stored in your browser (`localStorage`). Use **Reset sample data** in the sidebar to restore the starter set.
