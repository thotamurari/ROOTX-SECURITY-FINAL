# Building the RootX-Security Android APK

This turns the RootX web app into a real, installable Android APK using
[Capacitor](https://capacitorjs.com) (it wraps the web build in a native
Android WebView shell). Everything is pre-configured — you just run the build
on your laptop, which needs the Android toolchain that a build server can't
download.

> **Note:** An APK installs on an **Android phone or emulator**, not on
> Windows directly. To run it on your laptop you'd use the Android Studio
> emulator or Windows Subsystem for Android. To run it on your phone, copy the
> `.apk` over and sideload it (enable "Install unknown apps").

---

## 1. One-time prerequisites (on your laptop)

1. **Node.js 18+** — you already have this (the app runs).
2. **Java JDK 17** — https://adoptium.net (Temurin 17).
3. **Android Studio** — https://developer.android.com/studio
   During setup, let it install the **Android SDK**, **SDK Platform**, and
   **Android SDK Build-Tools**. Open Android Studio once so it finishes
   downloading components.
4. Tell the tools where the SDK is (set once, then restart your terminal):
   - Windows env var `ANDROID_HOME` → `C:\Users\<you>\AppData\Local\Android\Sdk`

---

## 2. Build the APK

From the project folder (`C:\MyApp`) in a terminal:

```bash
npm install            # pulls in the Capacitor packages now listed in package.json

# The repo still contains an OLD, unused React Native android/ folder. It must
# be removed before Capacitor can create its own, or `cap add` will refuse:
rmdir /s /q android    # Windows (or delete the android\ folder in Explorer)

npm run cap:add        # one time only — creates the fresh native android/ project
npm run apk:build      # builds the web app + assembles a debug APK
```

That's it. Your installable APK is at:

```
android\app\build\outputs\apk\debug\app-debug.apk
```

Copy that file wherever you like (e.g. your Desktop) and sideload it onto an
Android phone.

### Prefer Android Studio's UI?

```bash
npm run apk:open       # builds, syncs, and opens the project in Android Studio
```

Then use **Build → Build Bundle(s) / APK(s) → Build APK(s)**, or press Run to
launch it in an emulator.

---

## 3. Important: point the app at a reachable backend

Inside an APK, `localhost` means the **phone**, not your laptop — so the app
can't reach a backend running on `http://localhost:3000`. Before
`npm run apk:build`, edit `.env`:

```
# Use your laptop's LAN IP (find it with `ipconfig`), not localhost:
VITE_API_URL=http://192.168.1.42:3000
VITE_WS_URL=http://192.168.1.42:3000
```

Then start the backend (`cd safeopen-backend && npm run dev`) and make sure
the phone is on the same Wi-Fi. For a real release you'd host the backend on a
public HTTPS URL and point `VITE_API_URL` at that instead.

Remember the backend still needs its own credentials filled in
(`safeopen-backend/.env`: the `FIREBASE_*` and `SUPABASE_SERVICE_ROLE_KEY`
values) for scans, auth, and history to work — see the comments in that file.

---

## 4. Signed release APK (optional, for distribution)

The debug APK above is fine for testing on your own devices. To distribute:

```bash
# Generate a keystore once:
keytool -genkey -v -keystore rootx-release.keystore -alias rootx -keyalg RSA -keysize 2048 -validity 10000

# Then in Android Studio: Build → Generate Signed Bundle / APK → APK,
# select the keystore, and choose the "release" build variant.
```

---

## What Capacitor does and doesn't give you

- ✅ A real, installable Android app of the full RootX UI (dashboard, scanners,
  news, etc.), running the same code as the web app.
- ⚠️ It does **not** by itself grant access to the phone's installed-app list,
  root status, or live device telemetry — that still requires the native
  Android module (using `PackageManager`, `BatteryManager`, etc.) that's on the
  roadmap. Until then, the Android-Sec page shows the clearly-labeled sample
  data. Capacitor is the shell; that native module is a separate plugin that
  plugs into it.
