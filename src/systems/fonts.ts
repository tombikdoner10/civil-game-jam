import { FONT, MONO } from '../config';

/**
 * Phaser metni ilk çizdiğinde font yüklü değilse yedek fonta düşer, sonradan da düzelmez.
 * Türkçe harfler (ğ ş ı İ) ayrı bir alt küme dosyasında; örnek metinle onu da açıkça yükletiyoruz.
 */
export async function loadFonts(): Promise<void> {
  const sample = 'AaĞğŞşİıÇçÖöÜü0123';
  const families = [FONT, MONO].map((stack) => stack.split(',')[0].trim());
  const loads = families.flatMap((family) =>
    ['400', '700'].map((weight) => document.fonts.load(`${weight} 32px ${family}`, sample)),
  );
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, 3000));
  try {
    await Promise.race([Promise.all(loads), timeout]);
  } catch {
    // Font yüklenemezse yedek fontla devam.
  }
}
