// Duman testi: görünmez Edge/Chrome açar, oyunu yükler, açılış ekranına ve menüdeki "Oyna"ya tıklar,
// her adımda ekran görüntüsü alır ve sayfadaki hataları yazar. Teslimden önce ZIP'i ya da canlı siteyi denemek için.
// Kullanım: node scripts/smoke.mjs [adres-ya-da-dosya] [çıktı-klasörü]
//   node scripts/smoke.mjs                                   → dist-single/index.html (npm run zip çıktısı)
//   node scripts/smoke.mjs https://tombikdoner10.github.io/civil-game-jam/
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const target = process.argv[2] ?? 'dist-single/index.html';
const outDir = process.argv[3] ?? 'teslim/smoke';
const url = /^https?:\/\//.test(target) ? target : pathToFileURL(resolve(target)).href;
const browser = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].find((p) => existsSync(p));
if (!browser) throw new Error('Edge ya da Chrome bulunamadı');

const W = 1280;
const H = 720;
const PORT = 9333;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Oyunun mantıksal çözünürlüğü (1920×1080) → ekran görüntüsü koordinatı.
const at = (x, y) => [(x * W) / 1920, (y * H) / 1080];

mkdirSync(outDir, { recursive: true });
const profile = mkdtempSync(join(tmpdir(), 'pe-smoke-'));
const proc = spawn(browser, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  `--window-size=${W},${H}`,
  '--no-first-run',
  'about:blank',
]);

let ws;
const errors = [];
try {
  let page;
  for (let i = 0; i < 50 && !page; i++) {
    await sleep(200);
    page = await fetch(`http://127.0.0.1:${PORT}/json`).then((r) => r.json()).then((list) => list.find((t) => t.type === 'page')).catch(() => undefined);
  }
  if (!page) throw new Error('Tarayıcıya bağlanılamadı');

  ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r, j) => ((ws.onopen = r), (ws.onerror = j)));
  let nextId = 0;
  const pending = new Map();
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params.exceptionDetails;
      errors.push(d.exception?.description ?? d.text);
    } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      errors.push(msg.params.args.map((a) => a.value ?? a.description).join(' '));
    }
  };
  const send = (method, params = {}) =>
    new Promise((r) => {
      const id = ++nextId;
      pending.set(id, r);
      ws.send(JSON.stringify({ id, method, params }));
    });
  const shot = async (name) => {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(outDir, name), Buffer.from(res.result.data, 'base64'));
    console.log(`  ${name}`);
  };
  const click = async ([x, y]) => {
    for (const type of ['mousePressed', 'mouseReleased']) {
      await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
    }
  };

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  console.log(`Açılıyor: ${url}`);
  await send('Page.navigate', { url });
  await sleep(2500);
  await shot('1-acilis.png');
  await click(at(960, 540));
  await sleep(2800);
  await shot('2-menu.png');
  await click(at(960, 530)); // menüdeki ilk buton: Oyna
  await sleep(1500);
  await shot('3-oyun.png');
} finally {
  ws?.close();
  proc.kill();
  await sleep(300);
  rmSync(profile, { recursive: true, force: true });
}

if (errors.length) {
  console.error(`\nSayfada ${errors.length} hata:`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`\nHata yok. Ekran görüntüleri: ${outDir}/`);
