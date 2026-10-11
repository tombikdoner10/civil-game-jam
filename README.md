# OYUN ADI

**Prompt Engineers** takımının [CIVIL GAME JAM 2026](https://game.ktimo.com.tr/) için geliştirdiği oyun.

> Bu repo şu anda jam öncesinde hazırlanan **genel şablonu** içeriyor. Oyunun kendisi tema açıklandıktan sonra (16 Ekim 2026, 18.00) geliştirilecek.

## Oyna

**https://KULLANICI.github.io/REPO/**

Kurulum ya da hesap gerekmez; masaüstü tarayıcıda açılır.

## Oyun hakkında

_Tema açıklandıktan sonra yazılacak._

## Kontroller

| Tuş | Eylem |
|---|---|
| Fare | Menülerde seçim |
| ↑ ↓ (W S), Enter / Boşluk | Menülerde gezinme ve seçim |
| Esc / P | Duraklat |

_Oyun içi kontroller tema açıklandıktan sonra eklenecek._

## Çalıştırma talimatları

- **Platform ve gereksinimler:** Masaüstü tarayıcı (Chrome, Edge ya da Firefox'un güncel sürümü). Ek yazılım gerekmez.
- **Başlatma:** Yukarıdaki bağlantıyı aç ve ekrana tıkla. Tarayıcılar ilk tıklamaya kadar sesi açmadığı için oyun "Başlamak için tıkla" ekranıyla açılır.
- **Bilinen sorunlar:** Yok.

### Kaynak koddan çalıştırma

Node.js 20.19 veya üstü gerekir.

```bash
npm install
npm run dev      # geliştirme sunucusu: http://localhost:5173
npm run build    # yayın sürümü: dist/
```

Menünün sağ alt köşesindeki "sürüm" yazısı ve `version.json` dosyası, oyunun derlendiği Git commit'ini gösterir.

## Jam öncesi hazırlık beyanı

Kural 3.1 kapsamında, tema açıklanmadan önce yalnızca genel altyapı hazırlandı: menü ve ayar ekranları, sahne geçişleri, kodla üretilen ses efekti ve müzik sistemi, görsel efekt yardımcıları, klavye kontrolleri ve otomatik yayın. Bu altyapıda oyuna özgü mekanik, içerik ya da görsel yoktur.

Tema açıklanmadan önceki son commit: _tema açıklanınca eklenecek_

## Hazır kaynak beyanı

| Kaynak ve sağlayıcı | Kaynak bağlantısı | Lisans | Kullanım ve değişiklik | Repoda bulunmayan dosyalar |
|---|---|---|---|---|
| Phaser 3.90, Richard Davey / Phaser Studio Inc. | https://phaser.io | MIT | Oyun motoru (kod kütüphanesi), değiştirilmedi | `npm install` ile kurulur |
| Rubik yazı tipi, The Rubik Project Authors (Fontsource paketi) | https://github.com/googlefonts/rubik | SIL Open Font License 1.1 | Arayüz yazı tipi, değiştirilmedi | `npm install` ile kurulur |
| JetBrains Mono yazı tipi, The JetBrains Mono Project Authors (Fontsource paketi) | https://github.com/JetBrains/JetBrainsMono | SIL Open Font License 1.1 | Takım logosu ve teknik yazılar, değiştirilmedi | `npm install` ile kurulur |
| Vite ve TypeScript (yalnızca derleme araçları, oyuna dahil değil) | https://vite.dev, https://www.typescriptlang.org | MIT, Apache-2.0 | Derleme | `npm install` ile kurulur |

Ses efektleri ve müzik kodla üretilir (`src/audio/`); hazır ses dosyası kullanılmadı.

## Yapay zekâ beyanı

| Araç | Amaç | Kullanıldığı bölümler |
|---|---|---|
| Claude (Anthropic), Claude Code üzerinden | Kodun tamamı, tasarım önerileri, kodla üretilen ses efektleri ve müzik, arayüz metinleri, belgeler | Oyunun bütün bölümleri ve bu şablon. Takım; fikir seçimi, yönlendirme, test ve sunumu yaptı. |

Commit'lerdeki `Co-Authored-By: Claude` satırları da bu kullanımı gösterir.

## Takım

Prompt Engineers: _üye adları eklenecek_
