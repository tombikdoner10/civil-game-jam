import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';

function git(args: string): string {
  try {
    return execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return '';
  }
}

// Oyunda ve dist/version.json'da görünen commit. Jüri, oynadığı sürümü repodaki commit'le
// eşleştirebilsin diye (kural 3.7). Kaydedilmemiş değişiklik varsa sonuna "-degisiklikli" eklenir.
const sha = process.env.GITHUB_SHA || git('rev-parse HEAD') || 'yerel';
const dirty = !process.env.GITHUB_SHA && git('status --porcelain') !== '';
const COMMIT = dirty ? `${sha}-degisiklikli` : sha;
const BUILD_TIME = new Date().toISOString();

export default defineConfig({
  // GitHub Pages alt dizinde (kullanici.github.io/repo/) çalışsın diye göreli yollar.
  base: './',
  define: {
    __COMMIT__: JSON.stringify(COMMIT),
    __BUILD_TIME__: JSON.stringify(BUILD_TIME),
  },
  server: { port: 5173, strictPort: true },
  build: { chunkSizeWarningLimit: 2000 },
  plugins: [
    {
      name: 'version-json',
      apply: 'build',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: JSON.stringify({ commit: COMMIT, builtAt: BUILD_TIME }, null, 2),
        });
      },
    },
  ],
});
