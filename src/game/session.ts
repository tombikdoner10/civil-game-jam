import type { Bina, Damga, KusurId } from './building';
import { gunDosyalari } from './building';
import { dogruDamga, gorunenKusurlar } from './rules';
import { TUNING } from './tuning';

export interface Karar {
  dosyaId: string;
  damga: Damga;
  dogruDamga: Damga;
  dogru: boolean;
  /** O günün kurallarına göre dosyadaki kusurlar (geri bildirim fişi için). */
  kusurlar: KusurId[];
}

export function gunDosyaSayisi(gun: number): number {
  const liste = TUNING.mesai.dosyaSayisi;
  return liste[Math.min(Math.max(gun, 1), liste.length) - 1];
}

/** Bir günün oturumu: dosyalar, sıradaki dosya, kararlar ve mesai saati. Saf TS, Phaser yok. */
export class GunOturumu {
  readonly dosyalar: Bina[];
  readonly kararlar: Karar[] = [];
  private idx = 0;
  private gecenSn = 0;

  constructor(
    readonly gun: number,
    readonly tohum: number,
  ) {
    this.dosyalar = gunDosyalari(tohum, gun, gunDosyaSayisi(gun));
  }

  get mevcut(): Bina | undefined {
    return this.dosyalar[this.idx];
  }
  /** 1 tabanlı sıra; bittiğinde toplam. */
  get no(): number {
    return Math.min(this.idx + 1, this.dosyalar.length);
  }
  get toplam(): number {
    return this.dosyalar.length;
  }
  get dogruSayisi(): number {
    return this.kararlar.filter((k) => k.dogru).length;
  }
  get mesaiBitti(): boolean {
    return this.gecenSn >= TUNING.mesai.sure;
  }
  get bitti(): boolean {
    return this.idx >= this.dosyalar.length || this.mesaiBitti;
  }

  /** Mesai saatini ilerlet (gerçek saniye). */
  ilerle(sn: number): void {
    if (!this.mesaiBitti) this.gecenSn += sn;
  }

  /** "09:12" gibi oyun saati. */
  saatMetni(): string {
    const m = TUNING.mesai;
    const oran = Math.min(1, this.gecenSn / m.sure);
    const dk = Math.floor(oran * (m.bitisSaat - m.baslangicSaat) * 60);
    const toplam = m.baslangicSaat * 60 + dk;
    return `${String(Math.floor(toplam / 60)).padStart(2, '0')}:${String(toplam % 60).padStart(2, '0')}`;
  }

  damgala(damga: Damga): { dogru: boolean; dogruDamga: Damga; kusurlar: KusurId[] } | null {
    const b = this.mevcut;
    if (!b || this.bitti) return null;
    const dogru = dogruDamga(b, this.gun);
    const kusurlar = gorunenKusurlar(b, this.gun).map((k) => k.id);
    const sonuc = { dogru: dogru === damga, dogruDamga: dogru, kusurlar };
    this.kararlar.push({ dosyaId: b.id, damga, dogruDamga: dogru, dogru: sonuc.dogru, kusurlar });
    this.idx++;
    return sonuc;
  }
}
