/**
 * Desk Sync — background worker
 *
 * Lists conversations using the logged-in browser session on claude.ai /
 * chatgpt.com (same cookies the tab already has). Posts only metadata
 * (id, title, url, timestamps, status heuristic) to Desk's import API.
 *
 * Never sends Anthropic/OpenAI session cookies to Desk.
 * Unofficial / experimental — private site APIs change without notice.
 */

const DEFAULTS = {
  deskUrl: "http://127.0.0.1:3847",
  importToken: "",
  enableClaude: true,
  enableChatgpt: true,
  intervalMinutes: 5,
};

const RECENT_MS = 2 * 60 * 60 * 1000; // 2h → working, else dormant
const ALARM = "desk-sync";

chrome.runtime.onInstalled.addListener(() => {
  void ensureAlarm();
});

chrome.runtime.onStartup.addListener(() => {
  void ensureAlarm();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM) void runSync("alarm");
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "desk-sync-now") {
    void runSync(msg.reason || "manual").then(sendResponse);
    return true;
  }
  if (msg?.type === "desk-sync-ping") {
    void runSync(msg.reason || "page").then(sendResponse);
    return true;
  }
  if (msg?.type === "desk-sync-settings-changed") {
    void ensureAlarm().then(() => sendResponse({ ok: true }));
    return true;
  }
  return false;
});

async function getSettings() {
  const stored = await chrome.storage.sync.get(DEFAULTS);
  return { ...DEFAULTS, ...stored };
}

async function ensureAlarm() {
  const settings = await getSettings();
  const minutes = Math.max(1, Number(settings.intervalMinutes) || 5);
  await chrome.alarms.clear(ALARM);
  chrome.alarms.create(ALARM, {
    delayInMinutes: 0.2,
    periodInMinutes: minutes,
  });
}

function statusFromUpdated(iso) {
  const t = Date.parse(iso || "");
  if (!Number.isFinite(t)) return "dormant";
  return Date.now() - t < RECENT_MS ? "working" : "dormant";
}

function toIso(value) {
  if (value == null || value === "") return new Date().toISOString();
  if (typeof value === "number") {
    const ms = value < 1e12 ? value * 1000 : value;
    return new Date(ms).toISOString();
  }
  const parsed = Date.parse(String(value));
  if (Number.isFinite(parsed)) return new Date(parsed).toISOString();
  return new Date().toISOString();
}

async function fetchJson(url, init = {}) {
  const res = await fetch(url, {
    credentials: "include",
    cache: "no-store",
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text.slice(0, 200) };
  }
  if (!res.ok) {
    const err = new Error(
      `${res.status} ${url}: ${(text || res.statusText).slice(0, 180)}`,
    );
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/** Claude.ai private list (cookie session). */
async function listClaudeChats() {
  const orgs = await fetchJson("https://claude.ai/api/organizations");
  const list = Array.isArray(orgs) ? orgs : orgs?.organizations || [];
  if (!list.length) {
    throw new Error("Claude: no organizations (are you logged into claude.ai?)");
  }
  const orgId = list[0].uuid || list[0].id;
  if (!orgId) throw new Error("Claude: organization missing uuid");

  let data;
  try {
    data = await fetchJson(
      `https://claude.ai/api/organizations/${orgId}/chat_conversations?limit=50&offset=0`,
    );
  } catch (e) {
    if (e.status === 404 || e.status === 405) {
      data = await fetchJson(
        `https://claude.ai/api/organizations/${orgId}/chat_conversations_v2?limit=50&offset=0`,
      );
    } else {
      throw e;
    }
  }

  const rows = Array.isArray(data)
    ? data
    : data?.chat_conversations ||
      data?.data ||
      data?.conversations ||
      [];

  return rows
    .map((row) => {
      const id = String(row.uuid || row.id || "").trim();
      if (!id) return null;
      const createdAt = toIso(row.created_at || row.createdAt);
      const updatedAt = toIso(
        row.updated_at || row.updatedAt || row.created_at || row.createdAt,
      );
      const title =
        (row.name || row.title || "").trim() ||
        `Claude ${id.slice(0, 8)}`;
      return {
        externalId: id,
        title,
        tool: "claude",
        kind: "chat",
        status: statusFromUpdated(updatedAt),
        note: "Desk Sync extension · claude.ai (unofficial)",
        link: `https://claude.ai/chat/${id}`,
        createdAt,
        updatedAt,
        source: "claude",
      };
    })
    .filter(Boolean);
}

/** ChatGPT.com private list (session → Bearer). */
async function listChatgptChats() {
  const session = await fetchJson("https://chatgpt.com/api/auth/session");
  const token = session?.accessToken;
  if (!token) {
    throw new Error("ChatGPT: no accessToken (are you logged into chatgpt.com?)");
  }

  const data = await fetchJson(
    "https://chatgpt.com/backend-api/conversations?offset=0&limit=50&order=updated",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const rows = Array.isArray(data?.items) ? data.items : [];

  return rows
    .map((row) => {
      const id = String(row.id || "").trim();
      if (!id) return null;
      const createdAt = toIso(row.create_time);
      const updatedAt = toIso(row.update_time || row.create_time);
      const title =
        (row.title || "").trim() || `ChatGPT ${id.slice(0, 8)}`;
      return {
        externalId: id,
        title,
        tool: "codex",
        kind: "chat",
        status: statusFromUpdated(updatedAt),
        note: "Desk Sync extension · chatgpt.com (unofficial)",
        link: `https://chatgpt.com/c/${id}`,
        createdAt,
        updatedAt,
        source: "chatgpt",
      };
    })
    .filter(Boolean);
}

async function ensureDeskHostPermission(deskUrl) {
  let origin;
  try {
    origin = new URL(deskUrl).origin + "/*";
  } catch {
    throw new Error("Invalid Desk URL");
  }
  const has = await chrome.permissions.contains({ origins: [origin] });
  if (has) return;
  // Optional permission — user may grant from options. For localhost we
  // already declare host_permissions; hosted Desk needs optional grant.
  const granted = await chrome.permissions.request({ origins: [origin] });
  if (!granted) {
    throw new Error(
      `Grant host access to ${new URL(deskUrl).origin} in the extension options`,
    );
  }
}

async function postToDesk(settings, chats) {
  const base = String(settings.deskUrl || "").replace(/\/$/, "");
  if (!base) throw new Error("Set Desk URL in extension options");

  await ensureDeskHostPermission(base);

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const token = String(settings.importToken || "").trim();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${base}/api/sync/import`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      merge: true,
      source: "import",
      chats,
    }),
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text.slice(0, 200) };
  }
  if (!res.ok) {
    throw new Error(
      data?.error || `Desk import ${res.status}: ${text.slice(0, 160)}`,
    );
  }
  return data;
}

async function runSync(reason) {
  const startedAt = new Date().toISOString();
  const settings = await getSettings();
  const errors = [];
  const chats = [];

  if (settings.enableClaude) {
    try {
      chats.push(...(await listClaudeChats()));
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }
  if (settings.enableChatgpt) {
    try {
      chats.push(...(await listChatgptChats()));
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }

  let result = {
    ok: false,
    reason,
    startedAt,
    count: 0,
    errors,
  };

  if (chats.length === 0) {
    result = {
      ...result,
      error: errors[0] || "No chats listed (enable a source and stay logged in)",
    };
    await chrome.storage.local.set({ lastSync: result });
    return result;
  }

  try {
    const data = await postToDesk(settings, chats);
    result = {
      ok: true,
      reason,
      startedAt,
      syncedAt: data?.syncedAt || new Date().toISOString(),
      count: data?.count ?? chats.length,
      posted: chats.length,
      errors,
      hint: "Open Desk — chats auto-pull from the import buffer.",
    };
  } catch (e) {
    result = {
      ...result,
      error: e instanceof Error ? e.message : String(e),
      posted: chats.length,
    };
  }

  await chrome.storage.local.set({ lastSync: result });
  return result;
}
