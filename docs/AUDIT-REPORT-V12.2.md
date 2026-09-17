# V12.2 Full-System Audit Report — HMG ACADEMY CLASS DECK + Class Deck Generator

**Date:** 17 September 2026
**Scope:** every page and JS module in both repos — `hmgacademyclassdeck` (the deck) and `classdeckgenerator` (the builder), including the builder's `/template/` and the client ZIPs the engine emits.
**Method:** static analysis (syntax, JSON validity, broken local references, handler/function cross-reference, DOM-id cross-reference, service-worker precache vs shipped files), security review, and automated end-to-end generation tests (18 checks) that build a real client ZIP and inspect every file inside it.

---

## 1. Findings and fixes

### CRITICAL — security

**SEC-1 · Founder credentials hardcoded as auth fallback (client account takeover).**
`js/auth.js` resolved the owner account as `(window.HMG_OWNER && HMG_OWNER.email) ? … : "<founder email>"` with the same pattern for the password. Generated client decks intentionally blank `HMG_OWNER` — and a **blank string is falsy in JavaScript**, so every client deck silently fell back to the HMG founder's real email/password. Anyone knowing those credentials had lifetime owner access on *every client deployment*, and the credentials themselves were readable in the shipped file.
**Fix:** the fallbacks are removed entirely. Owner credentials come only from `js/config.js`; blank/missing config disables the owner account. `isOwnerEmail()` explicitly rejects a blank configured email (otherwise `"" === ""` would make empty input an owner match), and every password comparison additionally requires a non-empty configured password. Verified in four scenarios: HMG deck (works), client deck with blanked config (founder creds rejected), blank-vs-blank (rejected), missing config (owner disabled).

**SEC-2 · Client ZIP's generator folder shipped HMG's real credentials.**
The `CLASSDECK-GENERATOR/` folder inside every client ZIP packed `js/config.js` verbatim from the template — including the real `HMG_OWNER` email and password. `_brandGenFiles()` explicitly returned content untouched.
**Fix:** `_brandGenFiles()` now scrubs the `HMG_OWNER` block to blanks in any `js/config.js` it packs. End-to-end test scans **every text file in the generated ZIP** for both credential strings: zero hits.

**SEC-3 · Credentials duplicated across docs and backup files.**
The founder password appeared in plain text in `DEPLOYMENT-GUIDE.md`, `docs/FEATURES.md`, `docs/PROMPT_AUDIT.md`, and a stray `js/config.js.bak` — in both repos (and therefore in every client ZIP containing those docs).
**Fix:** password redacted from all documentation (replaced with a pointer to `js/config.js → HMG_OWNER`); `config.js.bak` deleted from both repos. The single intended home of the credentials is `js/config.js`, clearly marked *"CHANGE THIS before deploying to a public repo."*

**SEC-4 · Recording watermark stamped HMG's private email onto client videos.**
`js/enterprise-enhanced.js` hardcoded `"HMG ACADEMY CLASS DECK * <founder email> * <year>"` into the forensic watermark drawn over every recording — including recordings made on client decks.
**Fix:** the watermark now reads brand and owner identity from `CLASSDECK.BRAND` / `HMG_BRAND` / `HMG_OWNER` at runtime, so each deck stamps its own identity.

### HIGH — functional

**BUG-1 · Builder 404 page linked `join.html`, which doesn't exist at the builder root.**
Fix: the card now links to `template/index.html` ("Preview the template") and the home card says "Builder home."

**BUG-2 · Stale service worker could permanently mask the builder site.**
`classdeckgenerator.vercel.app` previously served the deck, so returning visitors' browsers hold the deck's service worker — which would keep answering navigations with the cached old deck shell even after the builder is deployed. Additionally, the builder root's `common.js` tried to register `sw.js`, which doesn't exist there.
Fix: the builder's copy of `common.js` now **unregisters every service worker on its scope and purges all caches** on load. (The deck and template copies still register their SW normally.)

**BUG-3 · Generated logo written with the wrong file extension (broken logo on every client page).**
Default builds (`logoExt: 'svg'`) wrote the SVG monogram to `assets/brand-logo.png` — SVG markup inside a `.png` filename — while every branded page references `assets/brand-logo.svg`. Result: broken logo image everywhere.
Fix: the monogram is always written to `brand-logo.svg` first (guaranteed present), and an uploaded logo then overwrites it at its true extension (SVG data-URIs handled for both base64 and URI-encoded forms). Test confirms the landing page's logo reference resolves to a file that exists in the ZIP.

**BUG-4 · Client `sw.js` precached files the ZIP doesn't ship.**
The service worker SHELL listed `./generate.html`, `./js/generator.js` and `./assets/icon-master.png`; the first two are builder-only (the generator lives in the ZIP's separate folder) and the third simply wasn't packed. Every client install logged failed fetches.
Fix: `_brand()` strips the two builder-only entries from the client's `sw.js`, and `icon-master.png` was added to the packed asset list. Test verifies **every** SHELL entry now exists in the ZIP.

**BUG-5 · Generated client config lacked `CLASSDECK.BRAND`.**
`portal-bridge.js`, `enhancements.js` and `teach-toolbar-fix.js` read `CLASSDECK.BRAND` (for theming and for the standalone/portal mode decision). The emitted client `js/config.js` only defined `CD_CONFIG`, leaving mode detection to defaults.
Fix: `_configJS()` now also emits a full `CLASSDECK.BRAND` block with `standalone: true` and `parentPortal: ''` stated explicitly — so no module can ever bypass a client deck's own login.

### MEDIUM — consistency

**BUG-6 · `template/version.json` lagged the deck's version** (12.0.0 vs 12.1.0), so generated decks reported an older build than their engine. Fix: both synced to `12.2.0-enterprise`.

**BUG-7 · Service-worker cache tags unbumped after fixes.** Deployed devices would keep pre-audit code. Fix: both `sw.js` caches bumped to `hmg-classdeck-v12.2.0-audit-hardening`.

**BUG-8 · Engine copies drifted risk.** The fixed `js/generator.js` is byte-synced across all three locations (builder root, `template/js/`, deck `js/`).

### Verified clean (no action needed)

- **JS syntax:** all non-vendor JS in both repos passes `node --check`.
- **JSON:** all manifests/version files parse.
- **Local references:** 0 broken `src`/`href` targets across all pages in both repos (after BUG-1).
- **Handler cross-reference:** all `onclick` handlers resolve to defined functions (flags were method calls like `this.closest(...)` — false positives).
- **DOM-id cross-reference:** all hard dereferences target elements that exist statically or are created dynamically immediately before use (verified individually).
- **SW precache (deck):** all 48 SHELL entries exist; the `install` handler uses `Promise.allSettled`, so one miss can't break installation; `ignoreSearch: true` correctly matches `?v=24` script URLs.

## 2. End-to-end test results (automated, 18/18 PASS)

Branding (client name present, zero HMG leaks, no cascade mangling) · Security (zero credential strings in the whole ZIP, auth fallback removed, generator-folder config scrubbed) · Logo (monogram present, referenced file exists) · Config (`CLASSDECK.BRAND` + `standalone: true` + blanked owner) · SW (builder-only entries stripped, every SHELL entry ships) · License (subscription model baked) · Watermark (config-driven) · Integrity (no empty files, icon-master packed). Plus 4/4 auth-resolution scenarios and live HTTP smoke tests of both sites (all pages 200, auth gate present on `teach.html`).

## 3. Action required after deploying V12.2

1. **Change the founder password** in `js/config.js` — it lived in a public repo's history, so treat it as exposed. Also change it anywhere you reuse it.
2. Replace the contents of **both** GitHub repos with the V12.2 packages (deck → `hmgacademyclassdeck`, builder → `classdeckgenerator`).
3. Visit the builder site once after deploying — the new `common.js` will purge visitors' stale deck service worker automatically.
4. Re-generate any client ZIP produced by earlier builds: pre-V12.2 client decks contain SEC-1/SEC-2 leaks and must not be shipped.
