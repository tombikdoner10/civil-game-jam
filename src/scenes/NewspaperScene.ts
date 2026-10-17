// @beyan görsel
import * as Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { FONT } from '../config';
import { PAL } from '../desk/palette';
import { PX, rastgele, snap, Tuval } from '../desk/pixel';
import { hazirGostergesi, masaCiz, pikselDugme } from '../desk/props';
import { Sokak, type SokakGirdi } from '../desk/Street';
import { SON_GUN } from '../game/days';
import { DOLGU_BASLIKLAR, FOTO_ALTI, GAZETE_ADI, GAZETE_TARIH, kisaSayiBloklari, manset, oneCikanlar, sayiSatiri, zarfSatiri } from '../game/gazete';
import { depremOzeti, oyuncuOzeti, sokakKayitlari, type DepremBinaSonucu } from '../game/session';
import { fadeIn, goTo } from '../systems/transition';
import { SCENES } from './keys';
import type { DepremData } from './QuakeScene';
import type { ResultData } from './ResultScene';

export interface NewspaperData extends DepremData {
  /** Büyük depremin sonuçları (sokak sırasıyla). */
  sonuclar: DepremBinaSonucu[];
}

/** Gazete kâğıdı (ekran pikseli). */
const KAGIT = { x: 200, y: 24, w: 1360, h: 1032 };
/** Fotoğraf çerçevesinin içi (ekran) ve fotoğraf sokağının ekran dışındaki yeri. */
const FOTO = { x: 240, y: 336, w: 880, h: 224 };
const UZAK = { x: 4000, y: 0 };
/** Fotoğrafta en çok kaç parsel (fazlası: öne çıkan binanın çevresi). G5b: daha geniş kare. */
const FOTO_PARSEL = 18;

/**
 * Giriş koruması (ms, sahne açılışından; G24): depremden gelirken basılı kalan ya da çift basılan Enter gazeteyi
 * atlatmasın. Koruma sürerken birincil düğmede "hazır" şeridi dolar (gün sonu raporuyla aynı gösterge).
 */
const GIRIS_KORUMA_MS = 500;

/** Sonuç ekranına geçişin kararma süresi (ms; ana ve fotoğraf kamerası birlikte). */
const GECIS_MS = 220;

const MUREKKEP = '#1d1a18';
const KAGIT_RENK = '#d9d3c1';
const KAGIT_KOYU = '#bfb8a4';

/**
 * Deprem sabahı gazetesi (kodla çizilen piksel birinci sayfa; gazete adı ve metinler yer tutucu, gerçek bir
 * gazete taklidi değil). Manşet ve satırlar sonuçlardan doldurulur (src/game/gazete.ts); küçük fotoğraf deprem
 * sonrası sokağın kendisi (siyah beyaz). Enter / Space / tıklama: sonuç ekranı.
 */
export class NewspaperScene extends Phaser.Scene {
  private veri!: NewspaperData;
  private hazir = false;
  private gecildi = false;
  /** Fotoğrafı gösteren ayrı kamera (geçişte ana kamerayla birlikte söner, G23). */
  private fotoKamera?: Phaser.Cameras.Scene2D.Camera;

  constructor() {
    super(SCENES.Newspaper);
  }

  init(data: NewspaperData): void {
    this.veri = data;
    this.hazir = false;
    this.gecildi = false;
    this.fotoKamera = undefined;
  }

  create(): void {
    fadeIn(this, 500);
    this.cameras.main.setRoundPixels(true);
    const v = this.veri;
    const oz = depremOzeti(v.sonuclar);
    // Kısa yolda (G21) öne çıkan satırlar önce oyuncunun binalarından; manşet yalnızca oyuncunun binalarının
    // sonucuna göre (G23b: örnek binalar sayı satırına ve fotoğrafa girer, manşeti belirlemez; sonuç ekranındaki
    // değerlendirmeyle aynı özet).
    const juri = v.kisa ? new Set(v.kisa.juri) : undefined;
    const mansetOzeti = oyuncuOzeti(v.sonuclar, juri);
    const one = oneCikanlar(v.sonuclar, juri);

    masaCiz(this, 0);
    this.kagitCiz();
    const L = KAGIT.x;
    const T = KAGIT.y;
    const R = KAGIT.x + KAGIT.w;
    const yaz = (x: number, y: number, t: string, size: number, ox = 0, oy = 0.5, renk = MUREKKEP): Phaser.GameObjects.Text =>
      this.add.text(snap(x), snap(y), t, { fontFamily: FONT, fontSize: `${size}px`, color: renk }).setOrigin(ox, oy);
    const cizgi = (y: number, x0 = L + 40, x1 = R - 40, kalin = PX): void => {
      this.add.rectangle(snap(x0), snap(y), snap(x1 - x0), kalin, 0x1d1a18).setOrigin(0);
    };

    // Künye: gazete adı, çift çizgi, tarih satırı.
    this.sigdir(yaz(KAGIT.x + KAGIT.w / 2, T + 84, GAZETE_ADI, 128, 0.5), KAGIT.w - 120);
    cizgi(T + 152);
    cizgi(T + 164);
    yaz(KAGIT.x + KAGIT.w / 2, T + 192, GAZETE_TARIH, 30, 0.5, 0.5, '#3d3832');
    cizgi(T + 216);

    // Manşet
    this.sigdir(yaz(KAGIT.x + KAGIT.w / 2, T + 264, manset(mansetOzeti), 84, 0.5), KAGIT.w - 80);

    // Fotoğraf: deprem sonrası sokak (ekran dışında kurulur, ayrı kamerayla siyah beyaz gösterilir).
    this.fotoKur(v, one.odak);
    this.add.rectangle(FOTO.x - PX * 2, FOTO.y - PX * 2, FOTO.w + PX * 4, FOTO.h + PX * 4, 0x1d1a18).setOrigin(0);
    yaz(FOTO.x, FOTO.y + FOTO.h + 28, FOTO_ALTI, 28, 0, 0.5, '#3d3832');

    // Sağ sütun: sayılar (bina sayısı), altında kısa haber (gri çizgiler).
    const sx = FOTO.x + FOTO.w + 40;
    const sw = R - 40 - sx;
    const rnd = rastgele(v.tohum * 17 + 3);
    this.add.rectangle(sx - 20, FOTO.y - 8, PX, FOTO.h + 56, 0x1d1a18, 0.6).setOrigin(0);
    // Zarf izi (G17): kabul edilen zarfın binası hasar gördüyse.
    const zarf = zarfSatiri(v.sonuclar);
    let y: number;
    if (juri) y = this.kisaSayilar(sx, sw, v.sonuclar, juri, zarf);
    else {
      const sayi = this.add
        .text(snap(sx), snap(FOTO.y), sayiSatiri(oz), { fontFamily: FONT, fontSize: '36px', color: MUREKKEP, wordWrap: { width: sw, useAdvancedWrap: true }, lineSpacing: 2 })
        .setOrigin(0, 0);
      y = snap(FOTO.y + sayi.height + 16);
      if (zarf) {
        const z = this.add
          .text(snap(sx), y, zarf, { fontFamily: FONT, fontSize: '30px', color: '#6e2a24', wordWrap: { width: sw, useAdvancedWrap: true }, lineSpacing: 2 })
          .setOrigin(0, 0);
        y = snap(y + z.height + 12);
      }
    }
    cizgi(y, sx, R - 40);
    for (y += 24; y < FOTO.y + FOTO.h + 36; y += 20) this.add.rectangle(snap(sx), snap(y), snap(sw - rnd() * 24), 8, 0x6e675c, 0.55).setOrigin(0);

    // Alt kısım: üç sütun. Başlıkları öne çıkan binalar (sonuçtan), metinleri gri çizgiler (doldurma).
    const altY = FOTO.y + FOTO.h + 64;
    cizgi(altY);
    const sut = 3;
    const sutW = (KAGIT.w - 80 - (sut - 1) * 40) / sut;
    for (let i = 0; i < sut; i++) {
      const x0 = L + 40 + i * (sutW + 40);
      const baslik = one.satirlar[i] ?? DOLGU_BASLIKLAR[i % DOLGU_BASLIKLAR.length];
      const b = this.add
        .text(snap(x0), snap(altY + 20), baslik, {
          fontFamily: FONT,
          fontSize: one.satirlar[i] ? '36px' : '32px',
          color: MUREKKEP,
          wordWrap: { width: sutW, useAdvancedWrap: true },
          lineSpacing: 2,
        })
        .setOrigin(0, 0);
      for (let yy = snap(altY + 20 + b.height + 20); yy < T + KAGIT.h - 40; yy += 20) {
        const son = yy + 20 >= T + KAGIT.h - 40 || rnd() < 0.12;
        const w = son ? sutW * (0.3 + rnd() * 0.5) : sutW - rnd() * 24;
        this.add.rectangle(snap(x0), snap(yy), snap(w), 8, 0x6e675c, 0.55).setOrigin(0);
      }
      if (i > 0) this.add.rectangle(snap(x0 - 20), altY + 16, PX, T + KAGIT.h - altY - 56, 0x1d1a18, 0.4).setOrigin(0);
    }

    // Devam
    const devam = (): void => this.devam();
    const dugme = pikselDugme(this, 1740, 980, 'DEVAM', 'Enter', devam);
    // G24: düğme gazeteyle birlikte görünür; giriş koruması sürerken üstünde "hazır" şeridi dolar, ~0,5 sn sonra
    // Enter/Space/tık kabul edilir (önceden 900 ms boyunca düğme yoktu ve basılan Enter sessizce yok sayılıyordu).
    this.tweens.add({ targets: dugme, alpha: 1, duration: 120 });
    hazirGostergesi(this, dugme, GIRIS_KORUMA_MS);
    const kb = this.input.keyboard;
    kb?.on('keydown-ENTER', devam);
    kb?.on('keydown-SPACE', devam);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      kb?.off('keydown-ENTER', devam);
      kb?.off('keydown-SPACE', devam);
    });
    this.time.delayedCall(GIRIS_KORUMA_MS, () => (this.hazir = true));
    sfx.play('kagitKay');
    this.time.delayedCall(250, () => sfx.play('kagitBirak'));
  }

  private devam(): void {
    if (!this.hazir || this.gecildi) return;
    this.gecildi = true;
    sfx.play('confirm');
    const data: ResultData = { ...this.veri };
    // goTo yalnızca ana kamerayı karartır: fotoğraf kamerası da aynı sürede sönsün (siyah ekranda asılı kalmasın).
    this.fotoKamera?.fadeOut(GECIS_MS, 0, 0, 0);
    goTo(this, SCENES.Result, data, GECIS_MS);
  }

  /**
   * Kısa yolun sayıları (G30, T22): önce jürinin binaları, sonra bütün sokak (başlıklı iki blok), altında zarf izi.
   * Sağ sütuna (fotoğrafın yanı) sığana kadar hepsi birlikte küçülür. Dönüş: alt çizginin y'si.
   */
  private kisaSayilar(sx: number, sw: number, sonuclar: readonly DepremBinaSonucu[], juri: ReadonlySet<string>, zarf: string | null): number {
    const bloklar = kisaSayiBloklari(sonuclar, juri);
    const alt = FOTO.y + FOTO.h + 44;
    const metin = (y: number, t: string, boy: number, renk: string): Phaser.GameObjects.Text =>
      this.add
        .text(snap(sx), snap(y), t, { fontFamily: FONT, fontSize: `${boy}px`, color: renk, wordWrap: { width: sw, useAdvancedWrap: true }, lineSpacing: 2 })
        .setOrigin(0, 0);
    const yazilar: Phaser.GameObjects.Text[] = [];
    for (let boy = 36; ; boy -= 2) {
      for (const t of yazilar) t.destroy();
      yazilar.length = 0;
      let y = FOTO.y;
      bloklar.forEach((b, i) => {
        const bas = metin(y, b.baslik, boy - 4, '#3d3832');
        const say = metin(bas.y + bas.height, b.satir, boy, MUREKKEP);
        yazilar.push(bas, say);
        y = say.y + say.height + (i < bloklar.length - 1 ? 12 : 16);
      });
      if (zarf) {
        const z = metin(y, zarf, boy - 6, '#6e2a24');
        yazilar.push(z);
        y = z.y + z.height + 12;
      }
      if (y <= alt || boy <= 26) return snap(y);
    }
  }

  /**
   * Fotoğraf: deprem sonrası sokak (çökenler moloz, hasarlılar çatlak), sabah ışığında. Uzakta kurulur, fotoğraf
   * çerçevesine ayrı bir kamerayla gösterilir (kırpma) ve siyah beyaz yapılır (WebGL; Canvas'ta renkli kalır).
   */
  private fotoKur(v: NewspaperData, odak?: DepremBinaSonucu): void {
    const durum = new Map(v.sonuclar.map((s) => [s.dosyaId, s]));
    const girdiler: SokakGirdi[] = sokakKayitlari(v.tohum, v.kayitlar).map((k) => {
      const s = durum.get(k.bina.id);
      return { ...k, hasar: s ? (s.coktu ? 'yikik' : s.durum) : k.hasar };
    });
    const alan = { x: UZAK.x, y: UZAK.y, w: FOTO.w, h: FOTO.h };
    const sokak = new Sokak(this, alan, SON_GUN, girdiler, 10, { olcek: 2, uzak: false });
    const n = girdiler.length;
    if (n > 0) {
      if (n <= FOTO_PARSEL + 2) sokak.odakla(0, n - 1, 0, undefined, 0.5, 0.05);
      else {
        const merkez = odak ? odak.no - 1 : Math.floor(n / 2);
        const i0 = Phaser.Math.Clamp(merkez - Math.floor(FOTO_PARSEL / 2), 0, n - FOTO_PARSEL);
        sokak.odakla(i0, i0 + FOTO_PARSEL - 1, 0, undefined, 0.5, 0.05);
      }
    }
    // Baskı noktası dokusu (fotoğrafın üstünde, aynı kamerada).
    const t = new Tuval(this, FOTO.w / PX, FOTO.h / PX, 'baski');
    t.dither(0, 0, FOTO.w / PX, FOTO.h / PX, '#000000');
    t.goruntu(UZAK.x, UZAK.y).setOrigin(0).setDepth(50).setAlpha(0.1);

    const fc = this.cameras.add(FOTO.x, FOTO.y, FOTO.w, FOTO.h);
    fc.setScroll(UZAK.x, UZAK.y).setRoundPixels(true).setBackgroundColor(0x000000);
    if (this.renderer.type === Phaser.WEBGL) fc.postFX.addColorMatrix().grayscale(1);
    fc.fadeIn(500, 0, 0, 0);
    this.fotoKamera = fc;
  }

  private kagitCiz(): void {
    const W = KAGIT.w / PX;
    const H = KAGIT.h / PX;
    const rnd = rastgele(this.veri.tohum * 131 + 11);
    const t = new Tuval(this, W + 2, H + 3, 'gazete');
    t.rect(2, 3, W, H, '#00000066');
    t.rect(0, 0, W, H, KAGIT_RENK);
    t.benek(0, 0, W, H, KAGIT_KOYU, 0.05, rnd);
    t.benek(0, 0, W, H, '#e4dfcf', 0.03, rnd);
    // Katlama izi (yatay, ortada) ve sararmış kenarlar.
    t.dither(0, Math.floor(H / 2), W, 1, KAGIT_KOYU);
    t.dither(0, 0, W, 2, KAGIT_KOYU);
    t.dither(0, H - 2, W, 2, KAGIT_KOYU, 1);
    t.dither(0, 0, 2, H, KAGIT_KOYU);
    t.dither(W - 2, 0, 2, H, KAGIT_KOYU, 1);
    t.goruntu(KAGIT.x, KAGIT.y).setOrigin(0);
  }

  /** Metin genişliği aşarsa küçült. */
  private sigdir(t: Phaser.GameObjects.Text, w: number): Phaser.GameObjects.Text {
    let boy = parseInt(String(t.style.fontSize), 10);
    while (t.width > w && boy > 24) {
      boy -= 4;
      t.setFontSize(boy);
    }
    return t;
  }
}
