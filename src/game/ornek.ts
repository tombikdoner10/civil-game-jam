import type { Damga } from './building';
import { sorulabilir } from './kisi';
import { depremSonucu, dogruDamga, GECERSIZ_BELGE, gorunenKusurlar, kanitOgeleri, type EdinilenBilgi } from './rules';
import { GunOturumu, type GunKaydi } from './session';
import { TUNING } from './tuning';

/** Doğru damga yerine verilen yanlış damga (dev örnekleri: aşırı temkin ya da eksik önlem). */
const YANLIS: Record<Damga, Damga> = { guvenli: 'bosalt', guclendir: 'bosalt', bosalt: 'guclendir', iade: 'guvenli' };

/**
 * Yalnızca dev: gün 1'den (gun - 1)'e kadar örnek kayıtlar (sokak ve deprem testleri, sunum provası).
 * Kararlar çoğunlukla doğru (eksik belgeli dosyalar İADE); her dördüncü dosya yanlışlıkla GÜVENLİ, her altıncı başka
 * bir yanlış damga, her yedinci (gün 3'ten) İADE (dosya eksiksizse yanlış).
 * G17: eksik belgeli her ikinci dosyada belge sahibinden İSTENİR (gerçek rapor gelirse gerçek duruma göre damga);
 * her beşinci dosyada bulunan ilk kusur SORULUR, zarf gelirse çift sırada kabul, tek sırada ret.
 * G17b: geçersiz belgeli (elle düzeltilmiş, başka binanın, imzasız) her ikinci dosyada kusur bulunur ve belgenin
 * düzgünü İSTENİR (gerçeği gelirse gerçek duruma göre damga, gelmezse İADE).
 * Doğru kararlarda kusurlar bulunmuş sayılır. Öncü sarsıntılı günlerde sarsıntı sonucu oyundaki kuralla.
 */
export function ornekKayitlar(tohum: number, gun: number): GunKaydi[] {
  const out: GunKaydi[] = [];
  const O = TUNING.oncu;
  for (let g = 1; g < gun; g++) {
    const o = new GunOturumu(g, tohum);
    for (let i = 0; o.mevcut && !o.bitti; i++) {
      const b = o.mevcut;
      const bilgi: EdinilenBilgi = {};
      if (i % 2 === 0)
        for (const alan of ['karot', 'zemin'] as const) {
          const c = o.istenebilir(alan) ? o.iste(alan) : null;
          if (c?.tur === 'gercek' && c.rapor) {
            if (alan === 'karot') bilgi.karot = c.rapor.deger as number;
            else bilgi.zemin = b.gercek.zemin;
          }
        }
      if (i % 2 === 0)
        for (const k of gorunenKusurlar(b, g).filter((x) => GECERSIZ_BELGE.includes(x.id))) {
          o.incele(kanitOgeleri(k));
          const alan = o.isteAlani(k.id);
          const c = alan ? o.iste(alan) : null;
          if (alan && c?.tur === 'gercek' && c.rapor) {
            if (alan === 'karot') bilgi.karot = b.gercek.betonMpa;
            else if (alan === 'zemin') bilgi.zemin = b.gercek.zemin;
            else bilgi[alan] = true;
          }
        }
      if (i % 5 === 2) {
        const k = gorunenKusurlar(b, g).find((x) => sorulabilir(x.id));
        if (k) {
          o.incele(kanitOgeleri(k));
          const c = o.sor(k.id);
          if (c?.zarf !== undefined) o.zarfKarar(i % 2 === 0);
        }
      }
      const dogru = dogruDamga(b, g, Object.keys(bilgi).length > 0 ? bilgi : undefined);
      o.damgala(i % 4 === 1 ? 'guvenli' : i % 6 === 4 ? YANLIS[dogru] : g >= 3 && i % 7 === 5 ? 'iade' : dogru);
    }
    const kararlar = o.kararlar.map((k) => ({ ...k, bulunan: k.dogru ? k.kusurlar.slice() : [] }));
    const kayit: GunKaydi = { gun: g, kararlar };
    if (o.ayar.oncuSarsinti) {
      kayit.oncu = {
        siddet: O.siddet,
        sonuclar: kararlar.map((k) => {
          const b = o.dosyalar.find((x) => x.id === k.dosyaId);
          const s = b ? depremSonucu(b, k.damga, O.siddet, false) : { durum: 'ayakta' as const, bos: false };
          return { dosyaId: k.dosyaId, durum: s.durum === 'agirHasar' ? 'hasarli' : s.durum, bos: s.bos };
        }),
      };
    }
    out.push(kayit);
  }
  return out;
}
