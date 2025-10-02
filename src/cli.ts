
import * as fs from 'fs';
import * as path from 'path';
import * as frida from 'frida';

type Mode = 'attach' | 'spawn';
type Args = { mode: Mode, target: string, usb: boolean, pack?: string, scripts?: string[], ndjson?: boolean };

function parseArgs(): Args {
  const a = process.argv.slice(2);
  if (a.length < 2) { usage(); process.exit(1); }
  const mode = (a[0] === 'attach' ? 'attach' : a[0] === 'spawn' ? 'spawn' : null) as Mode | null;
  if (!mode) { usage(); process.exit(1); }
  const target = a[1];
  let usb = false, ndjson = false;
  let pack: string | undefined;
  const scripts: string[] = [];
  for (let i = 2; i < a.length; i++) {
    const k = a[i];
    if (k === '--usb') usb = true;
    else if (k === '--ndjson') ndjson = true;
    else if (k === '--pack' && a[i+1]) { pack = a[++i]; }
    else if (k === '--scripts' && a[i+1]) { scripts.push(...a[++i].split(',')); }
  }
  return { mode, target, usb, pack, scripts: scripts.length? scripts : undefined, ndjson };
}

function usage() {
  console.error("usage: cli attach|spawn <process|bundle> [--usb] [--pack android_core|ios_core] [--scripts a.js,b.js] [--ndjson]");
}

async function loadPack(name: string): Promise<string[]> {
  const p = path.join(process.cwd(), 'packs', name + '.json');
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

async function main() {
  const args = parseArgs();
  const device = args.usb ? await frida.getUsbDevice() : await frida.getLocalDevice();
  const scripts: string[] = [];
  if (args.pack) scripts.push(...await loadPack(args.pack));
  if (args.scripts) scripts.push(...args.scripts);
  if (scripts.length === 0) { console.error("no scripts specified"); process.exit(2); }

  let pid = 0;
  let session: frida.Session;
  if (args.mode === 'attach') {
    session = await device.attach(args.target);
  } else {
    pid = await device.spawn([args.target]);
    session = await device.attach(pid);
  }

  for (const rel of scripts) {
    const fp = path.join(process.cwd(), rel);
    const source = fs.readFileSync(fp, 'utf-8');
    const s = await session.createScript(source);
    s.message.connect(msg => {
      if (msg.type === 'send') {
        const o = msg.payload;
        if (args.ndjson) console.log(JSON.stringify(o));
        else console.log(JSON.stringify(o, null, 2));
      } else if (msg.type === 'error') {
        console.error(msg.stack || JSON.stringify(msg));
      }
    });
    await s.load();
  }

  if (args.mode === 'spawn' && pid) await device.resume(pid);
  console.error("loaded scripts:", scripts.join(', '));
  await new Promise<void>(() => {});
}

main().catch(e => { console.error(e); process.exit(1); });
