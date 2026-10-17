// Büyük deprem adalet denetimi (G5, G16, G17, G19, G22, G42/G43 kendi evin): tohum 1-10 ve altı karar biçimi (dev örneği, hepsi doğru, hepsi GÜVENLİ,
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
const G = await server.ssrLoadModule('/src/game/gazete.ts');

let hata = 0;
let sayi = 0;
const dagilim = {};
const sahteDagilim = {};
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
      // G36: sahte ruhsatlı binalar ayrı dağılımda (doğru damga İADE; ruhsatsız yapı depremde fiziksel kusur).
      if (s.bina.gercek.ruhsatSahte && s.gun >= 5) {
        const sa = `${bicim}: ${r.damga} → ${r.coktu ? 'çöktü' : r.durum}`;
        sahteDagilim[sa] = (sahteDagilim[sa] ?? 0) + 1;
        bak(kusurlu, 'sahte ruhsatlı bina fiziksel kusursuz: ' + e);
      }
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
      // Bilgi edinilince gerçek damga da doğru, İADE de doğru kalır. G36: sahte ruhsatın bilgisi edinilemez (İSTE
      // yok): sahte ruhsatlı dosyada (BOŞALT görünmüyorsa) İADE doğru kalır; öbür eksik belgenin bilgisi saklı BOŞALT
      // gösterirse BOŞALT da doğru (en ağır damga), GÜÇLENDİR ya da GÜVENLİ asla.
      if (ana === 'iade' && gor.includes('sahteBelge')) {
        const bilgi = { karot: b.gercek.betonMpa, zemin: b.gercek.zemin, ruhsat: true, vaziyet: true };
        const kabul = R.dogruDamgalar(b, g, bilgi).join();
        bak(kabul === 'iade' || kabul === 'iade,bosalt', 'sahte ruhsatta bilgiyle kabul: ' + kabul + ' ' + e);
      } else if (ana === 'iade') {
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
          o2.bilgiEdin('karot', b.gercek.betonMpa, 'iste');
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
// G23b: kısa yolun örnek binalarında zarf yok; gazete ve sonuç ekranındaki zarf satırı ve ekleri yalnızca oyuncunun
// kendi (gün 1) kararlarındaki kabul edilen zarflara bakar. Zarf almayan oyuncuda hiçbiri çıkmaz; alanda çıkar.
const g23b = { zarfsizOyun: 0, zarfliOyun: 0 };
for (let tohum = 1; tohum <= 40; tohum++) {
  const ornek = O.kisaYolKayitlari(tohum);
  bak(ornek.every((x) => x.kararlar.every((c) => c.zarf === undefined)), `t${tohum} kısa yol: örnek binada zarf kaydı`);
  // Örnek kararlar zarflı olsa bile (eski kayıt) zarf işareti yalnızca oyuncunun kayıtlarından gelir.
  const zarfliOrnek = O.ornekKayitlar(O.kisaYolTohumu(tohum), 6, 2);
  for (const zarfAl of [false, true]) {
    const g1 = O.ornekKayitlar(tohum, 2, 1, !zarfAl);
    for (const digerleri of [ornek, zarfliOrnek]) {
      const hepsi = [...g1, ...digerleri];
      const sonuc = S.buyukDeprem(tohum, hepsi, g1);
      const juri = new Set(g1[0].kararlar.map((c) => c.dosyaId));
      const kendiZarf = new Set(g1[0].kararlar.filter((c) => c.zarf?.kabul).map((c) => c.dosyaId));
      const e = `t${tohum} kısa yol zarfAl=${zarfAl}`;
      bak(sonuc.every((r) => r.zarf === kendiZarf.has(r.dosyaId)), `${e}: zarf işareti oyuncunun zarflarıyla aynı değil`);
      const juriSonuc = sonuc.filter((r) => juri.has(r.dosyaId));
      const h = S.gunHesabi(g1[0].kararlar, D.gunAyar(1).dosyaSayisi);
      const metinler = [
        G.zarfSatiri(sonuc) ?? '',
        ...G.oneCikanlar(sonuc, juri).satirlar,
        G.degerlendirme(S.depremOzeti(juriSonuc)).metin,
        G.zarfOzeti(h.zarfKabul, h.zarf, juriSonuc) ?? '',
      ];
      const zarfGecti = metinler.some((m) => /zarf/i.test(m));
      if (kendiZarf.size === 0) {
        bak(!zarfGecti, `${e}: zarf almayan oyuncuda zarf metni: ${metinler.filter((m) => /zarf/i.test(m)).join(' | ')}`);
        g23b.zarfsizOyun++;
      } else {
        bak(G.zarfOzeti(h.zarfKabul, h.zarf, juriSonuc) !== null && /zarf/.test(G.degerlendirme(S.depremOzeti(juriSonuc)).metin), `${e}: zarf alan oyuncuda zarf özeti yok`);
        g23b.zarfliOyun++;
      }
    }
  }
}
console.log('G23b kısa yol zarf (tohum 1-40):', JSON.stringify(g23b));
// G23b (eleştirmen 3): kısa yolda manşet ve değerlendirme yalnızca jürinin (oyuncunun) binalarından ve aynı tonda;
// örnek binalar jürinin yanlış GÜVENLİ'sini gölgelemez (gazetenin öne çıkan satırlarında hep görünür).
// G35: tek bina çöktüyse tekil biçim.
const MANSET_KOTU = [
  '[Manşet: denetlenmeden kalan binalar çöktü]',
  '[Manşet: denetimden geçen binalar çöktü]',
  '[Manşet: denetlenmeden kalan bina çöktü]',
  '[Manşet: denetimden geçen bina çöktü]',
];
const g23bTon = { kotu: 0, orta: 0, iyi: 0, yanlisGuvenli: 0 };
const g37 = { ikiParca: 0, zarfOnayKisa: 0, zarfOnay5Gun: 0, zarfOnayHepsi: 0 };
for (let tohum = 1; tohum <= 40; tohum++) {
  const ornek = O.kisaYolKayitlari(tohum);
  const gunler = {
    ornek: O.ornekKayitlar(tohum, 2, 1, true),
    zarfli: O.ornekKayitlar(tohum, 2),
    ...Object.fromEntries(['dogru', 'guvenli', 'bosalt', 'iade'].map((b) => [b, kayitlar(tohum, b).slice(0, 1)])),
  };
  for (const [ad, g1] of Object.entries(gunler)) {
    const e = `t${tohum} kısa yol ${ad}`;
    const sonuc = S.buyukDeprem(tohum, [...g1, ...ornek], g1);
    const juri = new Set(g1[0].kararlar.map((c) => c.dosyaId));
    const juriSonuc = sonuc.filter((r) => juri.has(r.dosyaId));
    // Gazete ve sonuç ekranı manşeti/değerlendirmeyi bu özetten seçer (NewspaperScene, ResultScene).
    const oz = S.oyuncuOzeti(sonuc, juri);
    bak(oz.toplam === juriSonuc.length, `${e}: oyuncu özeti örnek binaları içeriyor`);
    // G37: sokakta jürinin denetlemediği binalardan çökenler (oyundaki gibi verilir).
    const sokakCoken = G.sokakCokenSayisi(sonuc, juri);
    bak(sokakCoken === sonuc.filter((r) => !juri.has(r.dosyaId) && r.coktu).length, `${e}: sokakta çöken sayısı`);
    const m = G.manset(oz, { sokakCoken });
    const deg = G.degerlendirme({ ...oz, zarf: 0, zarfHasar: 0, zarfCoken: 0, zarfDoluCoken: 0 }, { sokakCoken });
    bak((deg.ton === 'kotu') === MANSET_KOTU.includes(m), `${e}: manşet (${m}) ile değerlendirme (${deg.metin}, ${deg.ton}) çelişiyor`);
    if (g1[0].kararlar.every((c) => c.dogru)) bak(!MANSET_KOTU.includes(m) && deg.ton !== 'kotu', `${e}: jürinin hepsi doğru ama manşet/değerlendirme kötü: ${m}`);
    // G37 (takım kararı): jürinin binası çökmediyse ve sokakta çöken varsa manşet ve değerlendirme ikisini de söyler;
    // sokakta çöken yoksa "sokak ayakta"/"hazırdı" kalabilir, varsa bu ikisi çıkmaz.
    const sokakParcasi = /sokakta denetlenmeyen/;
    if (oz.coken === 0 && sokakCoken > 0) {
      bak(sokakParcasi.test(m) && sokakParcasi.test(deg.metin), `${e}: jürinin binaları ayakta, sokakta ${sokakCoken} çöken ama manşet/değerlendirme söylemiyor: ${m} | ${deg.metin}`);
      g37.ikiParca++;
    }
    // G37 (takım kararı): sokak cümlesi yalnızca uyarı; ton jürinin binalarına göre, sokak cümlesi olmadan nasılsa öyle
    // (jürinin binaları ayakta: 'iyi', ağır hasar: 'orta'; çöktüyse eskisi gibi).
    const sokaksiz = G.degerlendirme({ ...oz, zarf: 0, zarfHasar: 0, zarfCoken: 0, zarfDoluCoken: 0 });
    bak(deg.ton === sokaksiz.ton, `${e}: sokak cümlesi tonu değiştirdi (${deg.ton}, sokaksız ${sokaksiz.ton}): ${deg.metin}`);
    if (sokakParcasi.test(deg.metin)) g37[`ikiParca_${deg.ton}`] = (g37[`ikiParca_${deg.ton}`] ?? 0) + 1;
    if (sokakCoken > 0) bak(!/sokak ayakta|sokak depreme hazırdı/.test(m + deg.metin), `${e}: sokakta çöken var ama "sokak ayakta": ${m} | ${deg.metin}`);
    else bak(!sokakParcasi.test(m + deg.metin), `${e}: sokakta çöken yok ama sokak parçası: ${m} | ${deg.metin}`);
    if (oz.doluCoken > 0) bak(!sokakParcasi.test(m + deg.metin), `${e}: jürinin binası çöktü ama sokak parçası: ${m}`);
    // 5 günlük yol (sokakCoken verilmez) eski metinleri verir.
    bak(G.manset(oz, { sokakCoken: 0 }) === G.manset(oz), `${e}: sokakta çöken yokken kısa yol manşeti 5 günlük yolunkiyle aynı değil`);
    g23bTon[deg.ton]++;
    const satirlar = G.oneCikanlar(sonuc, juri).satirlar;
    for (const r of juriSonuc.filter((x) => x.damga === 'guvenli' && !x.dogru)) {
      const no = `Bina ${String(r.no).padStart(2, '0')}`;
      bak(satirlar.some((t) => t.includes(no)), `${e}: jürinin yanlış GÜVENLİ'si (${no}) gazetede görünmüyor`);
      g23bTon.yanlisGuvenli++;
    }
  }
}
console.log('G23b kısa yol manşet/değerlendirme (tohum 1-40):', JSON.stringify(g23bTon));
// G37: değerlendirmede onaylanıp çöken binanın zarfı ayrıca "zarf aldığın N bina çöktü" diye sayılmaz (aynı bina iki
// kez); zarf ekindeki çöken sayısı yalnızca onaylanıp çökenlerin dışındakiler. Kısa yol (zarflı örnek gün 1 ve her
// tohumda bütün damgalar GÜVENLİ) ve 5 günlük yol (örnek kayıtlar, bütün sokak).
for (let tohum = 1; tohum <= 200; tohum++) {
  const durumlar = [];
  for (const g1 of [O.ornekKayitlar(tohum, 2), kayitlar(tohum, 'guvenli').slice(0, 1)]) {
    const tum = S.buyukDeprem(tohum, [...g1, ...O.kisaYolKayitlari(tohum)], g1);
    const juri = new Set(g1[0].kararlar.map((c) => c.dosyaId));
    durumlar.push({ sonuc: tum.filter((r) => juri.has(r.dosyaId)), kisa: { sokakCoken: G.sokakCokenSayisi(tum, juri) } });
  }
  durumlar.push({ sonuc: S.buyukDeprem(tohum, O.ornekKayitlar(tohum, 6)), kisa: undefined });
  for (const { sonuc, kisa } of durumlar) {
    const oz = S.depremOzeti(sonuc);
    const deg = G.degerlendirme(oz, kisa).metin;
    const e = `t${tohum} G37 zarf`;
    const onay = oz.doluCoken > 0 && oz.doluCoken !== oz.iadeCoken ? oz.zarfDoluCoken : 0;
    if (onay > 0) {
      g37[kisa ? 'zarfOnayKisa' : 'zarfOnay5Gun']++;
      if (onay === oz.doluCoken) g37.zarfOnayHepsi++;
      bak(/zarf almıştın/.test(deg), `${e}: onaylanıp çöken zarflı bina değerlendirmede yok: ${deg}`);
      const m = deg.match(/zarf aldığın (\d+) bina depremde çöktü|binalardan (\d+) tanesi çöktü/);
      const ekCoken = m ? Number(m[1] ?? m[2]) : 0;
      bak(ekCoken === oz.zarfCoken - onay, `${e}: zarf ekinde onaylanan çöken bina yeniden sayıldı: ${deg}`);
    }
    if (oz.zarf > 0) bak(/zarf/.test(deg), `${e}: zarf alan oyuncunun değerlendirmesinde zarf yok: ${deg}`);
    else bak(!/zarf/.test(deg), `${e}: zarf almayan oyuncuda zarf: ${deg}`);
  }
}
// G37 (eleştirmen 5, b41): onayladığı tek bina zarflıydı ve çöktü → tek ifade; 5 günlük yolda metin eskisi gibi.
{
  const b = { gun: 1, adres: 'Bina 0', kusurlu: true, dogru: false, durum: 'agirHasar', zarf: false, bos: false, coktu: false };
  const s41 = [
    { ...b, no: 1, dosyaId: 'a', damga: 'guvenli', kusurlu: false, dogru: true, durum: 'ayakta' },
    { ...b, no: 2, dosyaId: 'b', damga: 'guvenli', zarf: true, coktu: true },
    { ...b, no: 3, dosyaId: 'c', damga: 'bosalt', dogru: true, bos: true, coktu: true },
    { ...b, no: 4, dosyaId: 'd', damga: 'guvenli', coktu: true },
  ];
  const juri = new Set(['a', 'b', 'c']);
  const oz = S.oyuncuOzeti(s41, juri);
  const kisa = G.degerlendirme(oz, { sokakCoken: G.sokakCokenSayisi(s41, juri) }).metin;
  bak(kisa === '[Değerlendirme: onayladığın bina çöktü; zarf almıştın]', `G37 b41: ${kisa}`);
  // 5 günlük yolda da aynı birleştirme (G37 eki).
  bak(G.degerlendirme(oz).metin === '[Değerlendirme: onayladığın bina çöktü; zarf almıştın]', `G37 b41 5 günlük biçim: ${G.degerlendirme(oz).metin}`);
  // Kusursuz jüri, sokakta çöken var (eleştirmen 5, a19/a21).
  const s19 = s41.map((x) => (juri.has(x.dosyaId) ? { ...x, zarf: false, coktu: false, durum: 'ayakta', bos: false, damga: 'guvenli', dogru: true } : x));
  const oz19 = S.oyuncuOzeti(s19, juri);
  const k19 = { sokakCoken: G.sokakCokenSayisi(s19, juri) };
  bak(/denetlediğin binalar ayakta.*sokakta denetlenmeyen bina çöktü/.test(G.manset(oz19, k19)), `G37 a19 manşet: ${G.manset(oz19, k19)}`);
  bak(/denetlediğin binalar ayakta.*sokakta denetlenmeyen bina çöktü/.test(G.degerlendirme(oz19, k19).metin), `G37 a21 değerlendirme: ${G.degerlendirme(oz19, k19).metin}`);
  bak(G.degerlendirme(oz19, k19).ton === 'iyi', `G37 a21: kusursuz jürinin tonu 'iyi' değil: ${G.degerlendirme(oz19, k19).ton}`);
  bak(G.manset(oz19) === '[Manşet: sokak ayakta]', 'G37: 5 günlük yol manşeti değişti');
}
console.log('G37 kısa yol iki parça ve zarf+onay tek ifade:', JSON.stringify(g37));
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
      // G36: sahte ruhsat da İADE'yi tutar (bilgisi edinilemez).
      const eksikDiger = gor.some((k) => R.EKSIK_BELGE.includes(k.id) || k.id === 'sahteBelge');
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

// ---- G36: sahte ruhsat → İADE (takım kararı T29); bulunan / kusur sayımı ----
// Sahte ruhsatın doğru damgası İADE (BOŞALT görünmüyorsa), GÜÇLENDİR yanlış; fiş "Doğrusu: İADE" ve gerekçede
// "Sahte belge"; kural kitabı İADE diyor; İADE kaşesi sahte ruhsatın çıktığı her günde var. Depremde İADE edilen
// sahte ruhsatlı bina GÜVENLİ gibi sonuç alır (ruhsatsız yapı: fiziksel kusur, ağır hasar ya da çöker).
// Bulunan kusur sayısı (sonuç ekranı) hiçbir kararda dosyanın kusur sayısını aşmaz (İSTE / saha sonrası dahil).
const g36 = { sahteRuhsat: 0, bosaltIle: 0, guclendirYanlis: 0, depremAgir: 0, bulunanDustu: 0, eskiSayimAsardi: 0, karar: 0 };
{
  const kural = R.KURALLAR.find((k) => k.kusurlar.includes('sahteBelge'));
  bak(R.KUSUR_BILGI.sahteBelge.ciddiyet === 'iade', 'G36: sahte belge ciddiyeti İADE değil');
  bak(kural && R.kuralMetni(kural, 5).includes('İADE') && !R.kuralMetni(kural, 5).includes('GÜÇLENDİR'), 'G36: sahte belge kural metni İADE demiyor');
  for (let g = 1; g <= 5; g++) if (kural && kural.ilkGun <= g) bak(D.gunAyar(g).kaseler.includes('iade'), `G36: gün ${g} sahte ruhsat var ama İADE kaşesi yok`);
  const Rng = (await server.ssrLoadModule('/src/game/rng.ts')).Rng;
  const rng = new Rng(36);
  for (let i = 0; i < 40; i++) {
    const b = BLD.kusurluBinaKur(rng, ['sahteBelge']);
    const e = `G36 kurulu sahte #${i}`;
    bak(R.dogruDamga(b, 5) === 'iade' && R.dogruDamgalar(b, 5).join() === 'iade', `${e}: gün 5 doğru damga ${R.dogruDamga(b, 5)}`);
    bak(!R.dogruDamgalar(b, 5, { ruhsat: true }).includes('guclendir'), `${e}: GÜÇLENDİR doğru sayıldı`);
    bak(R.fizikselKusurlar(b, 5).some((k) => k.id === 'sahteBelge'), `${e}: depremde fiziksel kusur değil`);
    const iade = R.buyukDepremSonucu(b, 'iade', 5);
    const guv = R.buyukDepremSonucu(b, 'guvenli', 5);
    bak(iade.kademe === guv.kademe && !iade.bos, `${e}: İADE ≠ GÜVENLİ depremde`);
  }
}
for (let tohum = 1; tohum <= 60; tohum++) {
  for (let g = 1; g <= 5; g++) {
    const o = new S.GunOturumu(g, tohum);
    const ikiz = new S.GunOturumu(g, tohum);
    while (o.mevcut && !o.bitti) {
      const b = o.mevcut;
      const e = `t${tohum} g${g} ${b.id}`;
      const gor = R.gorunenKusurlar(b, g);
      if (gor.some((k) => k.id === 'sahteBelge')) {
        g36.sahteRuhsat++;
        const bosaltGor = gor.some((k) => k.ciddiyet === 'bosalt');
        if (bosaltGor) g36.bosaltIle++;
        const ana = R.dogruDamga(b, g);
        bak(ana === (bosaltGor ? 'bosalt' : 'iade'), `${e}: sahte ruhsatta doğru damga ${ana}`);
        // İnceleme: mühür yılı + yapım yılı → Sahte belge.
        const r = ikiz.incele(R.kanitOgeleri('sahteBelge'));
        bak(r?.kusur.id === 'sahteBelge' && r.kusur.ciddiyet === 'iade', `${e}: sahte belge incelemede ${r?.kusur.id}/${r?.kusur.ciddiyet}`);
        if (!bosaltGor) {
          const s = ikiz.damgala('guclendir');
          bak(s && !s.dogru && s.dogruDamga === 'iade' && s.etiketler.includes('Sahte belge'), `${e}: GÜÇLENDİR fişi ${JSON.stringify(s)}`);
          if (s && !s.dogru) g36.guclendirYanlis++;
        } else ikiz.damgala(ana);
        const d = R.buyukDepremSonucu(b, ana, g);
        if (ana === 'iade' && (d.coker || d.durum === 'agirHasar')) g36.depremAgir++;
      } else ikiz.damgala(R.dogruDamga(b, g));
      // Bulunan / kusur: her görünen kusur bulunur; eksik belgede gerçek belge (ya da saha) gelince gerçek damga.
      for (const k of gor) o.incele(R.kanitOgeleri(k));
      for (const alan of ['karot', 'zemin']) if (o.istenebilir(alan)) o.iste(alan);
      if (o.sahaYapilabilir()) o.sahaTamamla();
      // Edinilen bilgiye göre (İSTE gerçek belge, saha) tercih edilen damga: eksik belge kusuru listeden düşer.
      const { bilgi, kaynak } = o.edinilenBilgi;
      const dis = {};
      if (kaynak.karot === 'iste') dis.karot = bilgi.karot;
      if (kaynak.karot === 'saha') dis.karotSaha = bilgi.karot;
      if (kaynak.zemin === 'iste') dis.zemin = bilgi.zemin;
      const kabul = R.dogruDamgalar(b, g, Object.keys(dis).length > 0 ? dis : undefined);
      const s = o.damgala(kabul[kabul.length - 1]);
      const kr = o.kararlar[o.kararlar.length - 1];
      g36.karar++;
      if (kr.bulunan.length > S.bulunanSayisi(kr)) g36.bulunanDustu++;
      if (kr.bulunan.length > kr.kusurlar.length) g36.eskiSayimAsardi++;
      bak(s && s.dogru && S.bulunanSayisi(kr) <= kr.kusurlar.length, `${e}: bulunan ${S.bulunanSayisi(kr)} > kusur ${kr.kusurlar.length}`);
    }
    const t = S.oyunToplami([{ gun: g, kararlar: o.kararlar }]);
    bak(t.bulunan <= t.kusur, `t${tohum} g${g}: toplam bulunan ${t.bulunan} > kusur ${t.kusur}`);
  }
}
console.log('G36 (tohum 1-60, gün 1-5):', JSON.stringify(g36));

// ---- G19: saha testi (Schmidt çekici) ----
// Karot yok ya da geçersizse saha testi yapılabilir (günde TUNING.saha.gunlukHak); tahmin gerçek dayanıma yakın ve
// eşiğin hep aynı yanında; saha notu sonrası doğru damga saha kuralına göre (tahmin eşiğin altında BOŞALT, üstünde
// GÜÇLENDİR), İADE yine doğru; önizleme (VAZGEÇ) hak harcamaz; hak bitince saha yok; geçersiz okumalar sayılmaz;
// inceleme modunda saha notu + saha kuralı "Düşük beton (saha)" bulur; saha kuralına uyan karar depremde adil.
const SH = await server.ssrLoadModule('/src/game/saha.ts');
const g19 = { saha: 0, dusuk: 0, yeterli: 0, iadeYine: 0, hakBitti: 0, gecersizKarot: 0, sahteKarot: 0, enBuyukFark: 0 };
const esik = T.betonEsikMpa;
for (let tohum = 1; tohum <= 60; tohum++) {
  for (let g = 1; g <= 5; g++) {
    const o = new S.GunOturumu(g, tohum);
    const ikiz = new S.GunOturumu(g, tohum);
    bak(o.sahaHakki === (g >= T.saha.ilkGun ? T.saha.gunlukHak : 0), `t${tohum} g${g}: saha hakkı ${o.sahaHakki}`);
    while (o.mevcut && !o.bitti) {
      const b = o.mevcut;
      const e = `t${tohum} g${g} ${b.id}`;
      const ana = R.dogruDamga(b, g);
      const baska = BLD.baskaBinaBelgesi(b.belgeler) === 'karot';
      const karotYok = b.belgeler.karot === null && R.gorunenKusurlar(b, g).some((k) => k.id === 'karotYok');
      // Saha yalnızca karot yok ya da geçersizken; geçersiz karot önce incelemede bulunmalı.
      if (baska) {
        bak(!o.sahaGerekli(), `${e}: başka binanın karotu bulunmadan saha`);
        const k = R.gorunenKusurlar(b, g).find((x) => x.id === 'baskaBina');
        o.incele(R.kanitOgeleri(k));
        bak(o.sahaKusurda('baskaBina'), `${e}: başka binanın karotunda etikette SAHA yok`);
        g19.gecersizKarot++;
      }
      bak(o.sahaGerekli() === ((karotYok || baska) && g >= T.saha.ilkGun), `${e}: saha gerekli ${o.sahaGerekli()}`);
      if (!o.sahaGerekli()) {
        bak(o.sahaOnizle() === null && o.sahaTamamla() === null, `${e}: gereksiz saha yapıldı`);
        o.damgala(ana);
        ikiz.damgala(ana);
        continue;
      }
      // Hak bitti: saha yok, İADE doğru.
      if (o.sahaHakki === 0) {
        g19.hakBitti++;
        bak(!o.sahaYapilabilir() && o.sahaOnizle() === null && o.sahaTamamla() === null, `${e}: hak bittiği halde saha`);
        const s = o.damgala(ana);
        bak(s && s.dogru, `${e}: hak yokken ${ana} yanlış`);
        ikiz.damgala(ana);
        continue;
      }
      // Önizleme (mini oyun açık, VAZGEÇ) hak harcamaz; aynı okumalar.
      const hak = o.sahaHakki;
      const on1 = o.sahaOnizle();
      const on2 = o.sahaOnizle();
      bak(on1 && JSON.stringify(on1) === JSON.stringify(on2) && o.sahaHakki === hak, `${e}: önizleme hak harcadı ya da değişti`);
      const beklenen = SH.sahaSonucu(tohum, b);
      bak(JSON.stringify(on1) === JSON.stringify(beklenen), `${e}: önizleme saha sonucuyla aynı değil`);
      // Okumalar: TUNING.saha.okuma tane, ortalama yalnızca geçerli okumalardan; tahmin gerçeğe yakın, eşiğin aynı yanında.
      const sn = beklenen;
      const ort = Math.round((sn.okumalar.reduce((a, x) => a + x, 0) / sn.okumalar.length) * 10) / 10;
      bak(sn.okumalar.length === T.saha.okuma && sn.ortR === ort, `${e}: okumalar ${sn.okumalar} ort ${sn.ortR}`);
      bak(sn.mpa < esik === b.gercek.betonMpa < esik, `${e}: tahmin ${sn.mpa} eşiğin öbür yanında (gerçek ${b.gercek.betonMpa})`);
      g19.enBuyukFark = Math.max(g19.enBuyukFark, Math.abs(sn.mpa - b.gercek.betonMpa));
      bak(Math.abs(sn.mpa - b.gercek.betonMpa) <= 4, `${e}: tahmin ${sn.mpa} gerçekten uzak (${b.gercek.betonMpa})`);
      bak(sn.pay >= T.saha.payEn, `${e}: pay ${sn.pay}`);
      // Geçersiz okumalar (sıva, çatlak) sayılmaz: mini oyun gibi karışık vuruşlarla aynı sonuç.
      const vurus = ['siva', 'temiz', 'catlak', 'temiz', 'temiz', 'siva', 'temiz', 'temiz', 'temiz'];
      const gecerli = [];
      let gi = 0;
      for (const v of vurus) {
        if (gecerli.length >= T.saha.okuma) break;
        if (v === 'temiz') gecerli.push(sn.okumalar[gecerli.length]);
        else SH.gecersizOkuma(tohum, b, gi++, v);
      }
      bak(gecerli.join() === sn.okumalar.join(), `${e}: geçersiz okuma sayıldı`);
      // Tamamla: hak düşer, saat ilerler, ikinci kez yapılamaz.
      const saat = o.saatMetni();
      const sonuc = o.sahaTamamla();
      g19.saha++;
      bak(sonuc && sonuc.mpa === sn.mpa && o.sahaHakki === hak - 1, `${e}: saha tamamlanmadı ya da hak düşmedi`);
      bak(o.saatMetni() > saat || o.mesaiBitti, `${e}: saha saati ilerletmedi (${saat} → ${o.saatMetni()})`);
      bak(!o.sahaGerekli() && o.sahaTamamla() === null, `${e}: saha iki kez`);
      bak(o.edinilenBilgi.kaynak.karot === 'saha', `${e}: bilgi kaynağı saha değil`);
      // İnceleme: saha notundaki tahmin + saha kuralı.
      const r = o.incele([
        { belge: 'karot', alan: 'mpa' },
        { belge: 'kural', alan: R.SAHA_KURALI },
      ]);
      bak(r?.kusur.id === 'sahaBeton', `${e}: saha notu incelemede bulunmadı`);
      if (sn.mpa < esik) bak(r?.kusur.etiket.toLocaleUpperCase('tr-TR') === 'DÜŞÜK BETON (SAHA)' && r.kusur.ciddiyet === 'bosalt', `${e}: düşük saha etiketi ${r?.kusur.etiket}`);
      else bak(r?.kusur.ciddiyet === 'guclendir', `${e}: yeterli saha ciddiyeti ${r?.kusur.ciddiyet}`);
      // Doğru damgalar: İADE (asıl) ve saha kuralına göre damga.
      const bilgi = { karotSaha: sn.mpa };
      const kabul = R.dogruDamgalar(b, g, bilgi);
      const tam = R.dogruDamga(R.bilgiyleTamamla(b, bilgi), g);
      const yalniz = R.gorunenKusurlar(b, g).every((k) => k.id === 'karotYok' || k.id === 'baskaBina');
      if (yalniz) bak(tam === (sn.mpa < esik ? 'bosalt' : 'guclendir'), `${e}: saha kuralı damgası ${tam} (tahmin ${sn.mpa})`);
      if (ana === 'iade') {
        bak(kabul[0] === 'iade' && kabul.includes(tam) && (tam === 'iade' || kabul.length === 2), `${e}: saha kabulü ${kabul}`);
        // İADE yine doğru (ikiz oturumda aynı saha ile).
        if (ikiz.sahaGerekli() || baska) {
          if (baska) ikiz.incele(R.kanitOgeleri(R.gorunenKusurlar(b, g).find((x) => x.id === 'baskaBina')));
          ikiz.sahaTamamla();
        }
        const si = ikiz.damgala('iade');
        bak(si && si.dogru, `${e}: saha sonrası İADE yanlış`);
        g19.iadeYine++;
      } else ikiz.damgala(ana);
      const s = o.damgala(tam);
      bak(s && s.dogru, `${e}: saha kuralına göre ${tam} yanlış sayıldı (kabul ${s?.kabul})`);
      if (tam === 'bosalt') g19.dusuk++;
      if (tam === 'guclendir') g19.yeterli++;
      // Fiş saha notuna göre (G19): gerekçede saha kusuru.
      if (tam !== 'iade' && ana === 'iade') bak(s.etiketler.some((x) => x.includes('saha') || x.includes('Saha')), `${e}: fişte saha gerekçesi yok: ${s.etiketler}`);
      // Depremde adalet: saha kuralına uyan karar insanlı ağır hasar ya da çökme getirmez.
      const d = R.buyukDepremSonucu(b, tam, g);
      if (!d.bos && tam !== 'iade') bak(!d.coker && d.durum !== 'agirHasar', `${e}: saha kararı (${tam}) depremde ağır sonuç`);
    }
  }
}
// Sahte karot (gişeden) bulununca da saha yapılabilir; saha notu sahte kartın yerine geçer.
for (let tohum = 1; tohum <= 300 && g19.sahteKarot < 20; tohum++) {
  for (let g = 3; g <= 5; g++) {
    const o = new S.GunOturumu(g, tohum);
    while (o.mevcut && !o.bitti) {
      const b = o.mevcut;
      const e = `t${tohum} g${g} ${b.id}`;
      const c = b.belgeler.karot === null && o.istenebilir('karot') ? o.iste('karot') : null;
      if (c?.tur === 'sahte') {
        bak(!o.sahaGerekli(), `${e}: sahte karot bulunmadan saha`);
        const alan = K.ipucuAlani(c.rapor);
        const kural = c.rapor.ipucu === 'muhur' || c.rapor.ipucu === 'tarih' ? R.RAPOR_KURALI : R.GECERSIZ_KURALI;
        const r = o.incele([
          { belge: 'karot', alan },
          { belge: 'kural', alan: kural },
        ]);
        bak(r?.kusur.id === 'sahteRapor' && o.sahaKusurda('sahteRapor'), `${e}: sahte karotta SAHA yok`);
        if (o.sahaYapilabilir()) {
          const sn = o.sahaTamamla();
          const r2 = o.incele([
            { belge: 'karot', alan: 'mpa' },
            { belge: 'kural', alan: R.SAHA_KURALI },
          ]);
          bak(r2?.kusur.id === 'sahaBeton', `${e}: sahte karot sonrası saha notu bulunmadı`);
          const tam = R.dogruDamga(R.bilgiyleTamamla(b, { karotSaha: sn.mpa }), g);
          const s = o.damgala(tam);
          bak(s && s.dogru, `${e}: sahte karot + saha sonrası ${tam} yanlış`);
          g19.sahteKarot++;
          continue;
        }
      }
      o.damgala(R.dogruDamga(b, g));
    }
  }
}
// Kural kitabı: saha kuralı gün 3'te gelir, BETON bölümünde damgalarını yazar.
{
  const k = R.KURALLAR.find((x) => x.id === R.SAHA_KURALI);
  bak(k && k.ilkGun === T.saha.ilkGun && ['BOŞALT', 'GÜÇLENDİR', String(esik)].every((x) => k.metin.includes(x)), 'saha kuralı metni');
  bak(k && k.kusurlar.length === 0, 'saha kuralı üreticiye kusur vermemeli');
}
console.log('G19 (tohum 1-60, gün 1-5; sahte karot ayrı):', JSON.stringify(g19));

// ---- G42 + G43: kendi evinin hazırlığı (para, kademeler, "Senin evin") ----
{
  const EV = await server.ssrLoadModule('/src/game/ev.ts');
  const EM = await server.ssrLoadModule('/src/game/ev-metin.ts');
  const g43 = { alim: 0, zarfla: 0, yetmedi: 0, tamamSonrasi: 0, kendiBina: 0, payliFark: 0, sonuc: 0, kendiSonuc: 0 };
  const F = T.ev.kademe;
  const N = EV.EV_KADEME;
  const kalemler = [...EV.EV_KALEMLER];
  bak(N === 3 && kalemler.every((k) => F[k].length === N), 'G43 her kalem 3 kademe');
  bak(kalemler.every((k) => F[k].every((f, i) => f === EV.evFiyat(k, i + 1) && f > 0)), 'G43 fiyatlar TUNING');
  bak(JSON.stringify(F) === JSON.stringify({ canta: [30, 40, 50], sabitleme: [30, 50, 60], guclendirme: [80, 100, 120] }), 'G43 fiyatlar takım kararıyla aynı');
  // Bütün 6 tuşluk sıralar (3^6; bir kalem 3'ten fazla denenir) × para × zarf: kademe sırayla artar, atlanmaz, 3'ten
  // sonra alınmaz; para eksiye inmez; sıradaki kademenin fiyatı düşülür; "zarfla" kademe başına, yalnızca temiz
  // para yetmediğinde.
  let uzun = [[]];
  for (let u = 0; u < 6; u++) uzun = uzun.flatMap((s0) => kalemler.map((k) => [...s0, k]));
  for (let para0 = -40; para0 <= 600; para0 += 40)
    for (let zarf = 0; zarf <= 300; zarf += 60)
      for (const sira of uzun) {
        let ev = EV.yeniEv();
        let para = para0;
        let harcanan = 0;
        const e0 = `G43 para0=${para0} zarf=${zarf} sıra=${sira.join(',')}`;
        for (const k of sira) {
          const n = EV.evKademe(ev, k);
          const r = EV.satinAl(ev, k, para, zarf, 1);
          const e = `${e0} ${k}${n + 1}`;
          sayi++;
          if (n >= N) {
            if (r !== null || EV.alimDurumu(ev, k, para) !== 'tamam' || EV.siradakiFiyat(ev, k) !== null) bak(false, `${e}: 3'ten sonra alındı ya da tamam değil`);
            g43.tamamSonrasi++;
            continue;
          }
          const f = F[k][n];
          if (para < f) {
            if (r !== null || EV.alimDurumu(ev, k, para) !== 'yetmiyor') bak(false, `${e}: para yetmediği halde alındı`);
            g43.yetmedi++;
            continue;
          }
          if (!r || EV.alimDurumu(ev, k, para) !== 'alinabilir') {
            bak(false, `${e}: alınamadı`);
            continue;
          }
          const temiz = Math.max(0, para - Math.max(0, Math.min(para, zarf - ev.zarfHarcanan)));
          const son = r.ev.alinan[k][n];
          const dogru =
            r.para === para - f &&
            r.para >= 0 &&
            r.kademe === n + 1 &&
            r.fiyat === f &&
            EV.evKademe(r.ev, k) === n + 1 &&
            son.kademe === n + 1 &&
            son.fiyat === f &&
            son.zarfla === r.zarfla &&
            r.zarfla === f > temiz &&
            r.ev.zarfHarcanan <= zarf &&
            (zarf > 0 || !r.zarfla) &&
            kalemler.every((x) => x === k || EV.evKademe(r.ev, x) === EV.evKademe(ev, x)) &&
            r.ev.alinan[k].slice(0, n).every((a, i) => JSON.stringify(a) === JSON.stringify(ev.alinan[k][i]));
          if (!dogru) bak(false, `${e}: alım yanlış (zarfla=${r.zarfla} temiz=${temiz})`);
          ev = r.ev;
          para = r.para;
          harcanan += f;
          g43.alim++;
          if (r.zarfla) g43.zarfla++;
        }
        bak(para >= Math.min(0, para0) && EV.evHarcanan(ev) === harcanan && harcanan === para0 - para, `${e0}: para/harcanan tutarsız`);
      }
  // Taksitler sırayla: 1, 2, 3; dördüncüsü yok.
  {
    let ev = EV.yeniEv();
    for (let i = 0; i < 4; i++) {
      const r = EV.satinAl(ev, 'guclendirme', 1000, 0, i + 1);
      if (i < N) {
        bak(r && r.kademe === i + 1 && r.fiyat === F.guclendirme[i], `G43 taksit ${i + 1}`);
        ev = r.ev;
      } else bak(r === null, 'G43 dördüncü taksit alındı');
    }
    bak(ev.alinan.guclendirme.map((a) => a.kademe).join() === '1,2,3' && EV.guclendirmeTam(ev), 'G43 taksit sırası');
  }

  // "Senin evin" (kendi bina yok): 4×4×4 bileşim (× zarf işareti), deterministik ve kademelere göre.
  const SOYUT = ['agir', 'agir', 'hasarli', 'hafif'];
  for (let c = 0; c <= N; c++)
    for (let sb = 0; sb <= N; sb++)
      for (let g = 0; g <= N; g++)
        for (const zk of [null, ...kalemler, 'hepsi']) {
          const kad = { canta: c, sabitleme: sb, guclendirme: g };
          const ev = EV.yeniEv();
          for (const k of kalemler)
            ev.alinan[k] = F[k].slice(0, kad[k]).map((fiyat, i) => ({ kademe: i + 1, gun: 1, fiyat, zarfla: (zk === k || zk === 'hepsi') && i === kad[k] - 1 }));
          const s1 = EV.evSonucu(ev, []);
          const s2 = EV.evSonucu(JSON.parse(JSON.stringify(ev)), []);
          const e = `G43 ev ç${c} s${sb} g${g} zarf=${zk}`;
          bak(JSON.stringify(s1) === JSON.stringify(s2), `${e}: deterministik değil`);
          bak(s1.durum === SOYUT[g] && !s1.kendiBina, `${e}: durum ${s1.durum} ≠ ${SOYUT[g]}`);
          bak(s1.canta === c && s1.sabitleme === sb && s1.guclendirme === g, `${e}: kademeler`);
          const zBek = kalemler.filter((k) => kad[k] > 0 && (zk === k || zk === 'hepsi'));
          bak(JSON.stringify(s1.zarfla) === JSON.stringify(zBek), `${e}: zarfla ${s1.zarfla}`);
          const cm = EM.evCumleleri(s1);
          bak(
            cm[0] === EM.EV_DURUM_METIN[SOYUT[g]] && cm[1] === EM.EV_GUCLENDIRME_METIN[g] && cm[2] === EM.EV_CANTA_METIN[c] && cm[3] === EM.EV_SABITLEME_METIN[sb],
            `${e}: cümleler`,
          );
          bak(cm.length === (zBek.length ? 5 : 4), `${e}: zarf yan cümlesi`);
          if (zBek.length) bak(cm[4] === (zBek.length === 1 ? EM.EV_ZARF_METIN[zBek[0]] : EM.EV_ZARF_METIN.birden), `${e}: zarf cümlesi`);
          bak(s1.harcanan === kalemler.reduce((n, k) => n + F[k].slice(0, kad[k]).reduce((a, b) => a + b, 0), 0), `${e}: harcanan`);
          g43.sonuc++;
        }
  // Kademe cümleleri birbirinden farklı (farklı kademe, farklı cümle).
  for (const dizi of [EM.EV_GUCLENDIRME_METIN, EM.EV_CANTA_METIN, EM.EV_SABITLEME_METIN])
    bak(dizi.length === N + 1 && new Set(dizi).size === N + 1, 'G43 kademe cümleleri farklı değil');
  // Ton (GDD T4): ev cümlelerinde sayı yok (kademe sayaçları yalnızca durum etiketlerinde).
  for (const m of [...Object.values(EM.EV_DURUM_METIN), ...EM.EV_GUCLENDIRME_METIN, ...EM.EV_CANTA_METIN, ...EM.EV_SABITLEME_METIN, ...Object.values(EM.EV_ZARF_METIN), EM.EV_PAYLI])
    bak(!/\d/.test(m), `G43 ev cümlesinde sayı: ${m}`);

  // Bina sonuçları: ev seçeneği verilmezse ya da güçlendirme 0-2 taksitse aynı; 3/3 taksitte yalnızca oyuncunun kendi
  // apartmanı (GÜVENLİ / İADE damgalıysa) GÜÇLENDİR sonucunu alır. Ev sonucu kendi apartmanınla tutarlı.
  for (let tohum = 1; tohum <= 10; tohum++)
    for (const bicim of ['ornek', 'dogru', 'guvenli', 'guclendir', 'bosalt', 'iade', 'kisa']) {
      const k = kayitlar(tohum, bicim);
      const zk = bicim === 'kisa' ? [k[0]] : k;
      const a = S.buyukDeprem(tohum, k, zk);
      const e = `G43 t${tohum} ${bicim}`;
      const sokak = S.sokakKayitlari(tohum, k);
      const kendi = a.filter((r) => r.kendiBinan);
      bak(kendi.length <= 1, `${e}: birden çok kendi apartman`);
      if (bicim === 'kisa') bak(kendi.length === 0, `${e}: kısa yolda örnek bina kendi apartman sayıldı`);
      if (kendi.length) g43.kendiBina++;
      for (let g = 0; g <= N; g++) {
        const c = S.buyukDeprem(tohum, k, zk, { guclendirmeKademe: g });
        if (g < N) bak(JSON.stringify(a) === JSON.stringify(c), `${e} g=${g}: 3/3'ten az taksitte sonuç değişti`);
        else
          a.forEach((r, i) => {
            const p = c[i];
            const payli = r.kendiBinan && (r.damga === 'guvenli' || r.damga === 'iade');
            if (!payli) {
              bak(JSON.stringify(r) === JSON.stringify(p), `${e} ${r.dosyaId}: pay başka binayı değiştirdi`);
              return;
            }
            const s = sokak[i];
            const gs = R.buyukDepremSonucu(s.bina, 'guclendir', s.gun, { oncuHasar: s.hasar });
            bak(p.evPayi === true && p.durum === gs.durum && p.coktu === gs.coker && p.bos === false && p.damga === r.damga, `${e} ${r.dosyaId}: 3/3 sonuç GÜÇLENDİR değil`);
            bak(!p.coktu && p.durum !== 'agirHasar', `${e} ${r.dosyaId}: 3/3 kendi apartman ağır`);
            if (JSON.stringify(r) !== JSON.stringify(p)) g43.payliFark++;
          });
        const ev = EV.yeniEv();
        ev.alinan.guclendirme = F.guclendirme.slice(0, g).map((fiyat, i) => ({ kademe: i + 1, gun: 5, fiyat, zarfla: false }));
        const s = EV.evSonucu(ev, c);
        const kb = c.find((r) => r.kendiBinan);
        if (kb) {
          const bek = kb.coktu ? (kb.bos ? 'coktuBos' : 'coktu') : kb.durum === 'agirHasar' ? 'agir' : kb.durum === 'hasarli' ? 'hafif' : 'saglam';
          bak(s.durum === bek && s.kendiBina === kb && s.guclendirme === g, `${e} g=${g}: ev durumu kendi apartmanla tutarsız (${s.durum} ≠ ${bek})`);
          bak(!!kb.evPayi === (g === N && (kb.damga === 'guvenli' || kb.damga === 'iade')), `${e} g=${g}: evPayi yanlış`);
          g43.kendiSonuc++;
        } else bak(s.durum === SOYUT[g] && !s.kendiBina, `${e} g=${g}: soyut ev durumu`);
      }
    }
  bak(g43.kendiBina > 0, 'G43 kendi apartman hiç sokakta değil');
  console.log('G43 (para × zarf × 6 tuşluk sıra; 4×4×4 sonuç; tohum 1-10):', JSON.stringify(g43));

  // Ekonomi denetimi: kusursuz dürüst oyuncu (zarf yok, hep doğru) gün sonunda en çok ne kadar alabilir. Gün kazancı
  // dosyaSayisi × maaş; gerçek oturumla da doğrulanır (tohum 1-20). Alım: her gün sonunda en ucuz sıradaki kademe
  // (her kalemin fiyatları artan olduğundan bu, alınabilecek kademe sayısının en çoğudur).
  const kazanc = [1, 2, 3, 4, 5].map((g) => D.gunAyar(g).dosyaSayisi * T.para.maas);
  for (let tohum = 1; tohum <= 20; tohum++)
    for (let g = 1; g <= 5; g++) {
      const o = new S.GunOturumu(g, tohum);
      while (o.mevcut && !o.bitti) o.damgala(R.dogruDamga(o.mevcut, g));
      const h = S.gunHesabi(o.kararlar, D.gunAyar(g).dosyaSayisi);
      bak(h.toplam === kazanc[g - 1] && h.zarf === 0, `G43 ekonomi t${tohum} g${g}: kusursuz kazanç ${h.toplam} ≠ ${kazanc[g - 1]}`);
    }
  let ev = EV.yeniEv();
  let para = T.para.baslangic;
  const tablo = [];
  for (let g = 1; g <= 5; g++) {
    para += kazanc[g - 1];
    for (;;) {
      const aday = kalemler
        .map((k) => [k, EV.siradakiFiyat(ev, k)])
        .filter(([, f]) => f !== null && f <= para)
        .sort((x, y) => x[1] - y[1])[0];
      if (!aday) break;
      const r = EV.satinAl(ev, aday[0], para, 0, g);
      bak(r && !r.zarfla, `G43 ekonomi gün ${g}: alım`);
      ({ ev, para } = r);
    }
    const kad = kalemler.map((k) => EV.evKademe(ev, k));
    tablo.push({ gun: g, kazanc: kazanc[g - 1], kademe: kad.reduce((a, b) => a + b, 0), kad, artan: para, harcanan: EV.evHarcanan(ev) });
  }
  const tumu = 3 * N;
  bak(tablo[0].kad[0] >= 1 && tablo[0].kad[1] >= 1 && tablo[0].kad[2] === 0, 'G43 gün 1: çanta 1 + sabitleme 1 alınabilmeli, güçlendirme alınamamalı');
  bak(kazanc[0] < F.guclendirme[0], 'G43 gün 1 zarfsız güçlendirme 1. taksit alınabiliyor');
  bak(kazanc[0] >= F.canta[0] + F.sabitleme[0], 'G43 gün 1 çanta 1 + sabitleme 1 alınamıyor');
  // Gün 1'de bir dosyada zarf (BOŞALT zarfının en azı) alıp o dosyayı yanlış damgalayan: güçlendirmeye başlayabilir.
  bak(kazanc[0] - T.para.maas - T.para.ceza + T.kisi.zarfMiktar.bosalt.min >= F.guclendirme[0], 'G43 gün 1 zarfla güçlendirme 1. taksit alınamıyor');
  bak(tablo[1].kademe < tumu, 'G43 kusursuz oyuncu gün 2 sonunda hepsini bitiriyor');
  bak(tablo[3].kademe < tumu, 'G43 kusursuz oyuncu gün 4 sonunda hepsini bitiriyor');
  bak(tablo[4].kademe === tumu, 'G43 kusursuz oyuncu gün 5 sonunda tamamlayamıyor');
  const toplamFiyat = kalemler.reduce((n, k) => n + F[k].reduce((a, b) => a + b, 0), 0);
  console.log(`G43 ekonomi (kusursuz dürüst oyuncu; toplam fiyat ${toplamFiyat} TL, 5 günün kazancı ${kazanc.reduce((a, b) => a + b, 0)} TL):`);
  for (const t of tablo)
    console.log(
      `  gün ${t.gun}: +${t.kazanc} TL → ${t.kademe}/${tumu} kademe (çanta ${t.kad[0]}, sabitleme ${t.kad[1]}, güçlendirme ${t.kad[2]}); harcanan ${t.harcanan}, artan ${t.artan} TL`,
    );
}

console.log(`${sayi} denetim, ${hata} hata`);
console.log(`Kural: fay yakını = ${T.fayKurali === 'bosalt' ? 'her zaman BOŞALT' : 'zemine bağlı (dere gibi)'}`);
console.log('Eksik belge ve dere/fay görülme sayıları (tohum 1-40, gün 1-5):', JSON.stringify(sayac));
console.log('Dağılım (damga / fiziksel kusur → sonuç):');
for (const [k, v] of Object.entries(dagilim).sort()) console.log(`  ${k}: ${v}`);
console.log('G36 sahte ruhsatlı binalar (gün 5, tohum 1-10; biçim: damga → sonuç):');
for (const [k, v] of Object.entries(sahteDagilim).sort()) console.log(`  ${k}: ${v}`);
await server.close();
process.exit(hata ? 1 : 0);
