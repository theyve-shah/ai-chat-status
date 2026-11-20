# Contributing

Thanks for helping improve Desk. This is a small Next.js app — keep changes focused.

## Setup

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:3847](http://127.0.0.1:3847).

Locally you do **not** need `DESK_PASSWORD`. Copy `.env.example` only if you want to test the login gate.

## What to work on

Good first contributions:

- UI polish and accessibility
- Clearer Connect copy / tool guides
- Empty, loading, and error states
- Docs improvements

Please open an issue before large redesigns or new backends (databases, OAuth providers, sync APIs).

## Pull requests

1. Fork the repo (or branch from `main`).
2. Keep PRs small and describe the user-facing change.
3. Run `npm run build` before you open the PR.
4. Do not commit `.env`, secrets, or personal chat data.

## Code notes

- Manual tracker only — no Claude / Codex / Cursor APIs.
- Chat + Connect state lives in `localStorage`.
- Auth is a shared password gate for hosted deploys (`DESK_PASSWORD` + `DESK_SESSION_SECRET`).
