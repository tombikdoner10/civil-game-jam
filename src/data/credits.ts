import aiBeyan from './ai-beyan.json';

/**
 * Beyanlar: oyun içi Emeği Geçenler ekranı ve teslim formu için tek kaynak. README'deki tablolarla aynı tutulmalı.
 *
 * Teslim formunda hem hazır kaynaklar hem yapay zekâ için beş kategori ayrı ayrı yanıtlanır
 * (kural 3.4, 4.2): görsel, ses, kod, metin, diğer. Boş liste "Kullanılmadı" demektir.
 * En küçük kullanım bile yazılmalı; eksik ya da yanlış beyan diskalifiye nedenidir (kural 4.4).
 */

export type Category = 'visual' | 'audio' | 'code' | 'text' | 'other';

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'visual', label: 'Görsel' },
  { id: 'audio', label: 'Ses' },
  { id: 'code', label: 'Kod' },
  { id: 'text', label: 'Metin' },
  { id: 'other', label: 'Diğer' },
];

export interface Member {
  name: string;
  role: string;
}

export interface AssetCredit {
  name: string;
  author: string;
  url: string;
  license: string;
  usage: string;
}

export interface AiCredit {
  tool: string;
  purpose: string;
  /** Oyunda kullanıldığı yerler (ekran ve öğe adları). */
  where: string[];
}

// Takım üyeleri (T32, G52, G56): adlar ve roller takımın yazdığı gibi. G56: roller Türkçe; Egemen'in adı ve rolü
// takımın isteğiyle. Köşeli parantezli (yer tutucu) satırlar Emeği Geçenler'de gizlenir (CreditsScene).
export const MEMBERS: Member[] = [
  { name: 'Egemen AYVAZ', role: 'Takım Lideri' },
  { name: 'Deniz Demir', role: 'Oyun Testçisi ve Fikir Geliştirici' },
  { name: 'Ahmet Ata Tuncer', role: 'Ses Tasarımcısı ve Fikir Geliştirici' },
];

/**
 * Takımın kararları (Emeği Geçenler'de Takım'dan hemen sonra, hazır kaynaklardan ve yapay zekâdan önce): takımın
 * kendi verdiği yaratıcı kararlar, her biri kısa bir madde. Boşken başlık da görünmez. README "Takımın kararları" ile
 * aynı. G31: GDD'deki takım kararlarından Claude'un taslağı (docs/TAKIM_CEVAPLARI.md 10); takım kendi cümleleriyle
 * yeniden yazabilir.
 */
export const TAKIM_KARARLARI: string[] = [
  'Tema yorumu: afet anında değil, öncesinde. Oyuncu denetim masasında karar verir; deprem bu kararları sınar.',
  'Gişede insan: her dosyanın arkasında mizacı olan bir mal sahibi var. Zarf kabul edilirse istenen damga zorunlu olur, bedeli depremde görülür.',
  'Kurallar: kaçak katta +1 GÜÇLENDİR, +2 BOŞALT; geçersiz belgeler İADE; saha testi tek başına GÜVENLİ verdirmez.',
  'Deprem dili: kehanet yok, "deprem her an olabilir". Kısa yol bir soru: "Büyük deprem bu gece olsaydı?"',
  'Kendi evin: paranın karşılığı ailenin hazırlığı (çanta, sabitleme, güçlendirme). Rüşvet aileni koruyabilir ama onayladığın bina çöker.',
  "Seçimler: görsel yön (Papers, Please ilhamı, boyanmış Tiny Town) ve ses ortamı (masa sessiz, gazete ve sonuçta kısa müzik) takımın. Metinleri Claude yazdı; takım tonu belirledi, son seçimi Claude'a bıraktı.",
];

/**
 * Yapay zekâ kullanımı: burada elle yazılmaz. `scripts/beyan.mjs`, kategori başına okunur özetten (docs/ai-ozet.json)
 * ai-beyan.json'u üretir; özeti, Claude Code kancasının otomatik kaydı (docs/ai-kayit.jsonl) ve elle eklenenler
 * (docs/ai-elle.json) ile denetler. Ayrıntılı kayıt docs/AI_BEYAN.md'nin altındadır. Her commit'te yenilenir.
 */
export const AI = Object.fromEntries(
  CATEGORIES.map(({ id }) => {
    const c = aiBeyan.kategoriler[id];
    return [id, c.kullanildi ? [{ tool: c.arac, purpose: c.amac, where: c.yer }] : []];
  }),
) as Record<Category, AiCredit[]>;

/** Hazır kaynaklar: başkasının üretip kullanıma açtığı her şey. */
export const ASSETS: Record<Category, AssetCredit[]> = {
  visual: [
    {
      name: 'Tiny Town',
      author: 'Kenney (www.kenney.nl)',
      url: 'https://kenney.nl/assets/tiny-town',
      license: 'Creative Commons CC0 1.0',
      usage: 'Bina cepheleri ve sokak; renk paleti değiştirildi, karolardan cephe kuruldu',
    },
  ],
  audio: [
    {
      name: 'Kenney – Impact Sounds',
      author: 'Kenney (www.kenney.nl)',
      url: 'https://kenney.nl/assets/impact-sounds',
      license: 'Creative Commons CC0 1.0',
      usage: 'Kaşenin belgeye vurması, kaşeyi alma ve yerine koyma, çekmece, kusur bulundu sesi ve depremin vuruş, moloz, çatırtı, cam titremesi ve bina hasarı sesleri; çoğu yavaşlatıldı (hız ve perde değiştirildi), bazıları katmanlandı (src/sounds/kenney/impact-sounds/)',
    },
    {
      name: 'Kenney – RPG Audio',
      author: 'Kenney (www.kenney.nl)',
      url: 'https://kenney.nl/assets/rpg-audio',
      license: 'Creative Commons CC0 1.0',
      usage: 'Kâğıt ve belge sesleri (kayma, alma, bırakma, toplama, fiş), yönetmelik klasörü aç/kapa, sekme ve sayfa çevirme, ıstampa, inceleme modu aç/kapa, gişede ayak sesleri, sarsıntıda gıcırtı; hız ve perde değiştirildi, baştaki sessizlik atlandı (src/sounds/kenney/rpg-audio/)',
    },
    {
      name: 'Kenney – Interface Sounds',
      author: 'Kenney (www.kenney.nl)',
      url: 'https://kenney.nl/assets/interface-sounds',
      license: 'Creative Commons CC0 1.0',
      usage: 'Menüde geri sesi, inceleme modunda seçim bırakma, kusur bulundu, "tutarsızlık yok", doğru ve yanlış karar uyarısı; hız ve perde hafifçe değiştirildi (src/sounds/kenney/interface-sounds/)',
    },
    {
      name: 'Kenney – UI Audio',
      author: 'Kenney (www.kenney.nl)',
      url: 'https://kenney.nl/assets/ui-audio',
      license: 'Creative Commons CC0 1.0',
      usage: 'Menü düğmeleri (tık, üzerine gelme) ve inceleme modunda alan seçimi; değiştirilmedi (src/sounds/kenney/ui-audio/)',
    },
    {
      name: 'Kenney – Music Jingles',
      author: 'Kenney (www.kenney.nl)',
      url: 'https://kenney.nl/assets/music-jingles',
      license: 'Creative Commons CC0 1.0',
      usage:
        'Pizzicato jingle\'ları: gün sonu raporu (iyi gün PIZZI10, kötü gün PIZZI07), gazete açılışı (PIZZI03), sonuç ekranı (iyi PIZZI02, kötü PIZZI01); değiştirilmedi (src/sounds/kenney/music-jingles/)',
    },
  ],
  code: [
    {
      name: 'Phaser 3.90',
      author: 'Richard Davey, Phaser Studio Inc.',
      url: 'https://phaser.io',
      license: 'MIT',
      usage: 'Oyun motoru (kod kütüphanesi), değiştirilmedi',
    },
  ],
  text: [],
  other: [
    {
      name: 'Pixelify Sans (yazı tipi)',
      author: 'The Pixelify Sans Project Authors',
      url: 'https://fonts.google.com/specimen/Pixelify+Sans',
      license: 'SIL Open Font License 1.1',
      usage: 'Arayüz ve belge başlıkları yazı tipi, değiştirilmedi',
    },
    {
      name: 'VT323 (yazı tipi)',
      author: 'The VT323 Project Authors',
      url: 'https://fonts.google.com/specimen/VT323',
      license: 'SIL Open Font License 1.1',
      usage: 'Belge değerleri, saat ve paneller yazı tipi, değiştirilmedi',
    },
  ],
};
