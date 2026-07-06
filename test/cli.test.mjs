import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

import { listPacks, parseArgs, resolveScripts, validateScripts } from "../dist/cli.js";

test("parses attach arguments", () => {
  const args = parseArgs(["attach", "com.example.app", "--usb", "--pack", "android_core", "--ndjson"]);
  assert.equal(args.command, "run");
  assert.equal(args.mode, "attach");
  assert.equal(args.target, "com.example.app");
  assert.equal(args.usb, true);
  assert.equal(args.pack, "android_core");
  assert.equal(args.output, "ndjson");
});

test("lists and validates shipped packs", () => {
  const packs = listPacks();
  assert.deepEqual(packs.map((pack) => pack.name), ["android_core", "ios_core"]);
  for (const pack of packs) {
    assert.equal(validateScripts(pack.scripts).length, 0, pack.name);
  }
});

test("resolves scripts without duplicates", () => {
  const scripts = resolveScripts("android_core", ["scripts/android/exec_watch.js"]);
  assert.equal(scripts.filter((item) => item === "scripts/android/exec_watch.js").length, 1);
});

test("cli validate and dry-run work without a Frida device", () => {
  const validate = execFileSync(process.execPath, ["dist/cli.js", "validate"], { encoding: "utf8" });
  assert.match(validate, /all packs ok/);

  const plan = execFileSync(
    process.execPath,
    ["dist/cli.js", "attach", "com.example.app", "--pack", "android_core", "--dry-run"],
    { encoding: "utf8" },
  );
  const parsed = JSON.parse(plan);
  assert.equal(parsed.mode, "attach");
  assert.equal(parsed.scripts.length >= 4, true);
});
