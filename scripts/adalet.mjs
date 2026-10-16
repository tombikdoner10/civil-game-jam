// Büyük deprem adalet denetimi (G5, G16, G17): tohum 1-10 ve altı karar biçimi (dev örneği, hepsi doğru, hepsi GÜVENLİ,
// hepsi GÜÇLENDİR, hepsi BOŞALT, hepsi İADE) için session.buyukDeprem sonuçlarını kurallara göre denetler. Ayrıca
// İADE ve eksik belge mantığını (doğru damgalar, bilgi edinme) ve dere/fay + zemin kuralını denetler.
// İADE edilen kusurlu bina insanlı kalır: oyuncunun bilinçli bıraktığı risktir, adalet ihlali sayılmaz.
// Kullanım: npm run adalet   (hata varsa çıkış kodu 1)
import { createServer } from 'vite';

const server = await createServer({ logLevel: 'error', server: { middlewareMode: true }, appType: 'custom' });
const S = await server.ssrLoadModule('/src/game/session.ts');
const R = await server.ssrLoadModule('/src/game/rules.ts');
const O = await server.ssrLoadModule('/src/game/ornek.ts');
const BLD = await server.ssrLoadModule('/src/game/building.ts');
const T = (await server.ssrLoadModule('/src/game/tuning.ts')).TUNING;

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
  for (const bicim of ['ornek', 'dogru', 'guvenli', 'guclendir', 'bosalt', 'iade']) {
    const k = kayitlar(tohum, bicim);
    const sokak = S.sokakKayitlari(tohum, k);
    const sonuc = S.buyukDeprem(tohum, k);
    bak(sokak.length === sonuc.length, `t${tohum} ${bicim}: sonuç sayısı`);
    sonuc.forEach((r, i) => {
      const s = sokak[i];
      const kusurlu = R.fizikselKusurlar(s.bina, s.gun).length > 0;
      const e = `t${tohum} ${bicim} ${r.dosyaId} damga=${r.damga} kusurlu=${kusurlu} durum=${r.durum} coktu=${r.coktu} bos=${r.bos} oncu=${s.hasar ?? '-'}`;
      const anahtar = `${r.damga} / ${kusurlu ? 'kusurlu' : 'temiz'} → ${r.coktu ? 'çöktü' : r.durum}`;
      dagilim[anahtar] = (dagilim[anahtar] ?? 0) + 1;
      bak(r.kusurlu === kusurlu, 'kusurlu alanı: ' + e);
      // Kusursuz bina (damgası ne olursa olsun) ayakta.
      if (!kusurlu) bak(r.durum === 'ayakta' && !r.coktu, 'kusursuz bina hasar aldı: ' + e);
      // GÜÇLENDİR damgalı bina en fazla hasarlı.
      if (r.damga === 'guclendir') bak(!r.coktu && r.durum !== 'agirHasar', 'GÜÇLENDİR hasarlıdan kötü: ' + e);
      // BOŞALT damgalı bina boş (çökse bile); öbürleri (İADE dahil) boş değil.
      bak(r.bos === (r.damga === 'bosalt'), 'boş bilgisi: ' + e);
      // Yanlışlıkla GÜVENLİ damgalanan (ya da İADE edilen) kusurlu bina ağır hasarlı ya da çökük.
      if (kusurlu && (r.damga === 'guvenli' || r.damga === 'iade'))
        bak(r.coktu || r.durum === 'agirHasar', 'GÜVENLİ/İADE kusurlu bina ağır değil: ' + e);
      // İADE edilen bina, gerçek kusurlarıyla GÜVENLİ damgalıymış gibi sonuç alır.
      if (r.damga === 'iade') {
        const g = R.buyukDepremSonucu(s.bina, 'guvenli', s.gun, { oncuHasar: s.hasar });
        bak(g.durum === r.durum && g.coker === r.coktu, 'İADE ≠ GÜVENLİ sonucu: ' + e);
      }
      // Doğru kararda içinde insan varken ağır hasar ya da çökme yok. İADE hariç: bilinçli bırakılan risk.
      if (r.dogru && !r.bos && r.damga !== 'iade') bak(!r.coktu && r.durum !== 'agirHasar', 'doğru karar ağır sonuç: ' + e);
    });
    const oz = S.depremOzeti(sonuc);
    bak(oz.ayakta + oz.hasarli + oz.coken === oz.toplam, `t${tohum} ${bicim}: özet toplamı`);
    bak(oz.cokenBos + oz.doluCoken === oz.coken, `t${tohum} ${bicim}: çöken toplamı`);
    bak(oz.iade === sonuc.filter((r) => r.damga === 'iade').length, `t${tohum} ${bicim}: iade sayısı`);
    if (bicim === 'dogru')
      bak(oz.doluCoken - oz.iadeCoken === 0 && oz.doluAgir - oz.iadeAgir === 0, `t${tohum}: hepsi doğru ama İADE dışı dolu ağır hasar ya da çöken var`);
  }
}

// ---- İADE ve eksik belge mantığı (her tohum ve gün) ----
const sayac = { karotYok: 0, zeminEtuduYok: 0, dereSaglam: 0, dereSivi: 0, dereEtutYok: 0, faySaglam: 0, faySivi: 0, fayEtutYok: 0 };
for (let tohum = 1; tohum <= 40; tohum++) {
  for (let g = 1; g <= 5; g++) {
    const o = new S.GunOturumu(g, tohum);
    const yeni = o.ayar.yeniKurallar.flatMap((k) => k.kusurlar);
    // İlk iki dosyadan biri o günün yeni kuralının kusurunu gösterir (gün 2+).
    if (g >= 2 && yeni.length > 0)
      bak(
        o.dosyalar.slice(0, 2).some((b) => R.gorunenKusurlar(b, g).some((k) => yeni.includes(k.id))),
        `t${tohum} g${g}: ilk iki dosyada yeni kural kusuru yok`,
      );
    for (const b of o.dosyalar) {
      const gor = R.gorunenKusurlar(b, g).map((k) => k.id);
      const e = `t${tohum} g${g} ${b.id} [${gor.join(',')}]`;
      const ana = R.dogruDamga(b, g);
      const eksik = R.eksikBelgeVar(b, g);
      const bosaltGor = R.gorunenKusurlar(b, g).some((k) => k.ciddiyet === 'bosalt');
      // Eksik karot yalnızca gün 3+, eksik zemin etüdü gün 4+.
      if (b.belgeler.karot === null) bak(g >= 3, 'erken eksik karot: ' + e);
      if (b.belgeler.zemin === null) bak(g >= 4, 'erken eksik zemin etüdü: ' + e);
      if (gor.includes('karotYok')) sayac.karotYok++;
      if (gor.includes('zeminEtuduYok')) sayac.zeminEtuduYok++;
      // Eksiksiz dosyada İADE yanlış; eksik belgeli dosyada (BOŞALT görünmüyorsa) doğru damga İADE.
      if (!eksik) bak(ana !== 'iade', 'eksiksiz dosyada doğru İADE: ' + e);
      else bak(ana === (bosaltGor ? 'bosalt' : 'iade'), 'eksik belgeli dosyada doğru damga: ' + ana + ' ' + e);
      // Bilgi edinilince gerçek damga da doğru, İADE de doğru kalır.
      if (ana === 'iade') {
        const bilgi = { karot: b.gercek.betonMpa, zemin: b.gercek.zemin };
        const kabul = R.dogruDamgalar(b, g, bilgi);
        bak(kabul[0] === 'iade' && kabul.length === 2 && kabul[1] !== 'iade', 'bilgiyle kabul: ' + kabul.join(',') + ' ' + e);
        bak(kabul[1] === R.dogruDamga(R.bilgiyleTamamla(b, bilgi), g), 'bilgiyle gerçek damga: ' + e);
      }
      // Dere ve fay: zemin etüdüne bağlı.
      for (const [id, ad] of [
        ['dereyeYakin', 'dere'],
        ['fayaYakin', 'fay'],
      ]) {
        if (!gor.includes(id)) continue;
        const z = b.belgeler.zemin;
        const bosaltFay = id === 'fayaYakin' && T.fayKurali === 'bosalt';
        const digerBosalt = R.gorunenKusurlar(b, g).some((k) => k.ciddiyet === 'bosalt' && k.id !== id && k.id !== 'sivilasma');
        if (digerBosalt) continue;
        if (z === null) {
          sayac[`${ad}EtutYok`]++;
          if (!bosaltFay) bak(ana === 'iade', `${ad} + etüt yok → İADE değil (${ana}): ` + e);
        } else if (z.tur === 'sivilasma') {
          sayac[`${ad}Sivi`]++;
          bak(ana === 'bosalt', `${ad} + sıvılaşma → BOŞALT değil (${ana}): ` + e);
        } else {
          sayac[`${ad}Saglam`]++;
          const digerGuc = R.gorunenKusurlar(b, g).some((k) => k.id !== id && k.ciddiyet === 'iade');
          if (!digerGuc) bak(ana === (bosaltFay ? 'bosalt' : 'guclendir'), `${ad} + ${z.tur} → beklenen değil (${ana}): ` + e);
        }
      }
    }
    // Oturum: eksiksiz dosyada İADE yanlış, eksik belgeli dosyada doğru; bilgi edinilince gerçek damga da doğru.
    const o2 = new S.GunOturumu(g, tohum);
    while (o2.mevcut && !o2.bitti) {
      const b = o2.mevcut;
      const ana = R.dogruDamga(b, g);
      if (ana === 'iade' && b.id.endsWith('1')) {
        if (b.belgeler.karot === null) o2.bilgiEdin('karot', b.gercek.betonMpa, 'saha');
        if (b.belgeler.zemin === null) o2.bilgiEdin('zemin', b.gercek.zemin, 'iste');
        const tam = R.dogruDamga(R.bilgiyleTamamla(b, { karot: 0, zemin: 'orta' }), g);
        const s = o2.damgala(tam);
        bak(s.dogru && s.kabul.includes('iade'), `t${tohum} g${g} ${b.id}: bilgiyle gerçek damga (${tam}) doğru sayılmadı`);
      } else {
        const s = o2.damgala('iade');
        bak(s.dogru === (ana === 'iade'), `t${tohum} g${g} ${b.id}: İADE doğruluğu (asıl ${ana})`);
      }
    }
  }
}
// Doğrudan kurulan binalarla dere + zemin üç durumu.
{
  const Rng = (await server.ssrLoadModule('/src/game/rng.ts')).Rng;
  const rng = new Rng(7);
  const durum = [
    [['dereyeYakin'], 'guclendir'],
    [['dereyeYakin', 'sivilasma'], 'bosalt'],
    [['dereyeYakin', 'zeminEtuduYok'], 'iade'],
    [['fayaYakin'], T.fayKurali === 'bosalt' ? 'bosalt' : 'guclendir'],
    [['fayaYakin', 'sivilasma'], 'bosalt'],
    [['fayaYakin', 'zeminEtuduYok'], T.fayKurali === 'bosalt' ? 'bosalt' : 'iade'],
    [['karotYok'], 'iade'],
    [[], 'guvenli'],
  ];
  for (const [kusurlar, beklenen] of durum) {
    for (let i = 0; i < 20; i++) {
      const b = BLD.kusurluBinaKur(rng, kusurlar);
      bak(R.dogruDamga(b, 5) === beklenen, `kurulu ${kusurlar.join('+') || 'temiz'}: ${R.dogruDamga(b, 5)} ≠ ${beklenen}`);
    }
  }
}

// ---- G17: gişedeki kişi (SOR, İSTE, zarf) ----
// Sahte rapora inanmak yanlış; gerçek rapor sonrası gerçek damga doğru; getiremezse İADE doğru; zarf damgayı
// etkilemez ama parayı artırır; cevaplar deterministik.
const K = await server.ssrLoadModule('/src/game/kisi.ts');
const g17 = { gercek: 0, sahte: 0, yok: 0, bahane: 0, itiraf: 0, zarf: 0, sahteBulundu: 0 };
for (let tohum = 1; tohum <= 40; tohum++) {
  for (let g = 1; g <= 5; g++) {
    const o = new S.GunOturumu(g, tohum);
    const ikiz = new S.GunOturumu(g, tohum);
    while (o.mevcut && !o.bitti) {
      const b = o.mevcut;
      const e = `t${tohum} g${g} ${b.id}`;
      const ana = R.dogruDamga(b, g);
      // İSTE
      let kabulBeklenen = [ana];
      let sahteVar = false;
      for (const alan of ['karot', 'zemin']) {
        const izin = o.istenebilir(alan);
        bak(izin === (o.ayar.iste && b.belgeler[alan] === null && R.gorunenKusurlar(b, g).some((k) => k.id === K.ISTE_KUSURU[alan])), `${e}: istenebilir(${alan})`);
        if (!izin) continue;
        const c = o.iste(alan);
        const c2 = ikiz.iste(alan);
        bak(c && c2 && c.tur === c2.tur && c.secim === c2.secim && JSON.stringify(c.rapor) === JSON.stringify(c2.rapor), `${e}: İSTE deterministik değil`);
        bak(o.iste(alan) === null, `${e}: ikinci İSTE`);
        g17[c.tur]++;
        if (c.tur === 'sahte') {
          sahteVar = true;
          bak(o.ayar.sahteRapor, `${e}: sahte rapor günü gelmeden sahte`);
          bak(!!c.rapor?.ipucu, `${e}: sahte raporda ipucu yok`);
          // Yanıltıcı yön: saklı kusur varsa sahte değer kusuru gizler.
          if (K.sakliKusur(b, alan))
            bak(alan === 'karot' ? c.rapor.deger >= T.betonEsikMpa : c.rapor.deger !== 'sivilasma', `${e}: sahte değer yanıltmıyor`);
          // İnceleme: ipucu alanı + rapor kuralı → Sahte rapor
          const r = o.incele([{ belge: alan, alan: K.ipucuAlani(c.rapor) }, { belge: 'kural', alan: R.RAPOR_KURALI }]);
          bak(r?.kusur.id === 'sahteRapor', `${e}: sahte rapor incelemede bulunmadı`);
          if (r?.kusur.id === 'sahteRapor') g17.sahteBulundu++;
        } else if (c.tur === 'gercek') {
          bak(c.rapor && c.rapor.deger === (alan === 'karot' ? b.gercek.betonMpa : b.gercek.zemin), `${e}: gerçek rapor değeri`);
          bak(c.rapor && c.rapor.tarihFark < 0 && !c.rapor.ipucu, `${e}: gerçek raporda ipucu`);
        } else bak(!c.rapor, `${e}: getiremediği halde rapor`);
      }
      // Kabul edilen damgalar: gerçek rapor geldiyse gerçek damga da.
      const gelen = {};
      for (const alan of ['karot', 'zemin']) if (o.edinilenBilgi.kaynak[alan] === 'iste') gelen[alan] = o.edinilenBilgi.bilgi[alan];
      if (Object.keys(gelen).length > 0) kabulBeklenen = R.dogruDamgalar(b, g, gelen);
      // SOR: her görünen kusur bulunur ve (sorulabilirse) sorulur.
      for (const k of R.gorunenKusurlar(b, g)) {
        o.incele(R.kanitOgeleri(k.id));
        ikiz.incele(R.kanitOgeleri(k.id));
        if (!K.sorulabilir(k.id)) {
          bak(!o.sorulabilir(k.id), `${e}: eksik belge sorulabilir`);
          continue;
        }
        const c = o.sor(k.id);
        const c2 = ikiz.sor(k.id);
        bak(c && c2 && c.tur === c2.tur && c.secim === c2.secim && c.zarf === c2.zarf, `${e}: SOR deterministik değil`);
        bak(o.sor(k.id) === null, `${e}: aynı kusur iki kez soruldu`);
        if (c) g17[c.tur]++;
        if (c?.zarf !== undefined) {
          bak(c.zarf > 0 && c.zarf % 10 === 0, `${e}: zarf miktarı ${c.zarf}`);
          o.zarfKarar(tohum % 2 === 0);
          ikiz.zarfKarar(tohum % 2 === 0);
        }
      }
      const zarf = o.zarf ? { ...o.zarf } : undefined;
      // Sahte rapora inanmak: sahte değerle tamamlanmış belgeye göre damga (İADE ya da BOŞALT değilse) yanlış.
      if (sahteVar) {
        const sahteler = o.sahteRaporlar;
        const B = { ...b.belgeler };
        for (const r of sahteler) {
          if (r.alan === 'karot') B.karot = { mpa: r.deger };
          else B.zemin = { tur: r.deger };
        }
        const inanan = R.dogruDamga({ ...b, belgeler: B }, g);
        if (!kabulBeklenen.includes(inanan)) {
          g17.inanan = (g17.inanan ?? 0) + 1;
          const s1 = ikiz.damgala(inanan);
          bak(s1 && !s1.dogru, `${e}: sahte rapora inanan damga (${inanan}) doğru sayıldı`);
          const s2 = o.damgala(kabulBeklenen[0]);
          bak(s2 && s2.dogru && s2.kusurlar.includes('sahteRapor'), `${e}: sahte raporlu dosyada doğru damga`);
          continue;
        }
      }
      // Doğru damgalar (zarf alınsa da) doğru; dosya eksiksizse İADE yanlış.
      const hedef = kabulBeklenen[kabulBeklenen.length - 1];
      const s1 = o.damgala(hedef);
      bak(s1 && s1.dogru, `${e}: doğru damga (${hedef}) yanlış sayıldı; kabul=${kabulBeklenen.join(',')}`);
      ikiz.damgala(hedef);
      const kr = o.kararlar[o.kararlar.length - 1];
      if (zarf) bak(kr.zarf && kr.zarf.miktar === zarf.miktar && kr.zarf.kabul === (zarf.kabul ?? true), `${e}: zarf kaydı`);
      else bak(!kr.zarf, `${e}: zarfsız dosyada zarf kaydı`);
    }
    // Gün hesabı: zarf toplama eklenir.
    const h = S.gunHesabi(o.kararlar, o.toplam);
    const zarfTop = o.kararlar.reduce((n, k) => n + (k.zarf?.kabul ? k.zarf.miktar : 0), 0);
    bak(h.zarf === zarfTop && h.toplam === h.maas - h.ceza + zarfTop, `t${tohum} g${g}: gün hesabında zarf`);
  }
}
// Zarf deprem sonucunu değiştirmez (ornek kayıtlarında zarf alanı sonuçta işaretli, durum aynı kurala göre).
for (let tohum = 1; tohum <= 10; tohum++) {
  const k = O.ornekKayitlar(tohum, 6);
  const zarfsiz = k.map((x) => ({ ...x, kararlar: x.kararlar.map(({ zarf: _z, ...c }) => c) }));
  const a1 = S.buyukDeprem(tohum, k);
  const a2 = S.buyukDeprem(tohum, zarfsiz);
  bak(a1.every((r, i) => r.durum === a2[i].durum && r.coktu === a2[i].coktu), `t${tohum}: zarf deprem sonucunu değiştirdi`);
  bak(a1.filter((r) => r.zarf).length === k.flatMap((x) => x.kararlar).filter((c) => c.zarf?.kabul).length, `t${tohum}: deprem sonucunda zarf işareti`);
}
console.log('G17 (tohum 1-40, gün 1-5):', JSON.stringify(g17));

console.log(`${sayi} denetim, ${hata} hata`);
console.log(`Kural: fay yakını = ${T.fayKurali === 'bosalt' ? 'her zaman BOŞALT' : 'zemine bağlı (dere gibi)'}`);
console.log('Eksik belge ve dere/fay görülme sayıları (tohum 1-40, gün 1-5):', JSON.stringify(sayac));
console.log('Dağılım (damga / fiziksel kusur → sonuç):');
for (const [k, v] of Object.entries(dagilim).sort()) console.log(`  ${k}: ${v}`);
await server.close();
process.exit(hata ? 1 : 0);
