/**
 * Emeği Geçenler ekranının verisi. README'deki beyanlarla aynı tutulmalı (kural 3.4, 4.2).
 * Yeni hazır kaynak eklediğinde ASSETS'e, yapay zekâ kullanımı değiştiğinde AI'a ekle.
 */

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

export const AI: AiCredit[] = [
  {
    tool: 'Claude (Anthropic), Claude Code üzerinden',
    purpose: 'Kodun tamamı, tasarım önerileri, kodla üretilen ses efektleri ve müzik, arayüz metinleri, belgeler',
    where: 'Oyunun bütün bölümleri. Takım; fikir seçimi, yönlendirme, test ve sunumu yaptı.',
  },
];

export const ASSETS: AssetCredit[] = [
  {
    name: 'Phaser 3.90',
    author: 'Richard Davey, Phaser Studio Inc.',
    url: 'https://phaser.io',
    license: 'MIT',
    usage: 'Oyun motoru (kod kütüphanesi)',
  },
  {
    name: 'Rubik (yazı tipi)',
    author: 'The Rubik Project Authors',
    url: 'https://github.com/googlefonts/rubik',
    license: 'SIL Open Font License 1.1',
    usage: 'Arayüz yazı tipi',
  },
  {
    name: 'JetBrains Mono (yazı tipi)',
    author: 'The JetBrains Mono Project Authors',
    url: 'https://github.com/JetBrains/JetBrainsMono',
    license: 'SIL Open Font License 1.1',
    usage: 'Takım logosu ve teknik yazılar',
  },
];
