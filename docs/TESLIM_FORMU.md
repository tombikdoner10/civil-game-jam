# Teslim formu metinleri (Prompt Engineers · Kâğıt Üstünde)

/teslim-kontrol ile hazırlandı (18 Ekim 2026). Teslimi temsilci yapar.

Kaynaklar: README.md, docs/BENIOKU.txt, docs/AI_BEYAN.md (özet bölümü), src/data/credits.ts.
Erişim kodu yalnızca formun kendisine yazılır; hiçbir dosyaya ya da sohbete konmaz.

## Dikkat (göndermeden önce)

1. **AI kullanımı › Görsel = "Kullanıldı"** olmalı: oyundaki görselleri çizen kodu yapay zekâ yazdı. Yanlış ya da eksik beyan diskalifiye nedeni.
2. AI kullanımında beş kategorinin **hepsi** "Kullanıldı". Hazır kaynakta **Metin** dışındaki dördü "Kullanıldı", Metin "Kullanılmadı".
3. Formda "Son teslim 18:15" yazıyor, kitapçık 18.00 diyor. **18.00'i esas al**, ilk teslimi erken yap (18.00'e kadar yeni sürüm gönderilebilir).
4. **ZIP:** `teslim/prompt-engineers-kagit-ustunde-<commit>.zip`; `<commit>` bu belgeyi içeren teslim commit'i, canlı sitenin ve ZIP'teki oyunun menüsündeki "sürüm" yazısıyla aynı. Dosya adında `-degisiklikli` olmamalı. Eski ZIP'ler `teslim/eski-zipler/` altında; onları yükleme.
5. **Video:** `teslim/video/kagit-ustunde-trailer-v3.mp4` (59,10 sn, 1920×1080, MP4, 50 MB; oynanış gün 1 → gün 5, takımın müziği baştan). Eski sürümler (kagit-ustunde-trailer.mp4, -v2) yükleme. `onizleme/` klasöründeki 720p kopya yalnız izlemek içindir.
6. Yükleme bitince makbuz numarası, sürüm, kayıt zamanı ve iki dosya adını kontrol et; ekran görüntüsünü sakla.

---

## Oyun adı

Kâğıt Üstünde

## Kısa açıklama

Belediyenin yapı denetçisisin. Binaların belgelerini inceleyip kurala göre damgala; büyük deprem gelince kararlarının sonucunu gör.

## Oynanabilir oyun bağlantısı

https://tombikdoner10.github.io/civil-game-jam/

## Public Git repo bağlantısı

https://github.com/tombikdoner10/civil-game-jam

## Çalıştırma talimatları

Platform: Windows bilgisayarda Chrome, Edge ya da Firefox'un güncel sürümü; klavye ve fare. Kurulum ya da hesap gerekmez.

Başlatma: Web bağlantısını aç ya da ZIP'i bir klasöre çıkarıp OYNA.html dosyasına çift tıkla (internet gerekmez). Ardından ekrana bir kez tıkla; tarayıcılar ilk tıklamaya kadar sesi açmaz.

Oynanış: Her dosyada belgeleri karşılaştır, tutarsızlığı inceleme modunda bul ve kaşeyle karar ver (GÜVENLİ / GÜÇLENDİR / BOŞALT / İADE). Hızlı deneme (yaklaşık 3 dakika): 1. günü bitir, gün sonu raporunda "Büyük deprem bu gece olsaydı?" düğmesi (Enter ya da D) büyük depremi, gazeteyi ve sonucu gösterir; sonuç ekranından 2. günden devam edilebilir.

Kontroller:
- Fare: belgeyi sürükle; kaşeye tıkla (ya da kaşeyi ruhsata sürükle) = karar
- 1 / 2 / 3 / 4: GÜVENLİ / GÜÇLENDİR / BOŞALT / İADE kaşesi
- Space ya da İNCELE: inceleme modu; iki alana tıkla = tutarsızlığı işaretle; SOR ve İSTE gişedeki kişiye sorar
- Yönetmelik klasörüne tıkla: kuralları aç (sekmeler, X kapatır)
- Zarf: AL / GERİ VER (karar verilene kadar kaşeler kilitli)
- SAHA (rapor yok kartında): Schmidt çekiciyle saha testi; Space/Enter notu alır, Esc vazgeçer
- Esc / P: duraklat; Enter / Space: gün sonu ve gazetede devam
- Menülerde ↑ ↓ ve Enter

Ayrıntı: README.md ("Çalıştırma talimatları") ve ZIP içindeki BENIOKU.txt.

## Platform

Web · oynanabilir bağlantı + ZIP arşivi

---

## Hazır kaynak kullanımı

### Görsel: Kullanıldı
- Adı: Tiny Town
- Üretici: Kenney (www.kenney.nl)
- Bağlantı: https://kenney.nl/assets/tiny-town
- Lisans: Creative Commons CC0 1.0
- Nerede: Bina cepheleri ve sokak
- Değişiklik: Renk paleti değiştirildi, karolardan cephe kuruldu (src/art/tiny-town/)
- Repoda olmayan dosya: Yok (dosyalar repoda)

### Ses: Kullanıldı
Hepsi Kenney (www.kenney.nl), lisans Creative Commons CC0 1.0, dosyalar repoda (src/sounds/kenney/):
- Impact Sounds (https://kenney.nl/assets/impact-sounds): kaşenin belgeye vurması, kaşeyi alma ve yerine koyma, kilitli kaşeye dokunuş, çekmece, kusur bulundu sesi, saha testinde çekiç vuruşu ve geçersiz okuma, gün sonunda alınamayan ev kalemi ve depremin vuruş, moloz, çatırtı, cam titremesi ve bina hasarı sesleri. Değişiklik: çoğu yavaşlatıldı (hız ve perde değiştirildi), bazıları katmanlandı.
- RPG Audio (https://kenney.nl/assets/rpg-audio): kâğıt ve belge sesleri (kayma, alma, bırakma, toplama, fiş, İADE'de dosya kapanması), zarfın masaya kayması, çekmeceye girmesi ve geri verilmesi, yönetmelik klasörü aç/kapa, sekme ve sayfa çevirme, ıstampa, inceleme modu aç/kapa, saha testinde ibre tıkırtısı, gişede ayak sesleri, sarsıntıda gıcırtı. Değişiklik: hız ve perde değiştirildi, baştaki sessizlik atlandı.
- Interface Sounds (https://kenney.nl/assets/interface-sounds): menüde geri sesi, inceleme modunda seçim bırakma, kusur bulundu, "tutarsızlık yok", doğru ve yanlış karar uyarısı, saha testinde sonuç, geçersiz okuma ve vazgeçme. Değişiklik: hız ve perde hafifçe değiştirildi.
- UI Audio (https://kenney.nl/assets/ui-audio): menü ve ekran düğmeleri (tık, üzerine gelme), duraklatma ve ayarlar, inceleme modunda alan seçimi, gişede konuşma balonunun harf sesi. Değişiklik: hız ve perde değiştirildi.
- Music Jingles (https://kenney.nl/assets/music-jingles): pizzicato jingle'ları: gün sonu raporu (iyi gün PIZZI10, kötü gün PIZZI07), gazete açılışı (PIZZI03), sonuç ekranı (iyi PIZZI02, kötü PIZZI01). Değişiklik yok.
- Not: Ana menü müziği takımın kendi bestesidir (FL Studio, yalnızca programın kendi enstrüman ve sesleri; hazır döngü, örnek paketi ve yapay zekâ yok). Hazır kaynak değildir.

### Kod: Kullanıldı
- Adı: Phaser 3.90
- Üretici: Richard Davey, Phaser Studio Inc.
- Bağlantı: https://phaser.io
- Lisans: MIT
- Nerede: Oyun motoru (kod kütüphanesi)
- Değişiklik: Değiştirilmedi
- Repoda olmayan dosya: Phaser `npm install` ile kurulur; ZIP sürümüne gömülüdür. Yalnızca derlemede kullanılan araçlar (oyuna dahil değil): Vite (MIT), TypeScript (Apache-2.0), fflate (MIT).

### Metin: Kullanılmadı

### Diğer: Kullanıldı
- Pixelify Sans (yazı tipi) · The Pixelify Sans Project Authors (Fontsource paketi) · https://fonts.google.com/specimen/Pixelify+Sans · SIL Open Font License 1.1 · Arayüz ve belge başlıkları yazı tipi, değiştirilmedi; tanıtım videosundaki ara kartlarda da kullanıldı
- VT323 (yazı tipi) · The VT323 Project Authors (Fontsource paketi) · https://fonts.google.com/specimen/VT323 · SIL Open Font License 1.1 · Belge değerleri, saat ve paneller yazı tipi, değiştirilmedi; tanıtım videosundaki ara kartlarda da kullanıldı
- Repoda olmayan dosya: Yazı tipleri `npm install` ile kurulur; ZIP sürümüne gömülüdür.

---

## AI kullanımı

Araç (beşinde de): Claude (Anthropic), Claude Code üzerinden. Modeller kategoriye göre aşağıda.

### Görsel: Kullanıldı
- Araç: Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5, Claude Sonnet 5.5)
- Amaç: Oyundaki görselleri kodla, piksel piksel çizen kodu yazdı: arayüz ve menü, masa ve belgeler, gişedeki kişilerin portreleri, kaşeler, bina cephesi ayrıntıları, sokak, deprem hasarı ve efektler. Bina ve sokak karoları hazır paketten gelir (Hazır kaynaklar bölümü).
- Kullanıldığı yer: Menü sokağı ve bütün arayüz: düğmeler, kâğıt paneller, arka plan, parçacık ve ekran efektleri; Masa: belgeler (yazılar, ada/parsel satırları, imzalar, elle düzeltme izleri), kaşeler ve kaşelik, yönetmelik klasörü, kural notları, inceleme modu, masa eşyaları; Gişe: gişe portreleri (yüz ayrıntıları ve mizaç ifadeleri), konuşma balonu, zarf ve çekmece, SOR/İSTE düğmeleri, getirilen raporlar; Sokak: bina cephesi ayrıntıları (kat bandı, vitrin), bina etiketleri, deprem çatlakları ve sıva dökülmesi; Saha testi (kolon yakın planı), deprem, gün sonu, gazete ve sonuç ekranları

### Ses: Kullanıldı
- Araç: Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5)
- Amaç: Ses efektlerini kodla üreten sentezleyiciyi (jam öncesi şablondaki müzik altyapısı dahil; oyunda kodla üretilmiş müzik çalmaz), deprem gürlemesini kodla üreten sesi ve ses ayarlarını yazdı. Hazır paketteki Kenney seslerinin hız, perde ve katman ayarlarını yaptı.
- Kullanıldığı yer: Arayüz ve oyun ses efektleri (yedek sentez sesleri), jam öncesi şablondaki müzik altyapısı (oyunda çalmaz); Deprem gürlemesi; Kenney seslerinin çalınışı (hız, perde, katman); Ses düzeyi ayarları; Ana menü müziğinin (takımın bestesi) OGG'ye dönüştürülmesi ve menüde döngüyle çalınması

### Kod: Kullanıldı
- Araç: Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5, Claude Sonnet 5.5)
- Amaç: Oyunun bütün kodunu yazdı (jam öncesi hazırlanan şablon dahil): oynanış ve kurallar, belgeler ve gişe diyaloğu, deprem, gün sonu, kendi evin hazırlığı (deprem çantası, eşya sabitleme, güçlendirme payı), gazete ve sonuç ekranları, menüler, ses bağlantıları. Ayrıca oyunun dengesini ve kararların adil sonuçlanmasını denetleyen bir araç ile otomatik ekran testi aracını yazdı.
- Kullanıldığı yer: Oyunun tamamı: menü, masa, gişe, sokak, saha testi, deprem, gün sonu ve kendi evin hazırlığı, gazete, sonuç, ayarlar, duraklatma; Geliştirme araçları: denge denetimi ve otomatik test (oyunda görünmez)

### Metin: Kullanıldı
- Araç: Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5, Claude Sonnet 5.5)
- Amaç: Oyundaki metinlerin taslaklarını yazdı: arayüz, kurallar, gişe diyalogları (beş mizaçta: kibar, sinirli, telaşlı, kurnaz, çekingen), gazete ve deprem anlatımı, kendi evin hazırlığı, hikâye binaları, Emeği Geçenler'deki "Takımın kararları" maddeleri (GDD'deki takım kararlarından), README ve BENIOKU. Takım konsepti, tonu ve deprem dilini (kehanet yok, kurban ve sayı yok) belirledi; metinlerin son seçimini ve onayını Claude'un lider oturumuna bıraktı. Ayrıca ses listesini ve beyan açıklamalarını yazdı.
- Kullanıldığı yer: Menü, ayarlar, oyun içi ipuçları ve göstergeler; Masa: kural notu ve yönetmelik kuralları, belge etiketleri, saha notu, fiş ve kusur etiketleri; Gişe diyalogları: selam, bekleme, sabırsızlık, SOR ve İSTE cevapları, zarf ve damga tepkileri; hikâye binalarının sahipleri ve sözleri; Gün sonu raporu, küçük deprem şeridi, kısa yol sorusu, deprem, gazete (manşetler, haber satırları) ve sonuç ekranı; Kendi evin hazırlığı: kalem ve kademe adları, açıklamalar, "Senin evin" cümleleri; Emeği Geçenler ("Takımın kararları" taslağı dahil), README, BENIOKU

### Diğer: Kullanıldı
- Araç: Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5, Claude Sonnet 5.5, Claude Fable 5.1)
- Amaç: Tema yorumu için konsept seçenekleri önerdi; oyun adı (Kâğıt Üstünde), kurgusal şehir (Dereboyu) ve gazete adı (Dereboyu Postası) için öneriler sundu, takım bu seçimi Claude'un lider oturumuna bıraktı. Oynanış için seçenekler önerdi (ör. kendi evin hazırlığı, müfettiş); seçimi takım yaptı. Kenney seslerinden ölçüme dayalı adaylar seçti, hazır kaynak beyanını ve ses listesini yazdı; konsept seçimi ve ses ortamı kararı takımın; tek tek seslerin seçimini takım Claude'a bıraktı. Geliştirme sürecini görevlere bölüp yönetti, oyunu otomatik oynayarak test etti ve jam ölçütlerine göre değerlendirip öneriler sundu. Teslim videosunu (tanıtım filmi) oyunun otomatik oynanışından kaydedip kurgulayan betiği yazdı ve videoyu üretti: oyunun kendi yazılarıyla ara kartlar, geçişler, yakınlaştırmalar ve kısa efektler (sarsıntı, flaş) ekledi, kurguyu müziğin vuruşlarına oturttu; oynanış görüntülerinin hepsi oyunun kendisi, müzik takımın bestesi.
- Kullanıldığı yer: Oyun fikri aşaması; oyun, şehir ve gazete adı; Oynanış önerileri: kendi evin hazırlığı, müfettiş; Ses seçimi ve hazır kaynak beyanı (Emeği Geçenler, README); Geliştirme, test ve değerlendirme süreci (oyunda doğrudan yer almaz); Teslim videosu (otomatik oynanış kaydı, kurgu, ara kartlar)

---

## Onay kutusu

"Yarışma kurallarını okuduk…" kutusu: temsilci olarak ekibin onayını aldığını beyan ediyorsun. Kuralların güncel sürümünü (https://game.ktimo.com.tr/kurallar) son bir kez kontrol et.
