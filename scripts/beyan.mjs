// Yapay zekâ beyanını üretir (kural 4.2, 4.4): beş kategorinin (görsel, ses, kod, metin, diğer) her biri için
// Kullanıldı / Kullanılmadı, araç, amaç ve oyunda kullanıldığı yer.
//   Girdiler: docs/ai-kayit.jsonl (kancanın otomatik kaydı) + docs/ai-elle.json (elle eklenenler)
//             + docs/ai-ozet.json (kategori başına okunur özet, elle yazılır)
//   Çıktılar: src/data/ai-beyan.json (oyundaki Emeği Geçenler, özet), docs/AI_BEYAN.md (üstte teslim formu özeti,
//             altta ayrıntılı kayıt), README tablosu (özet)
// Kullanım:
//   node scripts/beyan.mjs                       yeniden üret
//   node scripts/beyan.mjs --stage               üret ve git'e ekle (commit kancası kullanır)
//   node scripts/beyan.mjs ekle <görsel|ses|kod|metin|diğer> "<amaç>" "<kullanıldığı yer>"
//     (Bash ile çalışan betikler gibi kancanın göremediği AI kullanımları için)
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CATEGORIES, LOG, MANUAL, ROOT, isIgnored, tagToCategory } from './jam-lib.mjs';

const OZET = join(ROOT, 'docs', 'ai-ozet.json');

const TOOL = 'Claude (Anthropic), Claude Code üzerinden';
// Ajan → model, kaydın zamanına göre (UTC). Kaynak: alt ajan dökümleri (subagents/*.jsonl).
//   gelistirici: G1, G2 ve ilk G2b çağrısı (16 Ekim 16.30Z–17.01Z) Sonnet 5.5; 17.02Z'den beri Opus 5.5.
//   test-oyuncusu: son Sonnet çağrısı 16 Ekim 22.52Z'de bitti; 23.00Z'den beri Opus 5.5.
//   lider ve elestirmen: her zaman Opus 5.5.
const OPUS = 'Claude Opus 5.5';
const SONNET = 'Claude Sonnet 5.5';
const SONNET_UNTIL = {
  gelistirici: '2026-10-16T17:02:00Z',
  'test-oyuncusu': '2026-10-16T22:56:00Z',
};
function modelOf({ ajan, zaman }) {
  if (ajan === 'lider' || ajan === 'elestirmen') return OPUS;
  if (ajan in SONNET_UNTIL) return zaman && Date.parse(zaman) < Date.parse(SONNET_UNTIL[ajan]) ? SONNET : OPUS;
  return 'Claude';
}
const DEFAULT_PURPOSE = {
  visual: 'Görselleri kodla çizen kodu yazdı',
  audio: 'Sesleri kodla üreten kodu yazdı',
  code: 'Oyunun kodunu yazdı',
  text: 'Metinleri yazdı',
  other: 'Diğer geliştirme desteği',
};

const args = process.argv.slice(2);
const readJson = (path, fallback) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return fallback;
  }
};
const manual = readJson(MANUAL, []);

if (args[0] === 'ekle') {
  const [, tag, amac, yer] = args;
  const kategori = tagToCategory(tag);
  if (!kategori || !amac || !yer) {
    console.error('Kullanım: node scripts/beyan.mjs ekle <görsel|ses|kod|metin|diğer> "<amaç>" "<kullanıldığı yer>"');
    process.exit(1);
  }
  manual.push({ kategori, amac, yer, model: 'Claude Opus 5.5', zaman: new Date().toISOString() });
  writeFileSync(MANUAL, JSON.stringify(manual, null, 2) + '\n');
}

const log = existsSync(LOG)
  ? readFileSync(LOG, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      // Beyan dosyalarının kendisi (ör. docs/ai-ozet.json) yer listesine girmez; kayıt satırı dosyada kalır.
      .filter((e) => !isIgnored(e.dosya ?? ''))
  : [];

const unique = (list) => [...new Set(list.filter(Boolean))];

/** Dosya listesini okunur yerlere çevirir: "src/scenes/ (3 dosya)", "README.md". */
function places(files) {
  const groups = new Map();
  for (const f of files) {
    const parts = f.split('/');
    const key = parts.length >= 3 ? parts.slice(0, 2).join('/') : parts.length === 2 ? parts[0] : f;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(f);
  }
  return [...groups].map(([key, list]) => (list.length === 1 ? list[0] : `${key}/ (${list.length} dosya)`));
}

const result = {};
for (const { id } of CATEGORIES) {
  const auto = log.filter((e) => e.kategori === id);
  const hand = manual.filter((e) => e.kategori === id);
  const models = unique([...hand.map((e) => e.model), ...auto.map(modelOf)]);
  const purposes = unique(hand.map((e) => e.amac));
  if (auto.length && purposes.length === 0) purposes.push(DEFAULT_PURPOSE[id]);
  result[id] = {
    kullanildi: auto.length + hand.length > 0,
    arac: models.length ? `${TOOL} (${models.join(', ')})` : TOOL,
    amac: purposes.join('; '),
    yer: unique([...hand.map((e) => e.yer), ...places(unique(auto.map((e) => e.dosya)))]),
  };
}

const label = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]));

// Okunur özet (docs/ai-ozet.json, elle yazılır): oyunda, teslim formunda ve README'de bu gösterilir.
// Ayrıntılı kayıt (result) AI_BEYAN.md'nin altında eksiksiz kalır. Özeti olmayan kullanılmış kategori ayrıntılı metne düşer.
const ozetDosya = readJson(OZET, null);
const summary = {};
for (const { id } of CATEGORIES) {
  const c = result[id];
  const o = ozetDosya?.[id];
  const ozetVar = Boolean(o?.amac && Array.isArray(o.yer) && o.yer.length);
  if (!ozetDosya || (!c.kullanildi && !ozetVar)) {
    summary[id] = c;
  } else if (c.kullanildi && !ozetVar) {
    console.warn(`Uyarı: "${label[id]}" kayıtta Kullanıldı ama docs/ai-ozet.json'da özeti yok; ayrıntılı metin kullanıldı.`);
    summary[id] = c;
  } else {
    if (!c.kullanildi) {
      console.warn(`Uyarı: "${label[id]}" docs/ai-ozet.json'da var ama kayıtta yok; özet yine de Kullanıldı olarak gösterildi.`);
    }
    summary[id] = { kullanildi: true, arac: c.arac, amac: o.amac, yer: o.yer };
  }
}

const writeIfChanged = (path, content) => {
  const old = existsSync(path) ? readFileSync(path, 'utf8') : null;
  if (old !== content) writeFileSync(path, content);
};

writeIfChanged(join(ROOT, 'src', 'data', 'ai-beyan.json'), JSON.stringify({ kategoriler: summary }, null, 2) + '\n');

/** Bir kategori bölümü: "## Görsel: Kullanıldı" + araç, amaç, yer. */
const section = (id, c, level, joinPlaces) =>
  c.kullanildi
    ? [`${level} ${label[id]}: Kullanıldı`, '', `- **Araç:** ${c.arac}`, `- **Amaç:** ${c.amac}`, `- **Kullanıldığı yer:** ${joinPlaces(c.yer)}`, '']
    : [`${level} ${label[id]}: Kullanılmadı`, ''];
const md = [
  '# Yapay zekâ beyanı (teslim formu için)',
  '',
  'Bu dosya `npm run beyan` ile otomatik üretilir; elle düzenleme. Kaynak: `docs/ai-kayit.jsonl` (Claude Code kancasının',
  'otomatik kaydı), `docs/ai-elle.json` (elle eklenenler) ve `docs/ai-ozet.json` (okunur özet, elle yazılır).',
  '',
  '## Teslim formu için (özet)',
  '',
  'Teslim formunda her kategori için aşağıdakini seç ve açıklamayı yapıştır. Oyundaki Emeği Geçenler ekranı ve README de bu özeti gösterir.',
  '',
  ...CATEGORIES.flatMap(({ id }) => section(id, summary[id], '###', (yer) => yer.join('; '))),
  '## Ayrıntılı kayıt',
  '',
  'Kancanın ve elle eklenen kayıtların tam dökümü; özet bunların hepsini kapsar.',
  '',
  ...CATEGORIES.flatMap(({ id }) => section(id, result[id], '###', (yer) => yer.join(', '))),
].join('\n');
writeIfChanged(join(ROOT, 'docs', 'AI_BEYAN.md'), md);

const readmePath = join(ROOT, 'README.md');
const readme = readFileSync(readmePath, 'utf8');
const table = [
  '| Kategori | Durum | Araç | Amaç | Kullanıldığı yer |',
  '|---|---|---|---|---|',
  ...CATEGORIES.map(({ id }) => {
    const c = summary[id];
    return c.kullanildi
      ? `| ${label[id]} | Kullanıldı | ${c.arac} | ${c.amac} | ${c.yer.join('; ')} |`
      : `| ${label[id]} | Kullanılmadı | | | |`;
  }),
].join('\n');
const updated = readme.replace(
  /<!-- AI-BEYAN:BASLA -->[\s\S]*<!-- AI-BEYAN:BITIR -->/,
  `<!-- AI-BEYAN:BASLA -->\n${table}\n<!-- AI-BEYAN:BITIR -->`,
);
writeIfChanged(readmePath, updated);

if (args.includes('--stage')) {
  try {
    execFileSync('git', ['add', 'src/data/ai-beyan.json', 'docs/AI_BEYAN.md', 'README.md', 'docs/ai-kayit.jsonl', 'docs/ai-elle.json', 'docs/ai-ozet.json'], {
      cwd: ROOT,
      stdio: 'ignore',
    });
  } catch {
    // git yoksa ya da dosya izlenmiyorsa sessizce geç.
  }
}

const used = CATEGORIES.filter(({ id }) => result[id].kullanildi).map(({ id }) => label[id]);
console.log(`AI beyanı güncellendi. Kullanılan kategoriler: ${used.join(', ') || 'yok'} (${log.length} otomatik kayıt, ${manual.length} elle).`);
