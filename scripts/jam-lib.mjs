// Jam sisteminin ortak yardımcıları: saatler, beyan kategorileri, dosya yolları.
// Kancalar (.claude/hooks) ve betikler (scripts) kullanır. Oyuna özgü bir şey içermez.
import { closeSync, openSync, readFileSync, readSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = fileURLToPath(new URL('..', import.meta.url));
export const LOG = join(ROOT, 'docs', 'ai-kayit.jsonl');
export const MANUAL = join(ROOT, 'docs', 'ai-elle.json');

// Jam saatleri (UTC). Türkiye UTC+3, yaz saati uygulaması yok.
export const THEME = Date.UTC(2026, 9, 16, 15, 0); // 16 Ekim 18.00: tema, geliştirme başlar
export const FREEZE = Date.UTC(2026, 9, 18, 12, 0); // 18 Ekim 15.00: kod dondurma
export const DEADLINE = Date.UTC(2026, 9, 18, 15, 0); // 18 Ekim 18.00: son teslim, push yok

/** Şimdiki zaman (ms). Test için JAM_NOW ortam değişkeniyle değiştirilebilir (ISO tarih). */
export const now = () => (process.env.JAM_NOW ? Date.parse(process.env.JAM_NOW) : Date.now());

/** UTC+3 saatiyle okunur tarih: "Cmt 03:12". */
export function trTime(ms) {
  const d = new Date(ms + 3 * 3600 * 1000);
  const day = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'][d.getUTCDay()];
  return `${day} ${d.getUTCDate()} Ekim ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

export const CATEGORIES = [
  { id: 'visual', label: 'Görsel' },
  { id: 'audio', label: 'Ses' },
  { id: 'code', label: 'Kod' },
  { id: 'text', label: 'Metin' },
  { id: 'other', label: 'Diğer' },
];

const TAGS = { görsel: 'visual', ses: 'audio', kod: 'code', metin: 'text', diğer: 'other' };
export const tagToCategory = (tag) => TAGS[tag];

// Beyana girmeyen dosyalar: üretilen beyan dosyaları, proje hafızası, jam araç ayarları ve iç belgeler (oyunda yok).
const IGNORE = [
  /^docs\/(ai-kayit\.jsonl|ai-elle\.json|AI_BEYAN\.md)$/,
  /^src\/data\/ai-beyan\.json$/,
  /^(GDD|TASKS|JOURNAL|CLAUDE)\.md$/,
  /^docs\/(KURALLAR|TESLIM|TESLIM_FORMU|BULUT|ACIL)\.md$/,
  /^\.claude\//,
  /^\.jam\//,
  /^(node_modules|dist|dist-single|teslim)\//,
  /^package-lock\.json$/,
];

/** Mutlak yol → repo içi yol ("src/game/x.ts"); repo dışıysa null. */
export function repoPath(absPath, cwd = ROOT) {
  const rel = relative(ROOT, resolve(cwd, absPath)).split(sep).join('/');
  return rel.startsWith('..') || rel === '' ? null : rel;
}

function head(absPath) {
  try {
    const fd = openSync(absPath, 'r');
    const buf = Buffer.alloc(512);
    const n = readSync(fd, buf, 0, 512, 0);
    closeSync(fd);
    return buf.subarray(0, n).toString('utf8');
  } catch {
    return '';
  }
}

/**
 * Repo içi dosya → beyan kategorisi ('visual' | 'audio' | 'code' | 'text' | 'other'), yok sayılacaksa null.
 * Dosyanın ilk satırlarındaki "@beyan <görsel|ses|kod|metin|diğer>" etiketi her kuralın önüne geçer.
 */
export function categorize(rel, absPath) {
  if (IGNORE.some((r) => r.test(rel))) return null;
  const tag = /@beyan\s+(görsel|ses|kod|metin|diğer)/.exec(head(absPath ?? join(ROOT, rel)));
  if (tag) return TAGS[tag[1]];
  if (/\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(rel) || rel.startsWith('src/art/')) return 'visual';
  if (/\.(mp3|ogg|wav|m4a|flac)$/i.test(rel) || /^src\/(audio|sounds)\//.test(rel)) return 'audio';
  if (/\.(md|txt)$/i.test(rel)) return 'text';
  if (/\.(ts|tsx|js|mjs|cjs|json|css|html|ya?ml)$/i.test(rel)) return 'code';
  return 'other';
}

export function readRepoFile(name) {
  try {
    return readFileSync(join(ROOT, name), 'utf8');
  } catch {
    return '';
  }
}

/** Jam durumu: faz, kontrol noktaları, eleştirmen zamanı, açık görevler ve liderin sıradaki işleri. */
export function jamStatus(t = now()) {
  const gdd = readRepoFile('GDD.md');
  const journal = readRepoFile('JOURNAL.md');
  const tasks = readRepoFile('TASKS.md');
  const field = (re) => re.exec(journal)?.[1]?.trim() ?? '?';

  const conceptChosen = /Konsept durumu:\s*SEÇİLDİ/i.test(gdd);
  const checkpoints = {
    k1: field(/Kontrol 1[^:]*:\s*(.+)/),
    k2: field(/Kontrol 2[^:]*:\s*(.+)/),
    k3: field(/Kontrol 3[^:]*:\s*(.+)/),
  };
  const critic = field(/Son eleştirmen:\s*(.+)/);
  const usage = field(/Kullanım düzeyi:\s*(.+)/);
  const criticMs = Date.parse(critic);
  const criticAge = Number.isNaN(criticMs) ? Infinity : (t - criticMs) / 3600000;

  let phase;
  if (t < THEME) phase = 'tema-oncesi';
  else if (t >= DEADLINE) phase = 'bitti';
  else if (t >= FREEZE) phase = 'dondurma-teslim';
  else if (!conceptChosen) phase = 'konsept';
  else phase = 'gelistirme';

  const open = tasks.split('\n').filter((l) => /^\s*- \[ \]/.test(l));
  const count = (tag) => open.filter((l) => l.includes(tag)).length;

  const todo = [];
  if (phase === 'tema-oncesi') todo.push(`Tema ${trTime(THEME)}'de açıklanacak. Oyuna özgü hiçbir şey üretme.`);
  if (phase === 'konsept') todo.push('Kullanıcıdan temayı al; kullanıcı /konsept komutunu çalıştırmalı (xhigh). Kontrol 1 bekliyor.');
  if (phase === 'gelistirme') {
    if (criticAge >= 3) todo.push('Eleştirmen zamanı (son çalışma 3 saatten eski ya da hiç yok).');
    if (/BEKLİYOR/i.test(checkpoints.k2) && t >= Date.UTC(2026, 9, 17, 11, 0)) {
      todo.push('Ara oyun testi (Kontrol 2) Cumartesi 14.00 hedefini geçti; oynanabilir sürümü kullanıcıya göster.');
    }
    if (FREEZE - t < 3 * 3600000) todo.push('Kod dondurmaya 3 saatten az kaldı: yeni özellik yok, cila ve hata düzeltme.');
  }
  if (phase === 'dondurma-teslim') todo.push('Kod dondu. Kullanıcı /dondur (xhigh) ile planı yapmadıysa hatırlat; sonra ZIP + smoke, ardından /teslim-kontrol.');
  if (phase === 'bitti') todo.push('Son teslim geçti. Push yok; döngüyü durdur.');

  return {
    t,
    phase,
    conceptChosen,
    checkpoints,
    critic,
    criticAge,
    usage,
    open: open.length,
    counts: { teknik: count('[teknik]'), takim: count('[takım]') },
    todo,
  };
}

export async function readStdinJson() {
  let data = '';
  for await (const chunk of process.stdin) data += chunk;
  try {
    return JSON.parse(data || '{}');
  } catch {
    return {};
  }
}
