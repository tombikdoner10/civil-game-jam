import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';

function git(args: string): string {
  try {
    return execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return '';
  }
}

// Oyunda ve dist/version.json'da görünen commit. Teslim edilen build ile repodaki kodun
// eşleştiği gösterilebilsin diye (kural 3.7). Kaydedilmemiş değişiklik varsa sonuna "-degisiklikli" eklenir.
const sha = process.env.GITHUB_SHA || git('rev-parse HEAD') || 'yerel';
const dirty = !process.env.GITHUB_SHA && git('status --porcelain') !== '';
const COMMIT = dirty ? `${sha}-degisiklikli` : sha;
const BUILD_TIME = new Date().toISOString();

const text = (source: string | Uint8Array): string => (typeof source === 'string' ? source : new TextDecoder().decode(source));
const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Web derlemesinde sürüm bilgisini dist/version.json olarak yazar. */
function versionJson(): Plugin {
  return {
    name: 'version-json',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ commit: COMMIT, builtAt: BUILD_TIME }, null, 2),
      });
    },
  };
}

/**
 * ZIP teslimi için tek dosyalık derleme (`npm run zip`): JS, CSS, fontlar ve import edilen bütün
 * varlıklar index.html'in içine gömülür. Tarayıcılar file:// adresinden ayrı .js dosyası yüklemediği için,
 * oyunun internetsiz ve sunucusuz, dosyaya çift tıklayınca açılmasını sağlayan yol bu.
 */
function inlineEverything(): Plugin {
  return {
    name: 'inline-everything',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const html = Object.values(bundle).find((f) => f.type === 'asset' && f.fileName.endsWith('.html'));
      if (!html || html.type !== 'asset') return;
      let source = text(html.source);
      for (const file of Object.values(bundle)) {
        const name = escapeRegExp(file.fileName);
        if (file.type === 'chunk') {
          if (!file.isEntry) this.error(`Tek dosyalık derlemede dinamik import kullanılamaz: ${file.fileName}`);
          const code = file.code.replace(/<\/script/gi, '<\\/script');
          source = source.replace(new RegExp(`<script[^>]*src="[^"]*${name}"[^>]*></script>`), () => `<script type="module">${code}</script>`);
          delete bundle[file.fileName];
        } else if (file.fileName.endsWith('.css')) {
          source = source.replace(new RegExp(`<link[^>]*href="[^"]*${name}"[^>]*>`), () => `<style>${text(file.source)}</style>`);
          delete bundle[file.fileName];
        }
      }
      const favicon = readFileSync('public/favicon.svg').toString('base64');
      html.source = source.replace('href="favicon.svg"', `href="data:image/svg+xml;base64,${favicon}"`);
    },
  };
}

export default defineConfig(({ mode }) => {
  const single = mode === 'single';
  return {
    // GitHub Pages alt dizinde (kullanici.github.io/repo/) çalışsın diye göreli yollar.
    base: './',
    define: {
      __COMMIT__: JSON.stringify(COMMIT),
      __BUILD_TIME__: JSON.stringify(BUILD_TIME),
    },
    publicDir: single ? false : 'public',
    server: { port: 5173, strictPort: true },
    build: {
      outDir: single ? 'dist-single' : 'dist',
      chunkSizeWarningLimit: 4000,
      assetsInlineLimit: single ? Number.MAX_SAFE_INTEGER : 4096,
      cssCodeSplit: !single,
      modulePreload: single ? false : { polyfill: true },
    },
    plugins: [single ? inlineEverything() : versionJson()],
  };
});
