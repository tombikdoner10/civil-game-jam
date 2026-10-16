// Jam sisteminin ortak yardımcıları: saatler, beyan kategorileri, dosya yolları.
// Kancalar (.claude/hooks) ve betikler (scripts) kullanır. Oyuna özgü bir şey içermez.
import { closeSync, openSync, readSync } from 'node:fs';
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

export async function readStdinJson() {
  let data = '';
  for await (const chunk of process.stdin) data += chunk;
  try {
    return JSON.parse(data || '{}');
  } catch {
    return {};
  }
}
