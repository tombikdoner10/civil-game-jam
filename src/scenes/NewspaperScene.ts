// @beyan görsel
import * as Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { FONT } from '../config';
import { PAL } from '../desk/palette';
import { PX, rastgele, snap, Tuval } from '../desk/pixel';
import { hazirGostergesi, masaCiz, pikselDugme } from '../desk/props';
import { Sokak, type SokakGirdi } from '../desk/Street';
import { SON_GUN } from '../game/days';
import { DOLGU_BASLIKLAR, FOTO_ALTI, GAZETE_ADI, GAZETE_TARIH, kisaSayiBloklari, manset, oneCikanlar, sayiSatiri, sokakCokenSayisi, zarfSatiri } from '../game/gazete';
import { evSonucu } from '../game/ev';
import { EV_GAZETE_BASLIK, evCumleleri, evHarcananSatiri, evTaksitSatiri } from '../game/ev-metin';
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
/**
 * Manşet (G37): tek satırda bu boyun altına küçülecekse önce iki satıra kaydırılır, iki satırda da sığmazsa küçülür.
 * Eski manşetlerin hepsi tek satırda bu boyun üstünde kalır (gazete düzeni değişmez).
 */
const MANSET_BOY = 84;
const MANSET_TEK_SATIR_EN_AZ = 60;
/** Fotoğrafta en çok kaç parsel (fazlası: öne çıkan binanın çevresi). G5b: daha geniş kare. */
const FOTO_PARSEL = 18;

/**
 * Giriş koruması (ms, sahne açılışından; G24): depremden gelirken basılı kalan ya da çift basılan Enter gazeteyi
 * atlatmasın. Koruma sürerken birincil düğmede "hazır" şeridi dolar (gün sonu raporuyla aynı gösterge).
 */
const GIRIS_KORUMA_MS = 500;

/**
 * "Senin evin" kutusu (G42): alt sütunların altında; en çok bu yükseklikte (yazı sığana kadar küçülür). G43: ilkSutun'dan
 * sona kadar sütunları kaplar; sütun başlıkları uzunsa daha da kısalır (başlıklarla arasında en az bosluk kalır).
 */
const EV_KUTU = { enCokH: 300, ic: 16, bosluk: 24, ilkSutun: 1 };

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
  /** Fotoğraf çerçevesi; iki satırlık manşette (G37) aşağı kayar, altındaki her şey de onunla birlikte. */
  private foto = FOTO;

  constructor() {
    super(SCENES.Newspaper);
  }

  init(data: NewspaperData): void {
    this.veri = data;
    this.hazir = false;
    this.gecildi = false;
    this.fotoKamera = undefined;
    this.foto = FOTO;
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
    // G37: kısa yolda jürinin binaları çökmediyse manşet sokakta denetlenmeyen binalardan çökenleri de söyler.
    const kisaBilgi = juri ? { sokakCoken: sokakCokenSayisi(v.sonuclar, juri) } : undefined;
    // 5 günlük yolda bina adları gün sonu raporundaki gibi ve günüyle (G35); kısa yolda sokak sırası (değişmedi).
    const one = oneCikanlar(v.sonuclar, juri, !v.kisa);

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

    // Manşet (G37: uzunsa iki satır; fotoğraf, sağ sütun ve alt sütunlar aradaki fark kadar aşağı kayar).
    const kayma = this.mansetYaz(yaz(KAGIT.x + KAGIT.w / 2, T + 264, manset(mansetOzeti, kisaBilgi), MANSET_BOY, 0.5), KAGIT.w - 80);
    this.foto = { ...FOTO, y: FOTO.y + kayma };
    const foto = this.foto;

    // Fotoğraf: deprem sonrası sokak (ekran dışında kurulur, ayrı kamerayla siyah beyaz gösterilir).
    this.fotoKur(v, one.odak);
    this.add.rectangle(foto.x - PX * 2, foto.y - PX * 2, foto.w + PX * 4, foto.h + PX * 4, 0x1d1a18).setOrigin(0);
    yaz(foto.x, foto.y + foto.h + 28, FOTO_ALTI, 28, 0, 0.5, '#3d3832');

    // Sağ sütun: sayılar (bina sayısı), altında kısa haber (gri çizgiler).
    const sx = foto.x + foto.w + 40;
    const sw = R - 40 - sx;
    const rnd = rastgele(v.tohum * 17 + 3);
    this.add.rectangle(sx - 20, foto.y - 8, PX, foto.h + 56, 0x1d1a18, 0.6).setOrigin(0);
    // Zarf izi (G17): kabul edilen zarfın binası hasar gördüyse.
    const zarf = zarfSatiri(v.sonuclar);
    let y: number;
    if (juri) y = this.kisaSayilar(sx, sw, v.sonuclar, juri, zarf);
    else {
      const sayi = this.add
        .text(snap(sx), snap(foto.y), sayiSatiri(oz), { fontFamily: FONT, fontSize: '36px', color: MUREKKEP, wordWrap: { width: sw, useAdvancedWrap: true }, lineSpacing: 2 })
        .setOrigin(0, 0);
      y = snap(foto.y + sayi.height + 16);
      if (zarf) {
        const z = this.add
          .text(snap(sx), y, zarf, { fontFamily: FONT, fontSize: '30px', color: '#6e2a24', wordWrap: { width: sw, useAdvancedWrap: true }, lineSpacing: 2 })
          .setOrigin(0, 0);
        y = snap(y + z.height + 12);
      }
    }
    cizgi(y, sx, R - 40);
    for (y += 24; y < foto.y + foto.h + 36; y += 20) this.add.rectangle(snap(sx), snap(y), snap(sw - rnd() * 24), 8, 0x6e675c, 0.55).setOrigin(0);

    // Alt kısım: üç sütun. Başlıkları öne çıkan binalar (sonuçtan), metinleri gri çizgiler (doldurma).
    const altY = foto.y + foto.h + 64;
    cizgi(altY);
    const sut = 3;
    const sutW = (KAGIT.w - 80 - (sut - 1) * 40) / sut;
    // G42: "Senin evin" kutusu sütunların altında; G43: ikinci ve üçüncü sütunu birlikte kaplar (kademe cümleleri
    // uzadı), iki sütunun başlıklarının altına sığacak kadar yüksek. O sütunların doldurma çizgileri ve aradaki
    // ayırıcı kutunun üstünde biter.
    const basliklar = Array.from({ length: sut }, (_, i) => {
      const x0 = L + 40 + i * (sutW + 40);
      const baslik = one.satirlar[i] ?? DOLGU_BASLIKLAR[i % DOLGU_BASLIKLAR.length];
      return this.add
        .text(snap(x0), snap(altY + 20), baslik, {
          fontFamily: FONT,
          fontSize: one.satirlar[i] ? '36px' : '32px',
          color: MUREKKEP,
          wordWrap: { width: sutW, useAdvancedWrap: true },
          lineSpacing: 2,
        })
        .setOrigin(0, 0);
    });
    const altSinir = T + KAGIT.h - 40;
    const basAlt = Math.max(...basliklar.slice(EV_KUTU.ilkSutun).map((b) => altY + 20 + b.height));
    const evUst = this.evKutusu(L + 40 + EV_KUTU.ilkSutun * (sutW + 40), (sut - EV_KUTU.ilkSutun) * (sutW + 40) - 40, altSinir, altSinir - basAlt - EV_KUTU.bosluk);
    basliklar.forEach((b, i) => {
      const x0 = L + 40 + i * (sutW + 40);
      const sonY = i >= EV_KUTU.ilkSutun ? evUst - 24 : altSinir;
      for (let yy = snap(altY + 20 + b.height + 20); yy < sonY; yy += 20) {
        const son = yy + 20 >= sonY || rnd() < 0.12;
        const w = son ? sutW * (0.3 + rnd() * 0.5) : sutW - rnd() * 24;
        this.add.rectangle(snap(x0), snap(yy), snap(w), 8, 0x6e675c, 0.55).setOrigin(0);
      }
      const ayiriciAlt = i > EV_KUTU.ilkSutun ? evUst - 16 : altSinir;
      if (i > 0) this.add.rectangle(snap(x0 - 20), altY + 16, PX, ayiriciAlt - altY - 16, 0x1d1a18, 0.4).setOrigin(0);
    });

    // Devam
    const devam = (): void => this.devam();
    // Koruma sürerken basılan yeni (tekrar olmayan) Enter/Space beklemeye alınır, koruma bitince bir kez işlenir
    // (G35, gün sonu raporundaki G26 gibi). Basılı tutulan tuşun tekrarı (depremden kalan) bekletilmez: gazete atlanmaz.
    let bekleyen = false;
    const tus = (e?: KeyboardEvent): void => {
      if (this.hazir) devam();
      else if (!e?.repeat) bekleyen = true;
    };
    const dugme = pikselDugme(this, 1740, 980, 'DEVAM', 'Enter', devam);
    // G24: düğme gazeteyle birlikte görünür; giriş koruması sürerken üstünde "hazır" şeridi dolar, ~0,5 sn sonra
    // Enter/Space/tık kabul edilir (önceden 900 ms boyunca düğme yoktu ve basılan Enter sessizce yok sayılıyordu).
    this.tweens.add({ targets: dugme, alpha: 1, duration: 120 });
    hazirGostergesi(this, dugme, GIRIS_KORUMA_MS);
    const kb = this.input.keyboard;
    kb?.on('keydown-ENTER', tus);
    kb?.on('keydown-SPACE', tus);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      kb?.off('keydown-ENTER', tus);
      kb?.off('keydown-SPACE', tus);
      sfx.jingleSustur();
    });
    this.time.delayedCall(GIRIS_KORUMA_MS, () => {
      this.hazir = true;
      if (bekleyen) devam();
    });
    sfx.play('kagitKay');
    this.time.delayedCall(250, () => sfx.play('kagitBirak'));
    // G32 (T24): gazete masaya inince bir kez, sonuçtan bağımsız jingle. Sahne kapanınca kesilir.
    this.time.delayedCall(450, () => sfx.play('gazete'));
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
   * "Senin evin" kutusu (G42; kısa yolda da 5 günlük yolda da): çerçeveli küçük haber kutusu, başlık ve evin
   * durumu, güçlendirme, çanta, sabitleme ve (varsa) zarf cümleleri; G43: altında taksit durumu ve evine harcanan.
   * Alt kenarı alt'ta; yazı min(enCokH, sigH)'ye sığana kadar küçülür. Dönüş: kutunun üst kenarı.
   */
  private evKutusu(x: number, w: number, alt: number, sigH: number): number {
    const s = evSonucu(this.veri.ev, this.veri.sonuclar);
    const ic = EV_KUTU.ic;
    const baslik = this.add.text(0, 0, EV_GAZETE_BASLIK, { fontFamily: FONT, fontSize: '32px', color: MUREKKEP }).setOrigin(0, 0);
    const govde = this.add
      .text(0, 0, `${evCumleleri(s).join(' ')}
${evTaksitSatiri(s.guclendirme)} · ${evHarcananSatiri(`${s.harcanan} TL`)}`, { fontFamily: FONT, fontSize: '28px', color: MUREKKEP, wordWrap: { width: w - ic * 2, useAdvancedWrap: true }, lineSpacing: 2 })
      .setOrigin(0, 0);
    const yuk = (): number => ic + baslik.height + 8 + govde.height + ic;
    const enCok = Math.min(EV_KUTU.enCokH, sigH);
    for (let boy = 28; yuk() > enCok && boy > 20; ) govde.setFontSize((boy -= 2));
    const h = snap(yuk());
    const ust = snap(alt - h);
    this.add.rectangle(snap(x), ust, snap(w), h, 0x1d1a18).setOrigin(0);
    this.add.rectangle(snap(x) + PX, ust + PX, snap(w) - PX * 2, h - PX * 2, 0xcfc8b4).setOrigin(0);
    baslik.setPosition(snap(x + ic), ust + ic).setDepth(1);
    this.add.rectangle(snap(x + ic), snap(ust + ic + baslik.height + 2), snap(w - ic * 2), PX, 0x1d1a18, 0.6).setOrigin(0);
    govde.setPosition(snap(x + ic), snap(ust + ic + baslik.height + 8)).setDepth(1);
    return ust;
  }

  /**
   * Kısa yolun sayıları (G30, T22): önce jürinin binaları, sonra bütün sokak (başlıklı iki blok), altında zarf izi.
   * Sağ sütuna (fotoğrafın yanı) sığana kadar hepsi birlikte küçülür. Dönüş: alt çizginin y'si.
   */
  private kisaSayilar(sx: number, sw: number, sonuclar: readonly DepremBinaSonucu[], juri: ReadonlySet<string>, zarf: string | null): number {
    const bloklar = kisaSayiBloklari(sonuclar, juri);
    const alt = this.foto.y + this.foto.h + 44;
    const metin = (y: number, t: string, boy: number, renk: string): Phaser.GameObjects.Text =>
      this.add
        .text(snap(sx), snap(y), t, { fontFamily: FONT, fontSize: `${boy}px`, color: renk, wordWrap: { width: sw, useAdvancedWrap: true }, lineSpacing: 2 })
        .setOrigin(0, 0);
    const yazilar: Phaser.GameObjects.Text[] = [];
    for (let boy = 36; ; boy -= 2) {
      for (const t of yazilar) t.destroy();
      yazilar.length = 0;
      let y = this.foto.y;
      bloklar.forEach((b, i) => {
        const bas = metin(y, b.baslik, boy - 4, '#3d3832');
        const say = metin(bas.y + bas.height, this.kalemSatirlari(b.kalemler, boy, sw), boy, MUREKKEP);
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
   * Kalemleri satırlara dizer (G31c): sığdıkça " · " ile yan yana; satır yalnızca kalemler arasında kırılır; kırılan
   * satırın sonunda ya da başında "·" kalmaz (G31d). Tek kalem sütundan genişse metnin kendi kaydırması onu
   * sözcük arasından kırar.
   */
  private kalemSatirlari(kalemler: readonly string[], boy: number, w: number): string {
    const olc = this.add.text(0, 0, '', { fontFamily: FONT, fontSize: `${boy}px` }).setVisible(false);
    const satirlar: string[] = [];
    let satir = '';
    kalemler.forEach((k) => {
      // G31d: "·" yalnızca aynı satırdaki iki kalemin arasında; önceki kaleme bölünmez boşlukla bağlı (satır başına düşmez).
      const aday = satir ? `${satir} · ${k}` : k;
      if (!satir || olc.setText(aday).width < w) satir = aday;
      else {
        satirlar.push(satir);
        satir = k;
      }
    });
    if (satir) satirlar.push(satir);
    olc.destroy();
    return satirlar.join('\n');
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
    const alan = { x: UZAK.x, y: UZAK.y, w: this.foto.w, h: this.foto.h };
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
    const t = new Tuval(this, this.foto.w / PX, this.foto.h / PX, 'baski');
    t.dither(0, 0, this.foto.w / PX, this.foto.h / PX, '#000000');
    t.goruntu(UZAK.x, UZAK.y).setOrigin(0).setDepth(50).setAlpha(0.1);

    const fc = this.cameras.add(this.foto.x, this.foto.y, this.foto.w, this.foto.h);
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

  /**
   * Manşeti yerleştirir (G37). Tek satırda MANSET_TEK_SATIR_EN_AZ boyunda ya da daha büyük sığıyorsa eskisi gibi tek
   * satır (sigdir). Sığmıyorsa ortalı iki satıra kaydırır, iki satırda sığana kadar küçültür; üst kenarı tek satırlık
   * manşetinkiyle aynı kalır. Dönüş: altındaki öğelerin aşağı kayma miktarı (tek satırda 0).
   */
  private mansetYaz(t: Phaser.GameObjects.Text, w: number): number {
    const tekH = t.height;
    const ust = t.y - tekH / 2;
    this.sigdir(t, w);
    if (parseInt(String(t.style.fontSize), 10) >= MANSET_TEK_SATIR_EN_AZ) return 0;
    t.setFontSize(MANSET_BOY).setAlign('center').setLineSpacing(0).setWordWrapWidth(w, true);
    for (let boy = MANSET_BOY; (t.getWrappedText().length > 2 || t.width > w) && boy > 24; ) {
      boy -= 4;
      t.setFontSize(boy);
    }
    t.setOrigin(0.5, 0).setY(snap(ust));
    return snap(Math.max(0, t.height - tekH));
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
