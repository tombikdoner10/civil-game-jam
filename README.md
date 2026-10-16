# OYUN ADI

**Prompt Engineers** takımının [CIVIL GAME JAM 2026](https://game.ktimo.com.tr/) için geliştirdiği oyun.

> Bu repo şu anda jam öncesinde hazırlanan **genel şablonu** içeriyor. Oyunun kendisi tema açıklandıktan sonra (16 Ekim 2026, 18.00) geliştirilecek.

## Oyna

- **Web:** https://tombikdoner10.github.io/civil-game-jam/ (kurulum ya da hesap gerekmez)
- **İndirilebilir sürüm:** Teslim ZIP'ini çıkar ve `OYNA.html` dosyasına çift tıkla; internet gerekmez.

## Oyun hakkında

_Tema açıklandıktan sonra yazılacak._

## Çalıştırma talimatları

- **Platform ve gereksinimler:** Windows bilgisayarda Chrome, Edge ya da Firefox'un güncel sürümü. Ek yazılım gerekmez.
- **Başlatma:** Web bağlantısını aç ya da ZIP'i çıkarıp `OYNA.html`'e çift tıkla. Ardından ekrana bir kez tıkla; tarayıcılar ilk tıklamaya kadar sesi açmaz.
- **Oynanış:** Amaç, kontroller ve ilk adım tema açıklandıktan sonra yazılacak.
- **Bilinen sorunlar:** Yok.

### Kontroller

| Tuş | Eylem |
|---|---|
| Fare | Menülerde seçim |
| ↑ ↓ (W S), Enter / Boşluk | Menülerde gezinme ve seçim |
| Esc / P | Duraklat |

_Oyun içi kontroller tema açıklandıktan sonra eklenecek._

### Kaynak koddan çalıştırma

Node.js 20.19 veya üstü gerekir.

```bash
npm install
npm run dev      # geliştirme sunucusu: http://localhost:5173
npm run build    # web sürümü: dist/
npm run zip      # teslim ZIP'i: teslim/ (tek dosyalık, internetsiz çalışan sürüm)
```

Menünün sağ alt köşesindeki "sürüm" yazısı, oyunun derlendiği Git commit'ini gösterir.

## Jam öncesi hazırlık beyanı

Kural 3.1 kapsamında, tema açıklanmadan önce yalnızca genel altyapı hazırlandı: menü ve ayar ekranları, sahne geçişleri, kodla üretilen ses efekti ve müzik sistemi, görsel efekt yardımcıları, klavye kontrolleri, otomatik yayın ve teslim ZIP'ini hazırlayan araç. Bu altyapıda oyuna özgü mekanik, içerik ya da görsel yoktur.

Tema açıklanmadan önceki son commit: _tema açıklanınca eklenecek_

## Hazır kaynak beyanı

| Kategori | Durum | Kaynak ve sağlayıcı | Bağlantı | Lisans | Kullanım ve değişiklik |
|---|---|---|---|---|---|
| Görsel | Kullanıldı | Tiny Town, Kenney (www.kenney.nl) | https://kenney.nl/assets/tiny-town | Creative Commons CC0 1.0 | Bina cepheleri ve sokak; renk paleti değiştirildi, karolardan cephe kuruldu (`src/art/tiny-town/`) |
| Ses | Kullanıldı | Impact Sounds, Kenney (www.kenney.nl) | https://kenney.nl/assets/impact-sounds | Creative Commons CC0 1.0 | Damga tokmağı, damga çubuğu, kusur bulundu sesi ve öncü sarsıntının vuruş, moloz, çatırtı, cam titremesi ve bina hasarı sesleri; çoğu yavaşlatıldı (hız ve perde değiştirildi), bazıları katmanlandı (`src/sounds/kenney/impact-sounds/`) |
| Ses | Kullanıldı | RPG Audio, Kenney (www.kenney.nl) | https://kenney.nl/assets/rpg-audio | Creative Commons CC0 1.0 | Kâğıt ve belge sesleri (kayma, alma, bırakma, toplama, fiş), kural kitabı aç/kapa ve sayfa çevirme, inceleme modu aç/kapa, gişede ayak sesleri, sarsıntıda gıcırtı; hız ve perde değiştirildi, baştaki sessizlik atlandı (`src/sounds/kenney/rpg-audio/`) |
| Ses | Kullanıldı | Interface Sounds, Kenney (www.kenney.nl) | https://kenney.nl/assets/interface-sounds | Creative Commons CC0 1.0 | Menüde geri sesi, inceleme modunda seçim bırakma, kusur bulundu, "tutarsızlık yok", doğru ve yanlış karar uyarısı; hız ve perde hafifçe değiştirildi (`src/sounds/kenney/interface-sounds/`) |
| Ses | Kullanıldı | UI Audio, Kenney (www.kenney.nl) | https://kenney.nl/assets/ui-audio | Creative Commons CC0 1.0 | Menü düğmeleri (tık, üzerine gelme) ve inceleme modunda alan seçimi; değiştirilmedi (`src/sounds/kenney/ui-audio/`) |
| Ses | Kullanıldı | Music Jingles, Kenney (www.kenney.nl) | https://kenney.nl/assets/music-jingles | Creative Commons CC0 1.0 | Gün sonu raporu: iyi gün ve kötü gün jingle'ı (Pizzicato); değiştirilmedi (`src/sounds/kenney/music-jingles/`) |
| Kod | Kullanıldı | Phaser 3.90, Richard Davey / Phaser Studio Inc. | https://phaser.io | MIT | Oyun motoru, değiştirilmedi |
| Metin | Kullanılmadı | | | | |
| Diğer | Kullanıldı | Rubik yazı tipi, The Rubik Project Authors (Fontsource paketi) | https://github.com/googlefonts/rubik | SIL Open Font License 1.1 | Arayüz yazı tipi, değiştirilmedi |
| Diğer | Kullanıldı | JetBrains Mono yazı tipi, The JetBrains Mono Project Authors (Fontsource paketi) | https://github.com/JetBrains/JetBrainsMono | SIL Open Font License 1.1 | Takım logosu ve teknik yazılar, değiştirilmedi |
| Diğer | Kullanıldı | Pixelify Sans yazı tipi, The Pixelify Sans Project Authors (Fontsource paketi) | https://fonts.google.com/specimen/Pixelify+Sans | SIL Open Font License 1.1 | Arayüz ve belge başlıkları yazı tipi, değiştirilmedi |
| Diğer | Kullanıldı | VT323 yazı tipi, The VT323 Project Authors (Fontsource paketi) | https://fonts.google.com/specimen/VT323 | SIL Open Font License 1.1 | Belge değerleri, saat ve paneller yazı tipi, değiştirilmedi |

- Repoda bulunmayan dosyalar: Phaser ve yazı tipleri `npm install` ile kurulur. Lisansları yeniden dağıtıma izin verir; ZIP sürümünün içine gömülüdürler.
- Yalnızca derlemede kullanılan, oyuna dahil olmayan araçlar: Vite (MIT), TypeScript (Apache-2.0), fflate (MIT, ZIP oluşturma).
- Ses efektlerinin çoğu Kenney ses paketlerinden gelir (yukarıdaki tablo; hangi dosyanın nerede çaldığı `docs/SESLER.md`). Deprem gürlemesinin tabanı ve yedek sesler kodla üretilir (`src/audio/sfx.ts`).

## Yapay zekâ beyanı

<!-- AI-BEYAN:BASLA -->
| Kategori | Durum | Araç | Amaç | Kullanıldığı yer |
|---|---|---|---|---|
| Görsel | Kullanıldı | Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5, Claude Sonnet 5.5) | Arayüz görsellerini (butonlar, menü efektleri, parçacıklar) kodla çizen kodu yazdı; Masa sahnesi belge yazıları, bina cephesi kat bandı ve vitrin çizimi (betikle düzenlendi); G4b: sokakta deprem çatlağı ve sıva dökülmesi çizimi (betikle düzenleme) | Menüler, arayüz ve efektler (jam öncesi şablon), src/desk/documents.ts, src/desk/tiles.ts, src/desk/StampTray.ts, src/desk/props.ts, src/desk/tiles.ts (hasarCiz), src/desk/ (14 dosya), src/scenes/DayEndScene.ts |
| Ses | Kullanıldı | Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5, Claude Sonnet 5.5) | Ses efektlerini ve müziği kodla üreten sentezleyiciyi ve ses ayarlarını yazdı; Deprem gürlemesinin tabanını kodla üreten döngü (kahverengi gürültü, filtre, dalgalanma) ve Kenney ses dosyalarının hız/perde/katman ayarları | Ses efektleri ve müzik altyapısı (jam öncesi şablon), Öncü sarsıntı sesi (src/audio/sfx.ts, src/audio/sesler.ts), src/audio/ (2 dosya) |
| Kod | Kullanıldı | Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5, Claude Sonnet 5.5) | Oyunun kodunu yazdı; Gün dosyası dengesi, masa sınırı, kart boyutu, duman testi bayrakları (betikle düzenlendi); İnceleme modu ve kural kitabı (G3): Bash/Python betiğiyle yapılan kod düzenlemeleri; G4b: kalıcı sokak ve öncü sarsıntı bağlantıları (betikle düzenleme); G12: Kenney seslerinin oyuna bağlanması, ses tablosu ve Yeniden Başla düzeltmesi (Python betiğiyle kod düzenlemesi) | Jam öncesi şablonun bütün kodu, src/game/, src/desk/DocumentCard.ts, src/scenes/, src/ui/, scripts/smoke.mjs, src/scenes/GameScene.ts, src/game/rules.ts, src/game/session.ts, src/desk/documents.ts, src/desk/StampTray.ts, src/game/session.ts, rules.ts, tuning.ts, src/scenes/GameScene.ts, DayEndScene.ts, src/desk/Window.ts, src/audio/sfx.ts, src/audio/audio.ts, src/assets.ts, src/desk/ (Quake, Inspect, RuleBook, RuleNote, StampTray, DocumentCard), src/scenes/ (Game, Pause, DayEnd, Settings, Boot), src/main.ts, src/game/ (5 dosya), src/scenes/GameScene.ts, scripts/smoke.mjs, src/desk/yerlesim.ts |
| Metin | Kullanıldı | Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5, Claude Sonnet 5.5) | Arayüz metinlerini, README'yi ve BENIOKU'yu yazdı | Menü ve ayar yazıları, README, BENIOKU, docs/SESLER.md |
| Diğer | Kullanıldı | Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5) | Tema yorumu için konsept seçenekleri önerdi; seçim ve özgün dokunuş takımın; Kenney ses dosyalarını ad, süre ve dalga biçimi ölçümüne göre aday olarak seçti (takım dinleyip değiştirecek); hazır kaynak beyanını ve ses listesini yazdı | Oyun fikri aşaması, src/sounds/kenney/, docs/SESLER.md, README.md, src/data/credits.ts |
<!-- AI-BEYAN:BITIR -->

Bu tablo `npm run beyan` ile otomatik üretilir: Claude Code'un yazdığı her dosya bir kancayla kategorisine göre `docs/ai-kayit.jsonl`'a kaydedilir, elle eklenenler `docs/ai-elle.json`'da durur. Teslim formu için hazır metin: `docs/AI_BEYAN.md`. Commit'lerdeki `Co-Authored-By: Claude` satırları da bu kullanımı gösterir.

## Takım

Prompt Engineers: _üye adları eklenecek_
