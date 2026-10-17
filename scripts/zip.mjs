// Teslim ZIP'ini hazırlar: tek dosyalık oyun (OYNA.html) + çalıştırma talimatları (BENIOKU.txt).
// Kullanım: npm run zip  →  teslim/prompt-engineers-<oyun>-<commit>.zip
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { strToU8, zipSync } from 'fflate';

const git = (args) => {
  try {
    return execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return '';
  }
};

const title = /export const TITLE = '([^']*)'/.exec(readFileSync('src/config.ts', 'utf8'))?.[1] ?? 'oyun';
const slug =
  title
    .toLocaleLowerCase('tr')
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'oyun';
const sha = git('rev-parse --short HEAD') || 'yerel';
const dirty = git('status --porcelain') !== '';
const name = `prompt-engineers-${slug}-${sha}${dirty ? '-degisiklikli' : ''}`;

const html = readFileSync('dist-single/index.html');
// Windows Not Defteri'nde Türkçe karakterler ve satır sonları düzgün görünsün.
const readme = '﻿' + readFileSync('docs/BENIOKU.txt', 'utf8').replace(/\r?\n/g, '\r\n');

mkdirSync('teslim', { recursive: true });
const out = `teslim/${name}.zip`;
writeFileSync(out, zipSync({ 'OYNA.html': html, 'BENIOKU.txt': strToU8(readme) }, { level: 9 }));

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
console.log(`\nZIP hazır: ${out} (${mb(statSync(out).size)})`);
console.log(`İçinde: OYNA.html (${mb(html.length)}), BENIOKU.txt`);
if (dirty) {
  console.warn(
    "\nUYARI: Kaydedilmemiş değişiklik var. Teslim edilen ZIP repodaki bir commit'le eşleşmeli (kural 3.7). " +
      "Önce commit et, sonra ZIP'i yeniden üret.",
  );
}
