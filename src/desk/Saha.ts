// @beyan görsel
import * as Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { FONT } from '../config';
import type { Bina } from '../game/building';
import { SAHA_METIN } from '../game/diyalog';
import { gecersizOkuma, type SahaSonucu, type SahaYuzey } from '../game/saha';
import { KONTUR, num, PAL } from './palette';
import { dizgiTohum, PX, rastgele, snap, Tuval } from './pixel';
import { MASA_Y } from './Window';

/** Saha testinin kapladığı alan: masanın tamamı (kaşelik dahil). */
const ALAN = { x: 0, y: MASA_Y, w: 1920, h: 1080 - MASA_Y };
/** Beton yüzey (yakın plan) ve sağdaki çekiç paneli (ekran, 8'in katı). */
const YUZEY = { x: 32, y: MASA_Y + 24, w: 1344, h: 568 };
const PANEL = { x: 1400, y: MASA_Y + 24, w: 488, h: 568 };
const YW = YUZEY.w / PX;
const YH = YUZEY.h / PX;
/** İbre ölçeği (R). */
const OLCEK = { min: 10, max: 60 };
const IBRE = { x: PANEL.x + 32, y: PANEL.y + 200, w: PANEL.w - 64, h: 56 };
/** Derinlikler: kartların, klasörün ve kaşeliğin üstünde; inceleme şeridinin (kapalı) altında. */
const D = { zemin: 7600, yuzey: 7601, panel: 7602, yazi: 7603, cekic: 7610, ucan: 7611 };

const BETON = { taban: '#8f8b83', koyu: '#7d7972', acik: '#a19d94', gozenek: '#55524d', derz: '#77736c' };
const SIVA = { taban: '#c3baa4', koyu: '#a59c87', acik: '#d4ccb7' };
const CATLAK = { ic: '#2e2b28', kenar: '#6a6660' };

/** Maske değerleri: 0 temiz, 1 sıva, 2 çatlak (çevresiyle). */
const MASKE: SahaYuzey[] = ['temiz', 'siva', 'catlak'];

export interface SahaAyar {
  bina: Bina;
  tohum: number;
  /** Okumalar ve tahmin (oturum önizler; hak tamamlanınca harcanır). */
  sonuc: SahaSonucu;
  /** Testten önceki kalan hak (panelde). */
  hak: number;
}

/**
 * Saha testi mini oyunu (G19): masanın yerini binanın zemin kat kolonunun yakın planı alır (kodla piksel çizim:
 * beton, kalıp derzleri, agrega, sıva yamaları, çatlaklar). İmleç Schmidt çekicine döner; yüzeye her tıklamada
 * çekiç geri teper ve panelde ibre R değerini gösterir. Sıva ya da çatlak (ve yakını) üstündeki okuma geçersizdir,
 * sayılmaz. Geçerli okumalar tamamlanınca 'tamamlandi' (hak harcanır), ortalama ve tahmin panelde; NOTU AL ile
 * 'kapandi' (sonuç). VAZGEÇ ya da Esc 'kapandi' (null; hak harcanmaz). Masa kilitlemek GameScene'in işi.
 */
export class SahaTesti extends Phaser.Events.EventEmitter {
  private readonly nesneler: Phaser.GameObjects.GameObject[] = [];
  private readonly yuzey: Tuval;
  private readonly maske: Uint8Array;
  private readonly cekic: Phaser.GameObjects.Image;
  private readonly ibre: Phaser.GameObjects.Rectangle;
  private readonly ibreYazi: Phaser.GameObjects.Text;
  private readonly kutular: Phaser.GameObjects.Text[] = [];
  private readonly gecersizYazi: Phaser.GameObjects.Text;
  private readonly hakYazi: Phaser.GameObjects.Text;
  private readonly ipucu: Phaser.GameObjects.Text;
  private readonly dugme: { kutu: Phaser.GameObjects.Rectangle; yazi: Phaser.GameObjects.Text };
  private sonucYazi?: Phaser.GameObjects.Text;
  private gecerli = 0;
  private gecersiz = 0;
  private bitti = false;
  private kapali = false;
  /** Çekiç geri tepiyor (kısa animasyon): yeni vuruş alınmaz. */
  private tepiyor = false;
  private readonly hareket: (p: Phaser.Input.Pointer) => void;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly ayar: SahaAyar,
  ) {
    super();
    const s = scene;
    const ekle = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
      this.nesneler.push(o);
      return o;
    };
    // Arka plan: masanın tamamını örter ve tıklamaları tutar (alttaki belgelere, kaşeliğe geçmesin).
    const zemin = ekle(s.add.rectangle(ALAN.x, ALAN.y, ALAN.w, ALAN.h, num(PAL.duvarKoyu)).setOrigin(0).setDepth(D.zemin));
    zemin.setInteractive();
    ekle(s.add.rectangle(YUZEY.x - 8, YUZEY.y - 8, YUZEY.w + 16, YUZEY.h + 16, num(KONTUR)).setOrigin(0).setDepth(D.zemin));

    // Beton yüzey
    this.yuzey = new Tuval(s, YW, YH, 'saha-yuzey');
    this.maske = yuzeyCiz(this.yuzey, rastgele(dizgiTohum(`${ayar.bina.id}:saha-yuzey`)));
    const img = ekle(this.yuzey.goruntu(YUZEY.x, YUZEY.y).setOrigin(0).setDepth(D.yuzey));
    // Yüzeyde imleç gizli: Schmidt çekici imlecin yerini alır.
    img.setInteractive({ cursor: 'none' });
    img.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) => this.vur(p.worldX, p.worldY));
    img.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => this.cekic.setVisible(true));
    img.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => this.cekic.setVisible(false));

    this.panelCiz();
    const P = PANEL;
    const yaz = (x: number, y: number, t: string, boy: number, renk: string, ox = 0): Phaser.GameObjects.Text =>
      ekle(s.add.text(x, y, t, { fontFamily: FONT, fontSize: `${boy}px`, color: renk }).setOrigin(ox, 0.5).setDepth(D.yazi));
    yaz(P.x + 24, P.y + 36, SAHA_METIN.baslik, 50, PAL.saat);
    yaz(P.x + 24, P.y + 76, SAHA_METIN.alt.replace('{adres}', ayar.bina.adres), 30, PAL.panelYazi);
    this.ipucu = yaz(P.x + 24, P.y + 116, SAHA_METIN.ipucu, 26, PAL.kremAcik);
    if (this.ipucu.width > P.w - 48) this.ipucu.setScale((P.w - 48) / this.ipucu.width);

    // İbre: ölçek, çentikler, sürgü (rider) ve büyük okuma.
    yaz(IBRE.x, IBRE.y - 32, SAHA_METIN.ibre, 28, PAL.panelYazi);
    this.ibreYazi = yaz(IBRE.x + IBRE.w, IBRE.y - 32, 'R --', 44, PAL.saat, 1);
    for (let r = OLCEK.min; r <= OLCEK.max; r += 10) yaz(this.ibreX(r), IBRE.y + IBRE.h + 20, String(r), 26, PAL.panelYazi, 0.5).setOrigin(0.5);
    this.ibre = ekle(s.add.rectangle(this.ibreX(OLCEK.min), IBRE.y + IBRE.h / 2, PX * 2, IBRE.h - PX * 2, num(PAL.damgaBosalt)).setDepth(D.yazi));

    // Okuma kutuları
    yaz(P.x + 24, P.y + 324, SAHA_METIN.okumalar, 28, PAL.panelYazi);
    const n = ayar.sonuc.okumalar.length;
    const kw = 64;
    const ara = Math.floor((P.w - 48 - n * kw) / Math.max(1, n - 1));
    for (let i = 0; i < n; i++) {
      const x = P.x + 24 + i * (kw + ara);
      ekle(s.add.rectangle(x, P.y + 352, kw, 56, num(PAL.panel)).setOrigin(0).setStrokeStyle(PX, num(PAL.panelKenar)).setDepth(D.panel));
      this.kutular.push(yaz(x + kw / 2, P.y + 380, '--', 40, PAL.murekkepAcik, 0.5).setOrigin(0.5));
    }
    this.gecersizYazi = yaz(P.x + 24, P.y + 436, '', 28, '#d98a7e');
    // Kalan hak başlık satırının sağında (G23b): sonuç kutusu okumaların altına kendi satırında açılır, hak hep
    // görünür ve tezgâhtaki "SAHA n" sayacıyla aynı sayıyı gösterir (hakGoster).
    this.hakYazi = yaz(P.x + P.w - 24, P.y + 40, SAHA_METIN.hak.replace('{hak}', String(ayar.hak)), 28, PAL.panelYazi, 1);

    // VAZGEÇ (tamamlanınca NOTU AL)
    const kutu = ekle(s.add.rectangle(P.x + P.w / 2, P.y + P.h - 40, P.w - 48, 48, num(PAL.panel)).setStrokeStyle(PX, num(PAL.panelKenar)).setDepth(D.panel));
    const dyazi = yaz(P.x + P.w / 2, P.y + P.h - 40, SAHA_METIN.vazgec, 34, PAL.saat, 0.5).setOrigin(0.5);
    kutu.setInteractive({ useHandCursor: true });
    kutu.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => kutu.setFillStyle(0x3a2f22));
    kutu.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => kutu.setFillStyle(num(PAL.panel)));
    kutu.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => this.esc());
    this.dugme = { kutu, yazi: dyazi };

    // Schmidt çekici (imleç): ucu imlecin ucunda.
    this.cekic = ekle(cekicCiz(s).setDepth(D.cekic).setVisible(false));
    this.hareket = (p) => {
      if (!this.tepiyor) this.cekic.setPosition(snap(p.worldX), snap(p.worldY));
    };
    s.input.on(Phaser.Input.Events.POINTER_MOVE, this.hareket);

    // Açılış: kısa kayma
    for (const o of this.nesneler) {
      const g = o as unknown as Phaser.GameObjects.Components.Alpha;
      if (g.setAlpha && o !== this.cekic) g.setAlpha(0);
    }
    s.tweens.add({ targets: this.nesneler.filter((o) => o !== this.cekic), alpha: 1, duration: 160 });
    sfx.play('kagitKay', { volume: 0.6 });
  }

  /** Esc ya da VAZGEÇ: tamamlanmadıysa vazgeç (hak harcanmaz), tamamlandıysa notu al. */
  esc(): void {
    if (this.kapali) return;
    if (this.bitti) this.notuAl();
    else this.kapat(null);
  }

  /** Space / Enter: tamamlandıysa notu al. */
  onay(): void {
    if (this.bitti) this.notuAl();
  }

  /** Dışarıdan zorla kapat (mesai bitti): sonuç verilmez. */
  kapat(sonuc: SahaSonucu | null): void {
    if (this.kapali) return;
    this.kapali = true;
    this.scene.input.off(Phaser.Input.Events.POINTER_MOVE, this.hareket);
    this.scene.input.setDefaultCursor('default');
    const hepsi = this.nesneler.filter((o) => o.active);
    this.scene.tweens.killTweensOf(hepsi);
    this.scene.tweens.add({ targets: hepsi, alpha: 0, duration: 140, onComplete: () => hepsi.forEach((o) => o.destroy()) });
    this.cekic.setVisible(false);
    hepsi.forEach((o) => (o as Phaser.GameObjects.Rectangle).disableInteractive?.());
    if (!sonuc) sfx.play('back');
    this.emit('kapandi', sonuc);
    this.removeAllListeners();
  }

  get tamamlandi(): boolean {
    return this.bitti;
  }

  private notuAl(): void {
    this.kapat(this.ayar.sonuc);
  }

  private ibreX(r: number): number {
    const t = Phaser.Math.Clamp((r - OLCEK.min) / (OLCEK.max - OLCEK.min), 0, 1);
    return snap(IBRE.x + PX * 2 + t * (IBRE.w - PX * 4));
  }

  /** Yüzeyde (x, y) noktasına vuruş. */
  private vur(x: number, y: number): void {
    if (this.kapali || this.bitti || this.tepiyor) return;
    const ax = Math.floor((x - YUZEY.x) / PX);
    const ay = Math.floor((y - YUZEY.y) / PX);
    if (ax < 0 || ay < 0 || ax >= YW || ay >= YH) return;
    const yuzey = MASKE[this.maske[ay * YW + ax]] ?? 'temiz';
    const { sonuc, tohum, bina } = this.ayar;
    const gecerli = yuzey === 'temiz';
    const r = gecerli ? sonuc.okumalar[this.gecerli] : gecersizOkuma(tohum, bina, this.gecersiz, yuzey);
    // Çekiç geri teper: gövde eksen boyunca geri kayar ve döner.
    this.tepiyor = true;
    this.cekic.setPosition(snap(x), snap(y));
    this.scene.tweens.add({
      targets: this.cekic,
      x: snap(x) + 4 * PX,
      y: snap(y) + 4 * PX,
      duration: 70,
      yoyo: true,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.tepiyor = false;
        const p = this.scene.input.activePointer;
        this.cekic.setPosition(snap(p.worldX), snap(p.worldY));
      },
    });
    sfx.play('sahaVurus');
    this.iz(ax, ay, gecerli);
    this.ibreGoster(r, gecerli);
    if (gecerli) {
      this.kutular[this.gecerli].setText(String(r)).setColor(PAL.kremAcik);
      this.scene.tweens.add({ targets: this.kutular[this.gecerli], scale: { from: 1.4, to: 1 }, duration: 160, ease: 'Back.easeOut' });
      this.gecerli++;
      this.ucanYazi(x, y, `R ${r}`, PAL.panel, PAL.kremAcik);
      if (this.gecerli >= sonuc.okumalar.length) this.scene.time.delayedCall(260, () => this.tamamla());
    } else {
      this.gecersiz++;
      this.gecersizYazi.setText(SAHA_METIN.gecersiz.replace('{n}', String(this.gecersiz)));
      this.ucanYazi(x, y, `R ${r} · ${yuzey === 'siva' ? SAHA_METIN.siva : SAHA_METIN.catlak}`, PAL.damgaBosalt, '#f0e6cc');
      sfx.play('sahaGecersiz');
      // İpucu göz kırpar.
      this.scene.tweens.killTweensOf(this.ipucu);
      this.ipucu.setAlpha(1);
      this.scene.tweens.add({ targets: this.ipucu, alpha: 0.3, duration: 110, yoyo: true, repeat: 2, ease: 'Stepped' });
    }
  }

  /** İbre sürgüsü en alttan R değerine çıkar; büyük okuma yanar. */
  private ibreGoster(r: number, gecerli: boolean): void {
    this.scene.tweens.killTweensOf(this.ibre);
    this.ibre.setX(this.ibreX(OLCEK.min));
    this.ibreYazi.setText('R --');
    this.scene.tweens.add({
      targets: this.ibre,
      x: this.ibreX(r),
      duration: 180,
      delay: 60,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.ibreYazi.setText(`R ${r}`).setColor(gecerli ? PAL.saat : '#d98a7e');
        sfx.play('sahaIbre');
      },
    });
  }

  /** Vuruş izi yüzeye kalıcı çizilir (geçerli: küçük çukur; geçersiz: kırmızı çarpı). */
  private iz(ax: number, ay: number, gecerli: boolean): void {
    const t = this.yuzey;
    if (gecerli) {
      t.daire(ax, ay, 2, BETON.gozenek, true).px(ax, ay, BETON.acik).px(ax - 1, ay - 1, BETON.koyu);
    } else {
      for (let i = -2; i <= 2; i++) t.px(ax + i, ay + i, PAL.damgaBosalt).px(ax + i, ay - i, PAL.damgaBosalt);
    }
    t.yenile();
  }

  private ucanYazi(x: number, y: number, metin: string, zemin: string, renk: string): void {
    const o = this.scene.add
      .text(snap(x), snap(y - 72), metin, { fontFamily: FONT, fontSize: '34px', color: renk, backgroundColor: zemin, padding: { x: 8, y: 2 } })
      .setOrigin(0.5)
      .setDepth(D.ucan);
    // Yüzeyin dışına taşmasın.
    const yx = Phaser.Math.Clamp(o.x, YUZEY.x + o.width / 2 + 8, YUZEY.x + YUZEY.w - o.width / 2 - 8);
    o.setX(snap(yx)).setY(Math.max(YUZEY.y + 24, o.y));
    this.nesneler.push(o);
    this.scene.tweens.add({ targets: o, y: o.y - 32, alpha: 0, delay: 650, duration: 380, onComplete: () => o.destroy() });
  }

  /** Geçerli okumalar tamam: ortalama ve tahmin panelde, düğme NOTU AL olur. */
  private tamamla(): void {
    if (this.kapali || this.bitti) return;
    this.bitti = true;
    this.cekic.setVisible(false);
    const { sonuc } = this.ayar;
    const P = PANEL;
    const ort = sonuc.ortR.toFixed(1).replace('.', ',');
    const metin = `${SAHA_METIN.ortalama}: ${ort}\n${SAHA_METIN.tahmin}: ≈ ${sonuc.mpa} MPa (± ${sonuc.pay})`;
    // Sonuç, okuma kutularıyla düğme arasında kendi satırında (geçersiz sayısının yerinde).
    this.gecersizYazi.setVisible(false);
    this.sonucYazi = this.scene.add
      .text(P.x + 24, P.y + 456, metin, { fontFamily: FONT, fontSize: '30px', color: '#f0e6cc', backgroundColor: '#3a2f22', padding: { x: 8, y: 4 }, lineSpacing: 2 })
      .setOrigin(0, 0.5)
      .setDepth(D.yazi);
    this.nesneler.push(this.sonucYazi);
    this.scene.tweens.add({ targets: this.sonucYazi, scale: { from: 0.6, to: 1 }, duration: 200, ease: 'Back.easeOut' });
    this.dugme.yazi.setText(SAHA_METIN.notuAl);
    this.dugme.kutu.setStrokeStyle(PX, num(PAL.saat));
    sfx.play('dogru');
    this.emit('tamamlandi', sonuc);
  }

  /** Kalan hakkı güncelle (G23b: test tamamlanınca GameScene oturumdaki hakla çağırır; tezgâh sayacıyla aynı). */
  hakGoster(hak: number): void {
    this.hakYazi.setText(SAHA_METIN.hak.replace('{hak}', String(hak))).setColor(hak > 0 ? PAL.panelYazi : PAL.murekkepAcik);
  }

  /** Panel zemini, ibre kutusu. */
  private panelCiz(): void {
    const P = PANEL;
    const t = new Tuval(this.scene, P.w / PX, P.h / PX, 'saha-panel');
    const w = t.w;
    const h = t.h;
    t.rect(0, 0, w, h, PAL.panelKenar).rect(1, 1, w - 2, h - 2, PAL.panel);
    t.rect(1, 1, w - 2, 1, '#26231f');
    // İbre penceresi: koyu çerçeve, açık ölçek, çentikler.
    const ix = (IBRE.x - P.x) / PX;
    const iy = (IBRE.y - P.y) / PX;
    const iw = IBRE.w / PX;
    const ih = IBRE.h / PX;
    t.rect(ix - 1, iy - 1, iw + 2, ih + 2, KONTUR).rect(ix, iy, iw, ih, '#d6d0bd');
    t.rect(ix, iy, iw, 2, '#b9b19a');
    for (let r = OLCEK.min; r <= OLCEK.max; r += 2) {
      const x = (this.ibreX(r) - P.x) / PX;
      const uzun = r % 10 === 0;
      const orta = r % 10 === 5;
      t.rect(x, iy + ih - (uzun ? 6 : orta ? 4 : 2), 1, uzun ? 6 : orta ? 4 : 2, PAL.murekkep);
    }
    // Eşik bölgesi yok (kural klasörde): ölçek tarafsız.
    this.nesneler.push(t.goruntu(P.x, P.y).setOrigin(0).setDepth(D.panel));
  }
}

/**
 * Beton yüzey (kolon yüzü, sanat pikseli): kalıp derzleri ve tij delikleri, gözenek, agrega lekeleri, sıva
 * yamaları ve çatlaklar. Dönüş: maske (0 temiz, 1 sıva, 2 çatlak ve çevresi 4 piksel).
 */
function yuzeyCiz(t: Tuval, rnd: () => number): Uint8Array {
  const W = t.w;
  const H = t.h;
  const maske = new Uint8Array(W * H);
  t.rect(0, 0, W, H, BETON.taban);
  t.benek(0, 0, W, H, BETON.koyu, 0.12, rnd);
  t.benek(0, 0, W, H, BETON.acik, 0.08, rnd);
  t.benek(0, 0, W, H, BETON.gozenek, 0.006, rnd);
  // Kalıp derzleri (yatay) ve tij delikleri
  for (let y = 34; y < H - 4; y += 36) {
    t.rect(0, y, W, 1, BETON.derz);
    t.dither(0, y + 1, W, 1, BETON.acik, y);
    for (let x = 24 + Math.floor(rnd() * 20); x < W - 8; x += 56) t.rect(x, y - 6, 2, 2, BETON.gozenek).px(x, y - 7, BETON.acik);
  }
  // Agrega lekeleri (yalnızca görünüm)
  const agrega = ['#8a8174', '#9a9384', '#7e786e', '#a59d8c'];
  for (let i = 0; i < 90; i++) {
    const x = Math.floor(rnd() * W);
    const y = Math.floor(rnd() * H);
    const c = agrega[Math.floor(rnd() * agrega.length)];
    const r = rnd() < 0.7 ? 1 : 2;
    t.rect(x, y, r + 1, r, c);
    if (r > 1) t.px(x + 1, y + r, c);
  }
  // Sıva yamaları: üst üste binen elipslerden düzensiz lekeler.
  const n = 4 + Math.floor(rnd() * 2);
  for (let k = 0; k < n; k++) {
    const cx = 20 + Math.floor(((k + 0.2 + rnd() * 0.6) / n) * (W - 40));
    const cy = 22 + Math.floor(rnd() * (H - 44));
    const elips = Array.from({ length: 3 + Math.floor(rnd() * 3) }, () => ({
      x: cx + (rnd() - 0.5) * 22,
      y: cy + (rnd() - 0.5) * 14,
      rx: 7 + rnd() * 9,
      ry: 5 + rnd() * 6,
    }));
    for (let y = Math.max(0, cy - 26); y < Math.min(H, cy + 26); y++)
      for (let x = Math.max(0, cx - 36); x < Math.min(W, cx + 36); x++) {
        const f = Math.min(...elips.map((e) => ((x - e.x) / e.rx) ** 2 + ((y - e.y) / e.ry) ** 2));
        if (f < 1 - rnd() * 0.18) maske[y * W + x] = 1;
      }
  }
  // Sıvayı boya: taban, doku, kenar (komşusu sıva olmayan piksel) koyu, üst kenar açık.
  const sivaMi = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < W && y < H && maske[y * W + x] === 1;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!sivaMi(x, y)) continue;
      let c: string = rnd() < 0.1 ? SIVA.koyu : rnd() < 0.08 ? SIVA.acik : SIVA.taban;
      if (!sivaMi(x, y + 1) || !sivaMi(x + 1, y)) c = SIVA.koyu;
      else if (!sivaMi(x, y - 1)) c = SIVA.acik;
      t.px(x, y, c);
    }
  // Çatlaklar: kırık çizgi, koyu iç ve açık kenar; çevresi 4 piksel geçersiz.
  const cn = 2 + Math.floor(rnd() * 2);
  for (let k = 0; k < cn; k++) {
    let x = 20 + rnd() * (W - 40);
    let y = 10 + rnd() * (H - 20);
    let a = rnd() * Math.PI * 2;
    const boy = 50 + Math.floor(rnd() * 60);
    for (let i = 0; i < boy; i++) {
      a += (rnd() - 0.5) * 0.7;
      x += Math.cos(a);
      y += Math.sin(a);
      const px = Math.round(x);
      const py = Math.round(y);
      if (px < 1 || py < 1 || px >= W - 1 || py >= H - 1) break;
      t.px(px + 1, py, CATLAK.kenar).px(px, py, CATLAK.ic);
      if (i % 9 === 4 && rnd() < 0.5) t.px(px, py + 1, CATLAK.ic);
      for (let dy = -4; dy <= 4; dy++)
        for (let dx = -4; dx <= 4; dx++) {
          const qx = px + dx;
          const qy = py + dy;
          if (qx >= 0 && qy >= 0 && qx < W && qy < H && dx * dx + dy * dy <= 16) maske[qy * W + qx] = 2;
        }
    }
  }
  // Kolon kenarları (pah) ve üstten gölge
  t.dither(0, 0, 3, H, '#5e5b56').rect(0, 0, 1, H, '#4a4743');
  t.dither(W - 3, 0, 3, H, '#5e5b56', 1).rect(W - 1, 0, 1, H, '#4a4743');
  t.dither(0, 0, W, 2, '#4a4743');
  return maske;
}

/**
 * Schmidt çekici (kodla piksel çizim): çapraz duran silindir gövde, sol üstte ince darbe pimi (ucu imlecin ucu),
 * gövdede okuma penceresi, arkada koyu kapak.
 */
function cekicCiz(s: Phaser.Scene): Phaser.GameObjects.Image {
  const N = 34;
  const t = new Tuval(s, N, N, 'saha-cekic');
  const dolu: (string | null)[] = new Array(N * N).fill(null);
  const ux = Math.SQRT1_2;
  const uy = Math.SQRT1_2;
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const px = x + 0.5 - 1.5;
      const py = y + 0.5 - 1.5;
      const tt = px * ux + py * uy;
      const d = -px * uy + py * ux;
      let c: string | null = null;
      if (tt >= 0 && tt < 7 && Math.abs(d) <= 1.1) c = tt < 1.5 ? '#3a3a3e' : '#7d8088';
      else if (tt >= 7 && tt < 34 && Math.abs(d) <= 3.6) {
        c = d < -1.6 ? '#e2ded3' : d > 1.9 ? '#8a877f' : '#bdb9ae';
        if (tt >= 7 && tt < 9) c = '#5d6068';
        if (tt >= 15 && tt < 24 && d >= -1 && d <= 1.2) c = tt >= 19 && tt < 20 ? PAL.damgaBosalt : '#2a2a2e';
        if (tt >= 30) c = '#3a3a3e';
      }
      dolu[y * N + x] = c;
    }
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const c = dolu[y * N + x];
      if (c) t.px(x, y, c);
      else if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => dolu[(y + dy) * N + x + dx] && x + dx >= 0 && x + dx < N && y + dy >= 0 && y + dy < N))
        t.px(x, y, KONTUR);
    }
  return t.goruntu(0, 0).setOrigin(1.5 / N, 1.5 / N);
}
