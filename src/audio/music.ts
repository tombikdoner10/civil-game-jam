import { audio } from './audio';

/**
 * Kodla yazılan müzik için küçük bir adım sıralayıcı (step sequencer). Ses dosyası gerekmez.
 *
 * Desen yazımı (boşlukla ayrılmış adımlar, varsayılan olarak her adım bir onaltılık nota):
 *   "C4"  nota      "D#4" / "Eb4"  diyez / bemol      "C4+E4+G4"  akor
 *   "."   sus       "-"            önceki notayı bir adım uzat
 *   davullarda: "x" vur, "X" vurgulu vur.    "|" ölçü ayırıcı, yok sayılır.
 *
 *   music.play({ bpm: 120, tracks: [
 *     { inst: 'kick',     pattern: 'x . . . x . . . x . . . x . . .' },
 *     { inst: 'triangle', pattern: 'C3 - - . G2 - - . A2 - - . F2 - - .' },
 *   ]});
 */

export type Instrument = 'square' | 'saw' | 'triangle' | 'sine' | 'kick' | 'snare' | 'hat';

export interface Track {
  inst: Instrument;
  pattern: string;
  /** 0..1, varsayılan 0.5 */
  volume?: number;
  /** Kare/testere dalgayı yumuşatmak için alçak geçiren filtre kesimi (Hz). */
  lowpass?: number;
}

export interface Song {
  bpm: number;
  /** Vuruş başına adım sayısı; 4 = onaltılık (varsayılan), 2 = sekizlik. */
  stepsPerBeat?: number;
  tracks: Track[];
  /** false: bir kez çalıp biter (jingle). Varsayılan true. */
  loop?: boolean;
}

interface NoteEvent {
  freqs: number[];
  steps: number;
  accent: boolean;
}

interface ParsedTrack {
  inst: Instrument;
  volume: number;
  lowpass?: number;
  steps: (NoteEvent | null)[];
}

const SEMITONE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const OSC_TYPE = { square: 'square', saw: 'sawtooth', triangle: 'triangle', sine: 'sine' } as const;
const LOOKAHEAD = 0.12;
const TICK_MS = 25;

export function noteToFreq(note: string): number {
  const m = /^([A-Ga-g])([#b]?)(-?\d)$/.exec(note);
  if (!m) throw new Error(`Geçersiz nota: "${note}"`);
  const semitone = SEMITONE[m[1].toUpperCase()] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  const midi = semitone + (Number(m[3]) + 1) * 12;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function parseTrack(track: Track): ParsedTrack {
  const tokens = track.pattern.split(/\s+/).filter((t) => t !== '' && t !== '|');
  const drum = track.inst === 'kick' || track.inst === 'snare' || track.inst === 'hat';
  const steps = tokens.map((token, i): NoteEvent | null => {
    if (token === '.' || token === '-') return null;
    let length = 1;
    while (tokens[i + length] === '-') length++;
    if (drum) {
      if (token !== 'x' && token !== 'X') throw new Error(`Davul adımı x, X ya da . olmalı: "${token}"`);
      return { freqs: [], steps: length, accent: token === 'X' };
    }
    return { freqs: token.split('+').map(noteToFreq), steps: length, accent: false };
  });
  return { inst: track.inst, volume: track.volume ?? 0.5, lowpass: track.lowpass, steps };
}

export class MusicPlayer {
  private song: Song | null = null;
  private tracks: ParsedTrack[] = [];
  private length = 0;
  private out: GainNode | null = null;
  private timer: number | null = null;
  private step = 0;
  private nextTime = 0;
  private noise: AudioBuffer | null = null;

  constructor(private readonly bus: 'music' | 'sfx' = 'music') {}

  get current(): Song | null {
    return this.song;
  }

  /** Şarkıyı başlat. Aynı döngü zaten çalıyorsa bir şey yapmaz; jingle'lar her seferinde baştan çalar. */
  play(song: Song, fadeIn = 0.4): void {
    const ctx = audio.ctx;
    const bus = this.bus === 'music' ? audio.musicBus : audio.sfxBus;
    if (!ctx || !bus) return;
    if (this.song === song && song.loop !== false) return;
    this.stop(0.3);

    this.song = song;
    this.tracks = song.tracks.map(parseTrack);
    this.length = Math.max(1, ...this.tracks.map((t) => t.steps.length));
    this.out = ctx.createGain();
    this.out.gain.setValueAtTime(0.0001, ctx.currentTime);
    this.out.gain.exponentialRampToValueAtTime(1, ctx.currentTime + Math.max(0.01, fadeIn));
    this.out.connect(bus);
    this.step = 0;
    this.nextTime = ctx.currentTime + 0.06;
    this.timer = window.setInterval(() => this.tick(), TICK_MS);
  }

  stop(fadeOut = 0.4): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    const ctx = audio.ctx;
    const out = this.out;
    if (ctx && out) {
      const now = ctx.currentTime;
      out.gain.cancelScheduledValues(now);
      out.gain.setValueAtTime(out.gain.value, now);
      out.gain.linearRampToValueAtTime(0, now + fadeOut);
      window.setTimeout(() => out.disconnect(), (fadeOut + 0.2) * 1000);
    }
    this.out = null;
    this.song = null;
  }

  private tick(): void {
    const ctx = audio.ctx;
    const song = this.song;
    const out = this.out;
    if (!ctx || !song || !out) return;
    const stepDur = 60 / song.bpm / (song.stepsPerBeat ?? 4);

    // Sekme arka planda kalıp geride düştüysek kaçan adımları atla; birikmiş notalar aynı anda patlamasın.
    if (this.nextTime < ctx.currentTime - 0.05) {
      const missed = Math.ceil((ctx.currentTime - this.nextTime) / stepDur);
      this.step += missed;
      this.nextTime += missed * stepDur;
    }

    while (this.nextTime < ctx.currentTime + LOOKAHEAD) {
      if (song.loop === false && this.step >= this.length) {
        this.finish();
        return;
      }
      for (const track of this.tracks) {
        const ev = track.steps[this.step % track.steps.length];
        if (ev) this.trigger(ctx, out, track, ev, this.nextTime, ev.steps * stepDur);
      }
      this.step++;
      this.nextTime += stepDur;
    }
  }

  /** Jingle bitince: son notaların kuyruğu çalsın, sonra bağlantıyı kes. */
  private finish(): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    const out = this.out;
    this.out = null;
    this.song = null;
    if (out) window.setTimeout(() => out.disconnect(), 3000);
  }

  private trigger(ctx: AudioContext, out: AudioNode, track: ParsedTrack, ev: NoteEvent, time: number, dur: number): void {
    const vol = Math.max(0.0001, track.volume * (ev.accent ? 1.4 : 1));
    switch (track.inst) {
      case 'kick': return this.kick(ctx, out, time, vol);
      case 'snare': return this.snare(ctx, out, time, vol);
      case 'hat': return this.hat(ctx, out, time, vol, dur);
      default:
        for (const freq of ev.freqs) {
          this.tone(ctx, out, OSC_TYPE[track.inst], freq, time, dur, vol / Math.sqrt(ev.freqs.length), track.lowpass);
        }
    }
  }

  private tone(ctx: AudioContext, out: AudioNode, type: OscillatorType, freq: number, time: number, dur: number, vol: number, lowpass?: number): void {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    const end = time + Math.max(0.04, dur * 0.95);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vol, time + 0.008);
    gain.gain.setTargetAtTime(vol * 0.6, time + 0.008, 0.08);
    gain.gain.setTargetAtTime(0, end, 0.02);

    let node: AudioNode = osc;
    if (lowpass) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = lowpass;
      node = node.connect(filter);
    }
    node.connect(gain).connect(out);
    osc.start(time);
    osc.stop(end + 0.15);
  }

  private kick(ctx: AudioContext, out: AudioNode, time: number, vol: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.12);
    gain.gain.setValueAtTime(vol * 1.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
    osc.connect(gain).connect(out);
    osc.start(time);
    osc.stop(time + 0.3);
  }

  private snare(ctx: AudioContext, out: AudioNode, time: number, vol: number): void {
    const noise = this.noiseSource(ctx, 'highpass', 1200);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
    noise.out.connect(gain).connect(out);
    noise.src.start(time);
    noise.src.stop(time + 0.2);

    const body = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    body.type = 'triangle';
    body.frequency.setValueAtTime(220, time);
    body.frequency.exponentialRampToValueAtTime(120, time + 0.08);
    bodyGain.gain.setValueAtTime(vol * 0.6, time);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
    body.connect(bodyGain).connect(out);
    body.start(time);
    body.stop(time + 0.12);
  }

  private hat(ctx: AudioContext, out: AudioNode, time: number, vol: number, dur: number): void {
    const noise = this.noiseSource(ctx, 'highpass', 7000);
    const gain = ctx.createGain();
    // "-" ile uzatılan hi-hat açık hi-hat gibi daha uzun çınlar.
    const length = dur > 0.2 ? 0.25 : 0.05;
    gain.gain.setValueAtTime(vol * 0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + length);
    noise.out.connect(gain).connect(out);
    noise.src.start(time);
    noise.src.stop(time + length + 0.02);
  }

  private noiseSource(ctx: AudioContext, type: BiquadFilterType, freq: number): { src: AudioBufferSourceNode; out: AudioNode } {
    if (!this.noise) {
      this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    return { src, out: src.connect(filter) };
  }
}

/** Arka plan müziği (aynı anda tek döngü). */
export const music = new MusicPlayer('music');
/** Kısa müzikal efektler (bölüm sonu, kazanma); arka plan müziğini kesmez, efekt seviyesine bağlıdır. */
export const jingles = new MusicPlayer('sfx');
