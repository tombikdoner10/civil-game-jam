// Duman testi: görünmez Edge/Chrome açar, oyunu yükler, adımları uygular, her adımda ekran görüntüsü alır
// ve sayfadaki hataları yazar. Teslimden önce ZIP'i ya da canlı siteyi denemek, oynanışı test etmek için.
// Kullanım: node scripts/smoke.mjs [adres-ya-da-dosya] [çıktı-klasörü] [--senaryo dosya.json] [--hd]
//   --hd: görüntüleri 1920×1080 al (oyunun mantıksal çözünürlüğü, 1:1). Varsayılan 1280×720.
//   node scripts/smoke.mjs                                   → dist-single/index.html (npm run zip çıktısı)
//   node scripts/smoke.mjs https://tombikdoner10.github.io/civil-game-jam/
//   npm run smoke -- --senaryo senaryo.json
// Senaryo: adım dizisi. Koordinatlar oyunun 1920×1080 düzlemindedir.
//   [{ "bekle": 2500 }, { "tikla": [960, 540] }, { "tus": "ArrowRight", "sure": 400 }, { "goruntu": "adim.png" }]
//   Sürükle-bırak: { "surukle": [[x1, y1], [x2, y2]] }
// Senaryo verilmezse: açılış → tıkla → menü → "Oyna" → oyun ekranı.
// Tarayıcı yolu bulunamazsa CHROME_PATH ortam değişkeniyle verilebilir.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const argv = process.argv.slice(2);
const scenarioFlag = argv.indexOf('--senaryo');
const scenarioFile = scenarioFlag >= 0 ? argv[scenarioFlag + 1] : null;
const hd = argv.includes('--hd');
const positional = argv.filter(
  (a, i) => a !== '--hd' && (scenarioFlag < 0 || (i !== scenarioFlag && i !== scenarioFlag + 1)),
);
const target = positional[0] ?? 'dist-single/index.html';
const outDir = positional[1] ?? 'teslim/smoke';
// Dosya yolunda sorgu da verilebilir: dist-single/index.html?dev&gun=2&tohum=42
const [targetPath, targetQuery] = target.split(/\?(.*)/s, 2);
const url = /^https?:\/\//.test(target)
  ? target
  : pathToFileURL(resolve(targetPath)).href + (targetQuery !== undefined ? `?${targetQuery}` : '');

const browser = [
  process.env.CHROME_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/microsoft-edge',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].find((p) => p && existsSync(p));
if (!browser) {
  console.error('Tarayıcı bulunamadı (Edge/Chrome/Chromium). CHROME_PATH ile yol ver.');
  process.exit(2);
}

// Bekleme süreleri geçişlerin bitmesine göre (G5b): açılış (yükleme + tıklama kapısı), takım logosu ve menünün
// belirmesi, menüden oyuna geçiş ve belgelerin masaya inmesi. Yavaş makinede de geçişin ortası yakalanmasın.
const DEFAULT_STEPS = [
  { bekle: 3500 },
  { goruntu: '1-acilis.png' },
  { tikla: [960, 540] },
  { bekle: 3800 },
  { goruntu: '2-menu.png' },
  { tikla: [960, 530] }, // menüdeki ilk buton: Oyna
  { bekle: 3200 },
  { goruntu: '3-oyun.png' },
];
const steps = scenarioFile ? JSON.parse(readFileSync(scenarioFile, 'utf8')) : DEFAULT_STEPS;

const W = hd ? 1920 : 1280;
const H = hd ? 1080 : 720;
const PORT = 9300 + Math.floor(Math.random() * 600);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Oyunun mantıksal çözünürlüğü (1920×1080) → görüntü koordinatı.
const at = ([x, y]) => [(x * W) / 1920, (y * H) / 1080];

/** Klavye adı → Chrome DevTools tuş bilgisi (Phaser keyCode kullanır). */
function keyInfo(name) {
  const special = {
    ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40,
    Space: 32, Enter: 13, Escape: 27, Tab: 9, Backspace: 8, Shift: 16,
  };
  if (special[name]) return { key: name === 'Space' ? ' ' : name, code: name, windowsVirtualKeyCode: special[name] };
  const ch = name.length === 1 ? name : name.replace(/^Key|^Digit/, '');
  const upper = ch.toUpperCase();
  const isDigit = /[0-9]/.test(upper);
  return { key: ch.toLowerCase(), code: isDigit ? `Digit${upper}` : `Key${upper}`, windowsVirtualKeyCode: upper.charCodeAt(0) };
}

mkdirSync(outDir, { recursive: true });
const profile = mkdtempSync(join(tmpdir(), 'pe-smoke-'));
const proc = spawn(browser, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  `--window-size=${W},${H}`,
  '--no-first-run',
  '--no-sandbox',
  // Görünmez pencere birkaç saniye sonra arka plana alınıp rAF durmasın (uzun senaryolar donmasın).
  '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding',
  '--disable-background-timer-throttling',
  // Windows'ta pencere örtülme hesabı ve Edge'in uyuyan sekmeleri de sayfayı dondurabiliyor.
  '--disable-features=CalculateNativeWinOcclusion,IntensiveWakeUpThrottling,EdgeSleepingTabs',
  'about:blank',
]);

let ws;
const errors = [];
try {
  let page;
  for (let i = 0; i < 50 && !page; i++) {
    await sleep(200);
    page = await fetch(`http://127.0.0.1:${PORT}/json`)
      .then((r) => r.json())
      .then((list) => list.find((t) => t.type === 'page'))
      .catch(() => undefined);
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

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  // Sayfa odakta ve etkin sayılsın: rAF görünmez pencerede de dursun istemiyoruz.
  await send('Emulation.setFocusEmulationEnabled', { enabled: true });
  await send('Page.setWebLifecycleState', { state: 'active' });
  console.log(`Açılıyor: ${url}`);
  await send('Page.navigate', { url });

  for (const step of steps) {
    if (step.bekle) await sleep(step.bekle);
    if (step.tikla) {
      const [x, y] = at(step.tikla);
      for (const type of ['mousePressed', 'mouseReleased']) {
        await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
      }
    }
    if (step.surukle) {
      // Sürükle-bırak: { "surukle": [[x1, y1], [x2, y2]] } (oyun koordinatı), araya ara noktalar eklenir.
      const [a, b] = step.surukle.map(at);
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: a[0], y: a[1], button: 'left', buttons: 1, clickCount: 1 });
      for (let i = 1; i <= 12; i++) {
        const x = a[0] + ((b[0] - a[0]) * i) / 12;
        const y = a[1] + ((b[1] - a[1]) * i) / 12;
        await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'left', buttons: 1 });
        await sleep(16);
      }
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: b[0], y: b[1], button: 'left', buttons: 0, clickCount: 1 });
    }
    if (step.tus) {
      const info = keyInfo(step.tus);
      await send('Input.dispatchKeyEvent', { type: 'keyDown', ...info, nativeVirtualKeyCode: info.windowsVirtualKeyCode });
      await sleep(step.sure ?? 80);
      await send('Input.dispatchKeyEvent', { type: 'keyUp', ...info, nativeVirtualKeyCode: info.windowsVirtualKeyCode });
    }
    if (step.goruntu) {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      writeFileSync(join(outDir, step.goruntu), Buffer.from(res.result.data, 'base64'));
      console.log(`  ${step.goruntu}`);
    }
  }
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
