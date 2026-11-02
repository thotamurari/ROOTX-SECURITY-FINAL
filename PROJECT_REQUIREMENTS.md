# RootX-Security — Requirements to Complete the Project

A practical checklist based on the actual codebase. Grouped by priority.
✅ = done · 🔶 = partially done · ⬜ = not started · 🔑 = needs YOU (credentials/decisions I can't do)

---

## 0. Blockers — do these first (🔑 only you can)

These are why "real" features don't fully work yet. Nothing else matters until they're set.

- 🔑 ⬜ **Firebase service account** → put `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` in `safeopen-backend/.env`
  (Firebase Console → Project Settings → Service Accounts → Generate new private key).
- 🔑 ⬜ **Supabase service role key** → `SUPABASE_SERVICE_ROLE_KEY` in `safeopen-backend/.env`
  (Supabase → Project Settings → API → `service_role`).
- 🔑 ⬜ **Run** `safeopen-backend/supabase_schema_firebase_migration.sql` once in the Supabase SQL editor.
- 🔑 ⬜ **Replace the Firebase project.** It currently points at `e-learning-18dcf` (a reused, unrelated project). Create a real RootX Firebase project and update `src/lib/firebase.ts`.
- 🔑 ⬜ **Rotate all secrets.** API keys are currently committed in `.env` files (VirusTotal, AbuseIPDB, OpenAI, Anthropic, Gemini, AWS, Supabase). Rotate them and move `.env` out of git.
- 🔑 ⬜ **Confirm API quotas** are valid/active: VirusTotal, AbuseIPDB, Gemini/Anthropic/OpenAI.

---

## 1. Core scanning (mostly done)

- ✅ URL scanner — real VirusTotal + AbuseIPDB, per-vendor report, no fabricated results
- ✅ Scan works without login (optional auth); saves history when logged in
- ✅ Frontend never fabricates results (honest error states)
- ⬜ **Real APK file scanner (backend).** Accept an uploaded `.apk`, parse `AndroidManifest.xml` (permissions, components, min/target SDK), compute real SHA-256/SHA-1/MD5, read signing certificate, list native libs. *(Currently the APK scanner uses a hardcoded sample app list.)*
- ⬜ **APK Scanner UI** wired to that real upload + report (risk score, findings, permissions, components, certificate, hashes, IOCs, recommendations)
- 🔶 **File scanner** — works via VirusTotal hash lookup; fine, but only detects already-known files (no deep analysis)
- 🔶 **Message/social scanner** — works via AI text analysis

---

## 2. Native Android module (the big remaining piece)

Everything a browser cannot read needs a real native module + Capacitor plugin. This is the largest chunk of remaining work and is what turns "sample data" into real device data.

- ✅ Capacitor build setup + guide (`BUILD_ANDROID.md`) — you can produce an APK
- ✅ Real *browser-available* device data on Android-Sec (battery, storage, RAM, CPU, network, model/OS)
- ⬜ Native plugin: **installed apps** list via `PackageManager` (name, package, version, icon, permissions, install source, signature)
- ⬜ Native plugin: **running/active apps** (where Android policy allows)
- ⬜ Native plugin: **root / bootloader / ADB status**, **security patch level**
- ⬜ Native plugin: full **RAM / storage / battery health / thermal** (beyond browser limits)
- ⬜ Bridge that pushes this real data to the frontend + backend, replacing the sample set
- ⬜ Runtime **permission requests** (usage access, etc.) with clear consent screens

> Reality check: Android forbids silently reading "all data" or auto-installing apps. Everything here is permission-gated and Play-Store-compliant.

---

## 3. Other feature pages (varying completeness)

- ✅ Cybersecurity News — real live RSS aggregation
- ✅ Inbox — loads live feed
- ✅ RootX-AI chat — works without login, scoped to phone/security, fed real device data
- 🔶 **Tracker Map** — currently seeds sample connections; needs the native module (network monitoring) for real per-app connections
- 🔶 **Community** — schema + endpoints exist; needs real submission/voting flow tested end-to-end
- 🔶 **Behavior profiles** — table + endpoints exist but there's no real data source yet (native module)
- ⬜ **Scanner dashboard hub** — one unified entry point to URL / APK / Android / Live Apps / History

---

## 4. Quality, polish, correctness

- ✅ Design system, light/dark themes, mobile-first layouts, redesigned pages
- ✅ SPA routing bug fixed (direct nav + refresh)
- ⬜ Dashboard + Android-Sec "premium" visual polish pass (your earlier request — needs your direction)
- ⬜ Consistent loading / empty / error / skeleton states audited on **every** page
- ⬜ Full accessibility pass (the `accessibility-*` skills can audit this)
- ⬜ Remove dead code (legacy Mongoose models, unused `SocialShield`, orphaned APK components)
- ⬜ Real device testing on Android + iOS + desktop; verify zero console errors

---

## 5. Infrastructure & deployment

- ⬜ **Host the backend** (Render / Railway / Fly / a VPS) with HTTPS — currently only `localhost:3000`
- ⬜ **Host the frontend** (Vercel / Netlify) — `deploy-to-vercel` skill can do this
- ⬜ Set production `VITE_API_URL` / `VITE_WS_URL` to the hosted backend
- ⬜ Production CORS, rate limiting, and secret management review
- ⬜ CI check (typecheck + build) before deploys
- ⬜ Signed **release** APK + (optional) Play Store listing

---

## 6. Legal / trust (for a real security product)

- ⬜ Privacy policy + clear consent for any device data collected (required for Play Store)
- ⬜ Data retention policy (scans are capped at 5/user today — decide the real policy)
- ⬜ Make sure no screen presents sample/simulated data as real (banners added on Android-Sec; audit the rest)

---

## Suggested order

1. **Blockers (section 0)** — unlocks real auth, history, and scans.
2. **Real APK scanner** (section 1) — high-value, fully buildable without native code.
3. **Deploy backend + frontend** (section 5) — so it's usable off your laptop / from the APK.
4. **Native Android module** (section 2) — the biggest lift; turns sample data into real device data.
5. **Polish, QA, legal** (sections 4 & 6) — before any real users.

I can take on the items marked ⬜/🔶 that don't need credentials — just tell me which to start with. The 🔑 items need you.
