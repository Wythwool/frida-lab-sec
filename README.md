# frida-lab-sec

`frida-lab-sec` is a small mobile instrumentation lab for authorized Android and iOS testing. It ships curated Frida scripts for watching risky APIs and a TypeScript CLI that can validate packs, show a launch plan, and attach or spawn with consistent JSON output.

The scripts observe API usage and forward events. They do not bypass platform protections, persist anything on the device, or modify app data.

## What it watches

- Android process execution through `Runtime.exec` and `ProcessBuilder`
- Android WebView JavaScript bridges and URL connections
- Android keystore and `Cipher.init`
- OkHttp request execution
- iOS `execve`, `system`, URL opening, keychain calls, URL loading, and WebView JavaScript settings
- lightweight Android/iOS class discovery helpers for lab orientation

## Install

```bash
npm i
npm run build
```

## Commands

```bash
node dist/cli.js list
node dist/cli.js validate
node dist/cli.js validate --pack android_core
node dist/cli.js attach com.example.app --usb --pack android_core --ndjson
node dist/cli.js spawn com.example.app --usb --pack ios_core --ndjson
node dist/cli.js attach com.example.app --pack android_core --dry-run
```

`--dry-run` resolves the selected pack and scripts without contacting a Frida device. This is useful in CI and before a live session.

## Output

Pretty JSON is the default. `--ndjson` writes one compact JSON event per line.

Each event includes the script path plus the fields sent by the Frida script, for example:

```json
{"script":"scripts/android/exec_watch.js","platform":"android","category":"process","api":"Runtime.exec(String)","command":"id"}
```

## Tests

```bash
npm test
```

The test suite builds the CLI, validates all shipped packs, checks argument parsing, and verifies dry-run behavior without requiring a device.
