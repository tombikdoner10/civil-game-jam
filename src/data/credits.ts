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
  where: string;
}

// TODO: Takım üyelerinin adlarını ve rollerini yaz.
export const MEMBERS: Member[] = [
  { name: 'Takım üyesi 1', role: 'Yönetim, oyun tasarımı kararları, test' },
  { name: 'Takım üyesi 2', role: 'Test, video, sunum' },
];

/**
 * Yapay zekâ kullanımı: elle yazılmaz. `scripts/beyan.mjs`, Claude Code kancasının otomatik kaydından
 * (docs/ai-kayit.jsonl) ve elle eklenenlerden (docs/ai-elle.json) ai-beyan.json'u üretir; her commit'te yenilenir.
 */
export const AI = Object.fromEntries(
  CATEGORIES.map(({ id }) => {
    const c = aiBeyan.kategoriler[id];
    return [id, c.kullanildi ? [{ tool: c.arac, purpose: c.amac, where: c.yer.join(', ') }] : []];
  }),
) as Record<Category, AiCredit[]>;

/** Hazır kaynaklar: başkasının üretip kullanıma açtığı her şey. */
export const ASSETS: Record<Category, AssetCredit[]> = {
  visual: [],
  audio: [],
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
      name: 'Rubik (yazı tipi)',
      author: 'The Rubik Project Authors',
      url: 'https://github.com/googlefonts/rubik',
      license: 'SIL Open Font License 1.1',
      usage: 'Arayüz yazı tipi, değiştirilmedi',
    },
    {
      name: 'JetBrains Mono (yazı tipi)',
      author: 'The JetBrains Mono Project Authors',
      url: 'https://github.com/JetBrains/JetBrainsMono',
      license: 'SIL Open Font License 1.1',
      usage: 'Takım logosu ve teknik yazılar, değiştirilmedi',
    },
  ],
};
