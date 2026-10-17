// Büyük deprem adalet denetimi (G5, G16, G17, G22): tohum 1-10 ve altı karar biçimi (dev örneği, hepsi doğru, hepsi GÜVENLİ,
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
const D = await server.ssrLoadModule('/src/game/days.ts');

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
  // G21 kısa yol: gün 1 (örnek kararlar) + gün 2-5'i temsil eden örnek binalar (ayrı tohum).
  if (bicim === 'kisa') return [...O.ornekKayitlar(tohum, 2), ...O.kisaYolKayitlari(tohum)];
  const out = [];
  for (let g = 1; g <= 5; g++) {
    const o = new S.GunOturumu(g, tohum);
    while (o.mevcut && !o.bitti) o.damgala(bicim === 'dogru' ? R.dogruDamga(o.mevcut, g) : bicim);
    out.push({ gun: g, kararlar: o.kararlar.slice() });
  }
  return out;
}

for (let tohum = 1; tohum <= 10; tohum++) {
  for (const bicim of ['ornek', 'dogru', 'guvenli', 'guclendir', 'bosalt', 'iade', 'kisa']) {
    const k = kayitlar(tohum, bicim);
    const sokak = S.sokakKayitlari(tohum, k);
    const sonuc = S.buyukDeprem(tohum, k);
    bak(sokak.length === sonuc.length, `t${tohum} ${bicim}: sonuç sayısı`);
    if (bicim === 'kisa') {
      // Oyuncunun gün 1 binaları sokakta önde; toplam = gün 1 + örnek bina sayısı.
      const g1 = k[0].kararlar.map((c) => c.dosyaId);
      bak(g1.every((id, i) => sonuc[i]?.dosyaId === id), `t${tohum} kisa: gün 1 binaları önde değil`);
      bak(sonuc.length === g1.length + T.kisaYol.ornekBina, `t${tohum} kisa: sokak uzunluğu ${sonuc.length}`);
    }
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
    const yeni = D.yeniKusurlar(g);
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
        const bilgi = { karot: b.gercek.betonMpa, zemin: b.gercek.zemin, ruhsat: true, vaziyet: true };
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
        // Eksik ve geçersiz belgelerin hepsinin bilgisi edinilir (G17b: geçersiz ruhsat ve başka binanın belgesi dahil).
        const baska = BLD.baskaBinaBelgesi(b.belgeler);
        const bilgi = {};
        if (b.belgeler.karot === null || baska === 'karot') {
          o2.bilgiEdin('karot', b.gercek.betonMpa, 'saha');
          bilgi.karot = 0;
        }
        if (b.belgeler.zemin === null || baska === 'zemin') {
          o2.bilgiEdin('zemin', b.gercek.zemin, 'iste');
          bilgi.zemin = 'orta';
        }
        if (BLD.ruhsatGecersiz(b.belgeler.ruhsat)) {
          o2.bilgiEdin('ruhsat', true, 'iste');
          bilgi.ruhsat = true;
        }
        if (baska === 'vaziyet') {
          o2.bilgiEdin('vaziyet', true, 'iste');
          bilgi.vaziyet = true;
        }
        const tam = R.dogruDamga(R.bilgiyleTamamla(b, bilgi), g);
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
// Sahte rapora inanmak yanlış; gerçek rapor sonrası gerçek damga doğru; getiremezse İADE doğru; cevaplar
// deterministik. G22 zarfın bedeli: zarf karar beklerken hiçbir damga vurulamaz (örtük kabul yok); zarf alınınca
// yalnızca kişinin istediği damga vurulur ve doğruluk o damgaya göre (gerçek kurallarla); geri verilince normal
// kurallar. Kabul edilen zarf parayı artırır.
const K = await server.ssrLoadModule('/src/game/kisi.ts');
const TUM_DAMGA = ['guvenli', 'guclendir', 'bosalt', 'iade'];
const g17 = { gercek: 0, sahte: 0, yok: 0, bahane: 0, itiraf: 0, zarf: 0, sahteBulundu: 0, zarfKabul: 0, zarfKabulYanlis: 0, zarfRet: 0, istenenGuclendir: 0 };
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
        o.incele(R.kanitOgeleri(k));
        ikiz.incele(R.kanitOgeleri(k));
        if (!K.sorulabilir(k.id)) {
          bak(!o.sorulabilir(k.id), `${e}: eksik belge sorulabilir`);
          continue;
        }
        const c = o.sor(k.id);
        const c2 = ikiz.sor(k.id);
        bak(c && c2 && c.tur === c2.tur && c.secim === c2.secim && c.zarf === c2.zarf && c.istenen === c2.istenen, `${e}: SOR deterministik değil`);
        bak(o.sor(k.id) === null, `${e}: aynı kusur iki kez soruldu`);
        if (c) g17[c.tur]++;
        if (c?.zarf !== undefined) {
          bak(c.zarf > 0 && c.zarf % 10 === 0, `${e}: zarf miktarı ${c.zarf}`);
          // İstenen damga (G22): GÜVENLİ ya da (BOŞALT gerektiren kusurda) GÜÇLENDİR; kaşelikte var.
          const cid = k.id === 'sahteRapor' ? 'iade' : k.ciddiyet;
          bak(c.istenen === 'guvenli' || (c.istenen === 'guclendir' && cid === 'bosalt'), `${e}: istenen damga ${c.istenen} (ciddiyet ${cid})`);
          bak(o.ayar.kaseler.includes(c.istenen), `${e}: istenen damga kaşelikte yok`);
          if (c.istenen === 'guclendir') g17.istenenGuclendir++;
          // Örtük kabul yok: karar verilmeden hiçbir damga vurulmaz.
          bak(o.zarfBekliyor && TUM_DAMGA.every((d) => !o.damgaIzinli(d) && o.damgala(d) === null), `${e}: zarf karar beklerken damga vuruldu`);
          bak(o.mevcut === b, `${e}: zarf beklerken dosya ilerledi`);
          o.zarfKarar(tohum % 2 === 0);
          ikiz.zarfKarar(tohum % 2 === 0);
          bak(!o.zarfBekliyor, `${e}: karar sonrası zarf hâlâ bekliyor`);
        }
      }
      const zarf = o.zarf ? { ...o.zarf } : undefined;
      // Zarf alındı (G22): yalnızca istenen damga vurulur; doğruluk gerçek kurallara göre.
      if (zarf?.kabul) {
        g17.zarfKabul++;
        for (const d of TUM_DAMGA)
          if (d !== zarf.istenen) bak(!o.damgaIzinli(d) && o.damgala(d) === null, `${e}: zarf alındı ama ${d} vurulabildi`);
        bak(o.damgaIzinli(zarf.istenen), `${e}: zarf alındı ama istenen damga kilitli`);
        const s1 = o.damgala(zarf.istenen);
        ikiz.damgala(zarf.istenen);
        bak(s1 && s1.dogru === kabulBeklenen.includes(zarf.istenen), `${e}: zarflı damga (${zarf.istenen}) doğruluğu; kabul=${kabulBeklenen.join(',')}`);
        if (s1 && !s1.dogru) g17.zarfKabulYanlis++;
        const kr = o.kararlar[o.kararlar.length - 1];
        bak(kr.damga === zarf.istenen && kr.zarf?.kabul === true && kr.zarf.istenen === zarf.istenen && kr.zarf.miktar === zarf.miktar, `${e}: zarflı karar kaydı`);
        continue;
      }
      if (zarf) {
        g17.zarfRet++;
        bak(TUM_DAMGA.every((d) => o.damgaIzinli(d)), `${e}: zarf geri verildi ama kaşe kilitli`);
      }
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
      if (zarf) bak(kr.zarf && kr.zarf.miktar === zarf.miktar && kr.zarf.kabul === false && kr.zarf.istenen === zarf.istenen, `${e}: zarf kaydı`);
      else bak(!kr.zarf, `${e}: zarfsız dosyada zarf kaydı`);
    }
    // Gün hesabı: zarf toplama eklenir.
    const h = S.gunHesabi(o.kararlar, o.toplam);
    const zarfTop = o.kararlar.reduce((n, k) => n + (k.zarf?.kabul ? k.zarf.miktar : 0), 0);
    bak(h.zarf === zarfTop && h.toplam === h.maas - h.ceza + zarfTop, `t${tohum} g${g}: gün hesabında zarf`);
  }
}
// Deprem sonucu yalnızca vurulan damgaya bağlı (zarf alanı yalnızca işaret); zarflı kararda damga istenen damga,
// sokakta zarf izi kabul edilen zarflarla aynı (G22).
for (let tohum = 1; tohum <= 10; tohum++) {
  const k = O.ornekKayitlar(tohum, 6);
  for (const c of k.flatMap((x) => x.kararlar))
    if (c.zarf?.kabul) bak(c.damga === c.zarf.istenen, `t${tohum} ornek ${c.dosyaId}: zarflı kararda damga istenen değil`);
  const sk = S.sokakKayitlari(tohum, k);
  bak(sk.filter((x) => x.zarf).length === k.flatMap((x) => x.kararlar).filter((c) => c.zarf?.kabul).length, `t${tohum}: sokakta zarf izi sayısı`);
  const oz = S.depremOzeti(S.buyukDeprem(tohum, k));
  bak(oz.zarf === sk.filter((x) => x.zarf).length && oz.zarfHasar <= oz.zarf, `t${tohum}: deprem özetinde zarf`);
  const zarfsiz = k.map((x) => ({ ...x, kararlar: x.kararlar.map(({ zarf: _z, ...c }) => c) }));
  const a1 = S.buyukDeprem(tohum, k);
  const a2 = S.buyukDeprem(tohum, zarfsiz);
  bak(a1.every((r, i) => r.durum === a2[i].durum && r.coktu === a2[i].coktu), `t${tohum}: zarf deprem sonucunu değiştirdi`);
  bak(a1.filter((r) => r.zarf).length === k.flatMap((x) => x.kararlar).filter((c) => c.zarf?.kabul).length, `t${tohum}: deprem sonucunda zarf işareti`);
}
// Kısa yol örnekleri de aynı kuralla (zarflı kararda istenen damga).
for (let tohum = 1; tohum <= 10; tohum++)
  for (const c of O.kisaYolKayitlari(tohum).flatMap((x) => x.kararlar))
    if (c.zarf?.kabul) bak(c.damga === c.zarf.istenen, `t${tohum} kısa yol ${c.dosyaId}: zarflı kararda damga istenen değil`);
console.log('G17 + G22 (tohum 1-40, gün 1-5):', JSON.stringify(g17));

// ---- G17b: belge hileleri (elle düzeltme, başka binanın belgesi, imza yok) ----
// Geçersiz belge eksik belge gibi: İADE doğru; kusur incelemede bulunur, SOR ve İSTE çalışır; düzgün belge gelince
// gerçek damga doğru; elle düzeltilmiş değere ya da başka binanın belgesine inanan damga (İSTE'siz) yanlış; sahte
// belge incelemede "Sahte rapor" olarak bulunur ve değeri yanıltıcı yöndedir.
const HB = T.belgeHile;
const g17b = { elleDuzeltme: 0, baskaBina: 0, imzaYok: 0, gercek: 0, sahte: 0, yok: 0, inanan: 0, sahteBulundu: 0, gercekDamga: 0 };
const sahteKanit = (r) => {
  const alan = K.ipucuAlani(r);
  if (r.ipucu === 'ada')
    return [
      { belge: 'ruhsat', alan: 'ada' },
      { belge: r.alan, alan: 'ada' },
    ];
  const kural = r.ipucu === 'muhur' || r.ipucu === 'tarih' ? R.RAPOR_KURALI : R.GECERSIZ_KURALI;
  return [
    { belge: r.alan, alan },
    { belge: 'kural', alan: kural },
  ];
};
for (let tohum = 1; tohum <= 60; tohum++) {
  for (let g = 1; g <= 5; g++) {
    const o = new S.GunOturumu(g, tohum);
    const ikiz = new S.GunOturumu(g, tohum);
    while (o.mevcut && !o.bitti) {
      const b = o.mevcut;
      const B = b.belgeler;
      const e = `t${tohum} g${g} ${b.id}`;
      const ruhsatHile = BLD.ruhsatGecersiz(B.ruhsat);
      const baska = BLD.baskaBinaBelgesi(B);
      // Günler: imzasız ruhsat gün 4'ten, elle düzeltme ve başka binanın belgesi gün 5'ten.
      if (ruhsatHile === 'imzaYok') bak(g >= HB.imzaGun, `${e}: erken imzasız ruhsat`);
      if (ruhsatHile === 'elleDuzeltme') bak(g >= HB.elleBaskaGun, `${e}: erken elle düzeltme`);
      if (baska) bak(g >= HB.elleBaskaGun, `${e}: erken başka binanın belgesi`);
      // Ruhsatta en çok bir hile ve sahte mühürle birlikte değil; geçersiz ruhsatın kâğıttaki katı fotoğrafla aynı.
      if (ruhsatHile) {
        bak(!b.gercek.ruhsatSahte, `${e}: geçersiz ruhsat sahte mühürle`);
        bak(B.ruhsat.kat === B.foto.gorunenKat, `${e}: geçersiz ruhsatta kat fotoğraftan farklı`);
      }
      if (B.ruhsat.duzeltme) bak(B.ruhsat[B.ruhsat.duzeltme.alan] !== B.ruhsat.duzeltme.asil, `${e}: düzeltme değeri asılla aynı`);
      if (baska) bak(B[baska].ada !== B.ruhsat.ada, `${e}: başka binanın belgesinde ada aynı`);
      else bak([B.vaziyet, B.karot, B.zemin].every((x) => !x || x.ada === B.ruhsat.ada), `${e}: ada uyuşmazlığı`);
      const gor = R.gorunenKusurlar(b, g);
      const gecersiz = gor.filter((k) => R.GECERSIZ_BELGE.includes(k.id));
      if (gecersiz.length === 0) {
        const d = R.dogruDamga(b, g);
        o.damgala(d);
        ikiz.damgala(d);
        continue;
      }
      for (const k of gecersiz) g17b[k.id]++;
      const ana = R.dogruDamga(b, g);
      const bosaltGor = gor.some((k) => k.ciddiyet === 'bosalt');
      bak(ana === (bosaltGor ? 'bosalt' : 'iade'), `${e}: geçersiz belgede doğru damga ${ana}`);
      // Bulunmadan İSTE yok.
      for (const k of gecersiz) bak(ikiz.isteAlani(k.id) === null, `${e}: bulunmadan İSTE (${k.id})`);
      // Geçersiz belgedeki değere inanan (belge geçerliymiş gibi) damga, İSTE'siz yanlış.
      const inananB = { ...B, ruhsat: { ...B.ruhsat, imza: true, duzeltme: undefined } };
      if (baska) inananB[baska] = { ...B[baska], ada: B.ruhsat.ada };
      const inanan = R.dogruDamga({ ...b, belgeler: inananB }, g);
      if (inanan !== ana) {
        g17b.inanan++;
        const s = ikiz.damgala(inanan);
        bak(s && !s.dogru, `${e}: geçersiz belgeye inanan damga (${inanan}) doğru sayıldı`);
      } else ikiz.damgala(ana);
      // Bulma, SOR ve İSTE
      const bilgi = {};
      let tamam = true;
      for (const k of gecersiz) {
        const r = o.incele(R.kanitOgeleri(k));
        bak(r?.kusur.id === k.id, `${e}: ${k.id} incelemede bulunmadı`);
        bak(o.sorulabilir(k.id), `${e}: ${k.id} sorulamıyor`);
        const alan = o.isteAlani(k.id);
        bak(alan !== null && alan === K.gecersizAlani(b, k.id), `${e}: ${k.id} İSTE alanı ${alan}`);
        if (!alan) continue;
        const c = o.iste(alan);
        bak(c && o.iste(alan) === null, `${e}: ${k.id} İSTE iki kez`);
        if (!c) continue;
        g17b[c.tur]++;
        if (c.tur === 'gercek') {
          if (alan === 'karot') bilgi.karot = b.gercek.betonMpa;
          else if (alan === 'zemin') bilgi.zemin = b.gercek.zemin;
          else bilgi[alan] = true;
          bak(!c.rapor.ipucu && c.rapor.ada === B.ruhsat.ada, `${e}: gerçek belgede ipucu ya da ada farkı`);
          if (alan === 'ruhsat') bak(c.rapor.ruhsat.imza && !c.rapor.ruhsat.duzeltme, `${e}: gelen ruhsat geçersiz`);
        } else if (c.tur === 'sahte') {
          tamam = false;
          bak(!!c.rapor?.ipucu, `${e}: sahte belgede ipucu yok`);
          const r2 = o.incele(sahteKanit(c.rapor));
          bak(r2?.kusur.id === 'sahteRapor', `${e}: sahte ${alan} (${c.rapor.ipucu}) incelemede bulunmadı`);
          if (r2?.kusur.id === 'sahteRapor') g17b.sahteBulundu++;
          // Yanıltıcı yön: saklı kusur sahte belgede görünmez.
          if (K.sakliKusur(b, alan)) {
            if (alan === 'ruhsat') bak(c.rapor.ruhsat.kat === b.gercek.kat, `${e}: sahte ruhsat kaçak katı gizlemiyor`);
            if (alan === 'vaziyet')
              bak(c.rapor.vaziyet.dereM >= T.dereMinM && c.rapor.vaziyet.fayM >= T.fayMinM, `${e}: sahte plan yakınlığı gizlemiyor`);
            if (alan === 'karot') bak(c.rapor.deger >= T.betonEsikMpa, `${e}: sahte karot gizlemiyor`);
            if (alan === 'zemin') bak(c.rapor.deger !== 'sivilasma', `${e}: sahte etüt gizlemiyor`);
          }
        } else {
          tamam = false;
          bak(!c.rapor, `${e}: getiremediği halde belge`);
        }
      }
      const eksikDiger = gor.some((k) => R.EKSIK_BELGE.includes(k.id));
      const kabul = Object.keys(bilgi).length > 0 ? R.dogruDamgalar(b, g, bilgi) : [ana];
      bak(kabul[0] === ana, `${e}: kabulün ilki asıl damga değil`);
      if (tamam && !eksikDiger && ana === 'iade') {
        // Bütün geçersiz belgelerin düzgünü geldi: gerçek damga da doğru (binanın gerçeğine göre).
        const gercekD = R.dogruDamga(R.bilgiyleTamamla(b, bilgi), g);
        bak(gercekD !== 'iade' && kabul.includes(gercekD), `${e}: düzgün belge sonrası gerçek damga (${gercekD}) kabulde yok: ${kabul}`);
        const s = o.damgala(gercekD);
        bak(s && s.dogru, `${e}: düzgün belge sonrası gerçek damga yanlış sayıldı`);
        g17b.gercekDamga++;
      } else {
        // Sahte geldi ya da getiremedi: İADE (ya da görünen BOŞALT) doğru.
        const s = o.damgala(ana);
        bak(s && s.dogru, `${e}: geçersiz belgede ${ana} yanlış sayıldı`);
      }
    }
  }
}
// Doğrudan kurulan binalar: elle düzeltilmiş kat kaçak katı gizler; başka binanın belgesi yok sayılır.
{
  const Rng = (await server.ssrLoadModule('/src/game/rng.ts')).Rng;
  const rng = new Rng(17);
  for (let i = 0; i < 60; i++) {
    const b = BLD.kusurluBinaKur(rng, ['elleDuzeltme']);
    const e = `kurulu elle #${i}`;
    bak(R.dogruDamga(b, 5) === 'iade', `${e}: İADE değil`);
    bak(R.dogruDamga(b, 4) !== 'iade', `${e}: gün 4'te elle düzeltme görünüyor`);
    const d = b.belgeler.ruhsat.duzeltme;
    if (d?.alan === 'kat') {
      const gercekD = R.dogruDamga(R.bilgiyleTamamla(b, { ruhsat: true }), 5);
      bak(gercekD === 'guclendir' || gercekD === 'bosalt', `${e}: düzgün ruhsatta kaçak kat yok (${gercekD})`);
      bak(R.dogruDamgalar(b, 5, { ruhsat: true }).join() === `iade,${gercekD}`, `${e}: kabul`);
      // Kâğıttaki (elle yazılmış) kata inanmak: GÜVENLİ, yanlış.
      bak(!R.dogruDamgalar(b, 5).includes('guvenli'), `${e}: elle yazılmış kata inanan doğru`);
    }
  }
  for (let i = 0; i < 60; i++) {
    const b = BLD.kusurluBinaKur(rng, ['baskaBina']);
    const e = `kurulu başka #${i}`;
    const baska = BLD.baskaBinaBelgesi(b.belgeler);
    bak(!!baska && R.dogruDamga(b, 5) === 'iade', `${e}: İADE değil`);
    const sahici = { ...b.belgeler, [baska]: { ...b.belgeler[baska], ada: b.belgeler.ruhsat.ada } };
    const inanan = R.dogruDamga({ ...b, belgeler: sahici }, 5);
    bak(!R.dogruDamgalar(b, 5).includes(inanan), `${e}: başka binanın ${baska} belgesine inanan (${inanan}) doğru`);
    const bilgi = { karot: 1, zemin: 'orta', vaziyet: true };
    const gercekD = R.dogruDamga(R.bilgiyleTamamla(b, bilgi), 5);
    bak(gercekD === R.dogruDamga({ ...b, belgeler: { ...b.belgeler, [baska]: baska === 'vaziyet' ? { dereM: b.gercek.dereMesafeM, fayM: b.gercek.fayMesafeM, ada: b.belgeler.ruhsat.ada } : baska === 'karot' ? { mpa: b.gercek.betonMpa, ada: b.belgeler.ruhsat.ada } : { tur: b.gercek.zemin, ada: b.belgeler.ruhsat.ada } } }, 5), `${e}: gerçek belgeyle damga`);
  }
  for (let i = 0; i < 20; i++) {
    const b = BLD.kusurluBinaKur(rng, ['imzaYok']);
    bak(R.dogruDamga(b, 4) === 'iade' && R.dogruDamga(b, 3) === 'guvenli', `kurulu imza #${i}: gün 4 İADE, gün 3 GÜVENLİ değil`);
    bak(R.dogruDamgalar(b, 4, { ruhsat: true }).join() === 'iade,guvenli', `kurulu imza #${i}: düzgün ruhsatla GÜVENLİ`);
  }
  // Kural kitabı: gün 4'te imza, gün 5'te üç hile aynı satırda ve "YENİ".
  const kural = R.KURALLAR.find((k) => k.id === R.GECERSIZ_KURALI);
  bak(R.kuralMetni(kural, 4).includes('imzasız') && !R.kuralMetni(kural, 4).includes('elle'), 'gün 4 geçersiz belge kuralı metni');
  bak(['elle', 'başka', 'imzasız', 'İADE'].every((x) => R.kuralMetni(kural, 5).includes(x)), 'gün 5 geçersiz belge kuralı metni');
  bak(R.kuralYeni(kural, 4) && R.kuralYeni(kural, 5) && !R.kuralYeni(kural, 3), 'geçersiz belge kuralı YENİ günleri');
}
console.log('G17b (tohum 1-60, gün 1-5):', JSON.stringify(g17b));

console.log(`${sayi} denetim, ${hata} hata`);
console.log(`Kural: fay yakını = ${T.fayKurali === 'bosalt' ? 'her zaman BOŞALT' : 'zemine bağlı (dere gibi)'}`);
console.log('Eksik belge ve dere/fay görülme sayıları (tohum 1-40, gün 1-5):', JSON.stringify(sayac));
console.log('Dağılım (damga / fiziksel kusur → sonuç):');
for (const [k, v] of Object.entries(dagilim).sort()) console.log(`  ${k}: ${v}`);
await server.close();
process.exit(hata ? 1 : 0);
