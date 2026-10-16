// @beyan görsel
import * as Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { FONT } from '../config';
import { num, PAL } from '../desk/palette';
import { PX, rastgele, snap, Tuval } from '../desk/pixel';
import { masaCiz } from '../desk/props';
import { DAMGA_ADI, DAMGA_RENK } from '../desk/StampTray';
import type { Damga } from '../game/building';
import { SON_GUN } from '../game/days';
import { KUSUR_BILGI } from '../game/rules';
import { gunHesabi, type GunKaydi, type Karar, type SarsintiKaydi } from '../game/session';
import { TUNING } from '../game/tuning';
import { fadeIn, goTo } from '../systems/transition';
import type { GameData } from './GameScene';
import { SCENES } from './keys';
import type { ResultData } from './ResultScene';

export interface DayEndData {
  gun: number;
  tohum: number;
  /** Gün başındaki birikmiş para. */
  paraOnce: number;
  kararlar: Karar[];
  /** Günün bütün dosyaları (damgalanmayanlar "işlenmedi" görünür). */
  dosyalar: { id: string; adres: string }[];
  /** Önceki günlerin kayıtları. */
  kayitlar: GunKaydi[];
  /** Günün sonundaki öncü sarsıntı (varsa): raporda bir satır, kayıtta sokağın hasarı. */
  oncu?: SarsintiKaydi;
}

/** Rapor kâğıdı (ekran pikseli). */
const KAGIT = { x: 288, y: 40, w: 1344, h: 1000 };
const SATIR_H = 52;
/** Sütunların sol kenarı (kâğıdın solundan). */
const SUTUN = { no: 40, bina: 104, damga: 400, dogru: 640, kusur: 880, sonuc: KAGIT.w - 40 };

const para = (n: number): string => `${n < 0 ? '−' : ''}${Math.abs(n)} TL`;

/**
 * Gün sonu ekranı (Papers, Please'in gün sonu özeti gibi): masada bir rapor kâğıdı. Her dosya için bina,
 * verdiğin damga, doğru damga, inceleme modunda bulduğun kusurlar ve sonuç; altta maaş, ceza, günün
 * toplamı ve birikmiş para (yer tutucu değerler, TUNING.para). "Sonraki gün" (Enter/Space) bir sonraki güne,
 * son günden sonra sonuç ekranına geçer (büyük deprem G5).
 */
export class DayEndScene extends Phaser.Scene {
  private veri!: DayEndData;
  private hazir = false;
  private gecildi = false;

  constructor() {
    super(SCENES.DayEnd);
  }

  init(data: DayEndData): void {
    this.veri = data;
    this.hazir = false;
    this.gecildi = false;
  }

  create(): void {
    fadeIn(this);
    this.cameras.main.setRoundPixels(true);
    const v = this.veri;
    const hesap = gunHesabi(v.kararlar, v.dosyalar.length);
    const yeniPara = v.paraOnce + hesap.toplam;

    masaCiz(this, 0);
    this.kagitCiz();
    const L = KAGIT.x;
    const T = KAGIT.y;
    const yaz = (x: number, y: number, t: string, size = 32, renk: string = PAL.murekkep, ox = 0): Phaser.GameObjects.Text =>
      this.add.text(snap(x), snap(y), t, { fontFamily: FONT, fontSize: `${size}px`, color: renk }).setOrigin(ox, 0.5);

    // Başlık
    yaz(L + 40, T + 44, `GÜN ${v.gun} · GÜN SONU`, 64, PAL.kremAcik);
    yaz(L + KAGIT.w - 40, T + 44, `${v.gun}/${SON_GUN}`, 40, PAL.kremAcik, 1);
    yaz(L + 40, T + 124, 'Günlük denetim raporu', 30, PAL.murekkepSoluk);

    // Tablo başlığı
    const bas = T + 180;
    const basliklar: [number, string, number][] = [
      [SUTUN.no, 'NO', 0],
      [SUTUN.bina, 'BİNA', 0],
      [SUTUN.damga, 'DAMGAN', 0],
      [SUTUN.dogru, 'DOĞRUSU', 0],
      [SUTUN.kusur, 'BULDUĞUN KUSURLAR', 0],
      [SUTUN.sonuc, 'SONUÇ', 1],
    ];
    for (const [x, t, ox] of basliklar) yaz(L + x, bas, t, 28, PAL.etiket, ox);
    this.add.rectangle(L + 32, bas + 24, KAGIT.w - 64, PX, num(PAL.murekkepSoluk)).setOrigin(0);

    // Satırlar
    const kararlar = new Map(v.kararlar.map((k) => [k.dosyaId, k]));
    let y = bas + 24 + SATIR_H / 2 + 8;
    v.dosyalar.forEach((d, i) => {
      const k = kararlar.get(d.id);
      const ogeler: Phaser.GameObjects.GameObject[] = [];
      ogeler.push(yaz(L + SUTUN.no, y, String(i + 1).padStart(2, '0'), 32, PAL.murekkepSoluk));
      ogeler.push(this.sigdir(yaz(L + SUTUN.bina, y, d.adres, 32), SUTUN.damga - SUTUN.bina - 16));
      if (k) {
        ogeler.push(...this.damgaCip(L + SUTUN.damga, y, k.damga));
        ogeler.push(...this.damgaCip(L + SUTUN.dogru, y, k.dogruDamga));
        const bulunan = k.bulunan.map((id) => KUSUR_BILGI[id].etiket).join(', ') || '—';
        ogeler.push(this.sigdir(yaz(L + SUTUN.kusur, y, bulunan, 30), SUTUN.sonuc - SUTUN.kusur - 150));
        ogeler.push(yaz(L + SUTUN.sonuc, y, k.dogru ? 'DOĞRU' : 'YANLIŞ', 32, k.dogru ? PAL.damgaGuvenli : PAL.damgaBosalt, 1));
      } else {
        ogeler.push(yaz(L + SUTUN.damga, y, '—', 32, PAL.murekkepSoluk));
        ogeler.push(yaz(L + SUTUN.dogru, y, '—', 32, PAL.murekkepSoluk));
        ogeler.push(yaz(L + SUTUN.kusur, y, '—', 30, PAL.murekkepSoluk));
        ogeler.push(yaz(L + SUTUN.sonuc, y, 'İŞLENMEDİ', 32, PAL.murekkepSoluk, 1));
      }
      // Satır arası noktalı çizgi
      for (let x = L + 32; x < L + KAGIT.w - 32; x += 12) ogeler.push(this.add.rectangle(x, y + SATIR_H / 2, 4, 4, num(PAL.kremKoyu)).setOrigin(0));
      for (const o of ogeler) {
        (o as unknown as Phaser.GameObjects.Components.Alpha).setAlpha(0);
        this.tweens.add({ targets: o, alpha: 1, duration: 160, delay: 200 + i * 90 });
      }
      y += SATIR_H;
    });

    // Öncü sarsıntı satırı (yer tutucu metin)
    let oncuH = 0;
    if (v.oncu) {
      const adres = new Map(v.dosyalar.map((d) => [d.id, d.adres]));
      const catlayan = v.oncu.sonuclar.filter((s) => s.durum !== 'ayakta');
      const dolu = catlayan.filter((s) => !s.bos);
      const bos = catlayan.filter((s) => s.bos);
      const ad = (id: string): string => adres.get(id) ?? id;
      const parcalar: string[] = [];
      if (dolu.length > 0)
        parcalar.push(
          `${dolu.length} bina çatladı (${dolu.map((s) => `${ad(s.dosyaId)}, ${DAMGA_ADI[kararlar.get(s.dosyaId)?.damga ?? 'guvenli']} damgalı`).join('; ')})`,
        );
      else parcalar.push('içinde insan olan bina çatlamadı');
      if (bos.length > 0) parcalar.push(`çatlayan boş bina: ${bos.map((s) => ad(s.dosyaId)).join(', ')}`);
      const metin = `[Öncü sarsıntı: ${parcalar.join(' · ')}]`;
      const kotu = dolu.length > 0;
      const satir = yaz(L + 40, y + 20, metin, 34, kotu ? PAL.damgaBosalt : PAL.damgaGuvenli);
      this.sigdir(satir, KAGIT.w - 80);
      satir.setAlpha(0);
      this.tweens.add({ targets: satir, alpha: 1, duration: 160, delay: 200 + v.dosyalar.length * 90 + 120 });
      oncuH = 56;
    }

    // Hesap
    const P = TUNING.para;
    const hy = Math.max(y + 24 + oncuH, T + 700);
    this.add.rectangle(L + 32, hy - 16, KAGIT.w - 64, PX, num(PAL.murekkepSoluk)).setOrigin(0);
    const sol = L + 40;
    yaz(sol, hy + 24, `Doğru: ${hesap.dogru}`, 36, PAL.damgaGuvenli);
    yaz(sol, hy + 72, `Yanlış: ${hesap.yanlis}`, 36, PAL.damgaBosalt);
    if (hesap.islenmeyen > 0) yaz(sol, hy + 120, `İşlenmedi: ${hesap.islenmeyen}`, 36, PAL.murekkepSoluk);
    const ad = L + 640;
    const deger = L + KAGIT.w - 40;
    const satirlar: [string, string, string][] = [
      [`Maaş (${hesap.dogru} × ${P.maas})`, `+${para(hesap.maas)}`, PAL.murekkep],
      [`Ceza (${hesap.yanlis} × ${P.ceza})`, hesap.ceza > 0 ? para(-hesap.ceza) : para(0), PAL.damgaBosalt],
      ['Günün toplamı', para(hesap.toplam), PAL.murekkep],
      ['Birikmiş', para(yeniPara), PAL.murekkep],
    ];
    satirlar.forEach(([a, b, renk], i) => {
      const yy = hy + 24 + i * 48;
      if (i === 2) this.add.rectangle(ad, yy - 26, deger - ad, PX, num(PAL.murekkepSoluk)).setOrigin(0);
      yaz(ad, yy, a, 36, i >= 2 ? PAL.murekkep : PAL.etiket);
      yaz(deger, yy, b, i === 3 ? 44 : 36, renk, 1);
    });

    // Sonraki gün düğmesi
    const son = v.gun >= SON_GUN;
    this.dugmeKur(L + KAGIT.w / 2, T + KAGIT.h - 64, son ? 'SONUÇ' : 'SONRAKİ GÜN', () => this.devam(yeniPara));
    const kb = this.input.keyboard;
    const tus = (): void => this.devam(yeniPara);
    kb?.on('keydown-ENTER', tus);
    kb?.on('keydown-SPACE', tus);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      kb?.off('keydown-ENTER', tus);
      kb?.off('keydown-SPACE', tus);
    });
    // Rapor dolarken yanlışlıkla geçilmesin.
    this.time.delayedCall(500, () => (this.hazir = true));
    sfx.play('kagitKay');
    // Gün sonu jingle'ı: yanlış ya da işlenmeyen dosya yoksa iyi gün, varsa kötü gün.
    const iyi = hesap.yanlis === 0 && hesap.islenmeyen === 0;
    this.time.delayedCall(350, () => sfx.play(iyi ? 'gunIyi' : 'gunKotu'));
  }

  private devam(yeniPara: number): void {
    if (!this.hazir || this.gecildi) return;
    this.gecildi = true;
    sfx.play('confirm');
    const v = this.veri;
    const kayit: GunKaydi = { gun: v.gun, kararlar: v.kararlar };
    if (v.oncu) kayit.oncu = v.oncu;
    const kayitlar: GunKaydi[] = [...v.kayitlar, kayit];
    if (v.gun >= SON_GUN) {
      const toplam = kayitlar.reduce((n, g) => n + g.kararlar.length, 0);
      const dogru = kayitlar.reduce((n, g) => n + g.kararlar.filter((k) => k.dogru).length, 0);
      const data: ResultData = { score: yeniPara, won: toplam > 0 && dogru / toplam >= 0.5, title: `Gün ${v.gun} bitti` };
      goTo(this, SCENES.Result, data);
      return;
    }
    const data: GameData = { gun: v.gun + 1, tohum: v.tohum, para: yeniPara, kayitlar };
    goTo(this, SCENES.Game, data);
  }

  /** Metin genişliği aşarsa küçült. */
  private sigdir(t: Phaser.GameObjects.Text, w: number): Phaser.GameObjects.Text {
    let boy = parseInt(String(t.style.fontSize), 10);
    while (t.width > w && boy > 22) {
      boy -= 2;
      t.setFontSize(boy);
    }
    return t;
  }

  /** Damga adı, damga renginde küçük mürekkep kutusu içinde. */
  private damgaCip(x: number, y: number, d: Damga): Phaser.GameObjects.GameObject[] {
    const yazi = this.add.text(0, snap(y), DAMGA_ADI[d], { fontFamily: FONT, fontSize: '30px', color: '#f0e6cc' }).setOrigin(0, 0.5);
    const w = snap(yazi.width + 20);
    yazi.setX(snap(x + 10));
    const kutu = this.add.rectangle(snap(x), snap(y), w, 40, num(DAMGA_RENK[d])).setOrigin(0, 0.5);
    const kenar = this.add.rectangle(snap(x) - PX, snap(y), w + PX * 2, 48, 0x1d191b, 0.6).setOrigin(0, 0.5);
    kenar.setDepth(1);
    kutu.setDepth(2);
    yazi.setDepth(3);
    return [kenar, kutu, yazi];
  }

  private kagitCiz(): void {
    const W = KAGIT.w / PX;
    const H = KAGIT.h / PX;
    const rnd = rastgele(this.veri.gun * 131 + 7);
    const t = new Tuval(this, W + 2, H + 3, 'rapor');
    t.rect(2, 3, W, H, '#00000066');
    t.rect(0, 0, W, H, PAL.krem);
    t.benek(0, 0, W, H, PAL.kremKoyu, 0.035, rnd);
    t.frame(0, 0, W, H, PAL.kremKoyu);
    t.frame(2, 2, W - 4, H - 4, PAL.kremKoyu);
    t.dither(1, H - 2, W - 2, 1, PAL.kremKoyu);
    // Başlık şeridi
    t.rect(3, 3, W - 6, 22, PAL.basikSerit);
    for (let x = 3; x < W - 3; x += 2) {
      t.px(x, 3, '#7a4a42');
      t.px(x + 1, 24, '#7a4a42');
    }
    t.goruntu(KAGIT.x, KAGIT.y).setOrigin(0);
  }

  private dugmeKur(x: number, y: number, metin: string, is: () => void): void {
    const yazi = this.add.text(0, 0, metin, { fontFamily: FONT, fontSize: '44px', color: PAL.panel }).setOrigin(0.5);
    const ipucu = this.add.text(0, 0, 'Enter', { fontFamily: FONT, fontSize: '26px', color: PAL.panel }).setOrigin(0.5);
    const w = snap(yazi.width + ipucu.width + 96);
    const h = 72;
    const tw = w / PX;
    const th = h / PX;
    const t = new Tuval(this, tw, th, 'gunsonu-dugme');
    t.rect(0, 0, tw, th, PAL.cerceveKoyu);
    t.rect(1, 1, tw - 2, th - 2, PAL.damgaGuclendir);
    t.rect(1, 1, tw - 2, 1, '#d0ad52');
    t.rect(1, th - 2, tw - 2, 1, '#8a6a20');
    const kap = this.add.container(snap(x), snap(y));
    kap.add(t.goruntu(0, 0));
    yazi.setPosition(snap(-ipucu.width / 2 - 16), 0);
    ipucu.setPosition(snap(w / 2 - ipucu.width / 2 - 24), 4);
    kap.add([yazi, ipucu]);
    kap.setSize(w, h).setInteractive({ useHandCursor: true });
    kap.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => kap.setScale(1.04));
    kap.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => kap.setScale(1));
    kap.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, is);
    kap.setAlpha(0);
    this.tweens.add({ targets: kap, alpha: 1, duration: 200, delay: 400 });
  }
}
