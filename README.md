# PulseBridge

An experimental offline-first command station for short acoustic and optical messages, local packet logging, and approximate inertial breadcrumbs. It does not contact emergency services, and is **not** a substitute for certified communications or navigation equipment.

## Run and test

```sh
npm ci
npm run dev
npm test
npm run build
```

Use **Transmit & Live-Decode Test** to render MFSK audio locally and recover its symbols from the waveform without speaker or microphone access. For a two-device test, use a secure origin (HTTPS or localhost), set both devices to **Audible Standard**, enable **Live Mic** on the receiver, and start with a short message at low speaker volume. Use matching bands, unobstructed close range, and keep both tabs visible. High-frequency response varies greatly by device. The spectrogram shows simulated telemetry until live input is enabled. No field range or through-rubble performance is claimed.

For optical tests, run loopback first, then point the receiving camera at the screen pad, set the luma threshold between its dark and bright readings, and send a short payload. Screen signalling is intentionally slow. Avoid exposing people to the flashing display. The web app can start offline after the production service worker installs on an initial HTTPS visit. The packaged Android app loads bundled assets directly.

## Encryption and local data

Encrypted packets contain a random 16-byte salt and 12-byte nonce. AES-256-GCM keys are derived with PBKDF2-SHA-256 (600,000 iterations). Use a strong shared passphrase; it is not persisted. The ledger stores the on-wire bytes, so unencrypted packets remain readable in browser storage. CRC-8 detects transmission errors; it is not authentication. Role switching is a local feature preset, not an authorization boundary.

Live received frames are queued in IndexedDB. Mesh Command Admin can opt into relay or retry the queue against a trusted HTTPS endpoint that accepts JSON `POST` requests and returns 2xx only after durable storage. The relay must support CORS for the app origin and should deduplicate retries by packet `id`. No hosted relay or database is provisioned. Relay on reconnect runs only while the app is open.

## Android and Vercel

Run **Build Android APK and web bundle** in GitHub Actions. The workflow generates the Capacitor Android project, adds media permissions, assembles a debug-signed APK, generates its SHA-256 manifest, and uploads both the APK and the rebuilt Vite output containing `/releases/pulsebridge-release.apk`. Use a persistent signing key for a production or upgradable sideload release.

The web build serves the verified debug APK and its SHA-256 manifest from `public/releases/`. To refresh the download, replace both files together using the `pulsebridge-android` artifact from a successful workflow run. The Android build excludes the previously published APK from its bundled web assets.

## Verification limits

Automated tests exercise framing, CRC rejection, MFSK tone-bin mapping, optical sample timing, and AES-GCM authentication. Real microphones, cameras, Android installation and sensor accuracy require physical-device testing. Experimental echo ranging and Admin custom modem calibration are available; neither is field-validated.
