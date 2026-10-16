import * as Phaser from 'phaser';
import { settings, type Settings } from '../systems/settings';

/**
 * Ses yolu:
 *   efektler (sfx.ts; Kenney dosyaları ve sentez) → sfxBus ─┬→ sınırlayıcı ─┐
 *   prosedürel müzik (music.ts)   → musicBus ─┘                ├→ Phaser ana ses düğümü → hoparlör
 *   dosyadan yüklenen sesler      → Phaser    ─────────────────┘
 * Ana ses Phaser'ın master ses seviyesidir; müzik/efekt seviyeleri ayarlardan gelir.
 * Sınırlayıcı, çok ses üst üste binince sinyalin 1.0'ı aşıp cızırdamasını önler.
 */
class AudioSystem {
  ctx: AudioContext | null = null;
  musicBus: GainNode | null = null;
  sfxBus: GainNode | null = null;
  private manager: Phaser.Sound.WebAudioSoundManager | null = null;
  private fileMusic: Phaser.Sound.WebAudioSound | null = null;
  private fileMusicVolume = 1;

  init(sound: Phaser.Sound.BaseSoundManager): void {
    if (this.manager) return;
    if (!(sound instanceof Phaser.Sound.WebAudioSoundManager)) {
      console.warn('Web Audio yok; prosedürel sesler kapalı.');
      return;
    }
    this.manager = sound;
    this.ctx = sound.context;
    const limiter = this.ctx.createDynamicsCompressor();
    limiter.threshold.value = -3;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.002;
    limiter.release.value = 0.12;
    // Tarayıcının sınırlayıcısı sesi otomatik yükseltip tepeleri ~1.0'a taşır; biraz pay bırak.
    const trim = this.ctx.createGain();
    trim.gain.value = 0.85;
    limiter.connect(trim).connect(sound.destination);
    this.musicBus = this.ctx.createGain();
    this.sfxBus = this.ctx.createGain();
    this.musicBus.connect(limiter);
    this.sfxBus.connect(limiter);
    this.apply(settings.get());
    settings.onChange((s) => this.apply(s));
  }

  /** Tarayıcı sesi açtı mı? (İlk tıklama/tuşa kadar kapalıdır.) */
  get running(): boolean {
    return this.ctx?.state === 'running';
  }

  /** PreloadScene'de load.audio ile yüklenip çözülmüş ses verisi (yoksa null). sfx.ts dosya seslerini bununla çalar. */
  buffer(key: string): AudioBuffer | null {
    const b: unknown = this.manager?.game.cache.audio.get(key);
    return b instanceof AudioBuffer ? b : null;
  }

  /** PreloadScene'de load.audio ile yüklenmiş bir dosyayı efekt olarak çal. */
  playFile(key: string, config: Phaser.Types.Sound.SoundConfig = {}): void {
    this.manager?.play(key, { ...config, volume: (config.volume ?? 1) * settings.get().sfx });
  }

  /** Yüklenmiş bir müzik dosyasını döngüde çal; başka bir müzik dosyası çalıyorsa onu durdurur. */
  playMusicFile(key: string, volume = 1): void {
    if (!this.manager) return;
    if (this.fileMusic?.key === key && this.fileMusic.isPlaying) return;
    this.stopMusicFile();
    this.fileMusicVolume = volume;
    this.fileMusic = this.manager.add(key, { loop: true, volume: volume * settings.get().music });
    this.fileMusic.play();
  }

  stopMusicFile(): void {
    this.fileMusic?.destroy();
    this.fileMusic = null;
  }

  private apply(s: Readonly<Settings>): void {
    if (!this.manager || !this.ctx) return;
    this.manager.volume = s.master;
    const now = this.ctx.currentTime;
    this.musicBus?.gain.setTargetAtTime(s.music, now, 0.02);
    this.sfxBus?.gain.setTargetAtTime(s.sfx, now, 0.02);
    this.fileMusic?.setVolume(this.fileMusicVolume * s.music);
  }
}

export const audio = new AudioSystem();
