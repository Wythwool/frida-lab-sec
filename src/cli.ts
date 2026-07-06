#!/usr/bin/env node
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

type Mode = "attach" | "spawn";
type OutputMode = "pretty" | "ndjson";

type RunArgs = {
  command: "run";
  mode: Mode;
  target: string;
  usb: boolean;
  pack?: string;
  scripts: string[];
  output: OutputMode;
  dryRun: boolean;
  resume: boolean;
};

type ListArgs = { command: "list" };
type ValidateArgs = { command: "validate"; pack?: string };
type ParsedArgs = RunArgs | ListArgs | ValidateArgs | { command: "help" } | { command: "version" };

type PackSummary = {
  name: string;
  path: string;
  scripts: string[];
};

const VERSION = "0.2.0";
const ROOT = findProjectRoot();

export function parseArgs(argv = process.argv.slice(2)): ParsedArgs {
  if (argv.length === 0 || argv[0] === "-h" || argv[0] === "--help" || argv[0] === "help") {
    return { command: "help" };
  }
  if (argv[0] === "--version" || argv[0] === "version") {
    return { command: "version" };
  }
  if (argv[0] === "list") {
    return { command: "list" };
  }
  if (argv[0] === "validate") {
    const pack = valueAfter(argv, "--pack");
    return { command: "validate", pack };
  }

  const first = argv[0] === "run" ? argv[1] : argv[0];
  const offset = argv[0] === "run" ? 1 : 0;
  if (first !== "attach" && first !== "spawn") {
    throw new CliError("expected command: attach, spawn, list, validate, or run", 2);
  }
  const target = argv[offset + 1];
  if (!target) throw new CliError("target process, package, or bundle id is required", 2);

  const scripts: string[] = [];
  let pack: string | undefined;
  let usb = false;
  let output: OutputMode = "pretty";
  let dryRun = false;
  let resume = true;

  for (let i = offset + 2; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "--usb":
        usb = true;
        break;
      case "--ndjson":
        output = "ndjson";
        break;
      case "--pretty":
        output = "pretty";
        break;
      case "--dry-run":
        dryRun = true;
        break;
      case "--no-resume":
        resume = false;
        break;
      case "--pack":
        pack = requiredValue(argv, ++i, "--pack");
        break;
      case "--scripts":
        scripts.push(...requiredValue(argv, ++i, "--scripts").split(",").map((item) => item.trim()).filter(Boolean));
        break;
      default:
        scripts.push(arg);
    }
  }

  return { command: "run", mode: first, target, usb, pack, scripts, output, dryRun, resume };
}

export function listPacks(root = ROOT): PackSummary[] {
  const dir = path.join(root, "packs");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((file) => {
      const name = file.replace(/\.json$/, "");
      const packPath = path.join(dir, file);
      return { name, path: packPath, scripts: readPack(name, root) };
    });
}

export function resolveScripts(pack: string | undefined, scripts: string[], root = ROOT): string[] {
  const out: string[] = [];
  if (pack) out.push(...readPack(pack, root));
  out.push(...scripts);
  return [...new Set(out)];
}

export function validateScripts(scriptPaths: string[], root = ROOT): string[] {
  const errors: string[] = [];
  for (const scriptPath of scriptPaths) {
    if (path.isAbsolute(scriptPath)) {
      errors.push(`${scriptPath}: script path must be relative`);
      continue;
    }
    const full = path.resolve(root, scriptPath);
    if (!full.startsWith(root)) {
      errors.push(`${scriptPath}: script path escapes project root`);
      continue;
    }
    if (!fs.existsSync(full)) {
      errors.push(`${scriptPath}: file does not exist`);
      continue;
    }
    if (!full.endsWith(".js")) {
      errors.push(`${scriptPath}: script must be a JavaScript file`);
      continue;
    }
    const source = fs.readFileSync(full, "utf8");
    if (!source.includes("send(")) {
      errors.push(`${scriptPath}: script does not send events`);
    }
  }
  return errors;
}

async function main(): Promise<number> {
  const args = parseArgs();
  switch (args.command) {
    case "help":
      printHelp();
      return 0;
    case "version":
      console.log(VERSION);
      return 0;
    case "list":
      for (const pack of listPacks()) console.log(`${pack.name}\t${pack.scripts.length} scripts`);
      return 0;
    case "validate":
      return validateCommand(args.pack);
    case "run":
      return run(args);
  }
}

function validateCommand(pack?: string): number {
  const packs = pack ? [pack] : listPacks().map((item) => item.name);
  let errors: string[] = [];
  for (const name of packs) {
    const scripts = readPack(name);
    errors = errors.concat(validateScripts(scripts));
  }
  if (errors.length) {
    for (const error of errors) console.error(error);
    return 1;
  }
  console.log(pack ? `${pack}: ok` : "all packs ok");
  return 0;
}

async function run(args: RunArgs): Promise<number> {
  const scripts = resolveScripts(args.pack, args.scripts);
  if (!scripts.length) throw new CliError("no scripts selected; use --pack or --scripts", 2);
  const errors = validateScripts(scripts);
  if (errors.length) {
    for (const error of errors) console.error(error);
    return 1;
  }

  const plan = { mode: args.mode, target: args.target, usb: args.usb, pack: args.pack ?? null, scripts };
  if (args.dryRun) {
    console.log(JSON.stringify(plan, null, 2));
    return 0;
  }

  const frida = await import("frida");
  const device = args.usb ? await frida.getUsbDevice() : await frida.getLocalDevice();
  const pid = args.mode === "spawn" ? await device.spawn([args.target]) : 0;
  const session = args.mode === "spawn" ? await device.attach(pid) : await device.attach(args.target);

  for (const rel of scripts) {
    const source = fs.readFileSync(path.join(ROOT, rel), "utf8");
    const script = await session.createScript(source);
    script.message.connect((message: any) => {
      if (message.type === "send") {
        const payload = normalizePayload(message.payload, rel);
        console.log(args.output === "ndjson" ? JSON.stringify(payload) : JSON.stringify(payload, null, 2));
      } else if (message.type === "error") {
        console.error(message.stack ?? JSON.stringify(message));
      }
    });
    await script.load();
  }

  if (args.mode === "spawn" && pid && args.resume) await device.resume(pid);
  console.error(`loaded ${scripts.length} scripts`);
  await new Promise<void>(() => undefined);
  return 0;
}

function normalizePayload(payload: any, script: string): Record<string, unknown> {
  if (payload && typeof payload === "object") {
    return { script, ...payload };
  }
  return { script, event: "message", payload };
}

function readPack(name: string, root = ROOT): string[] {
  if (!/^[a-z0-9_-]+$/i.test(name)) throw new CliError(`invalid pack name: ${name}`, 2);
  const packPath = path.join(root, "packs", `${name}.json`);
  if (!fs.existsSync(packPath)) throw new CliError(`pack not found: ${name}`, 2);
  const parsed = JSON.parse(fs.readFileSync(packPath, "utf8"));
  if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) {
    throw new CliError(`pack is not a string array: ${name}`, 2);
  }
  return parsed;
}

function findProjectRoot(): string {
  let dir = path.dirname(fileURLToPath(import.meta.url));
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, "package.json")) && fs.existsSync(path.join(dir, "packs"))) return dir;
    dir = path.dirname(dir);
  }
  return process.cwd();
}

function valueAfter(argv: string[], key: string): string | undefined {
  const index = argv.indexOf(key);
  return index >= 0 ? argv[index + 1] : undefined;
}

function requiredValue(argv: string[], index: number, option: string): string {
  const value = argv[index];
  if (!value || value.startsWith("--")) throw new CliError(`${option} requires a value`, 2);
  return value;
}

function printHelp(): void {
  console.error(`usage:
  frida-lab-sec list
  frida-lab-sec validate [--pack android_core|ios_core]
  frida-lab-sec attach TARGET [--usb] [--pack NAME] [--scripts a.js,b.js] [--ndjson] [--dry-run]
  frida-lab-sec spawn BUNDLE [--usb] [--pack NAME] [--scripts a.js,b.js] [--ndjson] [--no-resume]`);
}

class CliError extends Error {
  constructor(message: string, readonly code: number) {
    super(message);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().then((code) => process.exit(code)).catch((error) => {
    if (error instanceof CliError) {
      console.error(error.message);
      process.exit(error.code);
    }
    console.error(error);
    process.exit(1);
  });
}
