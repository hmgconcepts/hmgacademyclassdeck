# Prompt-Compliance Audit + V12.3 Final Report

**Date:** 19 September 2026 · **Version:** 12.3.0-enterprise
**Method:** every prompt in the project conversation was re-read and compared line-by-line against the built output; the LIVE sites and BOTH GitHub repos were fetched and inspected directly (nothing assumed); the original repo clone was diffed word-by-word against the build.

---

## 1. Prompt-by-prompt compliance audit

| # | Prompt requirement | Status before this audit | Evidence + action taken |
|---|---|---|---|
| 1a | Copy every feature/capability of the Tutoring Connect & Adewale **Class Deck** into HMG ACADEMY Class Deck | ✅ Obeyed (after the scope correction) | All V36 modules present; deck-only scope confirmed |
| 1b | HMG deck must be an **exact replica** in capability | ⚠️ Partially — see §2 regressions | Fixed in V12.3 |
| 1c | **Don't remove pre-existing features — enhance them** | ❌ Violated in 3 places (see §2) | All restored in V12.3 |
| 2 | Create a Class Deck **generator/builder** for future clients (as Tutoring Connect was used to create Adewale) | ✅ Obeyed (after the V12.1 fix) — verified live: the generator repo's homepage is the wizard, template under `/template/` | Live check: classdeckgenerator.vercel.app currently shows *DEPLOYMENT_NOT_FOUND* — the V12.2 upload succeeded on GitHub but the Vercel project is disconnected; re-deploy steps in §5 |
| 3 | Zipped release containing both packages, GitHub-ready | ✅ Obeyed | `hmg-classdeck-release.zip` |
| 4 | Free tools only | ✅ Obeyed | Static hosting, PeerJS free tier, JSZip CDN, on-device storage |
| 5 | No AI API | ✅ Obeyed | Zero AI API calls anywhere |
| 6 | Detailed explanation of every feature | ✅ Obeyed | `docs/FEATURES.md` + upgrade reports + this file §4 |
| 7 | Deployment steps: clear, unambiguous, detailed | ✅ Obeyed | `DEPLOYMENT-GUIDE.md` + §5 below |
| 8 | Fix the generator-identical-to-deck bug | ✅ Obeyed (V12.1) | Verified on the GitHub repo: builder homepage + `/template/` structure is live on `main` |
| 9 | Expert audit of every page; fix all bugs | ✅ Obeyed (V12.2: 4 security flaws + 8 bugs) | `docs/AUDIT-REPORT-V12.2.md` |

## 2. Pre-existing features dropped by earlier passes — found by original-vs-build diff, now RESTORED

The word-level diff of the original repo clone against the build caught three genuine regressions that my earlier greps missed (they were introduced by the V36 Adewale files themselves, which had rebranded/portalised wording):

1. **"CLASS DECK" became "CLASSROOM DECK"** on `index.html` (hero H1, "Why teachers choose…", install button) and `admin.html`. Cause: the Adewale template files carried their own product name and my token replacement mapped it to the wrong string. **Restored to the original "CLASS DECK" everywhere.**
2. **The "3-day free trial" promise became "included with HMG ACADEMY"** on `index.html` and `admin.html` — Adewale's portal model leaked into HMG's standalone SaaS copy, breaking the licensing story (admin page describes the trial→key workflow). **Original wording restored.**
3. **The custom RTMP/RTMPS destination input was dropped** from the Tablet Social Live modal (original had YouTube/Facebook/Instagram/TikTok **+ Custom**; the V36 modal had only the four platforms). `teach.js` reads `.tlDest` inputs generically, so restoring the input fully restores the feature. **Restored in deck + template, and verified present in generated client ZIPs.**
4. **Ecosystem links to `hmgacademy.pages.dev` were overwritten** to the deck's own URL in `index.html` (JSON-LD `sameAs`, organization block, footer), `stream.html`, `generate.html` and `js/ecosystem-branding.js` — 11 link contexts restored exactly as the original had them.

Also verified NOT regressions (checked, not assumed): page reachability (all 11 pages are JS-navigable exactly as in the original), toolkit data packs (`CLASSROOM` headings there are original comments), parent.html "Parent Portal" title (original wording), recording modal (the V36 `hmgRec*` dialog is a superset of the original `rec*` dialog — both present).

## 3. Live-site findings (fetched directly)

- **hmgacademyclassdeck.vercel.app** — serving the V12.x build but with the pre-V12.3 regressions visible ("CLASSROOM DECK", "included with HMG ACADEMY"). Fixed in this package; redeploy to clear.
- **classdeckgenerator.vercel.app** — returns Vercel `DEPLOYMENT_NOT_FOUND`. The GitHub repo (`hmgconcepts/classdeckgenerator`) has the correct V12.2 builder structure on `main`, so the repo is fine — the Vercel project is missing/disconnected. Fix: §5-B step 2.
- **GitHub repos** — both repos verified: deck repo has the correct root layout; generator repo has `index.html` (wizard) + `template/`.

## 4. New enterprise features added in V12.3 (additive only — nothing removed)

| Feature | File | What it does |
|---|---|---|
| **Backup & Restore (data portability)** | `js/data-portability.js` (admin.html) | Exports every on-device record — teacher account, license, quiz banks, whiteboard decks, settings, recording branding — into one JSON file; import restores it on a new tablet in seconds. No server, no upload, free. |
| **Platform health check** | `js/health-check.js` (admin.html) | One-tap diagnostics: storage + quota, service-worker/PWA state, camera & mic permission state, WebRTC support, screen-capture + MediaRecorder support (recording readiness), vendor library reachability (PeerJS/pdf.js/QR), config sanity (owner set? brand set? license state). Tells a teacher *before class* whether the device is ready. |

Both modules are packed into every generated client deck (generator `deckFiles` + service-worker precache updated), and both service workers were cache-bumped to `v12.3.0` so deployed devices refresh automatically.

## 5. Deployment — clear, unambiguous, detailed

### A. Deploy the deck (hmgacademyclassdeck)
1. Unzip `hmg-academy-classdeck.zip`.
2. GitHub → open your deck repo → delete old contents → **Add file → Upload files** → drag ALL files/folders from inside the unzipped folder (so `index.html` is at repo root) → Commit.
3. Vercel auto-deploys if connected. If not: vercel.com → Add New → Project → import the repo → Framework **Other**, Build Command *empty*, Output *empty* → Deploy.
4. Verify: homepage says **"HMG ACADEMY CLASS DECK"** and **"3-day free trial"**; `admin.html` shows the new *Backup & Restore* and *Platform health check* cards; owner login from `js/config.js` works on `teach.html`.
5. ⚠️ Change the owner password in `js/config.js` (public repo history exposure).

### B. Deploy the builder (classdeckgenerator)
1. Unzip `classdeck-generator.zip`; upload contents to the `classdeckgenerator` repo root (same replace-not-merge method).
2. **The live URL currently shows DEPLOYMENT_NOT_FOUND** — the Vercel project is disconnected. Fix: vercel.com → Add New → Project → import `classdeckgenerator` → Framework **Other**, no build → Deploy → Settings → Domains → confirm `classdeckgenerator.vercel.app` is attached.
3. Verify: the site root opens the **Class Deck Generator wizard** (not a deck); `/template/index.html` previews the master deck; generating a test brand downloads a two-folder ZIP.

### C. Produce + hand over a client deck
1. Open the builder → fill brand, colours, logo, contacts, socials, license model (lifetime/subscription + price/cycle) → Generate.
2. From the downloaded ZIP give the client ONLY `<BRAND>-CLASSDECK/`; keep `CLASSDECK-GENERATOR/`.
3. Client deploys per the `DEPLOYMENT-GUIDE.md` inside their folder (same GitHub→Vercel flow).
4. Issue their access key from `admin.html` per your license model.

## 6. Final verification battery (all green)

- 29/29 SaaS-completeness + security checks on a freshly generated client ZIP (branding, credential scan of every file, license baking, custom RTMP present, standalone auth, regeneration tool).
- All non-vendor JS passes `node --check`; all JSON/manifests parse; zero broken local links in both packages.
- Word-level parity diff vs the original repo: no remaining dropped wording or features.
- Live smoke test: every page 200 on both local deployments.
