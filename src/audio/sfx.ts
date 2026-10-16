import { audio } from './audio';

/**
 * Ses efektleri. İki kaynak, tek arayüz (`sfx.play('ad')`):
 *  1. Dosya sesleri (Kenney CC0 paketleri, src/sounds/kenney/): `sfx.dosyaTanimla(ad, katmanlar)`.
 *     Hangi olayın hangi dosyayı çaldığı src/audio/sesler.ts'de; liste docs/SESLER.md'de.
 *  2. Kodla üretilen sesler (sfxr tarzı küçük bir sentezleyici): `sfx.define('kapi', { wave: 'square', ... })`.
 * Bir ad için dosya tanımı varsa ve dosyalar yüklüyse dosya çalar; yoksa aynı adlı (ya da `yedek`) sentez sesi.
 * Hepsi sfxBus'tan geçer: ayarlardaki ana ses ve efekt düzeyi (0 = kapalı) hepsine uygulanır.
 * Sentez efektlerinin birkaç varyantı üretilir ve çalarken perde hafifçe oynar; tekrar eden sesler bıktırmasın.
 */

export type Wave = 'square' | 'saw' | 'triangle' | 'sine' | 'noise';

export interface SfxParams {
  wave: Wave;
  /** Başlangıç frekansı (Hz). Gürültüde (noise) parlaklığı belirler. */
  freq: number;
  /** Bitiş frekansı (Hz). Verilirse ses boyunca üstel olarak kayar. */
  freqEnd?: number;
  /** Zarf süreleri (saniye). */
  attack?: number;
  sustain?: number;
  decay?: number;
  /** 0..1 */
  volume?: number;
  /** Kare dalga doluluk oranı (0..1); küçüldükçe ses incelir. */
  duty?: number;
  /** Titreşim: rate Hz, depth oran (0.05 = %5). */
  vibrato?: { rate: number; depth: number };
  /** `at` saniyesinde frekansı `mult` ile çarp (jeton sesindeki sıçrama gibi). */
  jump?: { at: number; mult: number };
  /** Alçak geçiren filtre kesimi (Hz); sert sesleri yumuşatır. */
  lowpass?: number;
}

export interface PlayOptions {
  volume?: number;
  /** Çalma hızı/perde çarpanı (1 = normal). */
  rate?: number;
  /** Stereo konum: -1 sol, 1 sağ. */
  pan?: number;
}

/** Bir dosya sesinin tek katmanı. Bir efekt birden çok katmanı aynı anda (ya da gecikmeli) çalabilir. */
export interface Katman {
  /** Dosya anahtarları (src/sounds/kenney/ altındaki dosya adı, uzantısız). Her çalışta biri rastgele seçilir. */
  dosya: string[];
  /** Ses düzeyi çarpanı (varsayılan 1; 1'in üstü yükseltir). */
  volume?: number;
  /** Çalma hızı (perde de değişir): 0.5 bir oktav pes ve iki kat uzun. Varsayılan 1. */
  rate?: number;
  /** Hızın rastgele oynaması (oran, varsayılan 0.04). */
  oynama?: number;
  /** Dosyanın başındaki sessizliği atla (sn). */
  bas?: number;
  /** Katman kaç saniye sonra başlasın. */
  gecikme?: number;
  /** 'muzik': müzik düzeyine bağlı çalar (jingle). Varsayılan efekt düzeyi. */
  kanal?: 'efekt' | 'muzik';
}

/** Süren bir döngü ses (deprem gürlemesi). */
export interface DonguSes {
  /** Düzeyi değiştir (0..~1.5); `sure` saniyede yumuşakça. */
  seviye(v: number, sure?: number): void;
  /** Sustur ve kapat. */
  durdur(sure?: number): void;
}

const VARIANTS = 4;
const r = (min: number, max: number): number => min + Math.random() * (max - min);

const BUILTIN: Record<string, () => SfxParams> = {
  click: () => ({ wave: 'square', freq: r(850, 950), freqEnd: 500, sustain: 0.01, decay: 0.05, volume: 0.25, duty: 0.25 }),
  hover: () => ({ wave: 'sine', freq: r(1100, 1250), freqEnd: 1500, sustain: 0.005, decay: 0.04, volume: 0.15 }),
  confirm: () => ({ wave: 'square', freq: r(520, 560), sustain: 0.04, decay: 0.16, volume: 0.28, jump: { at: 0.05, mult: 1.5 } }),
  back: () => ({ wave: 'square', freq: r(520, 560), sustain: 0.04, decay: 0.12, volume: 0.24, jump: { at: 0.05, mult: 0.75 } }),
  type: () => ({ wave: 'square', freq: r(1700, 2100), sustain: 0.004, decay: 0.025, volume: 0.12, duty: 0.3, lowpass: 5000 }),
  pickup: () => ({ wave: 'square', freq: r(900, 1100), sustain: 0.05, decay: 0.25, volume: 0.28, jump: { at: r(0.04, 0.07), mult: 1.5 } }),
  powerup: () => ({ wave: 'square', freq: r(250, 320), freqEnd: r(900, 1100), sustain: 0.25, decay: 0.3, volume: 0.26, vibrato: { rate: 14, depth: 0.04 } }),
  jump: () => ({ wave: 'square', freq: r(220, 280), freqEnd: r(550, 650), sustain: 0.06, decay: 0.15, volume: 0.24, duty: 0.3 }),
  shoot: () => ({ wave: 'saw', freq: r(1000, 1400), freqEnd: r(150, 250), sustain: 0.03, decay: 0.15, volume: 0.24, lowpass: 6000 }),
  hit: () => ({ wave: 'noise', freq: r(3000, 5000), freqEnd: 400, sustain: 0.02, decay: 0.16, volume: 0.45, lowpass: 3500 }),
  hurt: () => ({ wave: 'square', freq: r(380, 450), freqEnd: 120, sustain: 0.05, decay: 0.2, volume: 0.28, duty: 0.4, lowpass: 3000 }),
  explosion: () => ({ wave: 'noise', freq: r(1200, 1800), freqEnd: 60, sustain: 0.08, decay: r(0.5, 0.8), volume: 0.6, lowpass: 2000 }),
  thud: () => ({ wave: 'sine', freq: r(140, 170), freqEnd: 50, sustain: 0.02, decay: 0.16, volume: 0.6 }),
  whoosh: () => ({ wave: 'noise', freq: 600, freqEnd: 6000, attack: 0.08, sustain: 0.02, decay: 0.18, volume: 0.25, lowpass: 2500 }),
  error: () => ({ wave: 'square', freq: 160, freqEnd: 120, sustain: 0.12, decay: 0.1, volume: 0.22, lowpass: 2500 }),
  win: () => ({ wave: 'square', freq: 523, sustain: 0.3, decay: 0.4, volume: 0.26, jump: { at: 0.12, mult: 1.5 }, vibrato: { rate: 6, depth: 0.01 } }),
};

const presets = new Map<string, () => SfxParams>(Object.entries(BUILTIN));
const dosyalar = new Map<string, { katmanlar: Katman[]; yedek?: string }>();
/** Her efektin kaç kez çalındığı ve kaynağı (dev testleri: window.sfx.sayac). */
const sayac: Record<string, { dosya: number; sentez: number; sessiz: number }> = {};
let gurultu: AudioBuffer | null = null;
const cache = new Map<string, AudioBuffer[]>();
const warned = new Set<string>();

function render(ctx: BaseAudioContext, p: SfxParams): AudioBuffer {
  const sr = ctx.sampleRate;
  const attack = Math.max(0.002, p.attack ?? 0.005);
  const sustain = p.sustain ?? 0.05;
  const decay = Math.max(0.005, p.decay ?? 0.15);
  const total = attack + sustain + decay;
  const length = Math.ceil(total * sr);
  const buffer = ctx.createBuffer(1, length, sr);
  const out = buffer.getChannelData(0);
  const volume = p.volume ?? 0.5;
  const duty = p.duty ?? 0.5;
  const lpCoef = p.lowpass ? 1 - Math.exp((-2 * Math.PI * p.lowpass) / sr) : 1;

  let phase = 0;
  let noise = 0;
  let lp = 0;
  for (let i = 0; i < length; i++) {
    const t = i / sr;
    let f = p.freqEnd ? p.freq * Math.pow(p.freqEnd / p.freq, t / total) : p.freq;
    if (p.jump && t >= p.jump.at) f *= p.jump.mult;
    if (p.vibrato) f *= 1 + p.vibrato.depth * Math.sin(2 * Math.PI * p.vibrato.rate * t);

    phase += f / sr;
    if (phase >= 1) {
      phase -= Math.floor(phase);
      noise = Math.random() * 2 - 1;
    }

    let s = 0;
    switch (p.wave) {
      case 'square': s = phase < duty ? 1 : -1; break;
      case 'saw': s = 2 * phase - 1; break;
      case 'triangle': s = 1 - 4 * Math.abs(phase - 0.5); break;
      case 'sine': s = Math.sin(2 * Math.PI * phase); break;
      case 'noise': s = noise; break;
    }

    const env =
      t < attack ? t / attack
      : t < attack + sustain ? 1
      : Math.pow(Math.max(0, 1 - (t - attack - sustain) / decay), 2);

    lp += (s * env - lp) * lpCoef;
    out[i] = lp * volume;
  }
  return buffer;
}

function variants(name: string): AudioBuffer[] | null {
  const ctx = audio.ctx;
  if (!ctx) return null;
  let list = cache.get(name);
  if (!list) {
    const preset = presets.get(name);
    if (!preset) return null;
    list = Array.from({ length: VARIANTS }, () => render(ctx, preset()));
    cache.set(name, list);
  }
  return list;
}

export const sfx = {
  /** Efekt tanımla ya da var olanı değiştir. Fonksiyon verirsen her varyant biraz farklı çıkar. */
  define(name: string, params: SfxParams | (() => SfxParams)): void {
    presets.set(name, typeof params === 'function' ? params : () => params);
    cache.delete(name);
  },

  /**
   * Dosya tabanlı efekt tanımla (ya da var olan bir adın, ör. 'confirm', sentez sesinin yerine geç).
   * `yedek`: dosyalar yüklenmemişse çalınacak sentez efektinin adı (verilmezse aynı ad).
   */
  dosyaTanimla(name: string, katmanlar: Katman | Katman[], yedek?: string): void {
    dosyalar.set(name, { katmanlar: Array.isArray(katmanlar) ? katmanlar : [katmanlar], yedek });
  },

  /** Çalma sayaçları (kaynağa göre). Dev modunda window.sfx.sayac ile okunur. */
  sayac,

  play(name: string, opts: PlayOptions = {}): void {
    const say = (sayac[name] ??= { dosya: 0, sentez: 0, sessiz: 0 });
    const ctx = audio.ctx;
    const bus = audio.sfxBus;
    // Tarayıcı sesi açmadan çalınanlar kuyrukta birikip sonra hep birden patlamasın.
    if (!ctx || !bus || ctx.state !== 'running') {
      say.sessiz++;
      return;
    }
    const tanim = dosyalar.get(name);
    if (tanim && dosyaCal(ctx, tanim.katmanlar, opts)) {
      say.dosya++;
      return;
    }
    const sentezAdi = tanim?.yedek ?? name;
    const list = variants(sentezAdi);
    if (!list) {
      say.sessiz++;
      if (!warned.has(sentezAdi)) console.warn(`Bilinmeyen ses efekti: ${sentezAdi}`);
      warned.add(sentezAdi);
      return;
    }
    say.sentez++;
    const src = ctx.createBufferSource();
    src.buffer = list[Math.floor(Math.random() * list.length)];
    src.playbackRate.value = (opts.rate ?? 1) * r(0.96, 1.04);

    let node: AudioNode = src;
    if (opts.volume !== undefined && opts.volume !== 1) {
      const gain = ctx.createGain();
      gain.gain.value = opts.volume;
      node = node.connect(gain);
    }
    if (opts.pan) {
      const panner = ctx.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, opts.pan));
      node = node.connect(panner);
    }
    node.connect(bus);
    src.start();
  },

  /**
   * Döngü gürleme (deprem): kodla üretilen kahverengi gürültü, alçak geçiren filtre ve yavaş dalgalanma.
   * Düzey 0'dan başlar; çağıran `seviye` ile sürer, `durdur` ile kapatır. Ses açılmamışsa sessiz bir tutamak döner.
   */
  gurleme(): DonguSes {
    const ctx = audio.ctx;
    const bus = audio.sfxBus;
    const say = (sayac.gurleme ??= { dosya: 0, sentez: 0, sessiz: 0 });
    if (!ctx || !bus || ctx.state !== 'running') {
      say.sessiz++;
      return { seviye: () => undefined, durdur: () => undefined };
    }
    say.sentez++;
    gurultu ??= kahverengiGurultu(ctx);
    const src = ctx.createBufferSource();
    src.buffer = gurultu;
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 140;
    lp.Q.value = 0.9;
    // Yavaş dalgalanma: gürleme kabarıp çekilsin.
    const dalga = ctx.createGain();
    dalga.gain.value = 1;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 2.3;
    const lfoDerinlik = ctx.createGain();
    lfoDerinlik.gain.value = 0.35;
    lfo.connect(lfoDerinlik).connect(dalga.gain);
    const duzey = ctx.createGain();
    duzey.gain.value = 0;
    src.connect(lp).connect(dalga).connect(duzey).connect(bus);
    src.start();
    lfo.start();
    let bitti = false;
    return {
      seviye(v: number, sure = 0.08): void {
        if (bitti) return;
        duzey.gain.setTargetAtTime(Math.max(0, v) * 1.6, ctx.currentTime, Math.max(0.005, sure / 3));
      },
      durdur(sure = 0.3): void {
        if (bitti) return;
        bitti = true;
        const t = ctx.currentTime;
        duzey.gain.cancelScheduledValues(t);
        duzey.gain.setTargetAtTime(0, t, Math.max(0.005, sure / 3));
        src.stop(t + sure + 0.1);
        lfo.stop(t + sure + 0.1);
      },
    };
  },

  /** Tanımlı efekt adları (oyun alanı sahnesi için). */
  names(): string[] {
    return [...new Set([...dosyalar.keys(), ...presets.keys()])];
  },

  /** Bütün varyantları şimdiden üret; ilk çalışta takılma olmasın. Boot'ta çağrılır. */
  warmup(): void {
    for (const name of presets.keys()) variants(name);
  },
};

/** Katmanları çalar; hiçbir dosya yüklü değilse false (sentez yedeğine düşülür). */
function dosyaCal(ctx: AudioContext, katmanlar: Katman[], opts: PlayOptions): boolean {
  let caldi = false;
  for (const k of katmanlar) {
    const adaylar = k.dosya.map((d) => audio.buffer(d)).filter((b): b is AudioBuffer => b !== null);
    const bus = k.kanal === 'muzik' ? audio.musicBus : audio.sfxBus;
    if (adaylar.length === 0 || !bus) continue;
    const src = ctx.createBufferSource();
    const buf = adaylar[Math.floor(Math.random() * adaylar.length)];
    src.buffer = buf;
    const oyna = k.oynama ?? 0.04;
    src.playbackRate.value = (k.rate ?? 1) * (opts.rate ?? 1) * r(1 - oyna, 1 + oyna);
    let node: AudioNode = src;
    const v = (k.volume ?? 1) * (opts.volume ?? 1);
    if (v !== 1) {
      const gain = ctx.createGain();
      gain.gain.value = v;
      node = node.connect(gain);
    }
    if (opts.pan) {
      const panner = ctx.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, opts.pan));
      node = node.connect(panner);
    }
    node.connect(bus);
    src.start(ctx.currentTime + (k.gecikme ?? 0), Math.min(k.bas ?? 0, buf.duration));
    caldi = true;
  }
  return caldi;
}

/** 4 saniyelik, döngüye uygun kahverengi gürültü (derin gürleme tabanı). */
function kahverengiGurultu(ctx: BaseAudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const n = Math.floor(sr * 4);
  // Döngü noktasında tık olmasın: fazladan üretilen kuyruk başa çapraz geçişle karıştırılır.
  const xf = Math.floor(sr * 0.05);
  const ham = new Float32Array(n + xf);
  let son = 0;
  for (let i = 0; i < ham.length; i++) {
    son = (son + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    ham[i] = son;
  }
  for (let i = 0; i < xf; i++) {
    const a = i / xf;
    ham[i] = ham[i] * a + ham[n + i] * (1 - a);
  }
  let enBuyuk = 0;
  for (let i = 0; i < n; i++) enBuyuk = Math.max(enBuyuk, Math.abs(ham[i]));
  const buf = ctx.createBuffer(1, n, sr);
  const d = buf.getChannelData(0);
  const k = 0.9 / (enBuyuk || 1);
  for (let i = 0; i < n; i++) d[i] = ham[i] * k;
  return buf;
}
