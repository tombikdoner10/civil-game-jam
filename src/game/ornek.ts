import type { Damga } from './building';
import { depremSonucu, dogruDamga } from './rules';
import { GunOturumu, type GunKaydi } from './session';
import { TUNING } from './tuning';

/** Doğru damga yerine verilen yanlış damga (dev örnekleri: aşırı temkin ya da eksik önlem). */
const YANLIS: Record<Damga, Damga> = { guvenli: 'bosalt', guclendir: 'bosalt', bosalt: 'guclendir' };

/**
 * Yalnızca dev: gün 1'den (gun - 1)'e kadar örnek kayıtlar (sokak ve deprem testleri, sunum provası).
 * Kararlar çoğunlukla doğru; her dördüncü dosya yanlışlıkla GÜVENLİ, her altıncı başka bir yanlış damga.
 * Doğru kararlarda kusurlar bulunmuş sayılır. Öncü sarsıntılı günlerde sarsıntı sonucu oyundaki kuralla.
 */
export function ornekKayitlar(tohum: number, gun: number): GunKaydi[] {
  const out: GunKaydi[] = [];
  const O = TUNING.oncu;
  for (let g = 1; g < gun; g++) {
    const o = new GunOturumu(g, tohum);
    for (let i = 0; o.mevcut && !o.bitti; i++) {
      const dogru = dogruDamga(o.mevcut, g);
      o.damgala(i % 4 === 1 ? 'guvenli' : i % 6 === 4 ? YANLIS[dogru] : dogru);
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
