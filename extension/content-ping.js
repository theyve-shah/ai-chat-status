/**
 * Nudge the background worker when the user opens or focuses
 * claude.ai / chatgpt.com so Desk stays fresh without waiting for the alarm.
 */
(function () {
  let last = 0;
  function ping(reason) {
    const now = Date.now();
    if (now - last < 60_000) return;
    last = now;
    try {
      chrome.runtime.sendMessage({ type: "desk-sync-ping", reason });
    } catch {
      /* extension reloading */
    }
  }

  ping("load");
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") ping("visible");
  });
})();
