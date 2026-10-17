// @beyan görsel
import * as Phaser from 'phaser';
import { DEV, HEIGHT, SUBTITLE, TEAM, TITLE, VERSION, WIDTH } from '../config';
import { CAM, KONTUR, num, PAL } from '../desk/palette';
import { dizgiTohum, PX, rastgele } from '../desk/pixel';
import { Sokak, type SokakGirdi } from '../desk/Street';
import { CATI_H, CEPHE_W, cepheSecimi, KAT_H } from '../desk/tiles';
import { gunDosyalari, type Damga } from '../game/building';
import { gunAyar, SON_GUN } from '../game/days';
import { EV_KALEMLER, satinAl, yeniEv, zarfToplami, type EvKalem } from '../game/ev';
import { ornekKayitlar } from '../game/ornek';
import { GunOturumu, gunHesabi } from '../game/session';
import { TUNING } from '../game/tuning';
import { popIn } from '../systems/fx';
import { fadeIn, goTo } from '../systems/transition';
import { kenarKarart } from '../ui/backdrop';
import { Button } from '../ui/Button';
import { kagitPanel } from '../ui/kagit';
import { MenuNav } from '../ui/MenuNav';
import { label } from '../ui/text';
import { SCENES } from './keys';
import type { DayEndData } from './DayEndScene';
import type { DepremData } from './QuakeScene';

/**
 * Yalnızca dev: ?dev&deprem[&tohum=N] "Oyna"yı gün 5 sonuna (büyük deprem → gazete → sonuç) bağlar; beş gün
 * örnek kararlarla (doğru ve yanlış karışık) dolu. Test ve sunum provası için.
 */
function devDeprem(): DepremData | null {
  if (!DEV) return null;
  const q = new URLSearchParams(location.search);
  if (!q.has('deprem')) return null;
  const t = Number(q.get('tohum'));
  const tohum = q.has('tohum') && Number.isFinite(t) ? t : Math.floor(Math.random() * 1_000_000_000);
  const kayitlar = ornekKayitlar(tohum, SON_GUN + 1);
  let para = kayitlar.reduce((n, k) => n + gunHesabi(k.kararlar, gunAyar(k.gun).dosyaSayisi).toplam, 0);
  // G42: &ev=canta,sabitleme,guclendirme evin kalemlerini gün 5 sonunda alınmış sayar (para yettiği kadar).
  let ev = yeniEv();
  for (const k of (q.get('ev') ?? '').split(',') as EvKalem[]) {
    const r = EV_KALEMLER.includes(k) ? satinAl(ev, k, para, zarfToplami(kayitlar), SON_GUN) : null;
    if (r) ({ ev, para } = r);
  }
  return { tohum, para, kayitlar, ev };
}

/**
 * Yalnızca dev: ?dev&kisayol[&tohum=N] "Oyna"yı doğrudan gün 1 sonu raporuna bağlar (örnek 3 kararla, küçük
 * deprem sonucu dahil); oradan kısa yol (G21, soru biçimli düğme) ya da "Sonraki gün" denenir.
 */
function devKisaYol(): DayEndData | null {
  if (!DEV) return null;
  const q = new URLSearchParams(location.search);
  if (!q.has('kisayol')) return null;
  const t = Number(q.get('tohum'));
  const tohum = q.has('tohum') && Number.isFinite(t) ? t : Math.floor(Math.random() * 1_000_000_000);
  const [gun1] = ornekKayitlar(tohum, 2);
  return {
    gun: 1,
    tohum,
    paraOnce: TUNING.para.baslangic,
    kararlar: gun1.kararlar,
    dosyalar: new GunOturumu(1, tohum).dosyalar.map((b) => ({ id: b.id, adres: b.adres })),
    kayitlar: [],
    oncu: gun1.oncu,
  };
}

/** Menünün arkasındaki sokak (G11): akşamüstü, ekranı kaplar; kaldırım alttaki yazıların biraz üstünde. */
const SOKAK = { alan: { x: 0, y: -36, w: WIDTH, h: HEIGHT }, olcek: 3, derinlik: -30, binaSayisi: 8 };
/**
 * Sokak yavaşça kayar: iki uçtaki odak parsel aralığı ve bir geçişin süresi (ms). G25: kayma yarım parsel (2. parselin
 * ortası ↔ 2-3 arası); böylece ruhsat kâğıdının iki yanındaki 0. ve 4. parsel kayma boyunca görünür kalır.
 */
const KAYMA: { uclar: readonly [number, number][]; sure: number } = { uclar: [[2, 2], [2, 3]], sure: 20000 };
/** Pencere ışıkları: başta yanan oran, bir ışığın yanıp sönme aralığı (ms) ve yanan oranın sınırları. */
const ISIK = { bas: 0.2, aralik: 900, enAz: 0.12, enCok: 0.32, alfa: 0.85 };
/** Ruhsat kâğıdı: genişlik, üst kenar, başlık şeridi; "Oyna" y≈528 (smoke senaryoları 960,530'a tıklıyor). */
const KAGIT = { w: 720, ust: 192, serit: 152, dugmeY: 528, dugmeAra: 96, dugmeH: 80, alt: 56 };

/**
 * Menü sokağındaki binalar: oyunun bina üreticisinden; çoğu GÜVENLİ, biri iskeleli (GÜÇLENDİR), biri şeritli
 * (BOŞALT): oyunun dili ilk ekranda görünsün. G25: ikisi kâğıdın iki yanında (0. parsel solda, 4. parsel sağda),
 * kâğıdın arkasında kalmaz.
 */
function menuSokagi(tohum: number): SokakGirdi[] {
  const damgalar: Damga[] = ['guclendir', 'guvenli', 'guvenli', 'guvenli', 'bosalt', 'guvenli', 'guvenli', 'guvenli'];
  return gunDosyalari(tohum, 3, SOKAK.binaSayisi).map((bina, i) => ({ bina, damga: damgalar[i % damgalar.length], gun: 1 }));
}

export class MenuScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Menu);
  }

  create(): void {
    fadeIn(this);
    this.cameras.main.setRoundPixels(true).setBackgroundColor(PAL.panel);
    this.sokakKur();
    kenarKarart(this, -20, 1.4);

    // Ruhsat kâğıdı: başlık şeridinde oyun adı (yer tutucu, config TITLE), altında düğmeler, sağ altta mühür.
    const n = DEV ? 4 : 3;
    const sonDugme = KAGIT.dugmeY + (n - 1) * KAGIT.dugmeAra;
    const kagitH = sonDugme + KAGIT.dugmeH / 2 + KAGIT.alt - KAGIT.ust;
    const muhur: [number, number] = [KAGIT.w / PX - 16, Math.round(kagitH / PX) - 18];
    kagitPanel(this, WIDTH / 2, KAGIT.ust + kagitH / 2, KAGIT.w, kagitH, { serit: KAGIT.serit, ruhsat: true, muhur, tohum: 17 });
    const title = label(this, WIDTH / 2, KAGIT.ust + 12 + KAGIT.serit / 2, TITLE, {
      size: 112,
      weight: 'bold',
      baslik: true,
      color: num(PAL.kremAcik),
    });
    // Uzun ad da şeride sığsın.
    const sigan = KAGIT.w - 96;
    if (title.width > sigan) title.setScale(sigan / title.width);
    popIn(this, title);
    label(this, WIDTH / 2, KAGIT.ust + KAGIT.serit + 60, SUBTITLE, { size: 36, color: num(PAL.murekkepSoluk) });
    this.add.rectangle(WIDTH / 2, KAGIT.ust + KAGIT.serit + 96, 560, PX, num(PAL.kremKoyu));

    const items: [string, () => void][] = [
      [
        'Oyna',
        () => {
          const deprem = devDeprem();
          const kisa = devKisaYol();
          if (deprem) goTo(this, SCENES.Quake, deprem);
          else if (kisa) goTo(this, SCENES.DayEnd, kisa);
          else goTo(this, SCENES.Game);
        },
      ],
      ['Ayarlar', () => goTo(this, SCENES.Settings, { from: SCENES.Menu })],
      ['Emeği Geçenler', () => goTo(this, SCENES.Credits)],
    ];
    if (DEV) items.push(['Oyun Alanı (dev)', () => goTo(this, SCENES.Playground)]);

    const buttons = items.map(
      ([text, action], i) =>
        new Button(this, WIDTH / 2, KAGIT.dugmeY + i * KAGIT.dugmeAra, text, action, { height: KAGIT.dugmeH, fontSize: 48 }),
    );
    buttons.forEach((button, i) => popIn(this, button, 80 + i * 50));
    // İlk Enter doğrudan "Oyna" (G23: menü ilk girdiye tepki versin).
    new MenuNav(this, buttons, { varsayilan: 0 });
    this.erkenTikla(buttons, 80 + (buttons.length - 1) * 50 + 320);

    // Altta, asfaltın üstünde.
    label(this, 48, HEIGHT - 30, TEAM, { size: 32, color: num(PAL.panelYazi), align: 'left' });
    label(this, WIDTH - 48, HEIGHT - 30, `sürüm ${VERSION}`, { size: 28, color: num(PAL.panelYazi), align: 'right' });

    // Menü müziği jam sırasında eklenecek: music.play(SONGS.menu)
  }

  /**
   * Düğmeler büyüyerek belirirken (popIn) tıklanamıyordu: menü görünür ama ilk tık kayboluyordu (G41). Hazır olana kadar
   * düğmelerin kendi tıklaması kapalı; o sırada bir düğmenin (son boyundaki) alanına gelen tık saklanır ve menü hazır
   * olunca o düğmeye bir kez basılır. Enter zaten MenuNav'la hemen çalışır; geçiş başlamışsa (goTo) ikinci basış etkisiz.
   */
  private erkenTikla(buttons: Button[], hazirMs: number): void {
    let hazir = false;
    let bekleyen: Button | undefined;
    for (const b of buttons) b.disableInteractive();
    const tik = (p: Phaser.Input.Pointer): void => {
      if (hazir || bekleyen) return;
      bekleyen = buttons.find((b) => Math.abs(p.worldX - b.x) <= b.width / 2 && Math.abs(p.worldY - b.y) <= b.height / 2);
    };
    this.input.on(Phaser.Input.Events.POINTER_DOWN, tik);
    this.time.delayedCall(hazirMs, () => {
      hazir = true;
      this.input.off(Phaser.Input.Events.POINTER_DOWN, tik);
      for (const b of buttons) b.setInteractive({ useHandCursor: true });
      if (bekleyen && this.input.enabled) bekleyen.press();
    });
  }

  /**
   * Arka plan (G11): pencereden görünen akşamüstü sokağı, ekranı kaplar. Hafif hareket: sokak yavaşça bir yana
   * kayar, pencerelerde ışıklar tek tük yanıp söner, sokak lambalarından biri arada bir titrer.
   */
  private sokakKur(): void {
    // Yalnızca dev: ?dev&menutohum=N menü binalarını sabitler (video çekimi için).
    const q = DEV ? new URLSearchParams(location.search) : undefined;
    const mt = Number(q?.get('menutohum'));
    const tohum = q?.has('menutohum') && Number.isFinite(mt) ? mt : Math.floor(Math.random() * 1_000_000_000);
    const girdiler = menuSokagi(tohum);
    const sokak = new Sokak(this, SOKAK.alan, 1, girdiler, SOKAK.derinlik, { olcek: SOKAK.olcek });
    const [i0, i1] = KAYMA.uclar[0];
    sokak.odakla(i0, i1, 0, undefined, 0.5, 1, 1);
    const kay = (uc: number): void => {
      const [a, b] = KAYMA.uclar[uc];
      sokak.odakla(a, b, KAYMA.sure, () => kay(1 - uc), 0.5, 1, 1);
    };
    kay(1);

    // Pencere ışıkları: her binanın pencere yerlerine (cephe deseninden) birer ışık; sokakla birlikte kayar.
    const O = sokak.olcek;
    const isiklar: Phaser.GameObjects.Container[] = [];
    girdiler.forEach(({ bina }, yer) => {
      const secim = cepheSecimi(rastgele(dizgiTohum(bina.id)));
      const ust = Math.max(0, bina.belgeler.foto.gorunenKat - 1);
      const kap = this.add.container(0, 0);
      for (let k = 0; k < ust; k++)
        for (let i = 1; i <= 5; i++) {
          if (!((secim.desen >> (i - 1)) & 1)) continue;
          const isik = this.add.container((i * 16 + 5 - CEPHE_W / 2) * O, (CATI_H + k * KAT_H + 5) * O, [
            this.add.rectangle(0, 0, 6 * O, 6 * O, num(CAM.yanik)).setOrigin(0),
            this.add.rectangle(2 * O, 0, 2 * O, 6 * O, num(KONTUR)).setOrigin(0),
          ]);
          isik.setAlpha(Math.random() < ISIK.bas ? ISIK.alfa : 0);
          kap.add(isik);
          isiklar.push(isik);
        }
      sokak.ustuneEkle(yer, kap);
    });
    if (isiklar.length > 0)
      this.time.addEvent({
        delay: ISIK.aralik,
        loop: true,
        callback: () => {
          const oran = isiklar.filter((l) => l.alpha > 0).length / isiklar.length;
          const sondur = oran > ISIK.enCok || (oran > ISIK.enAz && Math.random() < 0.5);
          const adaylar = isiklar.filter((l) => (sondur ? l.alpha > 0 : l.alpha === 0) && !this.tweens.isTweening(l));
          const l = adaylar[Math.floor(Math.random() * adaylar.length)];
          if (l) this.tweens.add({ targets: l, alpha: sondur ? 0 : ISIK.alfa, duration: 240, ease: 'Stepped', easeParams: [3] });
        },
      });

    // Arızalı sokak lambası: birkaç saniyede bir kısa titreme.
    const titret = (): void => {
      const i = 2 + Math.floor(Math.random() * Math.max(1, sokak.lambaSayisi - 3));
      let adim = 0;
      this.time.addEvent({
        delay: 70,
        repeat: 7,
        callback: () => {
          adim++;
          sokak.lambaParlakligi(i, adim >= 8 ? 1 : Math.random() < 0.5 ? 0.15 : 1);
        },
      });
      this.time.delayedCall(2500 + Math.random() * 3500, titret);
    };
    this.time.delayedCall(1800, titret);
  }
}
