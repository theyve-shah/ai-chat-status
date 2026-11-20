# Desk Sync (Chrome / Chromium extension)

Experimental **Pro** path: stay logged into [claude.ai](https://claude.ai) and/or [chatgpt.com](https://chatgpt.com) in Chrome. The extension lists your chats with those sites’ private (unofficial) APIs **in your browser**, then `POST`s only metadata to Desk’s `/api/sync/import`.

- Session cookies for Anthropic/OpenAI **never** go to the Desk server.
- Not affiliated with Anthropic or OpenAI; APIs can break without notice.

## Load unpacked

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select this `extension/` folder
4. Open the extension options → set Desk URL (e.g. `http://127.0.0.1:3847`)
5. Stay logged into Claude / ChatGPT → Sync now (or wait for the interval)

Desk auto-pulls the import buffer onto the board while the tab is open.
