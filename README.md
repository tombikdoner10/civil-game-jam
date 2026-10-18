# Kâğıt Üstünde

**Prompt Engineers** takımının [CIVIL GAME JAM 2026](https://game.ktimo.com.tr/) için geliştirdiği oyun.

## Oyna

- **Web:** https://tombikdoner10.github.io/civil-game-jam/ (kurulum ya da hesap gerekmez)
- **İndirilebilir sürüm:** Teslim ZIP'ini çıkar ve `OYNA.html` dosyasına çift tıkla; internet gerekmez.

## Oyun hakkında

Belediyenin yapı denetçisisin. Binaların belgelerini inceleyip kurala göre damgala; büyük deprem gelince kararlarının sonucunu gör.

## Çalıştırma talimatları

- **Platform ve gereksinimler:** Windows bilgisayarda Chrome, Edge ya da Firefox'un güncel sürümü. Ek yazılım gerekmez.
- **Başlatma:** Web bağlantısını aç ya da ZIP'i çıkarıp `OYNA.html`'e çift tıkla. Ardından ekrana bir kez tıkla; tarayıcılar ilk tıklamaya kadar sesi açmaz.
- **Oynanış:** Her dosyada belgeleri karşılaştır, tutarsızlığı inceleme modunda bul ve kaşeyle karar ver (GÜVENLİ / GÜÇLENDİR / BOŞALT / İADE). Gün 1 kısa sürer ve küçük bir depremle biter; gün sonu raporundaki "Büyük deprem bu gece olsaydı?" düğmesi (Enter ya da D) kararlarının sonucunu hemen gösterir.
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
| Esc / P | Duraklat (açık klasörü ya da inceleme modunu önce kapatır) |
| Enter / Space | Gün sonu raporunda sonraki gün (gün 1 raporunda kısa yol); gazetede devam |
| SAHA (rapor yok kartında) | Schmidt çekiciyle saha testi: temiz yüzeye tıkla; Space / Enter notu alır, Esc vazgeçer (mesaiden süre yer) |
| Zarf: AL / GERİ VER | Zarfı al ya da geri ver (çekmeceye ya da gişeye sürüklemek de olur); karar verilene kadar kaşeler kilitli |
| Enter / Space / tıklama | Deprem sırasında hızlandır |
| Sonuç ekranında Enter / R / Esc | Kısa yolda 2. günden devam (5. gün sonunda yeniden oyna) / yeniden oyna (kısa yolda) / ana menü |
| N | Gün 1 sonu raporunda sonraki gün |
| D | Gün 1 sonu raporunda "Büyük deprem bu gece olsaydı?" (büyük depreme kısa yol) |
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

Tema açıklanmadan önceki son commit: `cc37c87` (`jam-oncesi-sablon` etiketi, 16 Ekim 2026 14.52)

## Takım

Prompt Engineers: Egemen Ayvaz (Takım Lideri), Deniz Demir (Oyun Testçisi ve Fikir Geliştirici), Ahmet Ata Tuncer (Ses Tasarımcısı ve Fikir Geliştirici).

## Takımın kararları

Oyundaki Emeği Geçenler ekranıyla aynı maddeler (`src/data/credits.ts`, `TAKIM_KARARLARI`). Taslağı Claude, GDD'deki takım kararlarından yazdı (Yapay zekâ beyanı, Metin).

- **Tema yorumu:** afet anında değil, öncesinde. Oyuncu denetim masasında karar verir; deprem bu kararları sınar.
- **Gişede insan:** her dosyanın arkasında mizacı olan bir mal sahibi var. Zarf kabul edilirse istenen damga zorunlu olur, bedeli depremde görülür.
- **Kurallar:** kaçak katta +1 GÜÇLENDİR, +2 BOŞALT; geçersiz belgeler İADE; saha testi tek başına GÜVENLİ verdirmez.
- **Müfettiş:** testte zarf hep kârlıydı; artık zarf yakalanabilir, rüşveti geri çevirmek övülür.
- **Deprem dili:** kehanet yok, "deprem her an olabilir". Kısa yol bir soru: "Büyük deprem bu gece olsaydı?"
- **Kendi evin:** paranın karşılığı ailenin hazırlığı (çanta, sabitleme, güçlendirme). Rüşvet aileni koruyabilir ama onayladığın bina çöker.
- **Seçimler:** görsel yön (Papers, Please ilhamı, boyanmış Tiny Town) ve ses ortamı (menüde takımın bestesi, masa sessiz, gazete ve sonuçta kısa müzik) takımın. Metinleri Claude yazdı; takım tonu belirledi, son seçimi Claude'a bıraktı.

## Hazır kaynak beyanı

| Kategori | Durum | Kaynak ve sağlayıcı | Bağlantı | Lisans | Kullanım ve değişiklik |
|---|---|---|---|---|---|
| Görsel | Kullanıldı | Tiny Town, Kenney (www.kenney.nl) | https://kenney.nl/assets/tiny-town | Creative Commons CC0 1.0 | Bina cepheleri ve sokak; renk paleti değiştirildi, karolardan cephe kuruldu (`src/art/tiny-town/`) |
| Ses | Kullanıldı | Impact Sounds, Kenney (www.kenney.nl) | https://kenney.nl/assets/impact-sounds | Creative Commons CC0 1.0 | Kaşenin belgeye vurması, kaşeyi alma ve yerine koyma, kilitli kaşeye dokunuş, çekmece, kusur bulundu sesi, saha testinde çekiç vuruşu ve geçersiz okuma, gün sonunda alınamayan ev kalemi ve depremin vuruş, moloz, çatırtı, cam titremesi ve bina hasarı sesleri; çoğu yavaşlatıldı (hız ve perde değiştirildi), bazıları katmanlandı (`src/sounds/kenney/impact-sounds/`) |
| Ses | Kullanıldı | RPG Audio, Kenney (www.kenney.nl) | https://kenney.nl/assets/rpg-audio | Creative Commons CC0 1.0 | Kâğıt ve belge sesleri (kayma, alma, bırakma, toplama, fiş, İADE'de dosya kapanması), zarfın masaya kayması, çekmeceye girmesi ve geri verilmesi, yönetmelik klasörü aç/kapa, sekme ve sayfa çevirme, ıstampa, inceleme modu aç/kapa, saha testinde ibre tıkırtısı, gişede ayak sesleri, sarsıntıda gıcırtı; hız ve perde değiştirildi, baştaki sessizlik atlandı (`src/sounds/kenney/rpg-audio/`) |
| Ses | Kullanıldı | Interface Sounds, Kenney (www.kenney.nl) | https://kenney.nl/assets/interface-sounds | Creative Commons CC0 1.0 | Menüde geri sesi, inceleme modunda seçim bırakma, kusur bulundu, "tutarsızlık yok", doğru ve yanlış karar uyarısı, saha testinde sonuç, geçersiz okuma ve vazgeçme; hız ve perde hafifçe değiştirildi (`src/sounds/kenney/interface-sounds/`) |
| Ses | Kullanıldı | UI Audio, Kenney (www.kenney.nl) | https://kenney.nl/assets/ui-audio | Creative Commons CC0 1.0 | Menü ve ekran düğmeleri (tık, üzerine gelme), duraklatma ve ayarlar, inceleme modunda alan seçimi, gişede konuşma balonunun harf sesi; hız ve perde değiştirildi (`src/sounds/kenney/ui-audio/`) |
| Ses | Kullanıldı | Music Jingles, Kenney (www.kenney.nl) | https://kenney.nl/assets/music-jingles | Creative Commons CC0 1.0 | Pizzicato jingle'ları: gün sonu raporu (iyi gün PIZZI10, kötü gün PIZZI07), gazete açılışı (PIZZI03), sonuç ekranı (iyi PIZZI02, kötü PIZZI01); değiştirilmedi (`src/sounds/kenney/music-jingles/`) |
| Kod | Kullanıldı | Phaser 3.90, Richard Davey, Phaser Studio Inc. | https://phaser.io | MIT | Oyun motoru (kod kütüphanesi), değiştirilmedi |
| Metin | Kullanılmadı | | | | |
| Diğer | Kullanıldı | Pixelify Sans (yazı tipi), The Pixelify Sans Project Authors (Fontsource paketi) | https://fonts.google.com/specimen/Pixelify+Sans | SIL Open Font License 1.1 | Arayüz ve belge başlıkları yazı tipi, değiştirilmedi; tanıtım videosundaki ara kartlarda da kullanıldı |
| Diğer | Kullanıldı | VT323 (yazı tipi), The VT323 Project Authors (Fontsource paketi) | https://fonts.google.com/specimen/VT323 | SIL Open Font License 1.1 | Belge değerleri, saat ve paneller yazı tipi, değiştirilmedi; tanıtım videosundaki ara kartlarda da kullanıldı |

- Repoda bulunmayan dosyalar: Phaser ve yazı tipleri `npm install` ile kurulur. Lisansları yeniden dağıtıma izin verir; ZIP sürümünün içine gömülüdürler.
- Yalnızca derlemede kullanılan, oyuna dahil olmayan araçlar: Vite (MIT), TypeScript (Apache-2.0), fflate (MIT, ZIP oluşturma).
- Ses efektlerinin çoğu Kenney ses paketlerinden gelir (yukarıdaki tablo; hangi dosyanın nerede çaldığı `docs/SESLER.md`). Deprem gürlemesinin tabanı ve yedek sesler kodla üretilir (`src/audio/sfx.ts`).
- Ana menü müziği takımın bestesidir: FL Studio'da yalnızca programın kendi enstrüman ve sesleriyle yapıldı; hazır döngü, örnek paketi ve yapay zekâ kullanılmadı. Claude ilk 15 saniyesini ve sondaki sessizliği kırpıp başa yarım saniyelik yumuşak giriş ekledi, OGG'ye dönüştürdü ve menüye bağladı; teslim videosunda müzik baştan çalar (`src/sounds/takim/ana-menu.ogg`).

## Yapay zekâ beyanı

<!-- AI-BEYAN:BASLA -->
| Kategori | Durum | Araç | Amaç | Kullanıldığı yer |
|---|---|---|---|---|
| Görsel | Kullanıldı | Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5, Claude Sonnet 5.5) | Oyundaki görselleri kodla, piksel piksel çizen kodu yazdı: arayüz ve menü, masa ve belgeler, gişedeki kişilerin portreleri, kaşeler, bina cephesi ayrıntıları, sokak, deprem hasarı ve efektler. Bina ve sokak karoları hazır paketten gelir (Hazır kaynaklar bölümü). | Menü sokağı ve bütün arayüz: düğmeler, kâğıt paneller, arka plan, parçacık ve ekran efektleri; Masa: belgeler (yazılar, ada/parsel satırları, imzalar, elle düzeltme izleri), kaşeler ve kaşelik, yönetmelik klasörü, kural notları, inceleme modu, masa eşyaları; Gişe: gişe portreleri (yüz ayrıntıları ve mizaç ifadeleri), konuşma balonu, zarf ve çekmece, SOR/İSTE düğmeleri, getirilen raporlar; Sokak: bina cephesi ayrıntıları (kat bandı, vitrin), bina etiketleri, deprem çatlakları ve sıva dökülmesi; Saha testi (kolon yakın planı), deprem, gün sonu, gazete ve sonuç ekranları |
| Ses | Kullanıldı | Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5) | Ses efektlerini kodla üreten sentezleyiciyi (jam öncesi şablondaki müzik altyapısı dahil; oyunda kodla üretilmiş müzik çalmaz), deprem gürlemesini kodla üreten sesi ve ses ayarlarını yazdı. Hazır paketteki Kenney seslerinin hız, perde ve katman ayarlarını yaptı. | Arayüz ve oyun ses efektleri (yedek sentez sesleri), jam öncesi şablondaki müzik altyapısı (oyunda çalmaz); Deprem gürlemesi; Kenney seslerinin çalınışı (hız, perde, katman); Ses düzeyi ayarları; Ana menü müziğinin (takımın bestesi) ilk 15 saniyesi ve sondaki sessizlik kırpılıp başa kısa yumuşak giriş eklenerek OGG'ye dönüştürülmesi ve menüde döngüyle çalınması |
| Kod | Kullanıldı | Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5, Claude Sonnet 5.5) | Oyunun bütün kodunu yazdı (jam öncesi hazırlanan şablon dahil): oynanış ve kurallar, belgeler ve gişe diyaloğu, deprem, gün sonu, kendi evin hazırlığı (deprem çantası, eşya sabitleme, güçlendirme payı), gazete ve sonuç ekranları, menüler, ses bağlantıları. Ayrıca oyunun dengesini ve kararların adil sonuçlanmasını denetleyen bir araç ile otomatik ekran testi aracını yazdı. | Oyunun tamamı: menü, masa, gişe, sokak, saha testi, deprem, gün sonu ve kendi evin hazırlığı, gazete, sonuç, ayarlar, duraklatma; Geliştirme araçları: denge denetimi ve otomatik test (oyunda görünmez) |
| Metin | Kullanıldı | Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5, Claude Sonnet 5.5) | Oyundaki metinlerin taslaklarını yazdı: arayüz, kurallar, gişe diyalogları (beş mizaçta: kibar, sinirli, telaşlı, kurnaz, çekingen), gazete ve deprem anlatımı, kendi evin hazırlığı, hikâye binaları, Emeği Geçenler'deki "Takımın kararları" maddeleri (GDD'deki takım kararlarından), README ve BENIOKU. Takım konsepti, tonu ve deprem dilini (kehanet yok, kurban ve sayı yok) belirledi; metinlerin son seçimini ve onayını Claude'un lider oturumuna bıraktı. Ayrıca ses listesini ve beyan açıklamalarını yazdı. | Menü, ayarlar, oyun içi ipuçları ve göstergeler; Masa: kural notu ve yönetmelik kuralları, belge etiketleri, saha notu, fiş ve kusur etiketleri; Gişe diyalogları: selam, bekleme, sabırsızlık, SOR ve İSTE cevapları, zarf ve damga tepkileri; hikâye binalarının sahipleri ve sözleri; Gün sonu raporu, küçük deprem şeridi, kısa yol sorusu, deprem, gazete (manşetler, haber satırları) ve sonuç ekranı; Kendi evin hazırlığı: kalem ve kademe adları, açıklamalar, "Senin evin" cümleleri; Emeği Geçenler ("Takımın kararları" taslağı dahil), README, BENIOKU |
| Diğer | Kullanıldı | Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5, Claude Sonnet 5.5, Claude Fable 5.1) | Tema yorumu için konsept seçenekleri önerdi; oyun adı (Kâğıt Üstünde), kurgusal şehir (Dereboyu) ve gazete adı (Dereboyu Postası) için öneriler sundu, takım bu seçimi Claude'un lider oturumuna bıraktı. Oynanış için seçenekler önerdi (ör. kendi evin hazırlığı, müfettiş); seçimi takım yaptı. Kenney seslerinden ölçüme dayalı adaylar seçti, hazır kaynak beyanını ve ses listesini yazdı; konsept seçimi ve ses ortamı kararı takımın; tek tek seslerin seçimini takım Claude'a bıraktı. Geliştirme sürecini görevlere bölüp yönetti, oyunu otomatik oynayarak test etti ve jam ölçütlerine göre değerlendirip öneriler sundu. Teslim videosunu (tanıtım filmi) oyunun otomatik oynanışından kaydedip kurgulayan betiği yazdı ve videoyu üretti: oyunun kendi yazılarıyla ara kartlar, geçişler ve yakınlaştırmalar ekledi; oynanış görüntülerinin hepsi oyunun kendisi, müzik takımın bestesi. | Oyun fikri aşaması; oyun, şehir ve gazete adı; Oynanış önerileri: kendi evin hazırlığı, müfettiş; Ses seçimi ve hazır kaynak beyanı (Emeği Geçenler, README); Geliştirme, test ve değerlendirme süreci (oyunda doğrudan yer almaz); Teslim videosu (otomatik oynanış kaydı, kurgu, ara kartlar) |
<!-- AI-BEYAN:BITIR -->

Bu tablo `npm run beyan` ile otomatik üretilir: Claude Code'un yazdığı her dosya bir kancayla kategorisine göre `docs/ai-kayit.jsonl`'a kaydedilir, elle eklenenler `docs/ai-elle.json`'da durur. Teslim formu için hazır metin: `docs/AI_BEYAN.md`. Commit'lerdeki `Co-Authored-By: Claude` satırları da bu kullanımı gösterir.
