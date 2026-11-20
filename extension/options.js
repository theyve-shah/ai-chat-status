const DEFAULTS = {
  deskUrl: "http://127.0.0.1:3847",
  importToken: "",
  enableClaude: true,
  enableChatgpt: true,
  intervalMinutes: 5,
};

const form = document.getElementById("form");
const lastSyncEl = document.getElementById("lastSync");
const syncBtn = document.getElementById("syncNow");

async function load() {
  const stored = await chrome.storage.sync.get(DEFAULTS);
  document.getElementById("deskUrl").value = stored.deskUrl || DEFAULTS.deskUrl;
  document.getElementById("importToken").value = stored.importToken || "";
  document.getElementById("enableClaude").checked = stored.enableClaude !== false;
  document.getElementById("enableChatgpt").checked =
    stored.enableChatgpt !== false;
  document.getElementById("intervalMinutes").value =
    stored.intervalMinutes || DEFAULTS.intervalMinutes;

  const local = await chrome.storage.local.get("lastSync");
  renderLast(local.lastSync);
}

function renderLast(last) {
  if (!last) {
    lastSyncEl.textContent = "No sync yet.";
    lastSyncEl.classList.remove("ok");
    return;
  }
  lastSyncEl.textContent = JSON.stringify(last, null, 2);
  lastSyncEl.classList.toggle("ok", Boolean(last.ok));
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const deskUrl = document.getElementById("deskUrl").value.trim();
  const payload = {
    deskUrl,
    importToken: document.getElementById("importToken").value.trim(),
    enableClaude: document.getElementById("enableClaude").checked,
    enableChatgpt: document.getElementById("enableChatgpt").checked,
    intervalMinutes: Number(document.getElementById("intervalMinutes").value) || 5,
  };
  await chrome.storage.sync.set(payload);

  try {
    const origin = new URL(deskUrl).origin + "/*";
    await chrome.permissions.request({ origins: [origin] });
  } catch {
    /* localhost already permitted */
  }

  chrome.runtime.sendMessage({ type: "desk-sync-settings-changed" });
  syncBtn.textContent = "Saved";
  setTimeout(() => {
    syncBtn.textContent = "Sync now";
  }, 900);
});

syncBtn.addEventListener("click", async () => {
  syncBtn.disabled = true;
  syncBtn.textContent = "Syncing…";
  try {
    const result = await chrome.runtime.sendMessage({
      type: "desk-sync-now",
      reason: "options",
    });
    renderLast(result);
  } catch (err) {
    renderLast({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
  } finally {
    syncBtn.disabled = false;
    syncBtn.textContent = "Sync now";
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.lastSync) {
    renderLast(changes.lastSync.newValue);
  }
});

void load();
