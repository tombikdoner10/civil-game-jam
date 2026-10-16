// Jam paneli: otonom sistemin canlı durumunu gösteren yerel sayfa.
// Kullanım: npm run panel  →  http://localhost:5180 (yalnızca bu bilgisayardan erişilir)
// Kaynaklar: GDD/TASKS/JOURNAL, .jam/aktivite.jsonl (kanca), git log, src/data/ai-beyan.json, gh (PR ve yayın).
import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { DEADLINE, FREEZE, ROOT, THEME, jamStatus, readRepoFile, trTime } from './jam-lib.mjs';

const run = promisify(execFile);
const PORT = Number(process.env.PANEL_PORT ?? 5180);
const HTML = join(ROOT, 'scripts', 'panel.html');

/** Markdown'daki "## Başlık" bölümünün satırları. */
function section(md, title) {
  const lines = md.split('\n');
  const start = lines.findIndex((l) => l.trim().toLowerCase() === `## ${title}`.toLowerCase());
  if (start < 0) return [];
  const out = [];
  for (const l of lines.slice(start + 1)) {
    if (/^## /.test(l)) break;
    if (l.trim()) out.push(l.trim());
  }
  return out;
}

function tasks() {
  const md = readRepoFile('TASKS.md');
  const items = (title) =>
    section(md, title)
      .filter((l) => /^- \[[ xX]\]/.test(l))
      .map((l) => ({ done: /^- \[[xX]\]/.test(l), text: l.replace(/^- \[[ xX]\]\s*/, '') }));
  return { simdi: items('Şimdi'), sirada: items('Sırada'), takim: items('Takım işleri'), bitti: items('Bitti') };
}

function activity() {
  try {
    return readFileSync(join(ROOT, '.jam', 'aktivite.jsonl'), 'utf8')
      .trim()
      .split('\n')
      .slice(-120)
      .map((l) => {
        try {
          return JSON.parse(l);
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .reverse();
  } catch {
    return [];
  }
}

async function commits() {
  try {
    const { stdout } = await run('git', ['log', '-25', '--format=%h%x1f%aI%x1f%s%x1f%b%x1e'], { cwd: ROOT });
    return stdout
      .split('\x1e')
      .map((r) => r.trim())
      .filter(Boolean)
      .map((r) => {
        const [hash, date, subject, body] = r.split('\x1f');
        const model = /Co-Authored-By:\s*(Claude[^<]*)</i.exec(body ?? '')?.[1]?.trim() ?? 'takım';
        return { hash, date, subject, model };
      });
  } catch {
    return [];
  }
}

// gh çağrıları yavaş: dakikada bir yenile.
let ghCache = { at: 0, data: { prs: [], deploy: null } };
async function github() {
  if (Date.now() - ghCache.at < 60_000) return ghCache.data;
  const data = { prs: [], deploy: null };
  try {
    const { stdout } = await run('gh', ['pr', 'list', '--json', 'number,title,headRefName,url,createdAt'], { cwd: ROOT });
    data.prs = JSON.parse(stdout);
  } catch {}
  try {
    const { stdout } = await run('gh', ['run', 'list', '--limit', '1', '--json', 'status,conclusion,displayTitle,updatedAt,url'], { cwd: ROOT });
    data.deploy = JSON.parse(stdout)[0] ?? null;
  } catch {}
  ghCache = { at: Date.now(), data };
  return data;
}

function aiDeclaration() {
  try {
    return JSON.parse(readRepoFile('src/data/ai-beyan.json')).kategoriler;
  } catch {
    return {};
  }
}

async function snapshot() {
  const s = jamStatus();
  const gdd = readRepoFile('GDD.md');
  const pick = (re) => re.exec(gdd)?.[1]?.trim() ?? '';
  return {
    ...s,
    tr: trTime(s.t),
    times: { theme: THEME, freeze: FREEZE, deadline: DEADLINE },
    gdd: {
      tema: section(gdd, 'Tema').filter((l) => !l.startsWith('_')).join(' '),
      konsept: pick(/\*\*Tek cümle:\*\*[ \t]*(.*)/),
      dongu: pick(/\*\*Çekirdek döngü[^*\n]*\*\*[ \t]*(.*)/),
    },
    tasks: tasks(),
    journal: section(readRepoFile('JOURNAL.md'), 'Günlük').slice(-40).reverse(),
    activity: activity(),
    commits: await commits(),
    beyan: aiDeclaration(),
    ...(await github()),
  };
}

createServer(async (req, res) => {
  try {
    if (req.url === '/api') {
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
      res.end(JSON.stringify(await snapshot()));
    } else {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(readFileSync(HTML));
    }
  } catch (error) {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    res.end(String(error));
  }
}).listen(PORT, '127.0.0.1', () => console.log(`Jam paneli: http://localhost:${PORT}`));
