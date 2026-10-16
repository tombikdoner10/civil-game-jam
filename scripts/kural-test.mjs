// Bina üreticisi ve kural motoru regresyon testi (G14).
// Beklenen değerler koddan çıkarılmaz: kural kitabının ve GDD'nin metninden elle türetilmiştir.
//  1. Altın tablo (elle kurulmuş binalar): her satırda görünen kusurlar (id:ciddiyet), doğru damga ve gerekirse
//     fiziksel kusurlar elle yazılı.
//  2. Altın tablo (tohumlu üretim): kusurluBinaKur'a verilen kusurlar ve gün → beklenen kusurlar ve damga
//     (birkaç sabit tohumla; tohumdan bağımsız olmalı).
//  3. Gün dosyaları (tohum × gün 1-5): kuralları metinden uygulayan bağımsız bir "kâhin" ile karşılaştırma,
//     gün 1 açılış dosyaları ve hikâye binaları için altın değerler.
//  4. Determinizm: aynı tohum aynı bina; farklı tohum çoğunlukla farklı.
//  5. Değişmezler: temiz bina GÜVENLİ; kaçak kat (+1 GÜÇLENDİR, +2 ve üstü BOŞALT); eksik belge İADE (adalet.mjs
//     ile aynı mantık: BOŞALT görünürse BOŞALT, bilgi edinilince gerçek damga da kabul).
// Kullanım: npm run kuraltest   (hata varsa çıkış kodu 1)
import { createServer } from 'vite';

const server = await createServer({ logLevel: 'error', server: { middlewareMode: true }, appType: 'custom' });
const BLD = await server.ssrLoadModule('/src/game/building.ts');
const R = await server.ssrLoadModule('/src/game/rules.ts');
const S = await server.ssrLoadModule('/src/game/session.ts');
const ST = await server.ssrLoadModule('/src/game/stories.ts');
const D = await server.ssrLoadModule('/src/game/days.ts');
const { Rng } = await server.ssrLoadModule('/src/game/rng.ts');
const T = (await server.ssrLoadModule('/src/game/tuning.ts')).TUNING;

let hata = 0;
let sayi = 0;
const bak = (kosul, mesaj) => {
  sayi++;
  if (!kosul) {
    hata++;
    console.log('HATA', mesaj);
  }
};
const esit = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// ---- Kural kitabından elle alınan eşikler (rules.ts metinleri, GDD "Kurallar netleşti") ----
// Takım bir eşiği değiştirirse bu test bilerek kırılır: tabloyu yeni kurala göre elle güncelleyin.
const ESIK = { kacakBosaltFark: 2, betonMpa: 20, dereM: 30, fayM: 150, fayKurali: 'zemin' };
/** Her kusurun kuralının ilk günü (GDD gün planı). */
const KURAL_GUNU = {
  kacakKat: 1,
  kesikKolon: 2,
  caprazCatlak: 2,
  dusukBeton: 3,
  karotYok: 3,
  dereyeYakin: 4,
  fayaYakin: 4,
  zeminEtuduYok: 4,
  sivilasma: 4,
  sahteBelge: 5,
};
bak(T.kacakKatBosaltFark === ESIK.kacakBosaltFark, `eşik değişti: kacakKatBosaltFark ${T.kacakKatBosaltFark}; testi güncelleyin`);
bak(T.betonEsikMpa === ESIK.betonMpa, `eşik değişti: betonEsikMpa ${T.betonEsikMpa}; testi güncelleyin`);
bak(T.dereMinM === ESIK.dereM, `eşik değişti: dereMinM ${T.dereMinM}; testi güncelleyin`);
bak(T.fayMinM === ESIK.fayM, `eşik değişti: fayMinM ${T.fayMinM}; testi güncelleyin`);
bak(T.fayKurali === ESIK.fayKurali, `kural değişti: fayKurali ${T.fayKurali}; testi güncelleyin`);
for (const [id, gun] of Object.entries(KURAL_GUNU))
  bak(R.kusurKurali(id)?.ilkGun === gun, `kural günü değişti: ${id} → ${R.kusurKurali(id)?.ilkGun} (beklenen ${gun})`);

// ---- Bağımsız kâhin: kuralları belgeler üzerinden metinden uygular (rules.ts'yi çağırmaz) ----
/**
 * mod 'belge': belgelerde görünen kusurlar (eksik belge İADE; dere/fay ciddiyeti zemin etüdündeki türe göre).
 * mod 'gercek': fiziksel kusurlar (eksik belge hariç; saklı düşük beton ve sıvılaşma dahil).
 * Dönüş: sıralı "id:ciddiyet" listesi, yalnızca o gün kuralı gelmiş kusurlar.
 */
function kahin(b, gun, mod = 'belge') {
  const B = b.belgeler;
  const g = b.gercek;
  const out = [];
  const ekle = (id, c) => {
    if (KURAL_GUNU[id] > gun) return;
    if (mod === 'gercek' && c === 'iade') return;
    out.push(`${id}:${c}`);
  };
  // Gün 1: ruhsattaki kat (zemin dahil) fotoğraftakiyle aynı olmalı. +1 → GÜÇLENDİR, +2 ve üstü → BOŞALT.
  const fark = B.foto.gorunenKat - B.ruhsat.kat;
  if (fark !== 0) ekle('kacakKat', Math.abs(fark) >= ESIK.kacakBosaltFark ? 'bosalt' : 'guclendir');
  // Gün 2: zemin katta kesik kolon (fotoğrafta vitrin) ya da çapraz çatlak → BOŞALT. Kılcal çatlak kusur değil.
  if (B.foto.vitrinKolonlar.length > 0) ekle('kesikKolon', 'bosalt');
  if (B.foto.gorunenCatlak === 'capraz') ekle('caprazCatlak', 'bosalt');
  // Gün 3: beton en az 20 MPa; altı BOŞALT. Karot raporu yoksa İADE.
  const mpa = mod === 'gercek' ? g.betonMpa : B.karot?.mpa;
  if (mpa !== undefined && mpa < ESIK.betonMpa) ekle('dusukBeton', 'bosalt');
  if (B.karot === null) ekle('karotYok', 'iade');
  // Gün 4: dereye 30 m'den, faya 150 m'den yakınsa zemine bak: sıvılaşma BOŞALT, değilse GÜÇLENDİR (etüt yoksa İADE
  // ayrı kusurdan gelir). Zemin etüdü yoksa İADE; sıvılaşma BOŞALT.
  const zemin = mod === 'gercek' ? g.zemin : (B.zemin?.tur ?? null);
  const yakin = zemin === 'sivilasma' ? 'bosalt' : 'guclendir';
  if (B.vaziyet.dereM < ESIK.dereM) ekle('dereyeYakin', yakin);
  if (B.vaziyet.fayM < ESIK.fayM) ekle('fayaYakin', yakin);
  if (B.zemin === null) ekle('zeminEtuduYok', 'iade');
  if (zemin === 'sivilasma') ekle('sivilasma', 'bosalt');
  // Gün 5: mühür yılı yapım yılından sonraysa belge sahte → GÜÇLENDİR.
  if (B.ruhsat.muhurYili > B.ruhsat.yil) ekle('sahteBelge', 'guclendir');
  return out.sort();
}

/** Öncelik kuralı: BOŞALT > İADE > GÜÇLENDİR; kusur yoksa GÜVENLİ. */
function kahinDamga(liste) {
  const c = liste.map((x) => x.split(':')[1]);
  if (c.includes('bosalt')) return 'bosalt';
  if (c.includes('iade')) return 'iade';
  if (c.length > 0) return 'guclendir';
  return 'guvenli';
}

const kodKusur = (kusurlar) => kusurlar.map((k) => `${k.id}:${k.ciddiyet}`).sort();
const gorunen = (b, gun) => kodKusur(R.gorunenKusurlar(b, gun));
const fiziksel = (b, gun) => kodKusur(R.fizikselKusurlar(b, gun));

// ---- 1. Altın tablo: elle kurulmuş binalar ----
/** Temiz bir bina; o ile kusurlar elle verilir. Belgeler gerçek durumla tutarlı (fotoğraf gerçeği gösterir). */
function elBina(o = {}) {
  const yil = o.yil ?? 2000;
  const ruhsatKat = o.ruhsatKat ?? 4;
  const kat = o.kat ?? ruhsatKat;
  const kesik = o.kesik ?? [];
  const catlak = o.catlak ?? 'yok';
  const mpa = o.mpa ?? 30;
  const zemin = o.zemin ?? 'saglam';
  const dere = o.dere ?? 200;
  const fay = o.fay ?? 800;
  const muhur = o.muhur ?? yil;
  return {
    id: 'el',
    adres: 'El 00',
    yil,
    gercek: {
      kat,
      zeminKolonSayisi: 6,
      kesikKolonlar: kesik,
      betonMpa: mpa,
      demir: 'nervurlu',
      denizKumu: false,
      catlak,
      dereMesafeM: dere,
      fayMesafeM: fay,
      zemin,
      ruhsatSahte: muhur > yil,
    },
    belgeler: {
      ruhsat: { kat: ruhsatKat, yil, muhurYili: muhur },
      proje: { zeminKolonSayisi: 6 },
      foto: { gorunenKat: kat, vitrinKolonlar: kesik.slice(), gorunenCatlak: catlak, denizKabugu: false },
      karot: o.karotYok ? null : { mpa },
      zemin: o.etutYok ? null : { tur: zemin },
      vaziyet: { dereM: dere, fayM: fay },
    },
  };
}

// [ad, bina seçenekleri, gün, beklenen görünen kusurlar, beklenen damga, (isteğe bağlı) beklenen fiziksel kusurlar]
const ALTIN_EL = [
  ['temiz g1', {}, 1, [], 'guvenli'],
  ['temiz g5', {}, 5, [], 'guvenli'],
  ['kılcal çatlak g5 (kusur değil)', { catlak: 'kilcal' }, 5, [], 'guvenli'],
  ['+1 kat g1', { ruhsatKat: 4, kat: 5 }, 1, ['kacakKat:guclendir'], 'guclendir'],
  ['+2 kat g1', { ruhsatKat: 3, kat: 5 }, 1, ['kacakKat:bosalt'], 'bosalt'],
  ['+3 kat g5', { ruhsatKat: 3, kat: 6 }, 5, ['kacakKat:bosalt'], 'bosalt'],
  ['kesik kolon g1 (kuralı yok)', { kesik: [2] }, 1, [], 'guvenli', []],
  ['kesik kolon g2', { kesik: [2, 4] }, 2, ['kesikKolon:bosalt'], 'bosalt'],
  ['çapraz çatlak g1 (kuralı yok)', { catlak: 'capraz' }, 1, [], 'guvenli'],
  ['çapraz çatlak g2', { catlak: 'capraz' }, 2, ['caprazCatlak:bosalt'], 'bosalt'],
  ['+1 kat ve çapraz çatlak g2 (öncelik)', { ruhsatKat: 5, kat: 6, catlak: 'capraz' }, 2, ['caprazCatlak:bosalt', 'kacakKat:guclendir'], 'bosalt'],
  ['15 MPa g2 (kuralı yok)', { mpa: 15 }, 2, [], 'guvenli', []],
  ['15 MPa g3', { mpa: 15 }, 3, ['dusukBeton:bosalt'], 'bosalt'],
  ['19 MPa g3', { mpa: 19 }, 3, ['dusukBeton:bosalt'], 'bosalt'],
  ['20 MPa g3 (eşikte, kusur değil)', { mpa: 20 }, 3, [], 'guvenli'],
  ['karot yok g2 (kuralı yok)', { karotYok: true }, 2, [], 'guvenli'],
  ['karot yok g3', { karotYok: true }, 3, ['karotYok:iade'], 'iade', []],
  ['karot yok, saklı 12 MPa g3', { karotYok: true, mpa: 12 }, 3, ['karotYok:iade'], 'iade', ['dusukBeton:bosalt']],
  ['karot yok ve +1 kat g3 (İADE > GÜÇLENDİR)', { karotYok: true, ruhsatKat: 4, kat: 5 }, 3, ['kacakKat:guclendir', 'karotYok:iade'], 'iade'],
  ['karot yok ve +2 kat g3 (BOŞALT > İADE)', { karotYok: true, ruhsatKat: 4, kat: 6 }, 3, ['kacakKat:bosalt', 'karotYok:iade'], 'bosalt'],
  ['karot yok ve kesik kolon g3', { karotYok: true, kesik: [1] }, 3, ['karotYok:iade', 'kesikKolon:bosalt'], 'bosalt'],
  ['dere 25 m g3 (kuralı yok)', { dere: 25 }, 3, [], 'guvenli'],
  ['dere 25 m, sağlam g4', { dere: 25, zemin: 'saglam' }, 4, ['dereyeYakin:guclendir'], 'guclendir'],
  ['dere 29 m, orta g4', { dere: 29, zemin: 'orta' }, 4, ['dereyeYakin:guclendir'], 'guclendir'],
  ['dere 30 m g4 (eşikte, kusur değil)', { dere: 30 }, 4, [], 'guvenli'],
  ['dere 10 m, sıvılaşma g4', { dere: 10, zemin: 'sivilasma' }, 4, ['dereyeYakin:bosalt', 'sivilasma:bosalt'], 'bosalt'],
  ['dere 10 m, etüt yok g4', { dere: 10, etutYok: true }, 4, ['dereyeYakin:guclendir', 'zeminEtuduYok:iade'], 'iade', ['dereyeYakin:guclendir']],
  [
    'dere 10 m, etüt yok, saklı sıvılaşma g4',
    { dere: 10, etutYok: true, zemin: 'sivilasma' },
    4,
    ['dereyeYakin:guclendir', 'zeminEtuduYok:iade'],
    'iade',
    ['dereyeYakin:bosalt', 'sivilasma:bosalt'],
  ],
  ['fay 100 m, orta g4', { fay: 100, zemin: 'orta' }, 4, ['fayaYakin:guclendir'], 'guclendir'],
  ['fay 149 m, sıvılaşma g5', { fay: 149, zemin: 'sivilasma' }, 5, ['fayaYakin:bosalt', 'sivilasma:bosalt'], 'bosalt'],
  ['fay 150 m g4 (eşikte, kusur değil)', { fay: 150 }, 4, [], 'guvenli'],
  ['fay 60 m, etüt yok g4', { fay: 60, etutYok: true }, 4, ['fayaYakin:guclendir', 'zeminEtuduYok:iade'], 'iade'],
  ['sıvılaşma g3 (kuralı yok)', { zemin: 'sivilasma' }, 3, [], 'guvenli', []],
  ['sıvılaşma g4', { zemin: 'sivilasma' }, 4, ['sivilasma:bosalt'], 'bosalt'],
  ['etüt yok g3 (kuralı yok)', { etutYok: true }, 3, [], 'guvenli'],
  ['etüt yok g4', { etutYok: true }, 4, ['zeminEtuduYok:iade'], 'iade', []],
  ['karot ve etüt yok g4', { karotYok: true, etutYok: true }, 4, ['karotYok:iade', 'zeminEtuduYok:iade'], 'iade'],
  ['mühür 1994 > yapım 1990 g4 (kuralı yok)', { yil: 1990, muhur: 1994 }, 4, [], 'guvenli'],
  ['mühür 1994 > yapım 1990 g5', { yil: 1990, muhur: 1994 }, 5, ['sahteBelge:guclendir'], 'guclendir'],
  ['mühür = yapım g5', { yil: 1990, muhur: 1990 }, 5, [], 'guvenli'],
  ['mühür < yapım g5', { yil: 1990, muhur: 1988 }, 5, [], 'guvenli'],
  ['sahte ve karot yok g5', { yil: 1990, muhur: 1995, karotYok: true }, 5, ['karotYok:iade', 'sahteBelge:guclendir'], 'iade'],
  ['sahte ve kesik kolon g5', { yil: 1990, muhur: 1995, kesik: [3] }, 5, ['kesikKolon:bosalt', 'sahteBelge:guclendir'], 'bosalt'],
  ['sahte, +1 kat, dere ve sağlam g5', { yil: 1980, muhur: 1983, ruhsatKat: 3, kat: 4, dere: 20 }, 5, ['dereyeYakin:guclendir', 'kacakKat:guclendir', 'sahteBelge:guclendir'], 'guclendir'],
];

for (const [ad, o, gun, beklenen, damga, fiz] of ALTIN_EL) {
  const b = elBina(o);
  const gor = gorunen(b, gun);
  bak(esit(gor, beklenen), `el "${ad}": görünen [${gor}] ≠ [${beklenen}]`);
  bak(R.dogruDamga(b, gun) === damga, `el "${ad}": doğru damga ${R.dogruDamga(b, gun)} ≠ ${damga}`);
  bak(esit(kahin(b, gun), beklenen), `el "${ad}": kâhin [${kahin(b, gun)}] ≠ tablo [${beklenen}] (tablo ya da kâhin yanlış)`);
  if (fiz) bak(esit(fiziksel(b, gun), fiz), `el "${ad}": fiziksel [${fiziksel(b, gun)}] ≠ [${fiz}]`);
}

// Edinilen bilgi (İSTE / saha testi): İADE + gerçek damga kabul; gerçek durum esas (yanlış değer verilse de).
{
  const sakli = elBina({ karotYok: true, mpa: 12 });
  const saglam = elBina({ karotYok: true, mpa: 30 });
  bak(esit(R.dogruDamgalar(saglam, 3), ['iade']), 'bilgi yok: kabul yalnızca İADE');
  bak(esit(R.dogruDamgalar(saglam, 3, { karot: 30 }), ['iade', 'guvenli']), 'karot 30 bilgisi: [iade, guvenli]');
  bak(esit(R.dogruDamgalar(sakli, 3, { karot: 12 }), ['iade', 'bosalt']), 'karot 12 bilgisi: [iade, bosalt]');
  bak(R.dogruDamga(sakli, 3, { karot: 35 }) === 'bosalt', 'bilgide yanlış değer: doğru damga gerçek duruma göre BOŞALT');
  const etut = elBina({ etutYok: true, dere: 10, zemin: 'sivilasma' });
  bak(esit(R.dogruDamgalar(etut, 4, { zemin: 'sivilasma' }), ['iade', 'bosalt']), 'dere + etüt yok, sıvılaşma bilgisi: [iade, bosalt]');
  const etut2 = elBina({ etutYok: true, dere: 10, zemin: 'orta' });
  bak(esit(R.dogruDamgalar(etut2, 4, { zemin: 'orta' }), ['iade', 'guclendir']), 'dere + etüt yok, orta bilgisi: [iade, guclendir]');
  // Eksiksiz dosyada bilgi kabul listesini değiştirmez.
  bak(esit(R.dogruDamgalar(elBina({ ruhsatKat: 4, kat: 5 }), 3, { karot: 10 }), ['guclendir']), 'eksiksiz dosyada bilgi: yalnızca asıl damga');
}

// ---- 2. Altın tablo: tohumlu üretim (kusurluBinaKur) ----
// Kusurlar elle verilir; temiz değerler (beton 24+, dere 60+, fay 250+) eşiklerin dışında olduğundan beklenen
// değer tohumdan bağımsızdır. [kusurlar, ek, gün, beklenen görünen, beklenen damga]
const ALTIN_URETIM = [
  [[], {}, 5, [], 'guvenli'],
  [['kacakKat'], { kacakFark: 1 }, 1, ['kacakKat:guclendir'], 'guclendir'],
  [['kacakKat'], { kacakFark: 2 }, 1, ['kacakKat:bosalt'], 'bosalt'],
  [['kesikKolon'], {}, 1, [], 'guvenli'],
  [['kesikKolon'], {}, 2, ['kesikKolon:bosalt'], 'bosalt'],
  [['caprazCatlak'], {}, 2, ['caprazCatlak:bosalt'], 'bosalt'],
  [['dusukBeton'], {}, 2, [], 'guvenli'],
  [['dusukBeton'], {}, 3, ['dusukBeton:bosalt'], 'bosalt'],
  [['karotYok'], {}, 3, ['karotYok:iade'], 'iade'],
  [['karotYok', 'kacakKat'], { kacakFark: 1 }, 3, ['kacakKat:guclendir', 'karotYok:iade'], 'iade'],
  [['dusukBeton', 'caprazCatlak'], {}, 3, ['caprazCatlak:bosalt', 'dusukBeton:bosalt'], 'bosalt'],
  [['dereyeYakin'], {}, 3, [], 'guvenli'],
  [['dereyeYakin'], {}, 4, ['dereyeYakin:guclendir'], 'guclendir'],
  [['fayaYakin'], {}, 4, ['fayaYakin:guclendir'], 'guclendir'],
  [['dereyeYakin', 'sivilasma'], {}, 4, ['dereyeYakin:bosalt', 'sivilasma:bosalt'], 'bosalt'],
  [['fayaYakin', 'zeminEtuduYok'], {}, 4, ['fayaYakin:guclendir', 'zeminEtuduYok:iade'], 'iade'],
  [['sivilasma'], {}, 4, ['sivilasma:bosalt'], 'bosalt'],
  [['zeminEtuduYok'], {}, 4, ['zeminEtuduYok:iade'], 'iade'],
  [['sahteBelge'], {}, 4, [], 'guvenli'],
  [['sahteBelge'], {}, 5, ['sahteBelge:guclendir'], 'guclendir'],
  [['sahteBelge', 'kesikKolon'], {}, 5, ['kesikKolon:bosalt', 'sahteBelge:guclendir'], 'bosalt'],
  [['sahteBelge', 'karotYok'], {}, 5, ['karotYok:iade', 'sahteBelge:guclendir'], 'iade'],
];
const TOHUMLAR = [1, 7, 42, 1999, 2026];
for (const [kusurlar, ek, gun, beklenen, damga] of ALTIN_URETIM) {
  for (const tohum of TOHUMLAR) {
    const b = BLD.kusurluBinaKur(new Rng(tohum), kusurlar, ek);
    const e = `üretim t${tohum} [${kusurlar.join('+') || 'temiz'}] g${gun}`;
    bak(esit(gorunen(b, gun), beklenen), `${e}: görünen [${gorunen(b, gun)}] ≠ [${beklenen}]`);
    bak(R.dogruDamga(b, gun) === damga, `${e}: doğru damga ${R.dogruDamga(b, gun)} ≠ ${damga}`);
    bak(esit(kahin(b, gun, 'gercek'), fiziksel(b, gun)), `${e}: fiziksel [${fiziksel(b, gun)}] ≠ kâhin [${kahin(b, gun, 'gercek')}]`);
    if (ek.kacakFark !== undefined) bak(b.belgeler.foto.gorunenKat - b.belgeler.ruhsat.kat === ek.kacakFark, `${e}: kaçak kat farkı`);
  }
}

// Hikâye binaları (stories.ts şablonları): kusurlar şablondan, damga kuraldan.
{
  const h1 = ST.HIKAYELER.find((h) => h.id === 'hikaye-1');
  const h2 = ST.HIKAYELER.find((h) => h.id === 'hikaye-2');
  bak(h1 && h1.gun === 2 && esit(h1.kusurlar, ['kesikKolon']), 'hikaye-1 şablonu değişti; testi güncelleyin');
  bak(h2 && h2.gun === 5 && esit(h2.kusurlar.slice().sort(), ['caprazCatlak', 'dusukBeton']) && h2.kendiBinan, 'hikaye-2 şablonu değişti; testi güncelleyin');
  for (const tohum of TOHUMLAR) {
    if (h1) {
      const b = ST.hikayeBinasiKur(new Rng(tohum), h1);
      bak(b.id === 'hikaye-1' && b.hikaye && esit(gorunen(b, 2), ['kesikKolon:bosalt']) && R.dogruDamga(b, 2) === 'bosalt', `hikaye-1 t${tohum}`);
    }
    if (h2) {
      const b = ST.hikayeBinasiKur(new Rng(tohum), h2);
      bak(b.kendiBinan === true && esit(gorunen(b, 5), ['caprazCatlak:bosalt', 'dusukBeton:bosalt']) && R.dogruDamga(b, 5) === 'bosalt', `hikaye-2 t${tohum}`);
    }
  }
}

// ---- 3. Gün dosyaları: tohum × gün 1-5 ----
const GUN_TOHUM = 30;
const acilis3 = { temiz: 0, bosalt: 0 };
for (let tohum = 1; tohum <= GUN_TOHUM; tohum++) {
  for (let gun = 1; gun <= 5; gun++) {
    const adet = D.gunAyar(gun).dosyaSayisi;
    const dosyalar = BLD.gunDosyalari(tohum, gun, adet);
    const e0 = `gün t${tohum} g${gun}`;
    bak(dosyalar.length === adet, `${e0}: dosya sayısı ${dosyalar.length} ≠ ${adet}`);
    if (gun === 1) bak(adet === 3, `${e0}: gün 1 üç dosya olmalı (GDD), ${adet}`);
    bak(new Set(dosyalar.map((b) => b.id)).size === dosyalar.length, `${e0}: yinelenen dosya kimliği`);

    for (const b of dosyalar) {
      const e = `${e0} ${b.id}`;
      const gor = gorunen(b, gun);
      const k = kahin(b, gun);
      bak(esit(gor, k), `${e}: görünen [${gor}] ≠ kâhin [${k}]`);
      bak(R.dogruDamga(b, gun) === kahinDamga(k), `${e}: doğru damga ${R.dogruDamga(b, gun)} ≠ kâhin ${kahinDamga(k)}`);
      bak(esit(fiziksel(b, gun), kahin(b, gun, 'gercek')), `${e}: fiziksel [${fiziksel(b, gun)}] ≠ kâhin [${kahin(b, gun, 'gercek')}]`);
      // Belgeler gerçek durumla tutarlı (fotoğraf gerçeği gösterir; var olan belge doğru değeri taşır).
      const g = b.gercek;
      const B = b.belgeler;
      bak(
        B.foto.gorunenKat === g.kat && esit(B.foto.vitrinKolonlar, g.kesikKolonlar) && B.foto.gorunenCatlak === g.catlak,
        `${e}: fotoğraf gerçek durumla tutarsız`,
      );
      bak(B.karot === null || B.karot.mpa === g.betonMpa, `${e}: karot değeri gerçek dışı`);
      bak(B.zemin === null || B.zemin.tur === g.zemin, `${e}: zemin etüdü gerçek dışı`);
      bak(B.vaziyet.dereM === g.dereMesafeM && B.vaziyet.fayM === g.fayMesafeM, `${e}: vaziyet planı gerçek dışı`);
      bak(B.ruhsat.yil === b.yil && (B.ruhsat.muhurYili > b.yil) === g.ruhsatSahte, `${e}: mühür yılı sahtelikle tutarsız`);
    }

    // Günde en az bir temiz ve en az bir kusurlu dosya.
    bak(dosyalar.some((b) => kahin(b, gun).length === 0), `${e0}: temiz dosya yok`);
    bak(dosyalar.some((b) => kahin(b, gun).length > 0), `${e0}: kusurlu dosya yok`);

    // Gün 1 açılışı (GDD "İlk 30 saniye"): 1 temiz → GÜVENLİ; 2 bir kaçak kat → GÜÇLENDİR; 3 temiz ya da 2+ kaçak kat.
    if (gun === 1) {
      const [d1, d2, d3] = dosyalar;
      bak(esit(gorunen(d1, 1), []) && R.dogruDamga(d1, 1) === 'guvenli', `${e0}: dosya 1 temiz GÜVENLİ değil`);
      bak(esit(gorunen(d2, 1), ['kacakKat:guclendir']) && R.dogruDamga(d2, 1) === 'guclendir', `${e0}: dosya 2 tek kaçak kat GÜÇLENDİR değil`);
      bak(d2.belgeler.foto.gorunenKat - d2.belgeler.ruhsat.kat === 1, `${e0}: dosya 2 kat farkı 1 değil`);
      const g3 = gorunen(d3, 1);
      if (g3.length === 0) {
        acilis3.temiz++;
        bak(R.dogruDamga(d3, 1) === 'guvenli', `${e0}: dosya 3 temiz ama GÜVENLİ değil`);
      } else {
        acilis3.bosalt++;
        bak(esit(g3, ['kacakKat:bosalt']) && R.dogruDamga(d3, 1) === 'bosalt', `${e0}: dosya 3 [${g3}] 2+ kaçak kat BOŞALT değil`);
      }
    }

    // Hikâye binaları: gün 2'de hikaye-1 (kesik kolon → BOŞALT), gün 5'te hikaye-2 (kendi binan → BOŞALT); ilk iki
    // dosyaya girmez. Hikâyesiz istekte hiç hikâye binası yok.
    const hikayeler = dosyalar.map((b, i) => [b, i]).filter(([b]) => b.hikaye);
    const beklenenHikaye = { 2: 'hikaye-1', 5: 'hikaye-2' }[gun];
    if (beklenenHikaye) {
      bak(hikayeler.length === 1 && hikayeler[0][0].id === beklenenHikaye, `${e0}: hikâye binası [${hikayeler.map(([b]) => b.id)}] ≠ ${beklenenHikaye}`);
      const [hb, hi] = hikayeler[0] ?? [];
      if (hb) {
        bak(hi >= 2, `${e0}: hikâye binası ilk iki dosyada (${hi + 1})`);
        bak(R.dogruDamga(hb, gun) === 'bosalt', `${e0}: hikâye binası BOŞALT değil`);
        if (gun === 5) bak(hb.kendiBinan === true, `${e0}: hikaye-2 kendi binan değil`);
      }
    } else bak(hikayeler.length === 0, `${e0}: beklenmeyen hikâye binası`);
    const hikayesiz = BLD.gunDosyalari(tohum, gun, adet, { hikayeDahil: false });
    bak(hikayesiz.every((b) => !b.hikaye), `${e0}: hikayeDahil false iken hikâye binası`);
  }
}
bak(acilis3.temiz > 0 && acilis3.bosalt > 0, `gün 1 dosya 3 hep aynı (temiz ${acilis3.temiz}, 2+ kaçak ${acilis3.bosalt})`);

// binaUret: kâhinle aynı; gizli kusur oranıyla bile görünen kusurlar yalnızca aktif kurallardan.
for (let tohum = 1; tohum <= 40; tohum++) {
  for (let gun = 1; gun <= 5; gun++) {
    const b = BLD.binaUret(new Rng(tohum * 31 + gun), gun, { gizliKusurOrani: 0.5 });
    const e = `binaUret t${tohum} g${gun}`;
    bak(esit(gorunen(b, gun), kahin(b, gun)), `${e}: görünen [${gorunen(b, gun)}] ≠ kâhin [${kahin(b, gun)}]`);
    bak(R.dogruDamga(b, gun) === kahinDamga(kahin(b, gun)), `${e}: doğru damga`);
    bak(R.gorunenKusurlar(b, gun).every((k) => KURAL_GUNU[k.id] <= gun), `${e}: kuralı gelmemiş kusur görünüyor`);
  }
}

// ---- 4. Determinizm ----
{
  for (let tohum = 1; tohum <= 10; tohum++) {
    for (let gun = 1; gun <= 5; gun++) {
      const adet = D.gunAyar(gun).dosyaSayisi;
      bak(esit(BLD.gunDosyalari(tohum, gun, adet), BLD.gunDosyalari(tohum, gun, adet)), `determinizm: gunDosyalari t${tohum} g${gun}`);
      const o1 = new S.GunOturumu(gun, tohum);
      const o2 = new S.GunOturumu(gun, tohum);
      bak(esit(o1.dosyalar, o2.dosyalar), `determinizm: GunOturumu t${tohum} g${gun}`);
      bak(esit(o1.dosyalar, BLD.gunDosyalari(tohum, gun, adet)), `GunOturumu dosyaları gunDosyalari ile aynı değil t${tohum} g${gun}`);
    }
    bak(
      esit(BLD.kusurluBinaKur(new Rng(tohum), ['kacakKat', 'karotYok']), BLD.kusurluBinaKur(new Rng(tohum), ['kacakKat', 'karotYok'])),
      `determinizm: kusurluBinaKur t${tohum}`,
    );
    bak(esit(BLD.binaUret(new Rng(tohum), 5), BLD.binaUret(new Rng(tohum), 5)), `determinizm: binaUret t${tohum}`);
  }
  // Farklı tohum çoğunlukla farklı: ardışık tohum çiftlerinin en az %90'ı farklı.
  let farkli = 0;
  let cift = 0;
  for (let gun = 1; gun <= 5; gun++) {
    const adet = D.gunAyar(gun).dosyaSayisi;
    for (let tohum = 1; tohum <= 20; tohum++) {
      cift++;
      if (!esit(BLD.gunDosyalari(tohum, gun, adet), BLD.gunDosyalari(tohum + 1, gun, adet))) farkli++;
    }
  }
  bak(farkli >= cift * 0.9, `farklı tohum: ${farkli}/${cift} çift farklı`);
  // Aynı tohum, farklı gün farklı dosyalar.
  bak(!esit(BLD.gunDosyalari(5, 3, 6), BLD.gunDosyalari(5, 4, 6)), 'aynı tohum, farklı gün aynı dosyalar');
  const tekil = new Set();
  for (let tohum = 1; tohum <= 50; tohum++) tekil.add(JSON.stringify(BLD.kusurluBinaKur(new Rng(tohum), [])));
  bak(tekil.size >= 45, `kusurluBinaKur 50 tohumda ${tekil.size} farklı bina`);
}

// ---- 5. Değişmezler (üretilen bütün dosyalarda) ----
{
  const sayac = { temiz: 0, kacak1: 0, kacak2: 0, eksik: 0, eksikBosalt: 0 };
  for (let tohum = 1; tohum <= 60; tohum++) {
    for (let gun = 1; gun <= 5; gun++) {
      for (const b of BLD.gunDosyalari(tohum, gun, D.gunAyar(gun).dosyaSayisi)) {
        const e = `değişmez t${tohum} g${gun} ${b.id}`;
        const kus = R.gorunenKusurlar(b, gun);
        const ana = R.dogruDamga(b, gun);
        // Temiz bina (belgeler ve kurallar uyumlu) → GÜVENLİ ve kusur listesi boş; tersi de.
        if (kahin(b, gun).length === 0) {
          sayac.temiz++;
          bak(kus.length === 0 && ana === 'guvenli', `${e}: temiz bina [${gorunen(b, gun)}] ${ana}`);
        }
        if (ana === 'guvenli') bak(kus.length === 0, `${e}: GÜVENLİ ama kusur var`);
        // Kaçak kat: gerçek kat ruhsattan fazlaysa kusur; +1 GÜÇLENDİR, +2 ve üstü BOŞALT; damga en az bu kadar ağır.
        const fark = b.gercek.kat - b.belgeler.ruhsat.kat;
        const kk = kus.find((k) => k.id === 'kacakKat');
        if (fark > 0) {
          const c = fark >= 2 ? 'bosalt' : 'guclendir';
          sayac[fark >= 2 ? 'kacak2' : 'kacak1']++;
          bak(kk && kk.ciddiyet === c, `${e}: +${fark} kat → kaçak kat ${c} değil (${kk?.ciddiyet ?? 'yok'})`);
          if (c === 'bosalt') bak(ana === 'bosalt', `${e}: +${fark} kat ama damga ${ana}`);
          else bak(ana !== 'guvenli', `${e}: +1 kat ama GÜVENLİ`);
        } else bak(!kk, `${e}: kat farkı yokken kaçak kat`);
        // Eksik belge (adalet.mjs ile aynı): BOŞALT görünürse BOŞALT, değilse İADE; eksiksiz dosyada İADE asla.
        const eksik = R.eksikBelgeVar(b, gun);
        const bosaltVar = kus.some((k) => k.ciddiyet === 'bosalt');
        const eksikKahin = kahin(b, gun).some((x) => x.endsWith(':iade'));
        bak(eksik === eksikKahin, `${e}: eksik belge ${eksik} ≠ kâhin ${eksikKahin}`);
        if (eksik) {
          sayac[bosaltVar ? 'eksikBosalt' : 'eksik']++;
          bak(ana === (bosaltVar ? 'bosalt' : 'iade'), `${e}: eksik belgeli dosyada ${ana}`);
          if (ana === 'iade') {
            const bilgi = { karot: b.gercek.betonMpa, zemin: b.gercek.zemin };
            const kabul = R.dogruDamgalar(b, gun, bilgi);
            const tam = kahinDamga(kahin(b, gun, 'gercek'));
            bak(kabul[0] === 'iade' && kabul.length === 2 && kabul[1] === tam, `${e}: bilgiyle kabul [${kabul}] ≠ [iade,${tam}]`);
          }
        } else bak(ana !== 'iade', `${e}: eksiksiz dosyada İADE`);
      }
    }
  }
  // Değişmezler gerçekten sınandı mı (her durum en az bir kez görüldü).
  for (const [k, v] of Object.entries(sayac)) bak(v > 0, `değişmez durumu hiç görülmedi: ${k}`);
  console.log('Değişmez görülme sayıları (tohum 1-60, gün 1-5):', JSON.stringify(sayac));
}

console.log(`${sayi} denetim, ${hata} hata`);
await server.close();
process.exit(hata ? 1 : 0);
