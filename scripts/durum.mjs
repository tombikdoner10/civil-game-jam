// Jam durumu: saat, faz, zaman kutuları, kontrol noktaları, eleştirmen zamanı ve açık görevler.
// Lider her döngü adımına bununla başlar: node scripts/durum.mjs
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEADLINE, FREEZE, ROOT, THEME, now, trTime } from './jam-lib.mjs';

const read = (name) => (existsSync(join(ROOT, name)) ? readFileSync(join(ROOT, name), 'utf8') : '');
const gdd = read('GDD.md');
const journal = read('JOURNAL.md');
const tasks = read('TASKS.md');
const t = now();

const until = (ms) => {
  const m = Math.max(0, Math.round((ms - t) / 60000));
  return `${Math.floor(m / 60)} sa ${m % 60} dk`;
};
const line = (re) => re.exec(journal)?.[1]?.trim() ?? '?';

const conceptChosen = /Konsept durumu:\s*SEÇİLDİ/i.test(gdd);
const k1 = line(/Kontrol 1[^:]*:\s*(.+)/);
const k2 = line(/Kontrol 2[^:]*:\s*(.+)/);
const k3 = line(/Kontrol 3[^:]*:\s*(.+)/);
const critic = line(/Son eleştirmen:\s*(.+)/);
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
  if (/BEKLİYOR/i.test(k2) && t >= Date.UTC(2026, 9, 17, 11, 0)) todo.push('Ara oyun testi (Kontrol 2) Cumartesi 14.00 hedefini geçti; oynanabilir sürümü kullanıcıya göster.');
  if (FREEZE - t < 3 * 3600000) todo.push('Kod dondurmaya 3 saatten az kaldı: yeni özellik yok, cila ve hata düzeltme.');
}
if (phase === 'dondurma-teslim') todo.push('Kod dondu. Kullanıcı /dondur (xhigh) ile planı yapmadıysa hatırlat; sonra ZIP + smoke, ardından /teslim-kontrol.');
if (phase === 'bitti') todo.push('Son teslim geçti. Push yok; döngüyü durdur.');

console.log(
  [
    `Saat (UTC+3): ${trTime(t)}`,
    `Faz: ${phase}`,
    `Temaya: ${until(THEME)} · Kod dondurmaya: ${until(FREEZE)} · Son teslime: ${until(DEADLINE)}`,
    `Konsept seçildi mi: ${conceptChosen ? 'evet' : 'hayır'}`,
    `Kontrol 1 (konsept): ${k1} · Kontrol 2 (ara test): ${k2} · Kontrol 3 (teslim): ${k3}`,
    `Son eleştirmen: ${critic}`,
    `Açık görevler: ${open.length} (teknik ${count('[teknik]')}, takım ${count('[takım]')}, bulut ${count('[bulut]')})`,
    ...todo.map((x) => `→ ${x}`),
  ].join('\n'),
);
