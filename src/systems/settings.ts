import { storage } from './storage';

export interface Settings {
  master: number;
  music: number;
  sfx: number;
  /** Ekran sarsıntısı ve kamera vuruşları (hareket hassasiyeti olanlar kapatabilsin). */
  shake: boolean;
}

type Listener = (settings: Readonly<Settings>) => void;

const DEFAULTS: Settings = { master: 0.8, music: 0.7, sfx: 0.8, shake: true };

let current: Settings = { ...DEFAULTS, ...storage.get<Partial<Settings>>('settings', {}) };
const listeners = new Set<Listener>();

export const settings = {
  get: (): Readonly<Settings> => current,

  set(patch: Partial<Settings>): void {
    current = { ...current, ...patch };
    storage.set('settings', current);
    listeners.forEach((fn) => fn(current));
  },

  /** Değişiklikleri dinle; dönen fonksiyon dinlemeyi bırakır. */
  onChange(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
