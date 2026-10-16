// PostToolUse kancası (bütün araçlar): kim (lider ya da hangi alt ajan) hangi aracı ne için kullandı,
// .jam/aktivite.jsonl'a tek satır yazar. Jam paneli (npm run panel) bu dosyayı canlı akış olarak gösterir.
import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, readStdinJson, repoPath } from '../../scripts/jam-lib.mjs';

const input = await readStdinJson();
const tool = String(input.tool_name ?? '?');
const ti = input.tool_input ?? {};
const short = (s, n = 140) => {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};
const file = (p) => (p ? repoPath(p, input.cwd) ?? p : '');

let ozet;
switch (tool) {
  case 'Bash':
  case 'PowerShell':
    ozet = ti.description ? `${ti.description} · ${short(ti.command, 80)}` : short(ti.command);
    break;
  case 'Read':
  case 'Write':
  case 'Edit':
  case 'MultiEdit':
  case 'NotebookEdit':
    ozet = file(ti.file_path ?? ti.notebook_path);
    break;
  case 'Agent':
  case 'Task':
    ozet = `${ti.subagent_type ?? 'ajan'} → ${short(ti.description ?? ti.prompt, 100)}${ti.effort ? ` (efor: ${ti.effort})` : ''}${ti.model ? ` (model: ${ti.model})` : ''}`;
    break;
  case 'Grep':
  case 'Glob':
    ozet = short(ti.pattern);
    break;
  case 'Skill':
    ozet = `/${ti.skill ?? ''} ${short(ti.args ?? '', 60)}`.trim();
    break;
  default:
    ozet = short(ti.description ?? ti.action ?? ti.url ?? ti.query ?? '');
}

try {
  mkdirSync(join(ROOT, '.jam'), { recursive: true });
  appendFileSync(
    join(ROOT, '.jam', 'aktivite.jsonl'),
    JSON.stringify({ zaman: new Date().toISOString(), ajan: input.agent_type ?? 'lider', arac: tool.replace(/^mcp__[^_]+__/, ''), ozet }) + '\n',
  );
} catch {
  // Panel kaydı çalışmayı asla durdurmasın.
}
