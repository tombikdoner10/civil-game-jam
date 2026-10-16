// @beyan görsel
import * as Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { FONT } from '../config';
import type { Kusur, KusurId } from '../game/building';
import type { SecimRef } from '../game/rules';
import type { IncelemeSonucu } from '../game/session';
import { punch } from '../systems/fx';
import { MASA } from './DocumentCard';
import { num, PAL } from './palette';
import { PX, snap, Tuval } from './pixel';
import { BANT_H, MASA_Y } from './Window';

/** İnceleme modunda seçilebilen bir öğe: belge alanı ya da kural satırı ve onu gösteren nesne. */
export interface SecimNesne extends SecimRef {
  nesne: Phaser.GameObjects.GameObject;
}

/** Tıklanabilir bir yüzey (belge kartı ya da açık kural kitabı). Üst üste binenlerde derinliği büyük olan. */
export interface Yuzey {
  derinlik: number;
  sinir: Phaser.Geom.Rectangle;
  alanlar: readonly SecimNesne[];
}

export interface InspectAyar {
  /** Şu an masadaki yüzeyler. */
  yuzeyler: () => Yuzey[];
  /** İki öğe seçilince: kusur kanıtı mı? (Oturum kaydeder.) */
  kontrol: (secim: SecimRef[]) => IncelemeSonucu | null;
  /** İnceleme modu şu an açılabilir mi (dosya geliyor ya da gidiyorsa hayır). */
  izin: () => boolean;
  /** Bu kusur gişedeki kişiye sorulabilir mi (G17): etikette SOR düğmesi çıkar, tıklanınca 'sor' olayı. */
  sorulabilir?: (id: KusurId) => boolean;
  /**
   * Bulunan kusur geçersiz bir belgeyse ve düzgünü istenebiliyorsa true (G17b): etikette İSTE düğmesi çıkar,
   * tıklanınca 'iste' olayı (kusur kimliği).
   */
  istenebilir?: (id: KusurId) => boolean;
}

interface Bulunan {
  kusur: Kusur;
  ogeler: SecimNesne[];
  etiket: Phaser.GameObjects.Container;
  /** Etiketin boyu (yer seçimi için). */
  w: number;
  h: number;
  /** Son seçilen aday (yer değişmezse etiket zıplamasın). */
  aday: number;
}

const D = { ortuMasa: 7, ortuBant: 3010, dugme: 3020, serit: 8000, cizim: 9000, etiket: 9001 };
const SARI = num(PAL.saat);
const KIRMIZI = num(PAL.damgaBosalt);
const KOYU = 0x1d191b;
/** Düğmenin yeri (tezgâh, panellerin sağı). */
export const DUGME = { x: 704, y: BANT_H + 24, w: 176, h: 40 };

function sinir(n: Phaser.GameObjects.GameObject): Phaser.Geom.Rectangle {
  return (n as unknown as Phaser.GameObjects.Components.GetBounds).getBounds();
}

function gorunur(n: Phaser.GameObjects.GameObject): boolean {
  if (!n.active) return false;
  if ((n as unknown as Phaser.GameObjects.Components.Visible).visible === false) return false;
  for (let p = n.parentContainer; p; p = p.parentContainer) if (!p.visible || !p.active) return false;
  return true;
}

const ayni = (a: SecimRef, b: SecimRef): boolean => a.belge === b.belge && a.alan === b.alan;

/** Öğenin ortası, kendi yüzeyinden daha üstteki bir yüzeyin (belge, not, açık kitap) altında mı? */
function ortulu(o: SecimNesne, yuzeyler: readonly Yuzey[]): boolean {
  const kendi = yuzeyler.find((y) => y.alanlar.some((a) => a.nesne === o.nesne));
  if (!kendi) return false;
  const r = sinir(o.nesne);
  return yuzeyler.some((y) => y !== kendi && y.derinlik > kendi.derinlik && y.sinir.contains(r.centerX, r.centerY));
}

/**
 * İnceleme modu (Papers, Please gibi): Space ya da İNCELE düğmesiyle açılır. Açıkken masa soluklaşır,
 * üstte İNCELEME şeridi çıkar; üzerine gelinen alan çerçevelenir. İki öğe seçilince aralarına kesikli
 * çizgi çekilir ve kontrol edilir: kusur kanıtıysa kırmızı çizgi ve kusur etiketi (dosya bitene kadar
 * kalır), değilse "Tutarsızlık yok". Belgeleri kilitlemek ve damga çubuğunu kapatmak GameScene'in işi
 * ('ac' / 'kapa' olayları).
 */
export class Inspect extends Phaser.Events.EventEmitter {
  acik = false;
  private secili: SecimNesne[] = [];
  private bulunanlar: Bulunan[] = [];
  /** "Tutarsızlık yok" gösterilirken kısa bekleme: tıklama alınmaz. */
  private beklemede = false;
  private readonly g: Phaser.GameObjects.Graphics;
  private readonly ortular: Phaser.GameObjects.Rectangle[];
  private readonly serit: Phaser.GameObjects.Container;
  private readonly dugmeIsik: Phaser.GameObjects.Image;
  private readonly dugmeYazi: Phaser.GameObjects.Text;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly ayar: InspectAyar,
  ) {
    super();
    this.g = scene.add.graphics().setDepth(D.cizim);
    this.ortular = [
      scene.add.rectangle(0, MASA_Y, 1920, 1080 - MASA_Y, 0x0f1a22, 0.42).setOrigin(0).setDepth(D.ortuMasa),
      scene.add.rectangle(0, 0, 1920, MASA_Y, 0x0f1a22, 0.5).setOrigin(0).setDepth(D.ortuBant),
    ];
    this.ortular.forEach((o) => o.setVisible(false));
    this.serit = this.seritKur();

    // İNCELE düğmesi (tezgâhta)
    const dg = new Tuval(scene, DUGME.w / PX, DUGME.h / PX, 'incele-dugme');
    const w = DUGME.w / PX;
    const h = DUGME.h / PX;
    dg.rect(0, 0, w, h, PAL.panelKenar).rect(1, 1, w - 2, h - 2, PAL.panel);
    dg.rect(2, 2, 3, 3, PAL.damgaGuclendir);
    const isik = new Tuval(scene, w, h, 'incele-isik');
    isik.rect(0, 0, w, h, PAL.cerceveKoyu).rect(1, 1, w - 2, h - 2, PAL.damgaGuclendir).rect(1, 1, w - 2, 1, '#d0ad52');
    const dugme = dg.goruntu(DUGME.x, DUGME.y).setDepth(D.dugme);
    this.dugmeIsik = isik.goruntu(DUGME.x, DUGME.y).setDepth(D.dugme).setVisible(false);
    this.dugmeYazi = scene.add
      .text(DUGME.x + 8, DUGME.y, 'İNCELE', { fontFamily: FONT, fontSize: '36px', color: PAL.saat })
      .setOrigin(0.5)
      .setDepth(D.dugme + 1);
    dugme.setInteractive({ useHandCursor: true }).setData('incelemeYok', true);
    dugme.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => this.degistir());

    const tikla = (p: Phaser.Input.Pointer, ustunde: Phaser.GameObjects.GameObject[]): void => this.tikla(p, ustunde);
    const ciz = (): void => this.ciz();
    scene.input.on(Phaser.Input.Events.POINTER_DOWN, tikla);
    scene.events.on(Phaser.Scenes.Events.POST_UPDATE, ciz);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.input.off(Phaser.Input.Events.POINTER_DOWN, tikla);
      scene.events.off(Phaser.Scenes.Events.POST_UPDATE, ciz);
      scene.input.setDefaultCursor('default');
      this.removeAllListeners();
    });
  }

  degistir(): void {
    if (this.acik) this.kapa();
    else this.ac();
  }

  ac(): void {
    if (this.acik || !this.ayar.izin()) return;
    this.acik = true;
    this.secili = [];
    this.beklemede = false;
    sfx.play('inceleAc');
    this.ortular.forEach((o) => o.setVisible(true));
    this.serit.setVisible(true);
    this.dugmeIsik.setVisible(true);
    this.dugmeYazi.setColor(PAL.panel);
    this.scene.input.setDefaultCursor('crosshair');
    this.emit('ac');
  }

  kapa(): void {
    if (!this.acik) return;
    this.acik = false;
    this.secili = [];
    this.beklemede = false;
    sfx.play('inceleKapa');
    this.ortular.forEach((o) => o.setVisible(false));
    this.serit.setVisible(false);
    this.dugmeIsik.setVisible(false);
    this.dugmeYazi.setColor(PAL.saat);
    this.scene.input.setDefaultCursor('default');
    this.emit('kapa');
  }

  /** Dosya masadan kalktı: bulunan kusur işaretleri ve seçim silinir. */
  dosyaBitti(): void {
    this.secili = [];
    for (const b of this.bulunanlar) b.etiket.destroy();
    this.bulunanlar = [];
  }

  /** Noktadaki seçilebilir öğe: en üstteki yüzeyin alanlarından, üst üste binenlerde en küçüğü. */
  private bul(x: number, y: number): SecimNesne | null {
    let ust: Yuzey | null = null;
    for (const yz of this.ayar.yuzeyler()) if (yz.sinir.contains(x, y) && (!ust || yz.derinlik > ust.derinlik)) ust = yz;
    if (!ust) return null;
    let en: SecimNesne | null = null;
    let enAlan = Infinity;
    for (const a of ust.alanlar) {
      if (!gorunur(a.nesne)) continue;
      const r = sinir(a.nesne);
      Phaser.Geom.Rectangle.Inflate(r, PX, PX);
      if (!r.contains(x, y)) continue;
      const alan = r.width * r.height;
      if (alan < enAlan) {
        en = a;
        enAlan = alan;
      }
    }
    return en;
  }

  private dunya(p: Phaser.Input.Pointer): Phaser.Math.Vector2 {
    return this.scene.cameras.main.getWorldPoint(p.x, p.y);
  }

  private tikla(p: Phaser.Input.Pointer, ustunde: Phaser.GameObjects.GameObject[]): void {
    if (!this.acik || this.beklemede || p.button !== 0) return;
    // Düğme, kitabı açma ve X: kendi işleyicileri var.
    if (ustunde.some((o) => o.getData('incelemeYok'))) return;
    const w = this.dunya(p);
    const h = this.bul(w.x, w.y);
    if (!h) {
      // Boşluğa tıklamak seçimi sıfırlar.
      if (this.secili.length > 0) sfx.play('secBirak');
      this.secili = [];
      return;
    }
    const i = this.secili.findIndex((s) => ayni(s, h));
    if (i >= 0) {
      this.secili.splice(i, 1);
      sfx.play('secBirak');
      return;
    }
    this.secili.push(h);
    sfx.play('sec');
    if (this.secili.length === 2) this.degerlendir();
  }

  private degerlendir(): void {
    const ogeler = this.secili.slice();
    const sonuc = this.ayar.kontrol(ogeler.map(({ belge, alan }) => ({ belge, alan })));
    if (sonuc) {
      this.secili = [];
      const eski = this.bulunanlar.find((b) => b.kusur.id === sonuc.kusur.id);
      if (eski) {
        eski.ogeler = ogeler;
        this.scene.tweens.add({ targets: eski.etiket, scale: 1.15, duration: 90, yoyo: true });
      } else {
        const id = sonuc.kusur.id;
        const dugmeler: ('sor' | 'iste')[] = [];
        if (this.ayar.sorulabilir?.(id)) dugmeler.push('sor');
        if (this.ayar.istenebilir?.(id)) dugmeler.push('iste');
        const etiket = this.etiketKur(sonuc.kusur.etiket, id, dugmeler);
        const r = etiket.getBounds();
        this.bulunanlar.push({ kusur: sonuc.kusur, ogeler, etiket, w: snap(r.width), h: snap(r.height), aday: -1 });
        etiket.setScale(0.4);
        this.scene.tweens.add({ targets: etiket, scale: 1, duration: 200, ease: 'Back.easeOut' });
      }
      sfx.play('kusur');
      punch(this.scene, 0.006, 120);
      this.emit('bulundu', sonuc);
      return;
    }
    // Tutarsızlık yok: kısa yazı, seçim temizlenir.
    this.beklemede = true;
    const [a, b] = ogeler.map((o) => sinir(o.nesne));
    const mx = snap((a.centerX + b.centerX) / 2);
    const my = snap((a.centerY + b.centerY) / 2);
    const yazi = this.scene.add
      .text(mx, my, 'Tutarsızlık yok', {
        fontFamily: FONT,
        fontSize: '40px',
        color: PAL.kremAcik,
        backgroundColor: PAL.panel,
        padding: { x: 12, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(D.etiket);
    this.scene.tweens.add({ targets: yazi, alpha: 0, y: my - 24, delay: 700, duration: 300, onComplete: () => yazi.destroy() });
    sfx.play('tutarsizlikYok');
    this.scene.time.delayedCall(450, () => {
      this.secili = [];
      this.beklemede = false;
    });
  }

  /**
   * Kusur etiketi: kırmızı kâğıt şerit, koyu kenar. Sağında düğmeler: SOR (G17) ve geçersiz belgede İSTE (G17b).
   * Tıklanınca 'sor' ya da 'iste' olayı (kusur kimliği) yayılır ve düğme sönükleşir (bir kez).
   */
  private etiketKur(metin: string, id: KusurId, dugmeler: readonly ('sor' | 'iste')[] = []): Phaser.GameObjects.Container {
    const s = this.scene;
    const yazi = s.add
      .text(0, 0, metin.toLocaleUpperCase('tr-TR'), { fontFamily: FONT, fontSize: '40px', color: '#f0e6cc' })
      .setOrigin(0.5);
    const dw = 88;
    const bosluk = 8;
    const dugmeW = dugmeler.length * (dw + bosluk);
    const w = snap(yazi.width + 32 + dugmeW);
    const h = 48;
    const kap = s.add.container(0, 0).setDepth(D.etiket);
    kap.add(s.add.rectangle(4, 4, w, h, 0x000000, 0.45));
    kap.add(s.add.rectangle(0, 0, w + 8, h + 8, KOYU));
    kap.add(s.add.rectangle(0, 0, w, h, KIRMIZI));
    kap.add(yazi);
    yazi.setX(snap(-dugmeW / 2));
    dugmeler.forEach((tur, i) => {
      const dx = snap(w / 2 - 4 - dw / 2 - (dugmeler.length - 1 - i) * (dw + bosluk));
      const kutu = s.add.rectangle(dx, 0, dw, h - 12, KOYU);
      const dyazi = s.add.text(dx, 0, tur === 'sor' ? 'SOR' : 'İSTE', { fontFamily: FONT, fontSize: '34px', color: PAL.saat }).setOrigin(0.5);
      kutu.setInteractive({ useHandCursor: true }).setData('incelemeYok', true);
      kutu.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => kutu.setFillStyle(0x3a2f22));
      kutu.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => kutu.setFillStyle(KOYU));
      kutu.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (_p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
        e.stopPropagation();
        kutu.disableInteractive();
        kutu.setFillStyle(KOYU);
        dyazi.setColor(PAL.murekkepAcik);
        sfx.play('sec');
        this.emit(tur, id);
      });
      kap.add([kutu, dyazi]);
    });
    return kap;
  }

  private seritKur(): Phaser.GameObjects.Container {
    const s = this.scene;
    const kap = s.add.container(0, 0).setDepth(D.serit).setVisible(false);
    kap.add(s.add.rectangle(0, 0, 1920, 52, KOYU).setOrigin(0));
    kap.add(s.add.rectangle(0, 0, 1920, 44, num(PAL.damgaGuclendir)).setOrigin(0));
    for (let x = 0; x < 1920; x += 16) kap.add(s.add.rectangle(x, 44, 8, 4, num(PAL.damgaGuclendir)).setOrigin(0));
    kap.add(s.add.text(960, 20, 'İNCELEME', { fontFamily: FONT, fontSize: '50px', color: PAL.panel }).setOrigin(0.5));
    kap.add(s.add.text(32, 22, 'İki alana tıkla', { fontFamily: FONT, fontSize: '32px', color: PAL.panel }).setOrigin(0, 0.5));
    kap.add(s.add.text(1888, 22, 'Space / Esc: çık', { fontFamily: FONT, fontSize: '32px', color: PAL.panel }).setOrigin(1, 0.5));
    return kap;
  }

  // ---- Çizim (her kare) ----

  private ciz(): void {
    const g = this.g;
    g.clear();
    // Bulunan kusurlar: kırmızı çerçeve, kırmızı kesikli çizgi; etiket alanın kenarında, değerleri örtmeyen yerde.
    // Üstüne başka belge ya da açık kitap çekilmiş alanın işareti çizilmez (etiket kitabın üstünde kalmasın).
    const yuzeyler = this.bulunanlar.length > 0 ? this.ayar.yuzeyler() : [];
    const engeller = this.bulunanlar.length > 0 ? this.alanSinirlari(yuzeyler) : [];
    const etiketler: Phaser.Geom.Rectangle[] = [];
    for (const b of this.bulunanlar) {
      // Kanıt belgesi masadan kalktıysa (ör. gişeden düzgünü gelip yerine geçti, G17b) işaret de kalkar.
      if (b.ogeler.some((o) => o.belge !== 'kural' && !o.nesne.active)) {
        b.etiket.setVisible(false);
        continue;
      }
      const gor = b.ogeler.filter((o) => gorunur(o.nesne) && !ortulu(o, yuzeyler)).map((o) => sinir(o.nesne));
      gor.forEach((r) => this.cerceve(r, KIRMIZI));
      if (gor.length === 2) this.kesikli(gor[0], gor[1], KIRMIZI);
      b.etiket.setVisible(gor.length > 0);
      if (gor.length > 0) {
        const r = this.etiketYeri(b, gor, engeller.concat(etiketler));
        b.etiket.setPosition(r.centerX, r.centerY);
        etiketler.push(r);
      }
    }
    // Seçim: sarı çerçeve, iki seçimde sarı kesikli çizgi.
    const sec = this.secili.filter((o) => gorunur(o.nesne));
    if (sec.length !== this.secili.length) this.secili = sec;
    const sr = sec.map((o) => sinir(o.nesne));
    sr.forEach((r) => this.cerceve(r, SARI));
    if (sr.length === 2) this.kesikli(sr[0], sr[1], SARI);
    // Üzerine gelinen alan: ince açık çerçeve.
    if (this.acik && !this.beklemede) {
      const w = this.dunya(this.scene.input.activePointer);
      const h = this.bul(w.x, w.y);
      if (h && !sec.some((s) => ayni(s, h))) this.cerceve(sinir(h.nesne), 0xe3d8b8, true);
    }
  }

  /** Masadaki bütün görünen alanların (belge değerleri, kural satırları) sınırları. */
  private alanSinirlari(yuzeyler: Yuzey[]): Phaser.Geom.Rectangle[] {
    const out: Phaser.Geom.Rectangle[] = [];
    for (const yz of yuzeyler) for (const a of yz.alanlar) if (gorunur(a.nesne)) out.push(sinir(a.nesne));
    return out;
  }

  /**
   * Etiketin yeri: kanıt alanlarının üstü, altı, sağı, solu ve en son ikisinin ortası adaylar; alanlarla
   * (belge değerleri) en az örtüşen seçilir. Masa dışına taşan aday masaya çekilir. Eşitlikte önceki aday
   * korunur (etiket zıplamasın), yoksa sıradaki ilk.
   */
  private etiketYeri(b: Bulunan, gor: Phaser.Geom.Rectangle[], engeller: Phaser.Geom.Rectangle[]): Phaser.Geom.Rectangle {
    const { w, h } = b;
    const bosluk = 16;
    const adaylar: [number, number][] = [];
    for (const r of gor) {
      adaylar.push([r.centerX, r.top - bosluk - h / 2]);
      adaylar.push([r.centerX, r.bottom + bosluk + h / 2]);
      adaylar.push([r.right + bosluk + w / 2, r.centerY]);
      adaylar.push([r.left - bosluk - w / 2, r.centerY]);
    }
    if (gor.length === 2) adaylar.push([(gor[0].centerX + gor[1].centerX) / 2, (gor[0].centerY + gor[1].centerY) / 2]);
    const kesisim = (a: Phaser.Geom.Rectangle, c: Phaser.Geom.Rectangle): number => {
      const x = Math.min(a.right, c.right) - Math.max(a.left, c.left);
      const y = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top);
      return x > 0 && y > 0 ? x * y : 0;
    };
    let en = -1;
    let enPuan = Infinity;
    let enR = new Phaser.Geom.Rectangle();
    adaylar.forEach(([cx, cy], i) => {
      // Masa sınırı içinde: damga çubuğu açıkken onun sol kenarına kadar.
      const x = snap(Phaser.Math.Clamp(cx, MASA.x + w / 2 + 8, Math.max(MASA.x + w / 2 + 8, MASA.x + MASA.w - w / 2 - 8)));
      const y = snap(Phaser.Math.Clamp(cy, MASA_Y + h / 2 + 8, 1080 - h / 2 - 8));
      const r = new Phaser.Geom.Rectangle(x - w / 2, y - h / 2, w, h);
      let puan = 0;
      for (const e of engeller) puan += kesisim(r, e);
      // Kanıt alanından uzaklaşan (masaya çekilen) adaylar biraz geride kalsın.
      puan += (Math.abs(x - cx) + Math.abs(y - cy)) * 2;
      const daha = puan < enPuan || (puan === enPuan && i === b.aday);
      if (daha) {
        en = i;
        enPuan = puan;
        enR = r;
      }
    });
    b.aday = en;
    return enR;
  }

  /** Piksel ızgarasına oturan çerçeve (koyu dış kenar + renk). */
  private cerceve(r: Phaser.Geom.Rectangle, renk: number, ince = false): void {
    const x = snap(r.x) - 8;
    const y = snap(r.y) - 8;
    const w = snap(r.width) + 16;
    const h = snap(r.height) + 16;
    const g = this.g;
    if (!ince) {
      g.lineStyle(PX, KOYU, 0.9).strokeRect(x - PX / 2, y - PX / 2, w + PX, h + PX);
      g.lineStyle(PX, renk, 1).strokeRect(x + PX / 2, y + PX / 2, w - PX, h - PX);
    } else {
      // Köşe işaretleri (hover)
      const k = 16;
      g.fillStyle(renk, 1);
      for (const [cx, cy, sx, sy] of [
        [x, y, 1, 1],
        [x + w, y, -1, 1],
        [x, y + h, 1, -1],
        [x + w, y + h, -1, -1],
      ]) {
        g.fillRect(sx > 0 ? cx : cx - k, sy > 0 ? cy : cy - PX, k, PX);
        g.fillRect(sx > 0 ? cx : cx - PX, sy > 0 ? cy : cy - k, PX, k);
      }
    }
  }

  /**
   * İki dikdörtgenin ortaları arasında kesikli çizgi (4 px kareler, koyu gölgeli). Çerçevelerin içinde
   * kalan kısım çizilmez: alandaki yazı okunur kalsın.
   */
  private kesikli(a: Phaser.Geom.Rectangle, b: Phaser.Geom.Rectangle, renk: number): void {
    const disA = Phaser.Geom.Rectangle.Inflate(Phaser.Geom.Rectangle.Clone(a), 12, 12);
    const disB = Phaser.Geom.Rectangle.Inflate(Phaser.Geom.Rectangle.Clone(b), 12, 12);
    const x0 = a.centerX;
    const y0 = a.centerY;
    const x1 = b.centerX;
    const y1 = b.centerY;
    const boy = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.floor(boy / 16);
    const g = this.g;
    for (const [renk2, ofs] of [
      [KOYU, PX],
      [renk, 0],
    ]) {
      g.fillStyle(renk2, 1);
      for (let i = 0; i <= n; i++) {
        const t = n === 0 ? 0 : i / n;
        const px = x0 + (x1 - x0) * t;
        const py = y0 + (y1 - y0) * t;
        if (disA.contains(px, py) || disB.contains(px, py)) continue;
        const x = snap(px) + ofs;
        const y = snap(py) + ofs;
        g.fillRect(x - PX, y - PX, PX * 2, PX * 2);
      }
    }
  }
}
