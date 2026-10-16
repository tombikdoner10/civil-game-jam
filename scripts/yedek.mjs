// Yedek: bütün git geçmişi + henüz commit edilmemiş değişiklikler (yeni eklenen dosyalar dahil) tek bir
// dosyada (git bundle). Çalışma dizinine ve git index'ine dokunmaz. Yedekler repo DIŞINDA, ../yedekler/ altında.
// Kullanım:
//   node scripts/yedek.mjs              hemen yedek al
//   node scripts/yedek.mjs --otomatik   son yedek 30 dakikadan eskiyse al (Stop kancası her tur sonunda çağırır)
//   node scripts/yedek.mjs --liste      yedekleri göster
// Geri yükleme (repo bozulursa): git clone ../yedekler/<zaman>.bundle kurtarma
//   Commit edilmemiş anlık durum: cd kurtarma && git checkout yedek/<zaman>
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ROOT, now } from './jam-lib.mjs';

const DIR = join(ROOT, '..', 'yedekler');
const KEEP = 30;
const auto = process.argv.includes('--otomatik');

const git = (args, env = {}) =>
  execFileSync('git', args, { cwd: ROOT, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim();

mkdirSync(DIR, { recursive: true });
const bundles = () =>
  readdirSync(DIR)
    .filter((f) => f.endsWith('.bundle'))
    .map((f) => ({ f, t: statSync(join(DIR, f)).mtimeMs, size: statSync(join(DIR, f)).size }))
    .sort((a, b) => b.t - a.t);

if (process.argv.includes('--liste')) {
  for (const b of bundles()) console.log(`${b.f}  ${(b.size / 1024 / 1024).toFixed(1)} MB  ${new Date(b.t).toLocaleString('tr-TR')}`);
  process.exit(0);
}

const latest = bundles()[0];
if (auto && latest && now() - latest.t < 30 * 60 * 1000) process.exit(0);

try {
  const d = new Date(now() + 3 * 3600 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}-${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}`;

  // Geçici index ile her şeyi (izlenmeyen yeni dosyalar dahil, .gitignore'a uyarak) bir commit nesnesine al.
  const index = join(tmpdir(), `pe-yedek-${process.pid}.index`);
  const gitDir = git(['rev-parse', '--absolute-git-dir']);
  if (existsSync(join(gitDir, 'index'))) copyFileSync(join(gitDir, 'index'), index);
  const env = { GIT_INDEX_FILE: index };
  git(['add', '-A'], env);
  const tree = git(['write-tree'], env);
  rmSync(index, { force: true });
  const snapshot = git(['commit-tree', tree, '-p', 'HEAD', '-m', `Yedek ${stamp} (commit edilmemiş değişiklikler dahil)`], {
    GIT_AUTHOR_NAME: 'yedek',
    GIT_AUTHOR_EMAIL: 'yedek@localhost',
    GIT_COMMITTER_NAME: 'yedek',
    GIT_COMMITTER_EMAIL: 'yedek@localhost',
  });
  const ref = `refs/heads/yedek/${stamp}`;
  git(['update-ref', ref, snapshot]);
  const file = join(DIR, `${stamp}.bundle`);
  try {
    git(['bundle', 'create', file, '--all']);
  } finally {
    git(['update-ref', '-d', ref]);
  }

  for (const old of bundles().slice(KEEP)) rmSync(join(DIR, old.f), { force: true });
  if (!auto) console.log(`Yedek alındı: ${file} (${(statSync(file).size / 1024 / 1024).toFixed(1)} MB). Toplam ${Math.min(bundles().length, KEEP)} yedek.`);
} catch (error) {
  // Otomatik yedek hiçbir zaman çalışmayı durdurmasın.
  if (!auto) {
    console.error(`Yedek alınamadı: ${error.message}`);
    process.exit(1);
  }
}
