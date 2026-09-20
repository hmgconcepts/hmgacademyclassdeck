/* ============================================================
   DATA PORTABILITY (V12.3 enterprise addition — free, on-device)
   ------------------------------------------------------------
   The deck stores everything on-device (accounts, license, quiz
   banks, whiteboard decks, settings, recording branding). This
   module adds enterprise-grade backup/restore WITHOUT any server:
     • Export  → one JSON file of every deck localStorage key
     • Import  → restore that file on a new device/browser
     • Purely additive: no existing feature is touched.
   Loaded on admin.html only. No AI API, no upload, no cost.
   ============================================================ */
(function (w, d) {
  "use strict";
  if (!/admin\.html/i.test(location.pathname)) return;

  var PREFIXES = ["hmg", "cd", "acd", "deck", "classdeck", "toolkit", "quiz", "wb", "rec", "tl"];

  function ownKeys() {
    var keys = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k) continue;
        var lk = k.toLowerCase();
        // include everything except other-site service tokens
        if (lk.indexOf("sb-") === 0) continue;
        keys.push(k);
      }
    } catch (e) {}
    return keys;
  }

  function doExport() {
    var dump = { _meta: { app: (w.APP_NAME || "CLASS DECK"), exported: new Date().toISOString(), version: 1 }, data: {} };
    ownKeys().forEach(function (k) {
      try { dump.data[k] = localStorage.getItem(k); } catch (e) {}
    });
    var blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
    var a = d.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "classdeck-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    d.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
    if (typeof toast === "function") toast("✅ Backup exported (" + Object.keys(dump.data).length + " records)", "ok");
  }

  function doImport(file) {
    var r = new FileReader();
    r.onload = function () {
      try {
        var dump = JSON.parse(String(r.result));
        if (!dump || !dump.data) throw new Error("Not a Class Deck backup file");
        var n = 0;
        Object.keys(dump.data).forEach(function (k) {
          try { localStorage.setItem(k, dump.data[k]); n++; } catch (e) {}
        });
        if (typeof toast === "function") toast("✅ Restored " + n + " records — reloading…", "ok");
        setTimeout(function () { location.reload(); }, 1200);
      } catch (e) {
        if (typeof toast === "function") toast("❌ Import failed: " + e.message, "err", 6000);
        else alert("Import failed: " + e.message);
      }
    };
    r.readAsText(file);
  }

  function inject() {
    if (d.getElementById("cdPortability")) return;
    var host = d.querySelector("main") || d.querySelector(".container") || d.body;
    var card = d.createElement("section");
    card.id = "cdPortability";
    card.style.cssText = "margin:18px auto;max-width:760px;padding:16px 18px;border:1px solid rgba(255,255,255,.14);border-radius:14px;background:rgba(255,255,255,.04)";
    card.innerHTML =
      '<h3 style="margin:0 0 6px">💾 Backup &amp; Restore (device data)</h3>' +
      '<p style="font-size:13px;opacity:.8;margin:0 0 10px">Everything this deck stores on this device — teacher account, license, quiz banks, whiteboard decks, settings and recording branding — in one JSON file. Move to a new tablet in seconds. Nothing is uploaded anywhere.</p>' +
      '<button class="btn small" id="cdExportBtn">⬇ Export backup</button> ' +
      '<label class="btn small" style="cursor:pointer">⬆ Import backup<input type="file" id="cdImportFile" accept="application/json" style="display:none"></label>';
    host.appendChild(card);
    d.getElementById("cdExportBtn").addEventListener("click", doExport);
    d.getElementById("cdImportFile").addEventListener("change", function (e) {
      if (e.target.files && e.target.files[0]) doImport(e.target.files[0]);
    });
  }

  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", inject);
  else inject();
})(window, document);
