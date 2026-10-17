// @beyan görsel
import * as Phaser from 'phaser';
import { FONT } from '../config';
import type { Damga } from '../game/building';
import { DAMGA_ADI, DAMGA_RENK } from './Kaselik';
import { num, PAL } from './palette';

/** Etiket boyları (yazı px): büyük deprem (tam ekran sokak) ve masa penceresindeki öncü sarsıntı. */
export interface EtiketBoy {
  damga: number;
  ust: number;
  sonuc: number;
  /** Çipler arası dikey adım ve binaya inen çubuğun boyu. */
  aralik: number;
  cubuk: number;
}
export const ETIKET_BUYUK: EtiketBoy = { damga: 40, ust: 36, sonuc: 44, aralik: 60, cubuk: 24 };
export const ETIKET_KUCUK: EtiketBoy = { damga: 26, ust: 24, sonuc: 26, aralik: 48, cubuk: 12 };
/** Küçük etiketin (başlıksız: damga + sonuç) cephenin üstünden yüksekliği (ekran, ölçek 1). */
export const ETIKET_KUCUK_YUKSEKLIK = 104;

export interface BinaEtiketi {
  kap: Phaser.GameObjects.Container;
  /** Sonuç çipi (gizli başlar); sonucGoster ile metni ve rengi verilip belirir. */
  sonucGoster: (metin: string, zemin: string) => void;
  /** Görünen çiplerin en genişinin genişliği (ekran, ölçek 1): yan yana etiketler çakışmasın diye (G21b). */
  genislik: () => number;
  /** Binaya inen çubuk (G23: etiket yana kayınca çubuk binanın üstünde kalsın diye ayrı konumlanır). */
  cubuk: Phaser.GameObjects.Rectangle;
}

/**
 * Binanın üstündeki etiket (G21 "SENİN DAMGAN", G5b öncü sarsıntı): en altta damga renginde damga adı, üstünde
 * isteğe bağlı başlık şeridi (ör. "SENİN DAMGAN"), en üstte sarsıntıdan sonra beliren sonuç çipi. ek: damga adının
 * yanına eklenen kısa metin (G22: zarf alınan binada "[ZARF]"). Kabın (0, 0)'ı
 * cephenin üst kenarının ortasıdır (Sokak.ustuneEkle).
 */
export function binaEtiketi(scene: Phaser.Scene, damga: Damga, boy: EtiketBoy, ust?: string, ek?: string): BinaEtiketi {
  const kap = scene.add.container(0, 0);
  const cip = (y: number, metin: string, zemin: string, renk: string, size: number): Phaser.GameObjects.Container => {
    const c = scene.add.container(0, y);
    const t = scene.add.text(0, 0, metin, { fontFamily: FONT, fontSize: `${size}px`, color: renk }).setOrigin(0.5);
    const w = Math.ceil((t.width + size * 0.7) / 4) * 4;
    const h = Math.ceil((size + 12) / 4) * 4;
    const cerceve = scene.add.rectangle(0, 0, w + 8, h + 8, 0x0e0d10, 0.9);
    const ic = scene.add.rectangle(0, 0, w, h, num(zemin));
    c.add([cerceve, ic, t]);
    c.setData('parca', { t, ic, cerceve, size });
    return c;
  };
  const a = boy.aralik;
  let y = -boy.cubuk - boy.damga / 2;
  const cubuk = scene.add.rectangle(0, -boy.cubuk / 2, 4, boy.cubuk, 0x0e0d10, 0.9);
  kap.add(cubuk);
  kap.add(cip(Math.round(y), ek ? `${DAMGA_ADI[damga]} ${ek}` : DAMGA_ADI[damga], DAMGA_RENK[damga], '#f0e6cc', boy.damga));
  if (ust) {
    y -= a;
    kap.add(cip(Math.round(y), ust, PAL.kremAcik, '#1d1a18', boy.ust));
  }
  y -= a + (boy.sonuc - boy.damga);
  const sonuc = cip(Math.round(y), '', PAL.damgaGuvenli, '#f0e6cc', boy.sonuc).setAlpha(0);
  kap.add(sonuc);
  /** Sonuç çipinin alt kenarı: çok satırlı metinde çip yukarı doğru büyür (G23: dar pencere camında iki satır). */
  const sonucAlt = Math.round(y) + (Math.ceil((boy.sonuc + 12) / 4) * 4) / 2;
  const sonucGoster = (metin: string, zemin: string): void => {
    const p = sonuc.getData('parca') as { t: Phaser.GameObjects.Text; ic: Phaser.GameObjects.Rectangle; cerceve: Phaser.GameObjects.Rectangle; size: number };
    const ilk = p.t.text === '';
    p.t.setText(metin).setAlign('center');
    const w = Math.ceil((p.t.width + p.size * 0.7) / 4) * 4;
    const tek = Math.ceil((p.size + 12) / 4) * 4;
    const h = metin.includes('\n') ? Math.max(tek, Math.ceil((p.t.height + 12) / 4) * 4) : tek;
    p.ic.setSize(w, h).setFillStyle(num(zemin));
    p.cerceve.setSize(w + 8, h + 8);
    // Çip alt kenarından yukarı büyüsün (iki satırda damga çipinin üstüne binmesin).
    sonuc.setY(sonucAlt - h / 2);
    if (ilk) scene.tweens.add({ targets: sonuc, alpha: 1, duration: 240, ease: 'Stepped', easeParams: [3] });
  };
  const genislik = (): number => {
    let w = 0;
    for (const c of kap.list) {
      const p = (c as Phaser.GameObjects.Container).getData?.('parca') as { cerceve: Phaser.GameObjects.Rectangle } | undefined;
      if (p && (c as Phaser.GameObjects.Container).alpha > 0) w = Math.max(w, p.cerceve.width);
    }
    return w;
  };
  return { kap, sonucGoster, genislik, cubuk };
}
