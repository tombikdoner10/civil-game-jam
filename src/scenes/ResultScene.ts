// @beyan görsel
import * as Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { FONT } from '../config';
import { num, PAL } from '../desk/palette';
import { PX, rastgele, snap, Tuval } from '../desk/pixel';
import { masaCiz, pikselDugme } from '../desk/props';
import { gunAyar, SON_GUN } from '../game/days';
import { DAMGA_ADI, DAMGA_RENK } from '../desk/Kaselik';
import { RET_SONUC, ZARF_ETIKET } from '../game/diyalog';
import { degerlendirme, juriGordukleri, KISA_SONUC, seninBinalarin, sokakCokenSayisi, sonucEtiketi, zarfOzeti } from '../game/gazete';
import { EV_KADEME, evSonucu } from '../game/ev';
import {
  EV_DURUM_METIN,
  EV_GUCLENDIRME_METIN,
  EV_KENDI_BINA,
  EV_PAYLI,
  EV_SABITLEME_METIN,
  EV_SONUC_BASLIK,
  evBaglamCumlesi,
  evCantaCumlesi,
  evCoktu,
  evHarcananSatiri,
  evTaksitSatiri,
  evZarfCumlesi,
} from '../game/ev-metin';
import { bulunanSayisi, depremOzeti, gunHesabi, oyuncuOzeti, oyunToplami } from '../game/session';
import { fadeIn, goTo } from '../systems/transition';
import type { GameData } from './GameScene';
import { SCENES } from './keys';
import type { NewspaperData } from './NewspaperScene';
import { sonucRengi } from './QuakeScene';

/** Sonuç ekranına gelen veri: beş günün kayıtları, birikmiş para ve büyük depremin sonuçları. */
export type ResultData = NewspaperData;

/** Dosya kâğıdı (ekran pikseli). G42: sola kaydı, sağında "Senin evin" kâğıdı (gün sonu raporuyla aynı yer). */
const KAGIT = { x: 40, y: 40, w: 1344, h: 1000 };
/** "Senin evin" kâğıdı (G42). */
const EV = { x: 1408, y: 40, w: 472, h: 1000 };
const SATIR_H = 48;
/** Sonuçtaki zarf satırları (G60): TOPLAM satırından ilk satırın ortasına uzaklık, satır aralığı, yazı boyu. */
const ZARF_SATIR = { ilk: 36, ara: 30, boy: 30 };
/** Tablo sütunlarının sağ kenarı (kâğıdın solundan); GÜN sütunu sol hizalı. */
const SUTUN = { gun: 40, dosya: 420, dogru: 600, yanlis: 780, islenmeyen: 990, kusur: 1180, para: KAGIT.w - 40 };

const para = (n: number): string => `${n < 0 ? '−' : ''}${Math.abs(n)} TL`;

/**
 * Oyun sonu (G5): masada "Denetçi dosyası". Beş günün doğru/yanlış toplamı, bulunan kusurlar, birikmiş para,
 * büyük depremde sokağın özeti (ayakta / hasarlı / çöken / boşaltılmış / iade) ve kısa bir değerlendirme satırı (yer
 * tutucu). "Yeniden oyna" (Enter) gün 1'den yeni sokakla başlar; "Ana menü" (Esc). Kısa yolda (G21) Enter
 * "Gün 2'den devam", "Yeniden oyna" R.
 */
export class ResultScene extends Phaser.Scene {
  private veri!: ResultData;
  private gecildi = false;

  constructor() {
    super(SCENES.Result);
  }

  init(data: ResultData): void {
    this.veri = { tohum: data?.tohum ?? 0, para: data?.para ?? 0, kayitlar: data?.kayitlar ?? [], sonuclar: data?.sonuclar ?? [] };
    if (data?.kisa) this.veri.kisa = data.kisa;
    if (data?.ev) this.veri.ev = data.ev;
    this.gecildi = false;
  }

  create(): void {
    fadeIn(this);
    this.cameras.main.setRoundPixels(true);
    const v = this.veri;
    // Kısa yol (G21): tablo ve toplamlar oyuncunun gerçek kayıtlarından; sokak özeti bütün sokaktan,
    // değerlendirme oyuncunun binalarından.
    const kisa = v.kisa;
    const gercek = kisa ? kisa.gercek : v.kayitlar;
    const juri = new Set(kisa?.juri ?? []);
    const juriSonuc = v.sonuclar.filter((s) => juri.has(s.dosyaId));
    const top = oyunToplami(gercek);
    const oz = depremOzeti(v.sonuclar);
    // G37: kısa yolda değerlendirme gazetedeki manşetle aynı (jürinin binaları, ardından sokakta denetlenmeyenler).
    const deg = degerlendirme(oyuncuOzeti(v.sonuclar, kisa ? juri : undefined), kisa ? { sokakCoken: sokakCokenSayisi(v.sonuclar, juri) } : undefined);

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
    yaz(L + KAGIT.w - 40, T + 44, kisa ? KISA_SONUC.sag : `${SON_GUN} GÜN`, 40, PAL.kremAcik, 1);
    yaz(L + 40, T + 124, kisa ? KISA_SONUC.alt : 'Denetim özeti ve deprem sonrası sokak', 30, PAL.murekkepSoluk);

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
    gercek.forEach((k, i) => {
      const dosya = gunAyar(k.gun).dosyaSayisi;
      const h = gunHesabi(k.kararlar, dosya);
      const bulunan = k.kararlar.reduce((n, c) => n + bulunanSayisi(c), 0);
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
    ];
    const birikmis = yaz(L + SUTUN.para, topY + 52, `Birikmiş para: ${para(v.para)}`, 38, PAL.murekkep, 1);
    toplamlar.push(birikmis);
    // Zarf (G17): kabul edilen zarflar ve hasar gören binaları (yer tutucu metin).
    let zarfAdet = 0;
    let zarfTL = 0;
    // G57: müfettişin el koyduğu zarflar ve geri verilen zarflar (oyuncunun kendi kayıtlarından).
    let mufettis = 0;
    let ret = 0;
    for (const k of gercek) {
      const h = gunHesabi(k.kararlar, gunAyar(k.gun).dosyaSayisi);
      zarfAdet += h.zarfKabul;
      zarfTL += h.zarf + h.zarfElKonan;
      mufettis += h.mufettis;
      ret += h.zarfTeklif - h.zarfKabul;
    }
    const zarfOz = zarfOzeti(zarfAdet, zarfTL, kisa ? juriSonuc : v.sonuclar, mufettis);
    // G60: zarf satırları sol sütunda alt alta, her biri tek satır ve okunur boyda: kabul edilen zarf (el konulan
    // dahil), zarf alınan binaların deprem sonucu (kırmızı), geri verilen zarf (yeşil). "Birikmiş para"nın solundaki
    // genişliğe sığmazsa en çok 24 px'e küçülür. Alttaki bölüm (BÜYÜK DEPREM ya da kısa yolda senin binaların)
    // satırlar uzarsa aşağı kayar.
    const zarfW = birikmis.x - birikmis.width - 40 - (L + SUTUN.gun);
    const zarfSatirlari: [string, string][] = (zarfOz ?? []).map((m) => [m, PAL.damgaBosalt]);
    if (ret > 0) zarfSatirlari.push([RET_SONUC(ret, zarfAdet), PAL.damgaGuvenli]);
    let zarfAlt = topY;
    zarfSatirlari.forEach(([m, r], i) => {
      const o = this.sigdir(yaz(L + SUTUN.gun, topY + ZARF_SATIR.ilk + i * ZARF_SATIR.ara, m, ZARF_SATIR.boy, r), zarfW);
      zarfAlt = o.y + o.height / 2;
      toplamlar.push(o);
    });
    for (const o of toplamlar) gorun(o, 200 + gercek.length * 90 + 80);

    // Kısa yol: oyuncunun binaları (damga → depremdeki sonuç) ve özeti.
    const dGec = 200 + gercek.length * 90 + 400;
    const jy = Math.max(topY + 112, zarfAlt + 36);
    if (kisa) {
      cizgi(jy - 24);
      gorun(yaz(L + 40, jy + 16, KISA_SONUC.senin, 34, PAL.etiket), dGec - 200);
      gorun(this.sigdir(yaz(L + KAGIT.w - 40, jy + 16, seninBinalarin(depremOzeti(juriSonuc)), 34, PAL.murekkep, 1), 760), dGec - 200);
      const sw = (KAGIT.w - 80) / 3;
      const satirlar: { kap: Phaser.GameObjects.Container; w: number }[] = [];
      juriSonuc.slice(0, 3).forEach((s, i) => {
        const x = L + 40 + i * sw;
        const kap = this.add.container(snap(x), snap(jy + 76));
        const ad = this.add.text(0, 0, s.adres, { fontFamily: FONT, fontSize: '32px', color: PAL.murekkep }).setOrigin(0, 0.5);
        kap.add(ad);
        let cx = snap(ad.width + 16);
        const cip = (metin: string, renk: string): void => {
          const t = this.add.text(0, 0, metin, { fontFamily: FONT, fontSize: '28px', color: '#f0e6cc' }).setOrigin(0, 0.5);
          const w = snap(t.width + 16);
          kap.add(this.add.rectangle(cx, 0, w, 36, num(renk)).setOrigin(0, 0.5));
          t.setX(cx + 8);
          kap.add(t);
          cx += w + 8;
        };
        cip(DAMGA_ADI[s.damga], DAMGA_RENK[s.damga]);
        // Zarf alınan bina (G22).
        if (s.zarf) cip(ZARF_ETIKET, PAL.damgaBosalt);
        const ok = this.add.text(cx, 0, '→', { fontFamily: FONT, fontSize: '32px', color: PAL.murekkepSoluk }).setOrigin(0, 0.5);
        kap.add(ok);
        cx += snap(ok.width + 8);
        cip(sonucEtiketi(s), sonucRengi(s));
        satirlar.push({ kap, w: cx });
        gorun(kap, dGec - 100 + i * 120);
      });
      // Sütuna sığmayan varsa hepsi aynı oranda küçülür.
      const olcek = Math.min(1, ...satirlar.map((r) => (sw - 16) / r.w));
      for (const r of satirlar) r.kap.setScale(olcek);
    }

    // Deprem özeti: dört kutu
    const dy = Math.max(jy + (kisa ? 176 : 0), T + 600);
    // G60: zarf satırları bölümü aşağı ittiyse değerlendirme şeridi kutulara yaklaşır (en çok 14 px; düğmelere değmesin).
    const kayma = Math.min(dy - (T + 600), 14);
    cizgi(dy - 24);
    gorun(yaz(L + 40, dy + 16, kisa ? KISA_SONUC.sokak(oz.toplam, juriSonuc.length) : 'BÜYÜK DEPREM · SOKAK', 34, PAL.etiket), dGec);
    // Kısa yolda (G28b, takım kararı T22; gazeteyle aynı koşul) jürinin görmediği kalemler gizli: İADE kutusu yalnızca
    // jüri İADE vurduysa, "içi boş" yalnızca jürinin BOŞALT damgalı binası çöktüyse ya da hasar gördüyse.
    const gor = kisa ? juriGordukleri(v.sonuclar, juri) : { iade: true, icBos: true };
    const icBos = kisa ? oz.cokenBos > 0 : oz.coken > 0;
    const kutular: [string, number, string, string?][] = [
      ['AYAKTA', oz.ayakta, PAL.damgaGuvenli],
      ['HASARLI', oz.hasarli, PAL.damgaGuclendir],
      // Gazeteyle aynı tanımlar (G5b): çökenlerin "içi boş" olanları; BOŞALTILMIŞ, ayakta + hasarlı + çöken binaların
      // (sokağın tamamının) içinden boşaltılmış olanlar (G46: alt yazı "N binadan", N sokaktaki bina sayısı).
      ['ÇÖKEN', oz.coken, PAL.damgaBosalt, gor.icBos && icBos ? `içi boş: ${oz.cokenBos}` : undefined],
      ['BOŞALTILMIŞ', oz.bos, PAL.murekkepSoluk, `${oz.toplam} binadan`],
    ];
    // İADE: denetlenmeden kalan binalar (içleri doluydu); kaçının çöktüğü alt satırda (G31c: "çöken: N").
    if (gor.iade)
      kutular.push(['İADE', oz.iade, PAL.damgaIade, oz.iade > 0 ? (oz.iadeCoken > 0 ? `çöken: ${oz.iadeCoken}` : 'denetlenmedi') : undefined]);
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

    // Değerlendirme (yer tutucu): tonun renginde dolu şerit, üstünde açık yazı (kâğıt üstünde okunur kontrast).
    const renk = deg.ton === 'iyi' ? PAL.damgaGuvenli : deg.ton === 'orta' ? PAL.damgaGuclendir : PAL.damgaBosalt;
    const dzY = dy + 248 - Math.max(0, kayma);
    const dz = this.sigdir(yaz(L + KAGIT.w / 2, dzY, deg.metin, 40, '#f4ecd6', 0.5), KAGIT.w - 140);
    const dzW = snap(dz.width + 48);
    const dzKap = this.add.container(0, 0);
    dzKap.add(this.add.rectangle(snap(L + KAGIT.w / 2 - dzW / 2 - PX), snap(dzY - 34), dzW + PX * 2, 68, 0x1d191b, 0.85).setOrigin(0));
    dzKap.add(this.add.rectangle(snap(L + KAGIT.w / 2 - dzW / 2), snap(dzY - 30), dzW, 60, num(renk)).setOrigin(0));
    dz.setDepth(1);
    gorun(dzKap, dGec + 700);
    gorun(dz, dGec + 700);

    // Senin evin (G42): raporun sağındaki kâğıt; değerlendirmeden önce belirir.
    this.evKagidi(dGec + 400);

    // Düğmeler
    const yeniden = (): void => this.git(SCENES.Game, { gun: 1 } satisfies GameData);
    const menu = (): void => this.git(SCENES.Menu);
    // Kısa yol: oyunu gün 2'den sürdür (oyuncunun gerçek kayıtları ve parasıyla; örnek binalar karışmaz).
    const surdur = (): void => {
      if (kisa) this.git(SCENES.Game, { gun: 2, tohum: v.tohum, para: v.para, kayitlar: kisa.gercek, ev: v.ev } satisfies GameData);
    };
    const by = T + KAGIT.h - 64;
    const ara = kisa ? 440 : 460;
    const dx = kisa ? -ara : -ara / 2;
    // Kısa yolda (G23) birincil "Gün 2'den devam" (Enter, D); "Yeniden oyna" ikincil (R ya da tık). Normal sonda
    // Enter = Yeniden oyna.
    const d1 = pikselDugme(
      this,
      L + KAGIT.w / 2 + dx,
      by,
      'YENİDEN OYNA',
      kisa ? 'R' : 'Enter',
      yeniden,
      kisa ? { govde: PAL.cerceveAcik, acik: '#7a7466', koyu: PAL.cerceve } : undefined,
    );
    const dugmeler = [d1];
    if (kisa) {
      const d2 = pikselDugme(this, L + KAGIT.w / 2, by, "GÜN 2'DEN DEVAM", 'Enter', surdur, { govde: PAL.damgaGuvenli, acik: '#5a9a66', koyu: '#2a5232' });
      dugmeler.push(d2);
      // Odak çerçevesi: birincil düğmenin çevresinde, nabız gibi (gün sonu raporundaki kısa yol düğmesi gibi).
      const odak = this.add
        .rectangle(snap(L + KAGIT.w / 2), snap(by), snap(d2.width + 24), snap(d2.height + 24))
        .setStrokeStyle(PX, num(PAL.damgaGuvenli))
        .setAlpha(0);
      this.tweens.add({ targets: odak, alpha: { from: 1, to: 0.25 }, duration: 600, delay: 400, yoyo: true, repeat: -1, ease: 'Stepped', easeParams: [3] });
    }
    dugmeler.push(
      pikselDugme(this, L + KAGIT.w / 2 + dx + ara * (kisa ? 2 : 1), by, 'ANA MENÜ', 'Esc', menu, {
        govde: PAL.cerceveAcik,
        acik: '#7a7466',
        koyu: PAL.cerceve,
      }),
    );
    // Düğmeler ekran açılır açılmaz görünür ve tıklanır (G21b); sayılar arkada belirmeye devam eder. Klavye
    // gazeteden gelen Enter'ın tekrarı yeniden başlatmasın diye kısa bir an sonra.
    for (const d of dugmeler) this.tweens.add({ targets: d, alpha: 1, duration: 200, delay: 150 });
    const kb = this.input.keyboard;
    const hazir = { v: false };
    this.time.delayedCall(350, () => (hazir.v = true));
    const enter = (): void => {
      if (!hazir.v) return;
      if (kisa) surdur();
      else yeniden();
    };
    const esc = (): void => {
      if (hazir.v) menu();
    };
    const dTus = (): void => {
      if (hazir.v) surdur();
    };
    const rTus = (): void => {
      if (hazir.v && kisa) yeniden();
    };
    kb?.on('keydown-ENTER', enter);
    kb?.on('keydown-ESC', esc);
    kb?.on('keydown-D', dTus);
    kb?.on('keydown-R', rTus);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      kb?.off('keydown-ENTER', enter);
      kb?.off('keydown-ESC', esc);
      kb?.off('keydown-D', dTus);
      kb?.off('keydown-R', rTus);
      sfx.jingleSustur();
    });
    sfx.play('kagitKay');
    // G32 (T24): değerlendirme şeridi belirince sonucun jingle'ı (iyi: değerlendirme iyi; orta ve kötü: kötü).
    this.time.delayedCall(dGec + 700, () => sfx.play(deg.ton === 'iyi' ? 'sonucIyi' : 'sonucKotu'));
  }

  private git(key: string, data?: object): void {
    if (this.gecildi) return;
    this.gecildi = true;
    sfx.play('confirm');
    goTo(this, key, data);
  }

  /**
   * "Senin evin" kâğıdı (G42; G43 kademeli): evin durumu (renkli şerit), güçlendirme taksit durumu, güçlendirme, çanta
   * ve sabitleme cümleleri (kademeye göre; işaret kutusu: hiç yok kırmızı, yarım sarı, tam yeşil), varsa kendi apartmanın
   * ve güçlendirme payı notu, zarf yan cümlesi; altta evine harcanan. Metinler yer tutucu (ev-metin.ts).
   */
  private evKagidi(gecikme: number): void {
    const v = this.veri;
    const s = evSonucu(v.ev, v.sonuclar);
    const X = EV.x;
    const Y = EV.y;
    const W = EV.w / PX;
    const H = EV.h / PX;
    const t = new Tuval(this, W + 2, H + 3, 'evSonuc');
    t.rect(2, 3, W, H, '#00000066');
    t.rect(0, 0, W, H, PAL.krem);
    t.benek(0, 0, W, H, PAL.kremKoyu, 0.035, rastgele(v.tohum * 13 + 9));
    t.frame(0, 0, W, H, PAL.kremKoyu);
    t.frame(2, 2, W - 4, H - 4, PAL.kremKoyu);
    t.dither(1, H - 2, W - 2, 1, PAL.kremKoyu);
    t.rect(3, 3, W - 6, 22, PAL.mavisi);
    for (let x = 3; x < W - 3; x += 2) {
      t.px(x, 3, '#2f3b5c');
      t.px(x + 1, 24, '#2f3b5c');
    }
    t.goruntu(X, Y).setOrigin(0);
    const ogeler: Phaser.GameObjects.GameObject[] = [];
    const tw = EV.w - 64;
    const metin = (x: number, y: number, m: string, boy: number, renk: string, w = tw): Phaser.GameObjects.Text => {
      const o = this.add
        .text(snap(x), snap(y), m, { fontFamily: FONT, fontSize: `${boy}px`, color: renk, wordWrap: { width: w, useAdvancedWrap: true }, lineSpacing: 2 })
        .setOrigin(0, 0);
      ogeler.push(o);
      return o;
    };
    const baslik = this.sigdir(this.add.text(snap(X + 32), snap(Y + 44), EV_SONUC_BASLIK, { fontFamily: FONT, fontSize: '52px', color: PAL.kremAcik }).setOrigin(0, 0.5), tw);
    ogeler.push(baslik);
    let y = Y + 112;
    if (s.kendiBina) y += metin(X + 32, y, EV_KENDI_BINA, 26, PAL.murekkepSoluk).height + 16;
    // Evin durumu: tonun renginde dolu şerit, üstünde açık yazı (değerlendirme şeridi gibi).
    const renk = s.durum === 'saglam' ? PAL.damgaGuvenli : s.durum === 'hafif' || s.durum === 'hasarli' ? PAL.damgaGuclendir : PAL.damgaBosalt;
    const durum = metin(X + 48, y + 16, EV_DURUM_METIN[s.durum], 34, '#f4ecd6', tw - 32);
    const serit = this.add.rectangle(snap(X + 32), snap(y), snap(tw), snap(durum.height + 32), num(renk)).setOrigin(0);
    ogeler.push(serit);
    durum.setDepth(1);
    y += durum.height + 32 + 24;
    // G45: soyut ev hasarlı ya da ağır hasarlı ve en çok bir taksit ödendiyse nedeni (bağlam cümlesi).
    const baglam = evBaglamCumlesi(s);
    if (baglam) y += metin(X + 32, y, baglam, 28, PAL.murekkepSoluk).height + 16;
    // G43: güçlendirme taksit durumu; güçlendirme, çanta ve sabitleme cümleleri kademeye göre. Solda işaret kutusu
    // (hiç alınmadı: kırmızı, kısmen: sarı, tamam: yeşil), yanında cümle.
    y += metin(X + 32, y, evTaksitSatiri(s.guclendirme), 28, PAL.etiket).height + 16;
    const satir = (n: number, m: string): void => {
      const r = n === 0 ? PAL.damgaBosalt : n >= EV_KADEME ? PAL.damgaGuvenli : PAL.damgaGuclendir;
      const kutu = this.add.rectangle(snap(X + 32), snap(y + 4), 24, 24, num(r)).setOrigin(0);
      ogeler.push(kutu);
      const o = metin(X + 72, y, m, 30, PAL.murekkep, tw - 40);
      y += o.height + 16;
    };
    satir(s.guclendirme, EV_GUCLENDIRME_METIN[s.guclendirme]);
    satir(s.canta, evCantaCumlesi(s));
    // G45: ev çöktüyse eşya sabitleme cümlesi yok (çanta cümlesi kalır).
    if (!evCoktu(s)) satir(s.sabitleme, EV_SABITLEME_METIN[s.sabitleme]);
    if (s.kendiBina?.evPayi) y += metin(X + 32, y, EV_PAYLI, 28, PAL.murekkepSoluk).height + 16;
    // Zarf bağı: zarf parası olmadan alınamayacak kalem alındıysa.
    const z = evZarfCumlesi(s);
    if (z) y += metin(X + 32, y + 8, z, 30, PAL.damgaBosalt).height + 24;
    // Altta evine harcanan (birikmiş para harcamalardan sonraki para).
    const alt = Y + EV.h - 64;
    const cizgi = this.add.rectangle(snap(X + 24), snap(alt - 32), EV.w - 48, PX, num(PAL.murekkepSoluk)).setOrigin(0);
    ogeler.push(cizgi);
    ogeler.push(this.sigdir(this.add.text(snap(X + 32), snap(alt), evHarcananSatiri(para(s.harcanan)), { fontFamily: FONT, fontSize: '30px', color: PAL.murekkep }).setOrigin(0, 0.5), tw));
    for (const o of ogeler) {
      const a = o as unknown as Phaser.GameObjects.Components.Alpha;
      a.setAlpha(0);
      this.tweens.add({ targets: o, alpha: 1, duration: 160, delay: gecikme });
    }
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
