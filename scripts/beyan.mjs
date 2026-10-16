// Yapay zekâ beyanını üretir (kural 4.2, 4.4): beş kategorinin (görsel, ses, kod, metin, diğer) her biri için
// Kullanıldı / Kullanılmadı, araç, amaç ve oyunda kullanıldığı yer.
//   Girdiler: docs/ai-kayit.jsonl (kancanın otomatik kaydı) + docs/ai-elle.json (elle eklenenler)
//   Çıktılar: src/data/ai-beyan.json (oyundaki Emeği Geçenler), docs/AI_BEYAN.md (teslim formu metni), README tablosu
// Kullanım:
//   node scripts/beyan.mjs                       yeniden üret
//   node scripts/beyan.mjs --stage               üret ve git'e ekle (commit kancası kullanır)
//   node scripts/beyan.mjs ekle <görsel|ses|kod|metin|diğer> "<amaç>" "<kullanıldığı yer>"
//     (Bash ile çalışan betikler gibi kancanın göremediği AI kullanımları için)
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CATEGORIES, LOG, MANUAL, ROOT, tagToCategory } from './jam-lib.mjs';

const TOOL = 'Claude (Anthropic), Claude Code üzerinden';
const MODEL_OF = {
  lider: 'Claude Opus 5.5',
  gelistirici: 'Claude Sonnet 5.5',
  'test-oyuncusu': 'Claude Sonnet 5.5',
  elestirmen: 'Claude Opus 5.5',
};
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
  const models = unique([...hand.map((e) => e.model), ...auto.map((e) => MODEL_OF[e.ajan] ?? 'Claude')]);
  const purposes = unique(hand.map((e) => e.amac));
  if (auto.length && purposes.length === 0) purposes.push(DEFAULT_PURPOSE[id]);
  result[id] = {
    kullanildi: auto.length + hand.length > 0,
    arac: models.length ? `${TOOL} (${models.join(', ')})` : TOOL,
    amac: purposes.join('; '),
    yer: unique([...hand.map((e) => e.yer), ...places(unique(auto.map((e) => e.dosya)))]),
  };
}

const writeIfChanged = (path, content) => {
  const old = existsSync(path) ? readFileSync(path, 'utf8') : null;
  if (old !== content) writeFileSync(path, content);
};

writeIfChanged(join(ROOT, 'src', 'data', 'ai-beyan.json'), JSON.stringify({ kategoriler: result }, null, 2) + '\n');

const label = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]));
const md = [
  '# Yapay zekâ beyanı (teslim formu için)',
  '',
  'Bu dosya `npm run beyan` ile otomatik üretilir; elle düzenleme. Kaynak: `docs/ai-kayit.jsonl` (Claude Code kancasının',
  'otomatik kaydı) ve `docs/ai-elle.json` (elle eklenenler). Teslim formunda her kategori için aşağıdakini seç ve açıklamayı yapıştır.',
  '',
  ...CATEGORIES.flatMap(({ id }) => {
    const c = result[id];
    if (!c.kullanildi) return [`## ${label[id]}: Kullanılmadı`, ''];
    return [`## ${label[id]}: Kullanıldı`, '', `- **Araç:** ${c.arac}`, `- **Amaç:** ${c.amac}`, `- **Kullanıldığı yer:** ${c.yer.join(', ')}`, ''];
  }),
].join('\n');
writeIfChanged(join(ROOT, 'docs', 'AI_BEYAN.md'), md);

const readmePath = join(ROOT, 'README.md');
const readme = readFileSync(readmePath, 'utf8');
const table = [
  '| Kategori | Durum | Araç | Amaç | Kullanıldığı yer |',
  '|---|---|---|---|---|',
  ...CATEGORIES.map(({ id }) => {
    const c = result[id];
    return c.kullanildi
      ? `| ${label[id]} | Kullanıldı | ${c.arac} | ${c.amac} | ${c.yer.join(', ')} |`
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
    execFileSync('git', ['add', 'src/data/ai-beyan.json', 'docs/AI_BEYAN.md', 'README.md', 'docs/ai-kayit.jsonl', 'docs/ai-elle.json'], {
      cwd: ROOT,
      stdio: 'ignore',
    });
  } catch {
    // git yoksa ya da dosya izlenmiyorsa sessizce geç.
  }
}

const used = CATEGORIES.filter(({ id }) => result[id].kullanildi).map(({ id }) => label[id]);
console.log(`AI beyanı güncellendi. Kullanılan kategoriler: ${used.join(', ') || 'yok'} (${log.length} otomatik kayıt, ${manual.length} elle).`);
