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
- **Oynanış:** Her dosyada belgeleri karşılaştır, tutarsızlığı inceleme modunda bul ve kaşeyle karar ver (GÜVENLİ / GÜÇLENDİR / BOŞALT / İADE). Gün 1 kısa sürer ve küçük bir depremle biter; gün sonu raporundaki "[Büyük deprem bu gece olsaydı?]" düğmesi (Enter ya da D) kararlarının sonucunu hemen gösterir.
- **Bilinen sorunlar:** Yok.

### Kontroller

| Girdi | Eylem |
|---|---|
| Fare: belgeyi sürükle | Belgeyi masada taşı |
| Fare: kaşeye tıkla | Kaşe ruhsata vurulur (kararı verir); kaşe ruhsata sürüklenip bırakılabilir de |
| 1 / 2 / 3 / 4 | GÜVENLİ / GÜÇLENDİR / BOŞALT / İADE kaşesi (kaşe rafta varsa) |
| Space (ya da İNCELE düğmesi) | İnceleme modunu aç / kapa |
| İnceleme modunda iki alana tıkla | Tutarsızlığı işaretle (ör. ruhsattaki kat sayısı ile fotoğraf); etiketteki SOR ve İSTE gişedeki kişiye sorar |
| Fare: yönetmelik klasörüne tıkla | Klasörü aç; sekmeler bölümleri, X kapatır (gün 2'den) |
| Esc / P | Duraklat (inceleme modu açıksa önce onu kapatır) |
| Enter / Space | Gün sonu raporunda sonraki gün (gün 1 raporunda kısa yol); gazetede devam |
| N | Gün 1 sonu raporunda sonraki gün |
| D | Gün 1 sonu raporunda "[Büyük deprem bu gece olsaydı?]" (büyük depreme kısa yol) |
| ↑ ↓ (W S), Enter | Menülerde gezinme ve seçim |

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
| Ses | Kullanıldı | Impact Sounds, Kenney (www.kenney.nl) | https://kenney.nl/assets/impact-sounds | Creative Commons CC0 1.0 | Kaşenin belgeye vurması, kaşeyi alma ve yerine koyma, çekmece, kusur bulundu sesi ve depremin vuruş, moloz, çatırtı, cam titremesi ve bina hasarı sesleri; çoğu yavaşlatıldı (hız ve perde değiştirildi), bazıları katmanlandı (`src/sounds/kenney/impact-sounds/`) |
| Ses | Kullanıldı | RPG Audio, Kenney (www.kenney.nl) | https://kenney.nl/assets/rpg-audio | Creative Commons CC0 1.0 | Kâğıt ve belge sesleri (kayma, alma, bırakma, toplama, fiş), yönetmelik klasörü aç/kapa, sekme ve sayfa çevirme, ıstampa, inceleme modu aç/kapa, gişede ayak sesleri, sarsıntıda gıcırtı; hız ve perde değiştirildi, baştaki sessizlik atlandı (`src/sounds/kenney/rpg-audio/`) |
| Ses | Kullanıldı | Interface Sounds, Kenney (www.kenney.nl) | https://kenney.nl/assets/interface-sounds | Creative Commons CC0 1.0 | Menüde geri sesi, inceleme modunda seçim bırakma, kusur bulundu, "tutarsızlık yok", doğru ve yanlış karar uyarısı; hız ve perde hafifçe değiştirildi (`src/sounds/kenney/interface-sounds/`) |
| Ses | Kullanıldı | UI Audio, Kenney (www.kenney.nl) | https://kenney.nl/assets/ui-audio | Creative Commons CC0 1.0 | Menü düğmeleri (tık, üzerine gelme) ve inceleme modunda alan seçimi; değiştirilmedi (`src/sounds/kenney/ui-audio/`) |
| Ses | Kullanıldı | Music Jingles, Kenney (www.kenney.nl) | https://kenney.nl/assets/music-jingles | Creative Commons CC0 1.0 | Pizzicato jingle'ları: gün sonu raporu (iyi gün PIZZI10, kötü gün PIZZI07), gazete açılışı (PIZZI03), sonuç ekranı (iyi PIZZI02, kötü PIZZI01); değiştirilmedi (`src/sounds/kenney/music-jingles/`) |
| Kod | Kullanıldı | Phaser 3.90, Richard Davey / Phaser Studio Inc. | https://phaser.io | MIT | Oyun motoru, değiştirilmedi |
| Metin | Kullanılmadı | | | | |
| Diğer | Kullanıldı | Pixelify Sans yazı tipi, The Pixelify Sans Project Authors (Fontsource paketi) | https://fonts.google.com/specimen/Pixelify+Sans | SIL Open Font License 1.1 | Arayüz ve belge başlıkları yazı tipi, değiştirilmedi |
| Diğer | Kullanıldı | VT323 yazı tipi, The VT323 Project Authors (Fontsource paketi) | https://fonts.google.com/specimen/VT323 | SIL Open Font License 1.1 | Belge değerleri, saat ve paneller yazı tipi, değiştirilmedi |

- Repoda bulunmayan dosyalar: Phaser ve yazı tipleri `npm install` ile kurulur. Lisansları yeniden dağıtıma izin verir; ZIP sürümünün içine gömülüdürler.
- Yalnızca derlemede kullanılan, oyuna dahil olmayan araçlar: Vite (MIT), TypeScript (Apache-2.0), fflate (MIT, ZIP oluşturma).
- Ses efektlerinin çoğu Kenney ses paketlerinden gelir (yukarıdaki tablo; hangi dosyanın nerede çaldığı `docs/SESLER.md`). Deprem gürlemesinin tabanı ve yedek sesler kodla üretilir (`src/audio/sfx.ts`).

## Yapay zekâ beyanı

<!-- AI-BEYAN:BASLA -->
| Kategori | Durum | Araç | Amaç | Kullanıldığı yer |
|---|---|---|---|---|
| Görsel | Kullanıldı | Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5, Claude Sonnet 5.5) | Oyundaki görselleri kodla, piksel piksel çizen kodu yazdı: arayüz ve menü, masa ve belgeler, gişedeki kişilerin portreleri, kaşeler, bina cephesi ayrıntıları, sokak, deprem hasarı ve efektler. Bina ve sokak karoları hazır paketten gelir (Hazır kaynaklar bölümü). | Menü sokağı ve bütün arayüz: düğmeler, kâğıt paneller, arka plan, parçacık ve ekran efektleri; Masa: belgeler (yazılar, ada/parsel satırları, imzalar, elle düzeltme izleri), kaşeler ve kaşelik, yönetmelik klasörü, kural notları, inceleme modu, masa eşyaları; Gişe: kişi portreleri, konuşma balonu, zarf ve çekmece, SOR/İSTE düğmeleri, getirilen raporlar; Sokak: bina cephesi ayrıntıları (kat bandı, vitrin), bina etiketleri, deprem çatlakları ve sıva dökülmesi; Saha testi (kolon yakın planı), deprem, gün sonu, gazete ve sonuç ekranları |
| Ses | Kullanıldı | Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5) | Ses efektlerini ve müziği kodla üreten sentezleyiciyi, deprem gürlemesini kodla üreten sesi ve ses ayarlarını yazdı. Hazır paketteki Kenney seslerinin hız, perde ve katman ayarlarını yaptı. | Arayüz ve oyun ses efektleri, müzik altyapısı; Deprem gürlemesi; Kenney seslerinin çalınışı (hız, perde, katman); Ses düzeyi ayarları |
| Kod | Kullanıldı | Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5, Claude Sonnet 5.5) | Oyunun bütün kodunu yazdı (jam öncesi hazırlanan şablon dahil): oynanış ve kurallar, belgeler ve gişe diyaloğu, deprem, gün sonu, gazete ve sonuç ekranları, menüler, ses bağlantıları. Ayrıca oyunun dengesini ve kararların adil sonuçlanmasını denetleyen bir araç ile otomatik ekran testi aracını yazdı. | Oyunun tamamı: menü, masa, gişe, sokak, saha testi, deprem, gün sonu, gazete, sonuç, ayarlar, duraklatma; Geliştirme araçları: denge denetimi ve otomatik test (oyunda görünmez) |
| Metin | Kullanıldı | Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5) | Arayüz metinlerini, README'yi, BENIOKU'yu, ses listesini ve beyan açıklamalarını yazdı. Gişe diyalogları, zarf ve rapor satırları, kural metinleri, gazete ve deprem anlatımı için yer tutucu metinler yazdı; takım bunları yeniden yazacak. | Menü, ayarlar, oyun içi ipuçları ve göstergeler; Gişe diyalogları (SOR, İSTE), zarf ve rapor satırları, yönetmelik kuralları (yer tutucu); Gazete, küçük deprem şeridi, kısa yol sorusu ve çerçeve cümlesi (yer tutucu); Emeği Geçenler, README, BENIOKU |
| Diğer | Kullanıldı | Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5, Claude Sonnet 5.5) | Tema yorumu için konsept seçenekleri önerdi, Kenney seslerinden ölçüme dayalı adaylar seçti, hazır kaynak beyanını ve ses listesini yazdı; konsept seçimi, son ses seçimi ve kararlar takımın. Geliştirme sürecini görevlere bölüp yönetti, oyunu otomatik oynayarak test etti ve jam ölçütlerine göre değerlendirip öneriler sundu. | Oyun fikri aşaması; Ses seçimi ve hazır kaynak beyanı (Emeği Geçenler, README); Geliştirme, test ve değerlendirme süreci (oyunda doğrudan yer almaz) |
<!-- AI-BEYAN:BITIR -->

Bu tablo `npm run beyan` ile otomatik üretilir: Claude Code'un yazdığı her dosya bir kancayla kategorisine göre `docs/ai-kayit.jsonl`'a kaydedilir, elle eklenenler `docs/ai-elle.json`'da durur. Teslim formu için hazır metin: `docs/AI_BEYAN.md`. Commit'lerdeki `Co-Authored-By: Claude` satırları da bu kullanımı gösterir.

## Takım

Prompt Engineers: _üye adları eklenecek_
