# frida-lab-sec — mobile security lab (Frida)

**What:** Safe Frida scripts to watch risky APIs (exec, keystore, URL loading, WebView JS), plus anti-obfuscation helpers. Android+iOS demos. Logs as **NDJSON** or pretty JSON.

**Stack:** TypeScript CLI (frida-node) + JS scripts (Android/iOS).

## Quick start
```bash
npm i
npm run build
# Android (USB), attach to running app:
node dist/cli.js attach com.example.app --usb --pack android_core --ndjson
# iOS (USB), spawn by bundle id:
node dist/cli.js spawn com.example.app --usb --pack ios_core --ndjson
```
