// PreToolUse kancası: jam zaman kutularını ve beyanı uygular.
// - 18 Ekim 18.00'den sonra `git push` engellenir (kural 5.6: teslim edilen sürüm değişmez).
// - 18 Ekim 15.00 kod dondurmadan sonra src/, index.html, vite.config.ts ve public/ düzenlemeleri engellenir;
//   kullanıcı onaylı bir düzeltme için lider .jam/dondurma-izni dosyasını oluşturur, iş bitince siler.
// - Her `git commit` öncesinde AI beyanı yeniden üretilip commit'e eklenir.
import { execFileSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
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

// İş kaybettirebilecek komutlar. Kullanıcı onay verirse lider .jam/tehlikeli-izin dosyasını oluşturur;
// izin tek kullanımlıktır, kanca izin verdikten sonra dosyayı siler. Önce `npm run yedek` alınır.
const DANGEROUS = [
  [/\bgit\b[^\n]*\bpush\b[^\n]*(--force\b|--force-with-lease|\s-f\b)(?![^\n]*\b(jam-oncesi-sablon|son-saglam)\b)/, 'zorla push (geçmişi siler)'],
  [/\bgit\b[^\n]*\breset\b[^\n]*--hard/, 'git reset --hard (kaydedilmemiş işi siler)'],
  [/\bgit\b[^\n]*\bclean\b[^\n]*\s-[a-zA-Z]*f/, 'git clean (izlenmeyen dosyaları siler)'],
  [/\bgit\b[^\n]*\bbranch\b[^\n]*\s-D\b/, 'dalı zorla silme'],
  [/\bgit\b[^\n]*\b(checkout|restore)\b[^\n]*\s(--\s+)?\.(\s|$)/, 'bütün değişiklikleri geri alma'],
  [/\bgit\b[^\n]*\b(filter-branch|filter-repo)\b/, 'geçmişi yeniden yazma'],
  [(cmd) => recursiveDeleteOfProtected(cmd), 'toplu silme'],
];

/** rm -r / Remove-Item -Recurse gibi bir komut repo kökünü ya da ana klasörlerden birini siliyor mu? */
function recursiveDeleteOfProtected(cmd) {
  const PROTECTED = new Set(['', '.', '..', '*', '/', '~', '.git', 'src', 'docs', '.claude', 'scripts', 'public']);
  for (const part of cmd.split(/&&|\|\||;|\|/)) {
    const tokens = part.trim().split(/\s+/);
    const i = tokens.findIndex((tok) => /^(rm|rmdir|rd|del|ri|remove-item)$/i.test(tok.split(/[\\/]/).pop() ?? ''));
    if (i < 0) continue;
    const args = tokens.slice(i + 1);
    const recursive = args.some((a) => /^-[a-zA-Z]*[rR]/.test(a) || /^(--recursive|-recurse|\/s)$/i.test(a));
    if (!recursive) continue;
    const targets = args
      .filter((a) => !/^(-|\/[a-zA-Z]$)/.test(a))
      .map((a) => a.replace(/^["']|["']$/g, '').replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/\*?$/, ''));
    if (targets.some((t) => PROTECTED.has(t))) return true;
  }
  return false;
}
const permit = join(ROOT, '.jam', 'tehlikeli-izin');

if (input.tool_name === 'Bash' || input.tool_name === 'PowerShell') {
  const cmd = String(input.tool_input?.command ?? '');
  const danger = DANGEROUS.find(([test]) => (typeof test === 'function' ? test(cmd) : test.test(cmd)));
  if (danger) {
    if (existsSync(permit)) {
      rmSync(permit, { force: true });
    } else {
      deny(
        `Güvenlik: "${danger[1]}" iş kaybettirebilir ve engellendi. Gerçekten gerekiyorsa önce \`npm run yedek\` al, ` +
          'kullanıcıya ne yapılacağını açıklayıp onay iste, sonra .jam/tehlikeli-izin dosyasını oluştur (tek kullanımlık).',
      );
    }
  }
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
