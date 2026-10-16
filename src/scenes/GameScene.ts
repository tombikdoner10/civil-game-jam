import * as Phaser from 'phaser';
import { sfx } from '../audio/sfx';
import { DEV, FONT } from '../config';
import { DocumentCard, MASA, ustKatman } from '../desk/DocumentCard';
import { belgeKur, BOY } from '../desk/documents';
import { snap } from '../desk/pixel';
import { DUGME, Inspect, type Yuzey } from '../desk/Inspect';
import { PAL } from '../desk/palette';
import { fisDusur, fisKaldir, fisKur, masaCiz } from '../desk/props';
import { RuleBook } from '../desk/RuleBook';
import { RuleNote } from '../desk/RuleNote';
import { DAMGA_ADI, damgaIzi, StampTray, TEPSI_SOL } from '../desk/StampTray';
import { Quake } from '../desk/Quake';
import { GOZ, MASA_Y, Pencere, SOKAK_DERINLIK } from '../desk/Window';
import { yerlesim, type Yerlesim } from '../desk/yerlesim';
import type { Damga, Kural } from '../game/building';
import { ornekKayitlar } from '../game/ornek';
import { GunOturumu, sokakKayitlari, type GunKaydi, type SarsintiKaydi } from '../game/session';
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

/** Masa sahnesi: üstte belediye penceresi ve gişe, altta masa, belgeler ve damga çubuğu. */
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
  private tepsi!: StampTray;
  private fis?: Phaser.GameObjects.Container;
  private ilkDosya = true;
  private inceleme!: Inspect;
  private kitap?: RuleBook;
  private ipucu?: Phaser.GameObjects.Text;
  /** Bu günün öncü sarsıntı sonucu (gün sonu raporuna gider). */
  private oncu?: SarsintiKaydi;

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
      if (q.has('sokak')) this.kayitlar = ornekKayitlar(this.tohum, this.gun);
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
    MASA.w = TEPSI_SOL.kapali;
    MASA.h = 1080 - MASA_Y;
    masaCiz(this, MASA_Y);
    // Kural kitabı gün 2'den; gün 1'de masada yalnızca kural notu (hedef ve tek kural).
    if (ayar.kitap) this.kitap = new RuleBook(this, this.yer.kitap[0], this.yer.kitap[1], this.gun);
    if (ayar.not) this.notGetir(ayar.not.gorev, ayar.not.kurallar);
    this.pencere = new Pencere(this, this.gun, sokakKayitlari(this.tohum, this.kayitlar));
    this.tepsi = new StampTray(this, (d) => this.damgala(d));
    // Masa sınırı damga çubuğunun sol kenarında biter; çubuk açılınca altında kalan belgeler dışarı itilir.
    this.tepsi.on('ac', () => {
      MASA.w = TEPSI_SOL.acik;
      this.kartlariMasayaIt();
      this.kitap?.masayaIt();
    });
    this.tepsi.on('kapa', () => {
      MASA.w = TEPSI_SOL.kapali;
    });

    this.incelemeKur();
    this.dosyaGetir();

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

  /** İnceleme modu: açıkken belgeler sürüklenmez, damga çubuğu kilitli. */
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
    });
    this.inceleme.on('ac', () => {
      for (const k of this.kartlar) k.disableInteractive(true);
      this.not?.disableInteractive(true);
      this.kitap?.kilitle(true);
      this.tepsi.kilitle(true);
      if (this.ipucu) {
        this.tweens.killTweensOf(this.ipucu);
        this.ipucu.destroy();
        this.ipucu = undefined;
      }
    });
    this.inceleme.on('kapa', () => {
      for (const k of this.kartlar) if (k.active) k.setInteractive();
      this.not?.setInteractive();
      this.kitap?.kilitle(false);
      this.tepsi.kilitle(false);
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

  /** Masa sınırının dışında kalan belgeleri (ör. açılan damga çubuğunun altındakileri) içeri kaydırır. */
  private kartlariMasayaIt(): void {
    const liste: (DocumentCard | RuleNote)[] = [...this.kartlar];
    if (this.not) liste.push(this.not);
    for (const k of liste) {
      if (!k.active || !k.input?.enabled) continue;
      const [x, y] = k.masadaKonum(k.x, k.y);
      if (x === k.x && y === k.y) continue;
      this.tweens.add({ targets: k, x, y, duration: 220, ease: 'Cubic.easeOut' });
    }
  }

  /** Masadaki belgeler: mevcut dosyanınkiler ve damgalanıp henüz kalkmamış olanlar. */
  private masadakiKartlar(): DocumentCard[] {
    return [...this.kartlar, ...this.giden].filter((k) => k.active);
  }

  /** Gün 1 kural notu: gişeden masaya kayar ve gün boyu masada kalır. */
  private notGetir(gorev: string, kurallar: Kural[]): void {
    const not = new RuleNote(this, GOZ.x, GOZ.y, this.gun, gorev, kurallar);
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
    this.pencere.setDosya(this.oturum.no, this.oturum.toplam);
    this.pencere.binaGoster(bina);
    this.pencere.siluetGelsin(this.tohum + this.oturum.no * 7919);
    sfx.play('siluet');
    const gecikme = 350;
    const belgeler = this.oturum.ayar.belgeler;
    this.kartlar = belgeler.map((tur, i) => {
      const [hx, hy] = this.yer.belge[tur];
      const k = belgeKur(this, tur, bina, GOZ.x, GOZ.y - BOY[tur][1] / 2);
      k.setDepth(ustKatman()).setAlpha(0);
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

  /** Dosyanın bütün belgeleri masada: masa açılır, saat işler; günün ilk dosyasında damga çubuğu açılır. */
  private belgelerOturdu(): void {
    if (this.bitirildi) return;
    this.mesgul = false;
    if (this.ilkDosya) {
      this.ilkDosya = false;
      this.tepsi.ac();
    }
  }

  private damgala(damga: Damga): void {
    if (this.mesgul || this.bitirildi) return;
    const sonuc = this.oturum.damgala(damga);
    if (!sonuc) return;
    this.mesgul = true;

    // Tokmak iner, mürekkep ruhsata basılır.
    const ruhsat = this.kartlar.find((k) => k.tur === 'ruhsat');
    this.tepsi.bas(damga);
    this.time.delayedCall(70, () => {
      sfx.play(damga === 'iade' ? 'iade' : 'damga');
      this.pencere.damgaVur(damga);
      punch(this, 0.01, 110);
      if (ruhsat?.active) {
        ruhsat.one();
        const iz = damgaIzi(this, damga, this.tohum + this.oturum.kararlar.length * 131);
        iz.setPosition(-ruhsat.genislik / 2 + 152, ruhsat.yukseklik / 2 - 60);
        ruhsat.add(iz);
      }
    });

    // Uyarı fişi (yer tutucu geri bildirim).
    this.time.delayedCall(450, () => {
      if (this.fis) fisKaldir(this, this.fis);
      // Yanlış kararda doğrusu ve dosyadaki kusurlar (atlanan ya da olmadığı halde görülen).
      // Eksiksiz dosyayı İADE etmek: gerekçe "dosya eksiksiz" (yer tutucu metin).
      const kusurlar = sonuc.etiketler.join('\n') || (damga === 'iade' ? 'Kusur yok, dosya eksiksiz' : 'Kusur yok');
      const metin = sonuc.dogru ? 'Doğru karar' : `Yanlış karar\nDoğrusu: ${DAMGA_ADI[sonuc.dogruDamga]}\n${kusurlar}`;
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
      this.pencere.siluetGitsin();
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
      new Quake(this, sokak, SOKAK_DERINLIK).oynat(
        O.siddet,
        binalar,
        (sonuclar) => {
          this.oncu = { siddet: O.siddet, sonuclar: sonuclar.map(({ dosyaId, durum, bos }) => ({ dosyaId, durum, bos })) };
          this.time.delayedCall(500, devam);
        },
        { sure: O.sureMs, genlik: O.sarsinti, enAgir: 'hasarli', gizli: false, yazi: ONCU_YAZI },
      );
    });
  }

  /** Sekans sırasında belgeler, kural notu, kitap ve damga çubuğu kilitli. */
  private masaKilitle(): void {
    if (this.ipucu) {
      this.tweens.killTweensOf(this.ipucu);
      this.ipucu.destroy();
      this.ipucu = undefined;
    }
    for (const k of this.masadakiKartlar()) k.disableInteractive(true);
    this.not?.disableInteractive(true);
    this.kitap?.kilitle(true);
    this.tepsi.kilitle(true);
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
