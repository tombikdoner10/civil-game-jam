// Yer tutucu denetimi (G38): src/ altında oyuncunun görebileceği metin dizelerinden köşeli parantezli olanları
// ("[Bina adı]", "[Bir gece]" gibi yer tutucular) dosya:satır ve metinle listeler; dosya başına sayı ve toplam verir.
// Teslimden önce hangi metinlerin hâlâ yer tutucu olduğunu görmek için. Yalnızca rapor: çıkış kodu hep 0.
// Kullanım: npm run yer-tutucu            → bütün liste + sayılar
//           npm run yer-tutucu -- --ozet  → yalnızca dosya başına sayılar ve toplam
// Kapsam: src/**/*.ts dizeleri ('…', "…", `…`; şablondaki ${…} "…" sayılır). Yorumlar, düzenli ifadeler, import
// yolları, console.* satırları ve yalnızca geliştirmede görünen sahneler/dosyalar (HARIC) sayılmaz.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(ROOT, 'src');
const ozet = process.argv.includes('--ozet');

/** Oyuncunun göremediği dosyalar: dev sahneleri (Playground, Debug), test müzik desenleri, tip bildirimleri. */
const HARIC = new Set(['src/scenes/PlaygroundScene.ts', 'src/scenes/DebugScene.ts', 'src/audio/songs.ts', 'src/vite-env.d.ts']);

/** Köşeli parantez içinde en az bir harf: "[Bina adı]", "[ZARF]"; "[0]" ya da "[]" sayılmaz. */
const YER_TUTUCU = /\[[^\[\]\n]*[A-Za-zÇĞİÖŞÜçğıöşüÂâÎîÛû][^\[\]\n]*\]/;

function dosyalar(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...dosyalar(p));
    else if (e.name.endsWith('.ts')) out.push(p);
  }
  return out;
}

/**
 * Basit TypeScript tarayıcı: yorumları ve düzenli ifadeleri atlar, dize değişmezlerini { satir, metin } olarak verir.
 * Şablon dizelerinde ${…} içi ayrıca taranır (içindeki dizeler de bulunur); şablonun kendi metninde "…" olur.
 */
function dizeler(kaynak) {
  const out = [];
  let i = 0;
  let satir = 1;
  /** Son anlamlı karakter (düzenli ifade mi bölme mi kararı için). */
  let onceki = '';
  let oncekiKelime = '';
  const n = kaynak.length;
  const ilerle = (c) => {
    if (c === '\n') satir++;
  };

  function dizeOku(tirnak) {
    const bas = satir;
    let metin = '';
    i++;
    while (i < n) {
      const c = kaynak[i];
      if (c === '\\') {
        const d = kaynak[i + 1] ?? '';
        metin += d === 'n' ? '\n' : d;
        ilerle(d);
        i += 2;
        continue;
      }
      if (c === tirnak) {
        i++;
        break;
      }
      if (tirnak === '`' && c === '$' && kaynak[i + 1] === '{') {
        metin += '…';
        i += 2;
        ifadeTara(1);
        continue;
      }
      if (c === '\n' && tirnak !== '`') break;
      metin += c;
      ilerle(c);
      i++;
    }
    out.push({ satir: bas, metin });
  }

  /** derinlik > 0: şablon içindeki ${…}; kapanan } ile döner. */
  function ifadeTara(derinlik) {
    while (i < n) {
      const c = kaynak[i];
      const d = kaynak[i + 1];
      if (c === '\n' || c === ' ' || c === '\t' || c === '\r') {
        ilerle(c);
        i++;
        continue;
      }
      if (c === '/' && d === '/') {
        while (i < n && kaynak[i] !== '\n') i++;
        continue;
      }
      if (c === '/' && d === '*') {
        i += 2;
        while (i < n && !(kaynak[i] === '*' && kaynak[i + 1] === '/')) ilerle(kaynak[i++]);
        i += 2;
        continue;
      }
      if (c === '"' || c === "'" || c === '`') {
        dizeOku(c);
        onceki = 'a';
        oncekiKelime = '';
        continue;
      }
      if (c === '/') {
        // Düzenli ifade: bir işleçten, açılan parantezden ya da return/typeof gibi bir sözcükten sonra.
        const regex = onceki === '' || '(,=:[!&|?{};+-*%<>~^'.includes(onceki) || ['return', 'typeof', 'case', 'of', 'in'].includes(oncekiKelime);
        if (regex) {
          i++;
          let sinif = false;
          while (i < n) {
            const r = kaynak[i];
            if (r === '\\') {
              i += 2;
              continue;
            }
            if (r === '\n') break;
            if (r === '[') sinif = true;
            else if (r === ']') sinif = false;
            else if (r === '/' && !sinif) break;
            i++;
          }
          i++;
          while (i < n && /[a-z]/i.test(kaynak[i])) i++;
          onceki = 'a';
          oncekiKelime = '';
          continue;
        }
      }
      if (derinlik > 0) {
        if (c === '{') derinlik++;
        else if (c === '}') {
          derinlik--;
          if (derinlik === 0) {
            i++;
            return;
          }
        }
      }
      if (/[A-Za-z0-9_$]/.test(c)) {
        let k = '';
        while (i < n && /[A-Za-z0-9_$]/.test(kaynak[i])) k += kaynak[i++];
        onceki = 'a';
        oncekiKelime = k;
        continue;
      }
      onceki = c;
      oncekiKelime = '';
      i++;
    }
  }

  ifadeTara(0);
  return out;
}

const sonuc = [];
for (const dosya of dosyalar(SRC).sort()) {
  const yol = relative(ROOT, dosya).split(sep).join('/');
  if (HARIC.has(yol)) continue;
  const kaynak = readFileSync(dosya, 'utf8');
  const satirlar = kaynak.split('\n');
  const bulunan = dizeler(kaynak).filter(({ satir, metin }) => {
    if (!YER_TUTUCU.test(metin)) return false;
    const s = satirlar[satir - 1] ?? '';
    return !/^\s*(import|export\s+\*|export\s+\{)/.test(s) && !/console\.\w+\(/.test(s);
  });
  if (bulunan.length > 0) sonuc.push({ yol, bulunan });
}

const toplam = sonuc.reduce((t, d) => t + d.bulunan.length, 0);
if (!ozet) {
  for (const { yol, bulunan } of sonuc) {
    console.log(`\n${yol} (${bulunan.length})`);
    for (const { satir, metin } of bulunan) console.log(`  ${yol}:${satir}  ${JSON.stringify(metin.length > 160 ? `${metin.slice(0, 157)}...` : metin)}`);
  }
  console.log('');
}
console.log('Dosya başına köşeli parantezli (yer tutucu) dize sayısı:');
const genis = Math.max(0, ...sonuc.map((d) => d.yol.length));
for (const { yol, bulunan } of [...sonuc].sort((a, b) => b.bulunan.length - a.bulunan.length)) {
  console.log(`  ${yol.padEnd(genis)}  ${String(bulunan.length).padStart(4)}`);
}
console.log(`Toplam: ${toplam} dize, ${sonuc.length} dosya (hariç: ${[...HARIC].join(', ')}; yorumlar sayılmaz)`);
