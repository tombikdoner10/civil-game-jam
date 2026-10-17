// @beyan görsel
import * as Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { FONT } from '../config';
import { num, PAL } from '../desk/palette';
import { PX, rastgele, snap, Tuval } from '../desk/pixel';
import { hazirGostergesi, masaCiz, pikselDugme, pikselDugmeEni } from '../desk/props';
import { DAMGA_ADI, DAMGA_RENK } from '../desk/Kaselik';
import type { Damga } from '../game/building';
import { SON_GUN } from '../game/days';
import { ZARF_ETIKET } from '../game/diyalog';
import { KISA_YOL_ACIKLAMA, KISA_YOL_DEVAM, KISA_YOL_DUGME, kucukDepremSatiri } from '../game/gazete';
import { kisaYolKayitlari } from '../game/ornek';
import { KUSUR_BILGI } from '../game/rules';
import { gunHesabi, type GunKaydi, type Karar, type SarsintiKaydi } from '../game/session';
import { TUNING } from '../game/tuning';
import { fadeIn, goTo } from '../systems/transition';
import type { GameData } from './GameScene';
import { SCENES } from './keys';
import type { DepremData } from './QuakeScene';

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

const SONRAKI = 'SONRAKİ GÜN';
/**
 * Gün 1'deki iki düğme (G25): aynı genişlik ve yazı boyu (kısa yol metni 44 px'te kâğıda sığmıyor), aralarında boşluk.
 * İkisinin toplamı kâğıdın iç genişliğine (KAGIT.w − 2·40) sığar.
 */
const IKILI = { boyut: 36, ara: 48 };

/**
 * Giriş koruması (ms, sahne açılışından): rapor açılırken basılı kalan ya da çift basılan Enter geçmesin. Önceki
 * sahnenin kararması (~220 ms) ile birlikte ilk Enter'dan ~0,5 sn sonra ikinci Enter çalışır (G23b). Koruma sürerken
 * birincil düğme soldan sağa dolar, bitince bir kez parlar ("hazır"). Koruma sürerken basılan (tekrar olmayan) Enter
 * beklemeye alınır ve koruma bitince bir kez işlenir (G26).
 */
const GIRIS_KORUMA_MS = 300;

/**
 * Gün sonu ekranı (Papers, Please'in gün sonu özeti gibi): masada bir rapor kâğıdı. Her dosya için bina,
 * verdiğin damga, doğru damga, inceleme modunda bulduğun kusurlar ve sonuç; altta maaş, ceza, günün
 * toplamı ve birikmiş para (yer tutucu değerler, TUNING.para). "Sonraki gün" (Enter/Space) bir sonraki güne,
 * son günden sonra "Gece" ile büyük depreme geçer (G5). Gün 1'de Enter/Space kısa yol "Depremi şimdi yaşa"
 * (G21b); "Sonraki gün" N ya da tıklama.
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
    // Gün sayacı ("1/5") yok (G11): deprem önceden bilinmez, kaçıncı günde olacağı ima edilmesin.
    yaz(L + 40, T + 44, `GÜN ${v.gun} · GÜN SONU`, 64, PAL.kremAcik);
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
        // Zarf alınan dosya (G22): sonuç sütununun solunda kırmızı işaret; kusur yazısı ona yer bırakır.
        const zarf = !!k.zarf?.kabul;
        ogeler.push(this.sigdir(yaz(L + SUTUN.kusur, y, bulunan, 30), SUTUN.sonuc - SUTUN.kusur - (zarf ? 250 : 150)));
        if (zarf) ogeler.push(yaz(L + SUTUN.sonuc - 128, y, ZARF_ETIKET, 30, PAL.damgaBosalt, 1));
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
      // Tek sayı ve tek liste (G25): çatlayan her bina damgası ve içinde insan olup olmadığıyla, dosya sırasıyla.
      const sira = new Map(v.dosyalar.map((d, i) => [d.id, i]));
      const adres = new Map(v.dosyalar.map((d) => [d.id, d.adres]));
      const catlayan = v.oncu.sonuclar
        .filter((s) => s.durum !== 'ayakta')
        .sort((a, b) => (sira.get(a.dosyaId) ?? 0) - (sira.get(b.dosyaId) ?? 0));
      const metin = kucukDepremSatiri(
        catlayan.map((s) => ({ ad: adres.get(s.dosyaId) ?? s.dosyaId, damga: kararlar.get(s.dosyaId)?.damga ?? 'guvenli', bos: s.bos })),
      );
      const kotu = catlayan.some((s) => !s.bos);
      const satir = yaz(L + 40, y + 20, metin, 34, kotu ? PAL.damgaBosalt : PAL.damgaGuvenli);
      this.sigdir(satir, KAGIT.w - 80);
      satir.setAlpha(0);
      this.tweens.add({ targets: satir, alpha: 1, duration: 160, delay: 200 + v.dosyalar.length * 90 + 120 });
      oncuH = 56;
    }

    // Hesap
    const P = TUNING.para;
    // Hesap bloğu düğmelerin odak çerçevesine değmesin (G11): en geç T + 680'de başlar.
    const hy = Math.max(y + 24 + oncuH, T + 680);
    this.add.rectangle(L + 32, hy - 16, KAGIT.w - 64, PX, num(PAL.murekkepSoluk)).setOrigin(0);
    const sol = L + 40;
    // Sayılar toplanınca dosya sayısını verir (G5b): Doğru + Yanlış + İşlenmedi = dosya. İADE ayrı bir sayı değil;
    // doğru ya da yanlış içinde sayılır ve satırında "içinde İADE" olarak gösterilir (binalar denetlenmeden kaldı).
    const iadeDogru = v.kararlar.filter((k) => k.damga === 'iade' && k.dogru).length;
    const iadeYanlis = v.kararlar.filter((k) => k.damga === 'iade' && !k.dogru).length;
    const icinde = (n: number): string => (n > 0 ? `  (içinde İADE: ${n})` : '');
    const SA = 42;
    yaz(sol, hy + 24, `Doğru: ${hesap.dogru}${icinde(iadeDogru)}`, 34, PAL.damgaGuvenli);
    yaz(sol, hy + 24 + SA, `Yanlış: ${hesap.yanlis}${icinde(iadeYanlis)}`, 34, PAL.damgaBosalt);
    let sy = hy + 24 + SA * 2;
    if (hesap.islenmeyen > 0) {
      yaz(sol, sy, `İşlenmedi: ${hesap.islenmeyen}`, 34, PAL.murekkepSoluk);
      sy += SA;
    }
    this.add.rectangle(sol, sy - 12, 240, PX, num(PAL.murekkepSoluk)).setOrigin(0);
    yaz(sol, sy + 12, `Toplam: ${v.dosyalar.length} dosya`, 34, PAL.murekkep);
    sy += SA + 12;
    // Zarf (G17): kabul edilenler günün toplamına eklenir; ayrı satır.
    if (hesap.zarfTeklif > 0) {
      const ret = hesap.zarfTeklif - hesap.zarfKabul;
      const metin = hesap.zarfKabul > 0 ? `Zarf: +${para(hesap.zarf)} (${hesap.zarfKabul} kabul${ret > 0 ? `, ${ret} ret` : ''})` : `Zarf: ${ret} ret`;
      yaz(sol, sy, metin, 34, hesap.zarfKabul > 0 ? PAL.damgaBosalt : PAL.murekkepSoluk);
    }
    const ad = L + 640;
    const deger = L + KAGIT.w - 40;
    const satirlar: [string, string, string][] = [
      [`Maaş (${hesap.dogru} × ${P.maas})`, `+${para(hesap.maas)}`, PAL.murekkep],
      [`Ceza (${hesap.yanlis} × ${P.ceza})`, hesap.ceza > 0 ? para(-hesap.ceza) : para(0), PAL.damgaBosalt],
      [hesap.zarf > 0 ? 'Günün toplamı (zarf dahil)' : 'Günün toplamı', para(hesap.toplam), PAL.murekkep],
      ['Birikmiş', para(yeniPara), PAL.murekkep],
    ];
    satirlar.forEach(([a, b, renk], i) => {
      const yy = hy + 24 + i * 48;
      if (i === 2) this.add.rectangle(ad, yy - 26, deger - ad, PX, num(PAL.murekkepSoluk)).setOrigin(0);
      yaz(ad, yy, a, 36, i >= 2 ? PAL.murekkep : PAL.etiket);
      yaz(deger, yy, b, i === 3 ? 44 : 36, renk, 1);
    });

    // Sonraki gün düğmesi; gün 1'de yanında kısa yol (G21, jüri yolu; soru biçimli düğme). Gün 1'de kısa yol
    // birincil (G21b, lider kararı): Enter/Space ve D onu seçer, düğmesi çerçeveli ve nabız gibi atar; "Sonraki gün"
    // ikincil (gri, tıklama ya da N). Gün 2-5'te Enter/Space yine "Sonraki gün".
    const son = v.gun >= SON_GUN;
    const kisaVar = v.gun === 1 && !son;
    const by = T + KAGIT.h - 64;
    const kb = this.input.keyboard;
    const tus = (): void => this.devam(yeniPara);
    const kisaTus = (): void => this.devam(yeniPara, true);
    // Enter (G26): giriş koruması sürerken (rapor kararmadan açılırken) basılan Enter kaybolmaz, koruma bitince bir
    // kez işlenir. Basılı tutulan tuşun tekrarı (önceki sahneden kalan) beklemeye alınmaz. Space, D ve N eskisi gibi.
    let bekleyen: (() => void) | undefined;
    const enterIle =
      (is: () => void) =>
      (e?: KeyboardEvent): void => {
        if (this.hazir) is();
        else if (!e?.repeat) bekleyen = is;
      };
    const enterTus = enterIle(tus);
    const enterKisa = enterIle(kisaTus);
    const nTus = (e: KeyboardEvent): void => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.keyCode === Phaser.Input.Keyboard.KeyCodes.N || e.code === 'KeyN' || e.key === 'n' || e.key === 'N') tus();
    };
    // Gün 1'de iki düğme aynı genişlikte ve aynı yazı boyunda (G25): kâğıdın ortasına göre simetrik.
    const ikili = kisaVar ? { boyut: IKILI.boyut, en: pikselDugmeEni(this, [[SONRAKI, 'N', IKILI.boyut], [KISA_YOL_DUGME, 'Enter', IKILI.boyut]]) } : undefined;
    const dugme = pikselDugme(
      this,
      L + KAGIT.w / 2,
      by,
      son ? 'GECE' : SONRAKI,
      kisaVar ? 'N' : 'Enter',
      tus,
      kisaVar ? { govde: PAL.cerceveAcik, acik: '#7a7466', koyu: PAL.cerceve } : undefined,
      ikili,
    );
    this.tweens.add({ targets: dugme, alpha: 1, duration: 120 });
    let birincil = dugme;
    if (kisaVar) {
      const kd = pikselDugme(
        this,
        L + KAGIT.w / 2,
        by,
        KISA_YOL_DUGME,
        'Enter',
        kisaTus,
        { govde: PAL.damgaBosalt, acik: '#c4544a', koyu: '#6e2a24' },
        ikili,
      );
      // Aralarında IKILI.ara; ikisinin toplamı kâğıdın ortasında (eşit genişlik: ikisi de ortadan eşit uzakta).
      const yari = (dugme.width + IKILI.ara) / 2;
      dugme.setX(snap(L + KAGIT.w / 2 - yari));
      const kx = snap(L + KAGIT.w / 2 + yari);
      kd.setX(kx);
      this.tweens.add({ targets: kd, alpha: 1, duration: 120 });
      birincil = kd;
      // Odak çerçevesi: birincil düğmenin çevresinde, nabız gibi.
      const odak = this.add
        .rectangle(snap(kx), snap(by), snap(kd.width + 24), snap(kd.height + 24))
        .setStrokeStyle(PX, num(PAL.damgaBosalt))
        .setAlpha(0);
      this.tweens.add({ targets: odak, alpha: { from: 1, to: 0.25 }, duration: 600, delay: 600, yoyo: true, repeat: -1, ease: 'Stepped', easeParams: [3] });
      // Açıklama: küçük deprem satırının altında (yer tutucu); altında oyunun sonra sürdüğünü söyleyen satır (G11).
      const ac = yaz(L + 40, y + 20 + oncuH, KISA_YOL_ACIKLAMA, 32, PAL.damgaBosalt);
      this.sigdir(ac, KAGIT.w - 80);
      const devamSatiri = yaz(L + 40, y + 20 + oncuH + 44, KISA_YOL_DEVAM, 30, PAL.murekkepSoluk);
      this.sigdir(devamSatiri, KAGIT.w - 80);
      for (const o of [ac, devamSatiri]) {
        o.setAlpha(0);
        this.tweens.add({ targets: o, alpha: 1, duration: 160, delay: 400 });
      }
      kb?.on('keydown-ENTER', enterKisa);
      kb?.on('keydown-SPACE', kisaTus);
      kb?.on('keydown-D', kisaTus);
      // "Sonraki gün": N (küçük ya da büyük harf, Shift gerekmez; G23b). Tuş kodu yoksa event.key/code'a da bakılır.
      kb?.on('keydown', nTus);
    } else {
      kb?.on('keydown-ENTER', enterTus);
      kb?.on('keydown-SPACE', tus);
    }
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const ad of ['keydown-ENTER', 'keydown-SPACE', 'keydown-D']) {
        kb?.off(ad, tus);
        kb?.off(ad, kisaTus);
      }
      kb?.off('keydown-ENTER', enterTus);
      kb?.off('keydown-ENTER', enterKisa);
      kb?.off('keydown', nTus);
    });
    // Rapor açılırken yanlışlıkla geçilmesin (giriş koruması); birincil düğmede "hazır" göstergesi.
    hazirGostergesi(this, birincil, GIRIS_KORUMA_MS);
    this.time.delayedCall(GIRIS_KORUMA_MS, () => {
      this.hazir = true;
      bekleyen?.();
    });
    sfx.play('kagitKay');
    // Gün sonu jingle'ı: yanlış ya da işlenmeyen dosya yoksa iyi gün, varsa kötü gün.
    const iyi = hesap.yanlis === 0 && hesap.islenmeyen === 0;
    this.time.delayedCall(350, () => sfx.play(iyi ? 'gunIyi' : 'gunKotu'));
  }

  private devam(yeniPara: number, kisa = false): void {
    if (!this.hazir || this.gecildi) return;
    this.gecildi = true;
    sfx.play('confirm');
    const v = this.veri;
    const kayit: GunKaydi = { gun: v.gun, kararlar: v.kararlar };
    if (v.oncu) kayit.oncu = v.oncu;
    const kayitlar: GunKaydi[] = [...v.kayitlar, kayit];
    if (kisa) {
      // Kısa yol (G21): oyuncunun binaları önde, ardından gün 2-5'i temsil eden örnek binalar; kısa deprem.
      // Oyuncunun kayıtları ayrı taşınır (sonuç ekranı, "Gün 2'den devam"); örnekler kayıtlara karışmaz.
      const data: DepremData = {
        tohum: v.tohum,
        para: yeniPara,
        kayitlar: [...kayitlar, ...kisaYolKayitlari(v.tohum)],
        kisa: { gercek: kayitlar, juri: v.kararlar.map((k) => k.dosyaId) },
      };
      goTo(this, SCENES.Quake, data, 600);
      return;
    }
    if (v.gun >= SON_GUN) {
      // Son gün: gece ve büyük deprem (gece geçişi QuakeScene'de; buradan daha yavaş kararır).
      const data: DepremData = { tohum: v.tohum, para: yeniPara, kayitlar };
      goTo(this, SCENES.Quake, data, 600);
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
}
