// @beyan görsel
import * as Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { FONT } from '../config';
import { num, PAL } from '../desk/palette';
import { PX, rastgele, snap, Tuval } from '../desk/pixel';
import { masaCiz, pikselDugme } from '../desk/props';
import { gunAyar, SON_GUN } from '../game/days';
import { degerlendirme, zarfOzeti } from '../game/gazete';
import { depremOzeti, gunHesabi, oyunToplami } from '../game/session';
import { fadeIn, goTo } from '../systems/transition';
import type { GameData } from './GameScene';
import { SCENES } from './keys';
import type { NewspaperData } from './NewspaperScene';

/** Sonuç ekranına gelen veri: beş günün kayıtları, birikmiş para ve büyük depremin sonuçları. */
export type ResultData = NewspaperData;

/** Dosya kâğıdı (ekran pikseli). */
const KAGIT = { x: 288, y: 40, w: 1344, h: 1000 };
const SATIR_H = 48;
/** Tablo sütunlarının sağ kenarı (kâğıdın solundan); GÜN sütunu sol hizalı. */
const SUTUN = { gun: 40, dosya: 420, dogru: 600, yanlis: 780, islenmeyen: 990, kusur: 1180, para: KAGIT.w - 40 };

const para = (n: number): string => `${n < 0 ? '−' : ''}${Math.abs(n)} TL`;

/**
 * Oyun sonu (G5): masada "Denetçi dosyası". Beş günün doğru/yanlış toplamı, bulunan kusurlar, birikmiş para,
 * büyük depremde sokağın özeti (ayakta / hasarlı / çöken / boşaltılmış / iade) ve kısa bir değerlendirme satırı (yer
 * tutucu). "Yeniden oyna" (Enter) gün 1'den yeni sokakla başlar; "Ana menü" (Esc).
 */
export class ResultScene extends Phaser.Scene {
  private veri!: ResultData;
  private gecildi = false;

  constructor() {
    super(SCENES.Result);
  }

  init(data: ResultData): void {
    this.veri = { tohum: data?.tohum ?? 0, para: data?.para ?? 0, kayitlar: data?.kayitlar ?? [], sonuclar: data?.sonuclar ?? [] };
    this.gecildi = false;
  }

  create(): void {
    fadeIn(this);
    this.cameras.main.setRoundPixels(true);
    const v = this.veri;
    const top = oyunToplami(v.kayitlar);
    const oz = depremOzeti(v.sonuclar);
    const deg = degerlendirme(oz);

    masaCiz(this, 0);
    this.kagitCiz();
    const L = KAGIT.x;
    const T = KAGIT.y;
    const yaz = (x: number, y: number, t: string, size = 32, renk: string = PAL.murekkep, ox = 0): Phaser.GameObjects.Text =>
      this.add.text(snap(x), snap(y), t, { fontFamily: FONT, fontSize: `${size}px`, color: renk }).setOrigin(ox, 0.5);
    const cizgi = (y: number, x0 = L + 32, x1 = L + KAGIT.w - 32): void => {
      this.add.rectangle(snap(x0), snap(y), snap(x1 - x0), PX, num(PAL.murekkepSoluk)).setOrigin(0);
    };
    const gorun = (o: Phaser.GameObjects.GameObject & { setAlpha(v: number): unknown }, gecikme: number): void => {
      o.setAlpha(0);
      this.tweens.add({ targets: o, alpha: 1, duration: 160, delay: gecikme });
    };

    // Başlık
    yaz(L + 40, T + 44, 'DENETÇİ DOSYASI', 64, PAL.kremAcik);
    yaz(L + KAGIT.w - 40, T + 44, `${SON_GUN} GÜN`, 40, PAL.kremAcik, 1);
    yaz(L + 40, T + 124, 'Denetim özeti ve deprem sonrası sokak', 30, PAL.murekkepSoluk);

    // Gün tablosu
    const bas = T + 176;
    const basliklar: [number, string, number][] = [
      [SUTUN.gun, 'GÜN', 0],
      [SUTUN.dosya, 'DOSYA', 1],
      [SUTUN.dogru, 'DOĞRU', 1],
      [SUTUN.yanlis, 'YANLIŞ', 1],
      [SUTUN.islenmeyen, 'İŞLENMEDİ', 1],
      [SUTUN.kusur, 'BULUNAN KUSUR', 1],
      [SUTUN.para, 'KAZANÇ', 1],
    ];
    for (const [x, t, ox] of basliklar) yaz(L + x, bas, t, 28, PAL.etiket, ox);
    cizgi(bas + 24);
    let y = bas + 24 + SATIR_H / 2 + 4;
    let kazanc = 0;
    v.kayitlar.forEach((k, i) => {
      const dosya = gunAyar(k.gun).dosyaSayisi;
      const h = gunHesabi(k.kararlar, dosya);
      const bulunan = k.kararlar.reduce((n, c) => n + c.bulunan.length, 0);
      const kusur = k.kararlar.reduce((n, c) => n + c.kusurlar.length, 0);
      kazanc += h.toplam;
      const ogeler = [
        yaz(L + SUTUN.gun, y, `Gün ${k.gun}`, 32),
        yaz(L + SUTUN.dosya, y, String(dosya), 32, PAL.murekkep, 1),
        yaz(L + SUTUN.dogru, y, String(h.dogru), 32, PAL.damgaGuvenli, 1),
        yaz(L + SUTUN.yanlis, y, String(h.yanlis), 32, h.yanlis > 0 ? PAL.damgaBosalt : PAL.murekkepSoluk, 1),
        yaz(L + SUTUN.islenmeyen, y, String(h.islenmeyen), 32, PAL.murekkepSoluk, 1),
        yaz(L + SUTUN.kusur, y, `${bulunan} / ${kusur}`, 32, PAL.murekkep, 1),
        yaz(L + SUTUN.para, y, para(h.toplam), 32, PAL.murekkep, 1),
      ];
      for (const o of ogeler) gorun(o, 200 + i * 90);
      y += SATIR_H;
    });
    cizgi(y - SATIR_H / 2 + 4);
    y += 8;
    const topY = y;
    const toplamlar = [
      yaz(L + SUTUN.gun, topY, 'TOPLAM', 34, PAL.murekkep),
      yaz(L + SUTUN.dosya, topY, String(top.dosya), 34, PAL.murekkep, 1),
      yaz(L + SUTUN.dogru, topY, String(top.dogru), 34, PAL.damgaGuvenli, 1),
      yaz(L + SUTUN.yanlis, topY, String(top.yanlis), 34, top.yanlis > 0 ? PAL.damgaBosalt : PAL.murekkepSoluk, 1),
      yaz(L + SUTUN.islenmeyen, topY, String(top.islenmeyen), 34, PAL.murekkepSoluk, 1),
      yaz(L + SUTUN.kusur, topY, `${top.bulunan} / ${top.kusur}`, 34, PAL.murekkep, 1),
      yaz(L + SUTUN.para, topY, para(kazanc), 34, PAL.murekkep, 1),
      yaz(L + SUTUN.para, topY + 52, `Birikmiş para: ${para(v.para)}`, 38, PAL.murekkep, 1),
    ];
    // Zarf (G17): kabul edilen zarflar ve hasar gören binaları (yer tutucu metin).
    let zarfAdet = 0;
    let zarfTL = 0;
    for (const k of v.kayitlar) {
      const h = gunHesabi(k.kararlar, gunAyar(k.gun).dosyaSayisi);
      zarfAdet += h.zarfKabul;
      zarfTL += h.zarf;
    }
    const zarf = zarfOzeti(zarfAdet, zarfTL, v.sonuclar);
    if (zarf) toplamlar.push(this.sigdir(yaz(L + SUTUN.gun, topY + 52, zarf, 32, PAL.damgaBosalt), 760));
    for (const o of toplamlar) gorun(o, 200 + v.kayitlar.length * 90 + 80);

    // Deprem özeti: dört kutu
    const dy = Math.max(topY + 112, T + 600);
    cizgi(dy - 24);
    const dGec = 200 + v.kayitlar.length * 90 + 400;
    gorun(yaz(L + 40, dy + 16, 'BÜYÜK DEPREM · SOKAK', 34, PAL.etiket), dGec);
    const kutular: [string, number, string, string?][] = [
      ['AYAKTA', oz.ayakta, PAL.damgaGuvenli],
      ['HASARLI', oz.hasarli, PAL.damgaGuclendir],
      ['ÇÖKEN', oz.coken, PAL.damgaBosalt, oz.coken > 0 ? `${oz.cokenBos} boşaltılmıştı` : undefined],
      ['BOŞALTILMIŞ', oz.bos, PAL.murekkepSoluk],
      // İADE: denetlenmeden kalan binalar (içleri doluydu); kaçının çöktüğü alt satırda.
      ['İADE', oz.iade, PAL.damgaIade, oz.iade > 0 ? (oz.iadeCoken > 0 ? `${oz.iadeCoken} çöktü` : 'denetlenmedi') : undefined],
    ];
    const kw = 232;
    const kara = (KAGIT.w - 80 - kutular.length * kw) / (kutular.length - 1);
    kutular.forEach(([ad, n, renk, alt], i) => {
      const x = L + 40 + i * (kw + kara);
      const ky = dy + 56;
      const kap = this.add.container(snap(x), snap(ky));
      kap.add(this.add.rectangle(0, 0, kw, 136, num(renk)).setOrigin(0));
      kap.add(this.add.rectangle(PX, PX, kw - PX * 2, 136 - PX * 2, num(PAL.krem)).setOrigin(0));
      kap.add(this.add.rectangle(PX, PX, kw - PX * 2, 36, num(renk)).setOrigin(0));
      kap.add(this.add.text(kw / 2, 22, ad, { fontFamily: FONT, fontSize: '30px', color: '#f0e6cc' }).setOrigin(0.5));
      kap.add(this.add.text(kw / 2, alt ? 76 : 86, String(n), { fontFamily: FONT, fontSize: '64px', color: renk }).setOrigin(0.5));
      if (alt) kap.add(this.add.text(kw / 2, 116, alt, { fontFamily: FONT, fontSize: '26px', color: PAL.murekkepSoluk }).setOrigin(0.5));
      gorun(kap, dGec + 100 + i * 120);
    });

    // Değerlendirme (yer tutucu)
    const renk = deg.ton === 'iyi' ? PAL.damgaGuvenli : deg.ton === 'orta' ? PAL.damgaGuclendir : PAL.damgaBosalt;
    const dz = this.sigdir(yaz(L + KAGIT.w / 2, dy + 248, deg.metin, 44, renk, 0.5), KAGIT.w - 80);
    gorun(dz, dGec + 700);

    // Düğmeler
    const yeniden = (): void => this.git(SCENES.Game, { gun: 1 } satisfies GameData);
    const menu = (): void => this.git(SCENES.Menu);
    const by = T + KAGIT.h - 64;
    const d1 = pikselDugme(this, L + KAGIT.w / 2 - 230, by, 'YENİDEN OYNA', 'Enter', yeniden);
    const d2 = pikselDugme(this, L + KAGIT.w / 2 + 230, by, 'ANA MENÜ', 'Esc', menu, {
      govde: PAL.cerceveAcik,
      acik: '#7a7466',
      koyu: PAL.cerceve,
    });
    for (const d of [d1, d2]) this.tweens.add({ targets: d, alpha: 1, duration: 200, delay: dGec + 900 });
    const kb = this.input.keyboard;
    const hazir = { v: false };
    this.time.delayedCall(dGec + 900, () => (hazir.v = true));
    const enter = (): void => {
      if (hazir.v) yeniden();
    };
    const esc = (): void => {
      if (hazir.v) menu();
    };
    kb?.on('keydown-ENTER', enter);
    kb?.on('keydown-ESC', esc);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      kb?.off('keydown-ENTER', enter);
      kb?.off('keydown-ESC', esc);
    });
    sfx.play('kagitKay');
    this.time.delayedCall(dGec + 700, () => sfx.play(deg.ton === 'iyi' ? 'gunIyi' : 'gunKotu'));
  }

  private git(key: string, data?: object): void {
    if (this.gecildi) return;
    this.gecildi = true;
    sfx.play('confirm');
    goTo(this, key, data);
  }

  /** Metin genişliği aşarsa küçült. */
  private sigdir(t: Phaser.GameObjects.Text, w: number): Phaser.GameObjects.Text {
    let boy = parseInt(String(t.style.fontSize), 10);
    while (t.width > w && boy > 24) {
      boy -= 2;
      t.setFontSize(boy);
    }
    return t;
  }

  private kagitCiz(): void {
    const W = KAGIT.w / PX;
    const H = KAGIT.h / PX;
    const rnd = rastgele(this.veri.tohum * 7 + 5);
    const t = new Tuval(this, W + 2, H + 3, 'dosya');
    t.rect(2, 3, W, H, '#00000066');
    t.rect(0, 0, W, H, PAL.krem);
    t.benek(0, 0, W, H, PAL.kremKoyu, 0.035, rnd);
    t.frame(0, 0, W, H, PAL.kremKoyu);
    t.frame(2, 2, W - 4, H - 4, PAL.kremKoyu);
    t.dither(1, H - 2, W - 2, 1, PAL.kremKoyu);
    // Başlık şeridi (dosya kapağı rengi)
    t.rect(3, 3, W - 6, 22, PAL.mavisi);
    for (let x = 3; x < W - 3; x += 2) {
      t.px(x, 3, '#2f3b5c');
      t.px(x + 1, 24, '#2f3b5c');
    }
    t.goruntu(KAGIT.x, KAGIT.y).setOrigin(0);
  }
}
