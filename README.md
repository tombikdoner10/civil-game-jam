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
| Görsel | Kullanılmadı | | | | |
| Ses | Kullanılmadı | | | | |
| Kod | Kullanıldı | Phaser 3.90, Richard Davey / Phaser Studio Inc. | https://phaser.io | MIT | Oyun motoru, değiştirilmedi |
| Metin | Kullanılmadı | | | | |
| Diğer | Kullanıldı | Rubik yazı tipi, The Rubik Project Authors (Fontsource paketi) | https://github.com/googlefonts/rubik | SIL Open Font License 1.1 | Arayüz yazı tipi, değiştirilmedi |
| Diğer | Kullanıldı | JetBrains Mono yazı tipi, The JetBrains Mono Project Authors (Fontsource paketi) | https://github.com/JetBrains/JetBrainsMono | SIL Open Font License 1.1 | Takım logosu ve teknik yazılar, değiştirilmedi |

- Repoda bulunmayan dosyalar: Phaser ve yazı tipleri `npm install` ile kurulur. Lisansları yeniden dağıtıma izin verir; ZIP sürümünün içine gömülüdürler.
- Yalnızca derlemede kullanılan, oyuna dahil olmayan araçlar: Vite (MIT), TypeScript (Apache-2.0), fflate (MIT, ZIP oluşturma).
- Ses efektleri ve müzik kodla üretilir (`src/audio/`); hazır ses dosyası kullanılmadı.

## Yapay zekâ beyanı

<!-- AI-BEYAN:BASLA -->
| Kategori | Durum | Araç | Amaç | Kullanıldığı yer |
|---|---|---|---|---|
| Görsel | Kullanıldı | Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5, Claude Sonnet 5.5) | Arayüz görsellerini (butonlar, menü efektleri, parçacıklar) kodla çizen kodu yazdı | Menüler, arayüz ve efektler (jam öncesi şablon), src/desk/ (3 dosya) |
| Ses | Kullanıldı | Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5) | Ses efektlerini ve müziği kodla üreten sentezleyiciyi ve ses ayarlarını yazdı | Ses efektleri ve müzik altyapısı (jam öncesi şablon) |
| Kod | Kullanıldı | Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5, Claude Sonnet 5.5) | Oyunun kodunu yazdı | Jam öncesi şablonun bütün kodu, src/game/ (4 dosya), src/scenes/GameScene.ts |
| Metin | Kullanıldı | Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5) | Arayüz metinlerini, README'yi ve BENIOKU'yu yazdı | Menü ve ayar yazıları, README, BENIOKU |
| Diğer | Kullanıldı | Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5) | Tema yorumu için konsept seçenekleri önerdi; seçim ve özgün dokunuş takımın | Oyun fikri aşaması |
<!-- AI-BEYAN:BITIR -->

Bu tablo `npm run beyan` ile otomatik üretilir: Claude Code'un yazdığı her dosya bir kancayla kategorisine göre `docs/ai-kayit.jsonl`'a kaydedilir, elle eklenenler `docs/ai-elle.json`'da durur. Teslim formu için hazır metin: `docs/AI_BEYAN.md`. Commit'lerdeki `Co-Authored-By: Claude` satırları da bu kullanımı gösterir.

## Takım

Prompt Engineers: _üye adları eklenecek_
