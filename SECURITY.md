# Security

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Email **devshah@getsouvenir.com** with:

- a short description of the issue
- steps to reproduce
- impact (what an attacker could do)

You’ll get a reply when it’s received. Please give a reasonable window before any public disclosure.

## Scope notes

- Hosted deploys should set `DESK_PASSWORD` and `DESK_SESSION_SECRET` in the host’s secret store — never commit them.
- Desk stores chats and Connect settings in the browser (`localStorage`). Treat shared machines as untrusted.
- Deep links (`claude://`, `chatgpt://`, `cursor://`) only open local apps; they are not an API integration.
