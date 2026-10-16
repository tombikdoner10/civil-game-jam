// PreToolUse kancası: jam zaman kutularını ve beyanı uygular.
// - 18 Ekim 18.00'den sonra `git push` engellenir (kural 5.6: teslim edilen sürüm değişmez).
// - 18 Ekim 15.00 kod dondurmadan sonra src/, index.html, vite.config.ts ve public/ düzenlemeleri engellenir;
//   kullanıcı onaylı bir düzeltme için lider .jam/dondurma-izni dosyasını oluşturur, iş bitince siler.
// - Her `git commit` öncesinde AI beyanı yeniden üretilip commit'e eklenir.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { DEADLINE, FREEZE, ROOT, now, readStdinJson, repoPath } from '../../scripts/jam-lib.mjs';

const deny = (reason) => {
  process.stdout.write(
    JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } }),
  );
  process.exit(0);
};

const input = await readStdinJson();
const t = now();

if (input.tool_name === 'Bash' || input.tool_name === 'PowerShell') {
  const cmd = String(input.tool_input?.command ?? '');
  if (/\bgit\b[^\n]*\bpush\b/.test(cmd) && t >= DEADLINE) {
    deny('18 Ekim 18.00 geçti: teslim edilen sürüm değişmesin diye push yasak (kural 5.6). Repo ve canlı oyun olduğu gibi kalmalı.');
  }
  if (/\bgit\b[^\n]*\bcommit\b/.test(cmd)) {
    try {
      execFileSync(process.execPath, [join(ROOT, 'scripts', 'beyan.mjs'), '--stage'], { cwd: ROOT, stdio: 'ignore' });
    } catch {
      // Beyan üretilemezse commit'i engelleme; lider `npm run beyan` ile elle dener.
    }
  }
  process.exit(0);
}

const file = input.tool_input?.file_path ?? input.tool_input?.notebook_path;
const rel = file ? repoPath(file, input.cwd) : null;
const frozen = rel && (/^(src|public)\//.test(rel) || rel === 'index.html' || rel === 'vite.config.ts');
if (frozen && t >= FREEZE && !existsSync(join(ROOT, '.jam', 'dondurma-izni'))) {
  deny(
    'Kod dondurma (18 Ekim 15.00) başladı: oyun kodu değişmez. Kritik bir hata varsa lider kullanıcıdan onay alır, ' +
      '.jam/dondurma-izni dosyasını oluşturur, düzeltmeden sonra dosyayı siler.',
  );
}
