import * as Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { DEV, FONT } from '../config';
import { DocumentCard, MASA, ustKatman } from '../desk/DocumentCard';
import { belgeKur, BOY, isteDugmesi, raporKur } from '../desk/documents';
import { PX, snap } from '../desk/pixel';
import { DUGME, Inspect, type Yuzey } from '../desk/Inspect';
import { PAL } from '../desk/palette';
import { fisDusur, fisKaldir, fisKur, masaCiz } from '../desk/props';
import { Klasor } from '../desk/Klasor';
import { RuleNote } from '../desk/RuleNote';
import { DAMGA_ADI, damgaIzi, Kaselik, RAF_SOL } from '../desk/Kaselik';
import { binaEtiketi, ETIKET_KUCUK, ETIKET_KUCUK_YUKSEKLIK, type BinaEtiketi } from '../desk/BinaEtiketi';
import { Quake } from '../desk/Quake';
import { GISE_ALAN, GOZ, MASA_Y, Pencere, SOKAK_DERINLIK } from '../desk/Window';
import { yerlesim, type Yerlesim } from '../desk/yerlesim';
import { Cekmece, Zarf, ZARF_BOY } from '../desk/Zarf';
import { Portre, PORTRE_EKRAN } from '../desk/Portre';
import type { Damga, KusurId, Kural } from '../game/building';
import { CERCEVE, DAMGA_TEPKI, ISTE_BELGE_METIN, ISTE_METIN, satir, SELAM, SOR_METIN, ZARF_TEPKI } from '../game/diyalog';
import type { Ifade, IsteAlani } from '../game/kisi';
import { oncuEtiketi } from '../game/gazete';
import { KUSUR_BILGI } from '../game/rules';
import { ornekKayitlar } from '../game/ornek';
import { gunAyar } from '../game/days';
import { GunOturumu, gunHesabi, sokakKayitlari, type GunKaydi, type SarsintiKaydi } from '../game/session';
import { TUNING } from '../game/tuning';
import type { DayEndData } from './DayEndScene';
import { Controls } from '../systems/controls';
import { punch } from '../systems/fx';
import { fadeIn, goTo } from '../systems/transition';
import { SCENES } from './keys';

/** Günler arasında taşınan oyun durumu. Menüden boş gelir (gün 1, yeni tohum). */
export interface GameData {
  gun?: number;
  tohum?: number;
  /** Birikmiş para (önceki günlerin toplamı). */
  para?: number;
  /** Önceki günlerin kararları (sokak ve deprem günü için; G4b/G5). */
  kayitlar?: GunKaydi[];
}

/** Öncü sarsıntı şeridi (yer tutucu metin; takım yazacak). */
const ONCU_YAZI = '[Öncü sarsıntı. Asıl deprem gelecek.]';

/**
 * Masada boş yer yoksa uyarı fişi gişe camının sol alt köşesine düşer (belgeleri örtmez). x: sol kenar;
 * w: siluetin solunda kalan genişlik (siluet gişenin ortasında, yaklaşık 1424-1712).
 */
const FIS_GISE = { x: 1256, w: 160, alt: 384, derinlik: 3500 };

/** İSTE ile gelen ve giden kartın kayarken derinliği: masanın (0) üstünde, kapalı klasörün (5) ve belgelerin altında. */
const KAYAN_DERINLIK = 4;

/** İSTE balonunun başlığı (yer tutucu). */
const ISTE_BASLIK: Record<IsteAlani, string> = {
  karot: 'İSTE · KAROT RAPORU',
  zemin: 'İSTE · ZEMİN ETÜDÜ',
  ruhsat: 'İSTE · RUHSAT',
  vaziyet: 'İSTE · VAZİYET PLANI',
};

/** Damgaya göre gişedeki kişinin yüzü. */
const DAMGA_IFADE: Record<Damga, Ifade> = { guvenli: 'sevincli', guclendir: 'mahcup', bosalt: 'kizgin', iade: 'kizgin' };

/** Masa sahnesi: üstte belediye penceresi ve gişe, altta masa, belgeler, yönetmelik klasörü ve kaşelik. */
export class GameScene extends Phaser.Scene {
  private controls!: Controls;
  private oturum!: GunOturumu;
  private gun = 1;
  private tohum = 0;
  private para = 0;
  private kayitlar: GunKaydi[] = [];
  private yer!: Yerlesim;
  private not?: RuleNote;
  private kartlar: DocumentCard[] = [];
  /** Damgalanmış dosyanın masadan kalkmakta olan belgeleri (fiş yeri ve kusur işaretleri için hâlâ masada). */
  private giden: DocumentCard[] = [];
  private mesgul = true;
  private bitirildi = false;
  private pencere!: Pencere;
  private kaselik!: Kaselik;
  private fis?: Phaser.GameObjects.Container;
  private ilkDosya = true;
  private inceleme!: Inspect;
  private kitap?: Klasor;
  private ipucu?: Phaser.GameObjects.Text;
  /** Bu günün öncü sarsıntı sonucu (gün sonu raporuna gider). */
  private oncu?: SarsintiKaydi;
  /** Gişeden kayan zarf (G17) ve onu alan çekmece. */
  private zarf?: Zarf;
  private cekmece!: Cekmece;

  constructor() {
    super(SCENES.Game);
  }

  init(data: GameData): void {
    this.gun = data?.gun ?? 1;
    this.tohum = data?.tohum ?? Math.floor(Math.random() * 1_000_000_000);
    this.para = data?.para ?? TUNING.para.baslangic;
    this.kayitlar = data?.kayitlar ?? [];
    // ?dev&gun=N&tohum=M yalnızca ilk girişte (menüden); sonraki günler veriden gelir.
    if (DEV && data?.gun === undefined) {
      const q = new URLSearchParams(location.search);
      const g = Number(q.get('gun'));
      const t = q.get('tohum');
      if (q.has('gun') && Number.isFinite(g) && g >= 1) this.gun = Math.floor(g);
      if (t !== null && Number.isFinite(Number(t))) this.tohum = Number(t);
      // ?dev&gun=N&sokak: önceki günler örnek kararlarla dolu gelsin (sokak ve deprem testleri için).
      if (q.has('sokak')) {
        this.kayitlar = ornekKayitlar(this.tohum, this.gun);
        // Para da örnek günlerin toplamı (sonuç ekranındaki birikmiş para tablo toplamıyla tutarlı olsun).
        this.para += this.kayitlar.reduce((n, k) => n + gunHesabi(k.kararlar, gunAyar(k.gun).dosyaSayisi).toplam, 0);
      }
    }
    this.kartlar = [];
    this.giden = [];
    this.mesgul = true;
    this.bitirildi = false;
    this.fis = undefined;
    this.ilkDosya = true;
    this.ipucu = undefined;
    this.not = undefined;
    this.kitap = undefined;
    this.oncu = undefined;
    this.zarf = undefined;
  }

  create(): void {
    fadeIn(this);
    this.cameras.main.setRoundPixels(true);
    this.controls = new Controls(this);
    this.oturum = new GunOturumu(this.gun, this.tohum);
    const ayar = this.oturum.ayar;
    this.yer = yerlesim(this.gun);
    if (DEV) this.input.keyboard?.on('keydown-ENTER', () => this.bitir());

    MASA.x = 0;
    MASA.y = MASA_Y;
    MASA.w = RAF_SOL;
    MASA.h = 1080 - MASA_Y;
    masaCiz(this, MASA_Y);
    // Yönetmelik klasörü gün 2'den; gün 1'de masada yalnızca kural notu (hedef ve tek kural).
    if (ayar.kitap) {
      this.kitap = new Klasor(this, this.yer.kitap[0], this.yer.kitap[1], this.gun);
      // Kapalı klasörün üstündeki belgeye ya da nota tıklamak klasörü açmasın (inceleme modunda belgeler tıklama almaz).
      this.kitap.ortulu = (x, y) =>
        this.masadakiKartlar().some((k) => k.sinir().contains(x, y)) || (!!this.not?.active && this.not.sinir().contains(x, y));
    }
    if (ayar.not) this.notGetir(ayar.not.gorev, ayar.not.kurallar);
    this.pencere = new Pencere(this, this.gun, sokakKayitlari(this.tohum, this.kayitlar));
    // Kaşelik (masanın sağı; masa sınırı onun solunda biter). Kaşeler kurallarla gelir (gün ayarı).
    this.kaselik = new Kaselik(this, ayar.kaseler, ayar.yeniKaseler, {
      hedef: () => this.muhurYeri(),
      vur: (d, x, y) => this.damgala(d, x, y),
      dokunuldu: () => {
        if (this.inceleme.acik) this.inceleme.kapa();
      },
    });

    this.cekmece = new Cekmece(this);
    this.incelemeKur();
    this.dosyaGetir();
    if (DEV && new URLSearchParams(location.search).has('portreler')) this.portreler();

    // Pencere odağı kaçarsa (alt-tab, başka sekme) oyunu duraklat.
    const onBlur = (): void => {
      if (this.scene.isActive()) this.pauseGame();
    };
    this.game.events.on(Phaser.Core.Events.BLUR, onBlur);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.game.events.off(Phaser.Core.Events.BLUR, onBlur));
  }

  update(_time: number, delta: number): void {
    if (this.controls.justDown('pause')) {
      // Esc önce inceleme modunu kapatır, kapalıyken duraklatır.
      if (this.inceleme.acik) this.inceleme.kapa();
      else this.pauseGame();
      return;
    }
    if (this.controls.justDown('action')) this.inceleme.degistir();
    if (this.bitirildi) return;
    if (!this.mesgul) {
      // Gün 1 ilk dosyada "Space: İNCELE" ipucu duruyorken (öğrenme anı) saat yavaş akar.
      const hiz = this.ipucu && this.oturum.no === 1 ? TUNING.mesai.ipucuHiz : 1;
      this.oturum.ilerle((Math.min(delta, 100) / 1000) * hiz);
      if (this.oturum.mesaiBitti) {
        this.mesgul = true;
        this.bitir();
        return;
      }
    }
    this.pencere.setSaat(this.oturum.saatMetni());
  }

  /** İnceleme modu: açıkken belgeler sürüklenmez; kaşeye dokunmak modu kapatır. */
  private incelemeKur(): void {
    this.inceleme = new Inspect(this, {
      yuzeyler: () => {
        const out: Yuzey[] = this.masadakiKartlar().map((k) => ({
          derinlik: k.depth,
          sinir: k.sinir(),
          alanlar: k.alanlar(),
        }));
        if (this.not?.active) out.push(this.not.yuzey());
        const kitap = this.kitap?.yuzey();
        if (kitap) out.push(kitap);
        return out;
      },
      kontrol: (secim) => this.oturum.incele(secim),
      izin: () => !this.mesgul && !this.bitirildi,
      sorulabilir: (id) => this.oturum.sorulabilir(id),
      istenebilir: (id) => this.oturum.isteAlani(id) !== null,
    });
    this.inceleme.on('sor', (id: KusurId) => this.sor(id));
    // Geçersiz belge (G17b): etiketteki İSTE, belgenin düzgününü ister.
    this.inceleme.on('iste', (id: KusurId) => {
      const alan = this.oturum.isteAlani(id);
      const kart = alan ? this.kartlar.find((k) => k.tur === alan && k.active) : undefined;
      if (alan && kart) this.iste(alan, kart);
    });
    // Tutarsızlık bulununca gişedeki kişi gerilir.
    this.inceleme.on('bulundu', () => {
      if (!this.mesgul) this.pencere.ifade('gergin');
    });
    this.inceleme.on('ac', () => {
      for (const k of this.kartlar) k.disableInteractive(true);
      this.zarf?.disableInteractive(true);
      this.not?.disableInteractive(true);
      this.kitap?.kilitle(true);
      if (this.ipucu) {
        this.tweens.killTweensOf(this.ipucu);
        this.ipucu.destroy();
        this.ipucu = undefined;
      }
    });
    this.inceleme.on('kapa', () => {
      for (const k of this.kartlar) if (k.active) k.setInteractive();
      if (this.zarf?.active && !this.mesgul) this.zarf.setInteractive();
      this.not?.setInteractive();
      this.kitap?.kilitle(false);
    });
    // Gün 1 ipucu (yer tutucu metin): inceleme modu bir kez açılınca kaybolur.
    if (this.gun === 1) {
      this.ipucu = this.add
        .text(DUGME.x + DUGME.w / 2 + 24, DUGME.y, '< Space: İNCELE', { fontFamily: FONT, fontSize: '32px', color: PAL.saat })
        .setOrigin(0, 0.5)
        .setDepth(3020);
      this.tweens.add({ targets: this.ipucu, alpha: 0.25, duration: 420, yoyo: true, repeat: -1 });
    }
  }

  /** Masadaki belgeler: mevcut dosyanınkiler ve damgalanıp henüz kalkmamış olanlar. */
  private masadakiKartlar(): DocumentCard[] {
    return [...this.kartlar, ...this.giden].filter((k) => k.active);
  }

  /** Gün 1 kural notu: gişeden masaya kayar ve gün boyu masada kalır. */
  private notGetir(gorev: string, kurallar: Kural[]): void {
    // Gün 1: notun en üstünde oyunu çerçeveleyen tek cümle (G5b, yer tutucu).
    const not = new RuleNote(this, GOZ.x, GOZ.y, this.gun, gorev, kurallar, this.gun === 1 ? CERCEVE : undefined);
    not.setDepth(ustKatman()).setAlpha(0);
    const [x, y] = not.masadaKonum(this.yer.not[0], this.yer.not[1]);
    this.tweens.add({ targets: not, alpha: 1, duration: 120, delay: 150 });
    this.tweens.add({ targets: not, x, y, duration: 460, delay: 150, ease: 'Cubic.easeOut', onStart: () => sfx.play('kagitKay') });
    this.not = not;
  }

  /**
   * Uyarı fişi için masada boş yer (belge, not ve kitapla örtüşmeyen; birden çoksa gişeye en yakın).
   * Hiç boş yer yoksa null (fiş gişe camına düşer).
   */
  private bosYer(w: number, h: number): [number, number] | null {
    const engel: Phaser.Geom.Rectangle[] = this.masadakiKartlar().map((k) => k.sinir());
    if (this.not?.active) engel.push(this.not.sinir());
    if (this.kitap) engel.push(this.kitap.sinir);
    engel.forEach((r) => Phaser.Geom.Rectangle.Inflate(r, 12, 12));
    let en: [number, number] | null = null;
    let enPuan = Infinity;
    // 16 px adımlı ızgara; masa kenarlarına ve engellerin kenarlarına dayalı konumlar da denenir (dar boşluklar kaçmasın).
    const adimlar = (bas: number, son: number, kenarlar: number[]): number[] => {
      const out: number[] = [];
      for (let v = bas; v < son; v += 16) out.push(v);
      out.push(son, ...kenarlar.filter((v) => v >= bas && v <= son));
      return out;
    };
    const ys = adimlar(MASA.y + h / 2 + 8, MASA.y + MASA.h - h / 2 - 8, engel.flatMap((e) => [e.top - h / 2 - 4, e.bottom + h / 2 + 4]));
    const xs = adimlar(MASA.x + w / 2 + 8, MASA.x + MASA.w - w / 2 - 8, engel.flatMap((e) => [e.left - w / 2 - 4, e.right + w / 2 + 4]));
    for (const y of ys)
      for (const x of xs) {
        const r = new Phaser.Geom.Rectangle(x - w / 2, y - h / 2, w, h);
        const ortu = engel.some((e) => Phaser.Geom.Intersects.RectangleToRectangle(r, e));
        if (ortu) continue;
        const puan = Math.hypot(x - GOZ.x, y - MASA.y);
        if (puan < enPuan) {
          enPuan = puan;
          en = [x, y];
        }
      }
    return en;
  }

  /** Sıradaki dosya: siluet gişeye gelir, bina pencerede görünür, belgeler gişe gözünden masaya kayar. */
  private dosyaGetir(): void {
    const bina = this.oturum.mevcut;
    if (!bina) return;
    // Önceki dosyanın fişi kayarak masadan çekilir.
    if (this.fis) {
      fisKaldir(this, this.fis);
      this.fis = undefined;
    }
    // Yeni dosyada açık klasör kapanır (G5b): belgeler klasörün altına ya da üstüne karışmasın.
    if (this.kitap?.acik) this.kitap.kapa();
    this.pencere.setDosya(this.oturum.no, this.oturum.toplam);
    this.pencere.binaGoster(bina);
    const kisi = this.oturum.kisi;
    if (kisi) {
      this.pencere.kisiGelsin(kisi);
      const id = bina.id;
      this.time.delayedCall(TUNING.diyalog.selamGecikme, () => {
        if (this.oturum.mevcut?.id === id && !this.bitirildi) this.pencere.soyle(satir(SELAM, kisi.selam), 'notr');
      });
    }
    sfx.play('siluet');
    const gecikme = 350;
    const belgeler = this.oturum.ayar.belgeler;
    this.kartlar = belgeler.map((tur, i) => {
      const [hx, hy] = this.yer.belge[tur];
      const k = belgeKur(this, tur, bina, this.gun, GOZ.x, GOZ.y - BOY[tur][1] / 2);
      k.setDepth(ustKatman()).setAlpha(0);
      // Eksik belge: sahibinden İSTE (G17).
      if ((tur === 'karot' || tur === 'zemin') && this.oturum.istenebilir(tur)) isteDugmesi(k, () => this.iste(tur, k));
      this.tweens.add({ targets: k, alpha: 1, duration: 120, delay: gecikme + i * 80 });
      this.tweens.add({
        targets: k,
        x: snap(hx),
        y: snap(hy),
        duration: 420,
        delay: gecikme + i * 80,
        ease: 'Cubic.easeOut',
        onStart: () => sfx.play('kagitKay', { volume: 0.7 }),
        // Son belge masaya inince kâğıt sesi.
        // Son belge masaya inince kâğıt sesi; mesai saati ancak o zaman işlemeye başlar.
        onComplete: () => {
          if (i === belgeler.length - 1) {
            sfx.play('kagitBirak');
            this.belgelerOturdu();
          }
        },
      });
      return k;
    });
  }

  /** Dosyanın bütün belgeleri masada: masa açılır, saat işler; gün 1 ilk dosyada kaşelik göz kırpar. */
  private belgelerOturdu(): void {
    if (this.bitirildi) return;
    this.mesgul = false;
    if (this.ilkDosya) {
      this.ilkDosya = false;
      if (this.gun === 1) this.kaselik.ipucuBaslat();
    }
  }

  /** Tek tıklamalı kaşenin ineceği yer: ruhsatın sol alt köşesi (mühür yeri). Damga vurulamıyorsa null. */
  private muhurYeri(): [number, number] | null {
    if (this.mesgul || this.bitirildi) return null;
    const r = this.kartlar.find((k) => k.tur === 'ruhsat' && k.active);
    if (!r) return null;
    return [snap(r.x - r.genislik / 2 + 152), snap(r.y + r.yukseklik / 2 - 60)];
  }

  // ---- Gişedeki kişi (G17): SOR, İSTE, zarf ----

  /** SOR: bulunan tutarsızlık kişiye sorulur; cevap balonda (bahane, itiraf ya da zarf). */
  private sor(id: KusurId): void {
    if (this.mesgul || this.bitirildi) return;
    const c = this.oturum.sor(id);
    if (!c) return;
    const baslik = `SOR · ${KUSUR_BILGI[id].etiket.toLocaleUpperCase('tr-TR')}`;
    this.pencere.soyle(satir(SOR_METIN[c.kusur][c.tur], c.secim, c.zarf), c.ifade, { baslik });
    if (c.zarf !== undefined) {
      const miktar = c.zarf;
      const dosya = this.oturum.mevcut?.id;
      this.time.delayedCall(700, () => {
        if (this.oturum.mevcut?.id === dosya && !this.mesgul) this.zarfGetir(miktar);
      });
    }
  }

  /** Zarf gişeden masaya kayar; çekmece açılır. Gişeye geri sürüklenirse ret, çekmeceye konursa kabul. */
  private zarfGetir(miktar: number): void {
    this.cekmece.ac(ustKatman());
    const z = new Zarf(this, miktar, GOZ.x, GOZ.y - 24);
    z.setDepth(ustKatman()).setAlpha(0);
    const yer = this.bosYer(ZARF_BOY.w, ZARF_BOY.h) ?? [GOZ.x - 300, MASA_Y + 100];
    this.tweens.add({ targets: z, alpha: 1, duration: 120 });
    this.tweens.add({ targets: z, x: snap(yer[0]), y: snap(yer[1]), duration: 460, ease: 'Cubic.easeOut' });
    sfx.play('zarfKay');
    z.on('birakildi', (x: number, y: number) => this.zarfBirakildi(z, x, y));
    if (this.inceleme.acik) z.disableInteractive(true);
    this.zarf = z;
  }

  private zarfBirakildi(z: Zarf, x: number, y: number): void {
    if (this.mesgul || this.zarf !== z) return;
    if (y < MASA_Y + 8) {
      // Gişeye geri verildi: ret.
      this.oturum.zarfKarar(false);
      this.zarf = undefined;
      z.disableInteractive();
      this.tweens.add({ targets: z, x: GOZ.x, y: GOZ.y - 60, alpha: 0, duration: 380, ease: 'Cubic.easeIn', onComplete: () => z.destroy() });
      sfx.play('zarfRet');
      this.cekmece.kapa(200);
      const t = this.oturum.kisi?.selam ?? 0;
      this.pencere.soyle(satir(ZARF_TEPKI.ret, t), t % 2 === 0 ? 'kizgin' : 'mahcup');
    } else if (this.cekmece.icinde(x, y)) {
      this.oturum.zarfKarar(true);
      this.zarfCekmeceye(z);
      this.pencere.soyle(satir(ZARF_TEPKI.kabul, this.oturum.kisi?.selam ?? 0), 'sevincli');
    }
  }

  /** Zarf çekmeceye kayar ve çekmece kapanır (kabul). */
  private zarfCekmeceye(z: Zarf): void {
    if (this.zarf === z) this.zarf = undefined;
    z.disableInteractive();
    const [x, y] = this.cekmece.agiz;
    this.tweens.add({ targets: z, x, y, scale: 0.7, duration: 260, ease: 'Cubic.easeIn' });
    this.tweens.add({ targets: z, alpha: 0, delay: 200, duration: 160, onComplete: () => z.destroy() });
    this.cekmece.kapa(300);
  }

  /**
   * İSTE: eksik belge ya da geçersiz belgenin düzgünü (G17b) kişiden istenir. Gerçek ya da sahte belge gelirse
   * kart gişeden kayar ve eski kartın ("Rapor yok" ya da geçersiz belge) yerine geçer (eski kart gişeye geri
   * döner); getiremezse kart gelmez.
   */
  private iste(alan: IsteAlani, eski: DocumentCard): void {
    if (this.mesgul || this.bitirildi) return;
    const once = this.oturum.mevcut;
    const eksik = !!once && (alan === 'karot' || alan === 'zemin') && once.belgeler[alan] === null;
    const c = this.oturum.iste(alan);
    const bina = this.oturum.mevcut;
    if (!c || !bina) return;
    this.pencere.soyle(satir((eksik ? ISTE_METIN : ISTE_BELGE_METIN)[c.tur], c.secim), c.ifade, { baslik: ISTE_BASLIK[alan] });
    const rapor = c.rapor;
    if (!rapor) return;
    this.time.delayedCall(TUNING.diyalog.raporGecikme, () => {
      if (this.oturum.mevcut?.id !== bina.id || this.mesgul || this.bitirildi) return;
      const yeni = raporKur(this, bina, rapor, this.gun, GOZ.x, GOZ.y);
      yeni.setY(GOZ.y - yeni.yukseklik / 2);
      const h = yeni.yukseklik;
      const hedef = eski.active ? [eski.x, eski.y] : this.yer.belge[alan];
      const [hx, hy] = yeni.masadaKonum(hedef[0], hedef[1]);
      // Kayarken yeni ve eski kart masadaki her şeyin altından geçer (G5b: öbür belgeleri ve klasörü örtmez); yeni
      // kart yerine inince eski kartın katmanına çıkar.
      const sonDerinlik = eski.active ? eski.depth : ustKatman();
      yeni.setDepth(KAYAN_DERINLIK).setAlpha(0);
      if (this.inceleme.acik) yeni.disableInteractive(true);
      this.tweens.add({ targets: yeni, alpha: 1, duration: 120 });
      this.tweens.add({
        targets: yeni,
        x: hx,
        y: hy,
        duration: 440,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          if (yeni.active && yeni.depth === KAYAN_DERINLIK) yeni.setDepth(sonDerinlik);
          sfx.play('kagitBirak');
        },
      });
      sfx.play('kagitKay');
      const i = this.kartlar.indexOf(eski);
      if (i >= 0) this.kartlar.splice(i, 1, yeni);
      else this.kartlar.push(yeni);
      if (eski.active) {
        this.input.setDraggable(eski, false);
        eski.disableInteractive();
        eski.setDepth(KAYAN_DERINLIK);
        this.tweens.add({ targets: eski, x: GOZ.x, y: GOZ.y - h / 2 - 40, alpha: 0, duration: 360, ease: 'Cubic.easeIn', onComplete: () => eski.destroy() });
      }
    });
  }

  /**
   * Kaşe (x, y) noktasına indi. Ruhsatın üstündeyse damga sayılır (true): mürekkep izi o noktada; değilse
   * (boş masa, başka belge, masa meşgul) false ve kaşe yerine döner.
   */
  private damgala(damga: Damga, x: number, y: number): boolean {
    if (this.mesgul || this.bitirildi) return false;
    const ruhsat = this.kartlar.find((k) => k.tur === 'ruhsat' && k.active);
    if (!ruhsat || !ruhsat.sinir().contains(x, y)) return false;
    const sonuc = this.oturum.damgala(damga);
    if (!sonuc) return false;
    this.mesgul = true;
    // Masada kalan zarf kabul sayıldı (oturum kaydetti): çekmeceye kayar. Kişi damgaya tepki verir.
    if (this.zarf) this.zarfCekmeceye(this.zarf);
    const sira = this.oturum.kararlar.length;
    this.time.delayedCall(260, () => this.pencere.soyle(satir(DAMGA_TEPKI[damga], sira + this.tohum), DAMGA_IFADE[damga]));

    // Kaşe indi: mürekkep izi ruhsatta, indiği yerde (kart içinde kalacak şekilde).
    sfx.play(damga === 'iade' ? 'iade' : 'damga');
    this.pencere.damgaVur(damga);
    punch(this, 0.01, 110);
    ruhsat.one();
    const iz = damgaIzi(this, damga, this.tohum + this.oturum.kararlar.length * 131);
    const mx = ruhsat.genislik / 2 - iz.displayWidth / 2 - 8;
    const my = ruhsat.yukseklik / 2 - iz.displayHeight / 2 - 8;
    iz.setPosition(snap(Phaser.Math.Clamp(x - ruhsat.x, -mx, mx)), snap(Phaser.Math.Clamp(y - ruhsat.y, -my, my)));
    ruhsat.add(iz);

    // Uyarı fişi (yer tutucu geri bildirim).
    this.time.delayedCall(450, () => {
      if (this.fis) fisKaldir(this, this.fis);
      // Yanlış kararda doğrusu ve dosyadaki kusurlar (atlanan ya da olmadığı halde görülen).
      // Eksiksiz dosyayı İADE etmek: gerekçe "dosya eksiksiz" (yer tutucu metin).
      const kusurlar = sonuc.etiketler.join('\n') || (damga === 'iade' ? 'Kusur yok, dosya eksiksiz' : 'Kusur yok');
      // Doğru kararda da kısa gerekçe (G5b): kusurlar ya da "Kusur yok", ok ve vurulan damga.
      const gerekce = `${sonuc.etiketler.join(', ') || 'Kusur yok'} → ${DAMGA_ADI[damga]}`;
      const metin = sonuc.dogru ? `Doğru karar\n${gerekce}` : `Yanlış karar\nDoğrusu: ${DAMGA_ADI[sonuc.dogruDamga]}\n${kusurlar}`;
      const fis = fisKur(this, sonuc.dogru, metin);
      // Masanın boş yerine; yer yoksa gişe camının altına (belge değerlerini örtmesin).
      // Önce tam boy, sığmazsa biraz küçük; masada hiç yer yoksa gişe camının sol kenarına küçülerek (silueti örtmez).
      let yer: [number, number] | null = null;
      for (const s of [1, 0.75]) {
        yer = this.bosYer(fis.width * s, fis.height * s);
        if (yer) {
          fis.setScale(s);
          break;
        }
      }
      if (yer) fisDusur(this, fis, yer[0], yer[1]);
      else {
        const s = Phaser.Math.Clamp(FIS_GISE.w / fis.width, 0.5, 1);
        fis.setScale(s);
        fisDusur(this, fis, FIS_GISE.x + (fis.width * s) / 2, FIS_GISE.alt - (fis.height * s) / 2, FIS_GISE.derinlik);
      }
      this.fis = fis;
      sfx.play('fis');
      sfx.play(sonuc.dogru ? 'dogru' : 'uyari');
    });

    // Belgeler toplanıp gişeden geri verilir, mal sahibi ayrılır.
    const eski = this.kartlar;
    this.kartlar = [];
    this.giden = eski;
    const topla = 1300;
    this.time.delayedCall(topla, () => {
      this.inceleme.dosyaBitti();
      this.pencere.kisiGitsin();
      sfx.play('siluet', { volume: 0.7 });
      eski.forEach((k, i) => {
        this.input.setDraggable(k, false);
        k.disableInteractive();
        this.tweens.add({
          targets: k,
          x: GOZ.x,
          y: GOZ.y - k.yukseklik / 2 - 40,
          duration: 380,
          delay: i * 50,
          ease: 'Cubic.easeIn',
          onComplete: () => k.destroy(),
        });
      });
      sfx.play('kagitTopla');
    });
    this.time.delayedCall(topla + 380 + eski.length * 50 + 120, () => {
      if (this.oturum.bitti) this.bitir();
      else this.dosyaGetir();
    });
    return true;
  }

  /** Gün bitti (dosyalar ya da mesai): öncü sarsıntı kancası, sonra gün sonu ekranı. */
  private bitir(): void {
    if (this.bitirildi) return;
    this.bitirildi = true;
    this.mesgul = true;
    if (this.inceleme.acik) this.inceleme.kapa();
    this.gunSonuOncesi(() => this.gunSonu());
  }

  /**
   * Gün sonu ekranından önceki adım: öncü sarsıntı olan günlerde (gün 1) sokak sallanır, zayıf binalar çatlar;
   * sonuç gün sonu raporuna ve sonraki günlerin sokağına taşınır. Sekans sırasında masa kilitli; Esc çalışır.
   */
  private gunSonuOncesi(devam: () => void): void {
    this.events.emit('gunSonuOncesi', this.oturum.ayar);
    if (!this.oturum.ayar.oncuSarsinti) {
      devam();
      return;
    }
    this.masaKilitle();
    const O = TUNING.oncu;
    const sokak = this.pencere.sokak;
    const binalar = sokak.damgalilar();
    this.time.delayedCall(700, () => {
      // Her damgalı binanın üstünde damga etiketi (G5b); çatlayanlarda üstünde sonuç belirir. Sokak, en uzun
      // binanın etiketi pencereye sığacak kadar küçülür (etiketler sokakla birlikte ölçeklenir).
      let olcek = 1;
      for (const b of binalar) {
        const k = sokak.yerelKutu(b.yer);
        olcek = Math.min(olcek, (k.bottom - 8) / (k.height + ETIKET_KUCUK_YUKSEKLIK));
      }
      const etiketler = new Map<string, BinaEtiketi>();
      for (const b of binalar) {
        const e = binaEtiketi(this, b.damga, ETIKET_KUCUK);
        e.kap.setAlpha(0);
        this.tweens.add({ targets: e.kap, alpha: 1, duration: 240, ease: 'Stepped', easeParams: [3] });
        sokak.ustuneEkle(b.yer, e.kap);
        etiketler.set(b.bina.id, e);
      }
      new Quake(this, sokak, SOKAK_DERINLIK).oynat(
        O.siddet,
        binalar,
        (sonuclar) => {
          this.oncu = { siddet: O.siddet, sonuclar: sonuclar.map(({ dosyaId, durum, bos }) => ({ dosyaId, durum, bos })) };
          this.time.delayedCall(500, devam);
        },
        {
          sure: O.sureMs,
          genlik: O.sarsinti,
          enAgir: 'hasarli',
          gizli: false,
          yazi: ONCU_YAZI,
          yaziAlan: GISE_ALAN,
          enBuyukOlcek: olcek,
          binaTepki: (s) => etiketler.get(s.dosyaId)?.sonucGoster(oncuEtiketi(s.bos), s.bos ? PAL.damgaIade : PAL.damgaBosalt),
        },
      );
    });
  }

  /** Sekans sırasında belgeler, kural notu, klasör ve kaşelik kilitli. */
  private masaKilitle(): void {
    if (this.ipucu) {
      this.tweens.killTweensOf(this.ipucu);
      this.ipucu.destroy();
      this.ipucu = undefined;
    }
    for (const k of this.masadakiKartlar()) k.disableInteractive(true);
    this.zarf?.disableInteractive(true);
    this.not?.disableInteractive(true);
    this.kitap?.kilitle(true);
    this.kaselik.kilitle(true);
  }

  /** Yalnızca dev (?dev&portreler): masanın üstünde portreler ve bir portrenin beş ifadesi (görsel denetim). */
  private portreler(): void {
    const ifadeler: Ifade[] = ['notr', 'gergin', 'kizgin', 'mahcup', 'sevincli'];
    const s = 0.5;
    const adim = PORTRE_EKRAN.w * s + 8;
    this.add.rectangle(0, MASA_Y, 1920, 1080 - MASA_Y, 0x2b2926).setOrigin(0).setDepth(7000);
    for (let i = 0; i < 24; i++) {
      const sira = i < 12 ? i : i - 12;
      const p = new Portre(this, this.tohum * 31 + i * 7919, 16 + sira * adim, MASA_Y + 16 + (i < 12 ? 0 : 172));
      p.img.setScale(PX * s).setDepth(7001);
    }
    for (let i = 0; i < 5; i++) {
      const p = new Portre(this, this.tohum * 31 + 3 * 7919, 16 + i * adim, MASA_Y + 360 + 16);
      p.img.setScale(PX * s).setDepth(7001);
      p.setIfade(ifadeler[i]);
    }
  }

  private gunSonu(): void {
    const data: DayEndData = {
      gun: this.gun,
      tohum: this.tohum,
      paraOnce: this.para,
      kararlar: this.oturum.kararlar.slice(),
      dosyalar: this.oturum.dosyalar.map((b) => ({ id: b.id, adres: b.adres })),
      kayitlar: this.kayitlar,
      oncu: this.oncu,
    };
    goTo(this, SCENES.DayEnd, data);
  }

  pauseGame(): void {
    // "Yeniden Başla" bu günü aynı tohum, para ve önceki günlerin kayıtlarıyla baştan kurar.
    const yeniden: GameData = { gun: this.gun, tohum: this.tohum, para: this.para, kayitlar: this.kayitlar };
    this.scene.launch(SCENES.Pause, { from: SCENES.Game, yeniden });
    this.scene.pause();
  }
}
