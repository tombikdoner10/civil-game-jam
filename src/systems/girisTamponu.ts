/**
 * Sahne geçişlerinde girdi tamponu (G41). Bir sahne kararıp ötekine geçerken Phaser girdisi kapalıdır; o sırada gelen
 * yeni basışlar (Enter, Space, tık) kaybolmasın diye tarayıcı düzeyinde zamanlarıyla toplanır. Hedef sahne açılınca
 * tamponAl() ile alır ve kendi kuralına göre uygular. Basılı tutulan tuşun tekrarı sayılmaz.
 */
export interface GirisTamponu {
  /** Tamponun başladığı an (geçişi başlatan basış), performance.now() ms. */
  baslangic: number;
  /** Yeni basışların zamanları (performance.now() ms), sırayla. */
  basislar: number[];
}

/** Hedef sahne hiç açılmazsa (beklenmedik durum) dinleyici en geç bu kadar ms sonra kalkar. */
const EN_COK_MS = 5000;

let aktif: { tampon: GirisTamponu; temizle: () => void } | undefined;

/** Geçiş başlarken çağır: bundan sonraki yeni basışlar tamponAl() çağrılana kadar toplanır. */
export function tamponBaslat(): void {
  aktif?.temizle();
  const tampon: GirisTamponu = { baslangic: performance.now(), basislar: [] };
  const tus = (e: KeyboardEvent): void => {
    if (e.repeat) return;
    if (e.key === 'Enter' || e.key === ' ' || e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space')
      tampon.basislar.push(performance.now());
  };
  const tik = (): void => {
    tampon.basislar.push(performance.now());
  };
  const sure = window.setTimeout(() => temizle(), EN_COK_MS);
  const temizle = (): void => {
    window.removeEventListener('keydown', tus);
    window.removeEventListener('pointerdown', tik);
    window.clearTimeout(sure);
    if (aktif?.tampon === tampon) aktif = undefined;
  };
  window.addEventListener('keydown', tus);
  window.addEventListener('pointerdown', tik);
  aktif = { tampon, temizle };
}

/** Tamponu al ve dinlemeyi bitir; tampon başlatılmadıysa undefined. */
export function tamponAl(): GirisTamponu | undefined {
  if (!aktif) return undefined;
  const { tampon, temizle } = aktif;
  temizle();
  return tampon;
}
