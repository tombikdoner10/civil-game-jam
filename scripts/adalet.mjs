// Büyük deprem adalet denetimi (G5): tohum 1-10 ve beş karar biçimi (dev örneği, hepsi doğru, hepsi GÜVENLİ,
// hepsi GÜÇLENDİR, hepsi BOŞALT) için session.buyukDeprem sonuçlarını kurallara göre denetler.
// Kullanım: npm run adalet   (hata varsa çıkış kodu 1)
import { createServer } from 'vite';

const server = await createServer({ logLevel: 'error', server: { middlewareMode: true }, appType: 'custom' });
const S = await server.ssrLoadModule('/src/game/session.ts');
const R = await server.ssrLoadModule('/src/game/rules.ts');
const O = await server.ssrLoadModule('/src/game/ornek.ts');

let hata = 0;
let sayi = 0;
const dagilim = {};
const bak = (kosul, mesaj) => {
  sayi++;
  if (!kosul) {
    hata++;
    console.log('HATA', mesaj);
  }
};

function kayitlar(tohum, bicim) {
  if (bicim === 'ornek') return O.ornekKayitlar(tohum, 6);
  const out = [];
  for (let g = 1; g <= 5; g++) {
    const o = new S.GunOturumu(g, tohum);
    while (o.mevcut && !o.bitti) o.damgala(bicim === 'dogru' ? R.dogruDamga(o.mevcut, g) : bicim);
    out.push({ gun: g, kararlar: o.kararlar.slice() });
  }
  return out;
}

for (let tohum = 1; tohum <= 10; tohum++) {
  for (const bicim of ['ornek', 'dogru', 'guvenli', 'guclendir', 'bosalt']) {
    const k = kayitlar(tohum, bicim);
    const sokak = S.sokakKayitlari(tohum, k);
    const sonuc = S.buyukDeprem(tohum, k);
    bak(sokak.length === sonuc.length, `t${tohum} ${bicim}: sonuç sayısı`);
    sonuc.forEach((r, i) => {
      const s = sokak[i];
      const kusurlu = R.gorunenKusurlar(s.bina, s.gun).length > 0;
      const e = `t${tohum} ${bicim} ${r.dosyaId} damga=${r.damga} kusurlu=${kusurlu} durum=${r.durum} coktu=${r.coktu} bos=${r.bos} oncu=${s.hasar ?? '-'}`;
      const anahtar = `${r.damga} / ${kusurlu ? 'kusurlu' : 'temiz'} → ${r.coktu ? 'çöktü' : r.durum}`;
      dagilim[anahtar] = (dagilim[anahtar] ?? 0) + 1;
      bak(r.kusurlu === kusurlu, 'kusurlu alanı: ' + e);
      // Kusursuz bina (damgası ne olursa olsun) ayakta.
      if (!kusurlu) bak(r.durum === 'ayakta' && !r.coktu, 'kusursuz bina hasar aldı: ' + e);
      // GÜÇLENDİR damgalı bina en fazla hasarlı.
      if (r.damga === 'guclendir') bak(!r.coktu && r.durum !== 'agirHasar', 'GÜÇLENDİR hasarlıdan kötü: ' + e);
      // BOŞALT damgalı bina boş (çökse bile); öbürleri boş değil.
      bak(r.bos === (r.damga === 'bosalt'), 'boş bilgisi: ' + e);
      // Yanlışlıkla GÜVENLİ damgalanan kusurlu bina ağır hasarlı ya da çökük.
      if (kusurlu && r.damga === 'guvenli') bak(r.coktu || r.durum === 'agirHasar', 'yanlış GÜVENLİ kusurlu bina ağır değil: ' + e);
      // Doğru kararda içinde insan varken ağır hasar ya da çökme yok.
      if (r.dogru && !r.bos) bak(!r.coktu && r.durum !== 'agirHasar', 'doğru karar ağır sonuç: ' + e);
    });
    const oz = S.depremOzeti(sonuc);
    bak(oz.ayakta + oz.hasarli + oz.coken === oz.toplam, `t${tohum} ${bicim}: özet toplamı`);
    bak(oz.cokenBos + oz.doluCoken === oz.coken, `t${tohum} ${bicim}: çöken toplamı`);
    if (bicim === 'dogru') bak(oz.doluCoken === 0 && oz.doluAgir === 0, `t${tohum}: hepsi doğru ama dolu ağır hasar ya da çöken var`);
  }
}

console.log(`${sayi} denetim, ${hata} hata`);
console.log('Dağılım (damga / görünen kusur → sonuç):');
for (const [k, v] of Object.entries(dagilim).sort()) console.log(`  ${k}: ${v}`);
await server.close();
process.exit(hata ? 1 : 0);
