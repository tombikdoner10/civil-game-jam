// PostToolUse kancası (Write/Edit): Claude'un yazdığı ya da değiştirdiği her dosyayı beş beyan
// kategorisinden birine ayırıp docs/ai-kayit.jsonl'a ekler. Takımın elle eklediği dosyalar buraya düşmez.
import { appendFileSync } from 'node:fs';
import { LOG, categorize, readStdinJson, repoPath } from '../../scripts/jam-lib.mjs';

const input = await readStdinJson();
const file = input.tool_input?.file_path ?? input.tool_input?.notebook_path;
const rel = file ? repoPath(file, input.cwd) : null;
const category = rel ? categorize(rel) : null;
if (category) {
  const entry = {
    zaman: new Date().toISOString(),
    kategori: category,
    dosya: rel,
    arac: input.tool_name,
    ajan: input.agent_type ?? 'lider',
  };
  try {
    appendFileSync(LOG, JSON.stringify(entry) + '\n');
  } catch {
    // Kayıt yazılamazsa çalışmayı durdurma.
  }
}
