import { GAME_ID } from '../config';

/** localStorage sarmalayıcısı. Gizli sekmede ya da depolama engelliyse sessizce varsayılana döner. */
export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(`${GAME_ID}:${key}`);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  },

  set(key: string, value: unknown): void {
    try {
      localStorage.setItem(`${GAME_ID}:${key}`, JSON.stringify(value));
    } catch {
      // Depolama yoksa oyun yine çalışsın; sadece kayıt tutulmaz.
    }
  },
};
