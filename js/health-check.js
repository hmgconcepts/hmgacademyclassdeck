/* ============================================================
   PLATFORM HEALTH CHECK (V12.3 enterprise addition — free)
   ------------------------------------------------------------
   One-tap self-diagnostics on admin.html: verifies every part of
   the deck a teacher relies on, in the browser, with zero cost:
     • storage available + quota estimate
     • service worker / PWA state
     • camera + microphone permission state
     • WebRTC (RTCPeerConnection) support
     • screen-capture + MediaRecorder support (recording studio)
     • vendor libraries reachable (PeerJS, pdf.js, qrcode)
     • config sanity (owner account set? brand set? license state)
   Purely additive; no existing feature touched. No AI API.
   ============================================================ */
(function (w, d) {
  "use strict";
  if (!/admin\.html/i.test(location.pathname)) return;

  function row(name, ok, note) {
    return '<tr><td style="padding:4px 8px">' + name + '</td>' +
      '<td style="padding:4px 8px">' + (ok === true ? "✅" : ok === false ? "❌" : "⚠️") + '</td>' +
      '<td style="padding:4px 8px;opacity:.75;font-size:12px">' + (note || "") + "</td></tr>";
  }

  async function runChecks(tbody) {
    var out = [];
    // storage
    try {
      localStorage.setItem("__hc", "1"); localStorage.removeItem("__hc");
      var quota = "";
      if (navigator.storage && navigator.storage.estimate) {
        var est = await navigator.storage.estimate();
        quota = Math.round((est.usage || 0) / 1024) + " KB used of ~" + Math.round((est.quota || 0) / 1048576) + " MB";
      }
      out.push(row("Local storage", true, quota));
    } catch (e) { out.push(row("Local storage", false, "blocked — private mode?")); }
    // service worker
    try {
      var regs = navigator.serviceWorker ? await navigator.serviceWorker.getRegistrations() : [];
      out.push(row("Service worker / PWA", regs.length > 0, regs.length ? regs.length + " active" : "not yet registered (first visit?)"));
    } catch (e) { out.push(row("Service worker / PWA", false, String(e.message || e))); }
    // permissions
    try {
      if (navigator.permissions && navigator.permissions.query) {
        var cam = await navigator.permissions.query({ name: "camera" }).catch(function () { return null; });
        var mic = await navigator.permissions.query({ name: "microphone" }).catch(function () { return null; });
        out.push(row("Camera permission", cam ? cam.state !== "denied" : null, cam ? cam.state : "unknown"));
        out.push(row("Microphone permission", mic ? mic.state !== "denied" : null, mic ? mic.state : "unknown"));
      } else out.push(row("Camera/Mic permissions", null, "Permissions API unavailable"));
    } catch (e) { out.push(row("Camera/Mic permissions", null, "query unsupported")); }
    // WebRTC / capture / recorder
    out.push(row("WebRTC (live classroom)", typeof RTCPeerConnection === "function"));
    out.push(row("Screen capture (broadcast)", !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia)));
    out.push(row("MediaRecorder (recording studio)", typeof MediaRecorder === "function",
      typeof MediaRecorder === "function" && MediaRecorder.isTypeSupported ?
        (MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "vp9 ok" : "vp8/default") : ""));
    // vendor libs
    [["vendor/peerjs.min.js", "PeerJS"], ["vendor/pdf.min.js", "pdf.js"], ["vendor/qrcode.min.js", "QR code"]].forEach(function (v) {
      // fetch HEAD-style check
      out.push('<tr data-vendor="' + v[0] + '"><td style="padding:4px 8px">' + v[1] + ' vendor file</td><td style="padding:4px 8px">⏳</td><td></td></tr>');
    });
    // config sanity
    var ownerSet = !!(w.HMG_OWNER && w.HMG_OWNER.email && w.HMG_OWNER.password);
    out.push(row("Owner account configured", ownerSet, ownerSet ? "lifetime access active" : "HMG_OWNER blank — owner login disabled (normal for client decks)"));
    var brandSet = !!(w.CLASSDECK && w.CLASSDECK.BRAND && w.CLASSDECK.BRAND.productName);
    out.push(row("Brand config", brandSet, brandSet ? w.CLASSDECK.BRAND.productName : "CLASSDECK.BRAND missing"));
    try {
      var lic = JSON.parse(localStorage.getItem("hmg_license") || localStorage.getItem("cd_license") || "null");
      out.push(row("License state", null, lic ? ("key on device" + (lic.expiry ? " · expiry " + lic.expiry : "")) : "no key on this device (trial or owner)"));
    } catch (e) { out.push(row("License state", null, "unreadable")); }

    tbody.innerHTML = out.join("");
    // async vendor checks
    tbody.querySelectorAll("tr[data-vendor]").forEach(function (tr) {
      fetch(tr.getAttribute("data-vendor"), { method: "GET", cache: "no-store" }).then(function (r) {
        tr.children[1].textContent = r.ok ? "✅" : "❌";
        tr.children[2].textContent = r.ok ? "" : "HTTP " + r.status;
      }).catch(function () { tr.children[1].textContent = "❌"; tr.children[2].textContent = "unreachable (offline?)"; });
    });
  }

  function inject() {
    if (d.getElementById("cdHealth")) return;
    var host = d.querySelector("main") || d.querySelector(".container") || d.body;
    var card = d.createElement("section");
    card.id = "cdHealth";
    card.style.cssText = "margin:18px auto;max-width:760px;padding:16px 18px;border:1px solid rgba(255,255,255,.14);border-radius:14px;background:rgba(255,255,255,.04)";
    card.innerHTML =
      '<h3 style="margin:0 0 6px">🩺 Platform health check</h3>' +
      '<p style="font-size:13px;opacity:.8;margin:0 0 10px">Verify this device is ready to teach: storage, PWA, camera/mic, live classroom, broadcast, recording and vendor libraries.</p>' +
      '<button class="btn small" id="cdHealthRun">▶ Run diagnostics</button>' +
      '<table style="width:100%;margin-top:10px;border-collapse:collapse;font-size:13px"><tbody id="cdHealthBody"></tbody></table>';
    host.appendChild(card);
    d.getElementById("cdHealthRun").addEventListener("click", function () {
      runChecks(d.getElementById("cdHealthBody"));
    });
  }

  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", inject);
  else inject();
})(window, document);
