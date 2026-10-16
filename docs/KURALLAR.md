# CIVIL GAME JAM 2026: Kuralların özeti (kitapçık v09)

Kaynak: https://game.ktimo.com.tr/kurallar (16 Ekim 2026, 11.00 civarı okundu). Bu bir özettir; bağlayıcı olan resmî metindir. İlk okuduğumuz sürüm v05'ti; v09'da teslim biçimi, sunum, AI beyanı ve alan kuralları değişti.

## Takvim (hepsi UTC+3)

| Ne zaman | Ne var |
|---|---|
| 16 Ekim Cuma 14.00 | Alana giriş ve kayıt: kart alma, masa kurası, elektrik kontrolü |
| 15.00 | Jüri oturumları ve söyleşiler |
| **En geç 16.00** | Kayıt tamamlanmış olmalı. Geç gelişe ek süre verilmez. |
| 17.00 | Açılış konuşmaları |
| **18.00** | Tema açıklanır, 48 saat başlar |
| 18 Ekim Pazar 12.00 | Git desteği için son başvuru (teknik ekipten) |
| **18.00** | Yeni teslim ya da yeni sürüm başlatmak için son an |
| Ardından | 3'er dakikalık sunumlar |
| Yarışma bitiminden 3 gün sonra | İtiraz süresinin sonu |

## Diskalifiye ve elenme nedenleri

- Geç teslim: 18.00'de ve sonrasında yeni teslim başlatılamaz.
- Repo private ya da repo bağlantısı yok. Oyunun puanı ne olursa olsun diskalifiye.
- AI ya da hazır kaynak kullanımının yanlış veya eksik beyanı. Kullanım ne kadar küçük olursa olsun beyan edilmeli.
- Çalıntı, kopya, lisanssız ya da beyan edilmemiş hazır kaynak. Kaynağı belirtmek tek başına kullanım izni sayılmaz.
- Takım ya da katılım koşullarına aykırılık. Takımın iki kişinin altına düşmesi de buna dahil.
- Bina içinde her türlü tütün ürünü (elektronik ve bitkisel dahil): o kişi ve **bütün takım** elenir.
- Çalışmayan oyun değerlendirmeye alınmaz; teslimden sonra düzeltme ya da ek süre verilmez.

## Takım

- 2–4 kişi. Tek başvuranlar eşleştirilir. Bir kişi yalnızca bir takımda olabilir.
- Çalışmayı yalnızca kayıtlı üyeler yürütür. AI araçları serbest, ama takım dışından bir insan katkı veremez. Teknik ekibin Git ya da araç yardımı üyelik sayılmaz.
- Takım bir temsilci seçer. Temsilci organizasyonla iletişimi ve web teslimini yürütür, takımın erişim kodunu korur.
- Yarışma başladıktan sonra çekilen üye geri dönemez, yerine kimse alınamaz. En az iki kayıtlı üye kalan takım devam edebilir.
- Kadro değişikliği başlangıçtan önce contact@lootbagstudios.net ya da yarışmacı WhatsApp grubu üzerinden bildirilir.
- **Prompt Engineers teslim ekranındaki takım listesinde var.** Listede yaklaşık 65–70 takım bulunuyor.

## Geliştirme

- Oyuna özgü her şey 48 saat içinde yapılır. Önceden hazırlanmış bir oyun ya da başka bir ekibin projesi sunulamaz.
- Önceden yapılabilecekler: motor kurulumu, genel araçların hazırlanması, kullanım hakkı olan kaynakların edinilmesi.
- Motor serbest. Oyun Windows bilgisayarda ya da masaüstü tarayıcıda çalışmalı. Gereken sürüm, donanım, kontroller ve kurulum talimatlarda yazılır.
- Build'i teslimden önce test etmek takımın sorumluluğu.
- Public repo takımın kodunu içerir. Yeniden dağıtımı yasak hazır dosyalar repoya konmaz; kaynağı, lisansı ve projeye nasıl ekleneceği yazılır. Takım kendi kodunu gizleyemez.
- Teslim edilen build ile repodaki kod uyumlu olmalı.
- Repoda kimseye ait kimlik bilgisi, parola ya da erişim anahtarı bulunmaz.
- Yarışma boyunca **bilgisayarlar alandan çıkarılamaz**; arıza ya da çekilmede organizasyonun onayıyla çıkarılabilir. Kişisel giriş çıkış serbest.

## AI ve hazır kaynaklar

- AI kullanımı serbest. Oran sınırı ya da zorunlu araç listesi yok; kod, görsel, ses ve diğer alanlarda kullanılabilir.
- **Madde 4.3:** AI kullanımının yoğunluğu, jürinin yaratıcılık ve görsel/sanatsal nitelik değerlendirmesini etkileyebilir; ölçülü kullanım tavsiye ediliyor. Ayrı bir AI puanı, yüzde eşiği ya da sabit ceza yok.
- Teslim formunda iki ayrı beyan bölümü var: **hazır kaynaklar** ve **AI**. Her bölümde beş kategori bulunuyor: **görsel, ses, kod, metin, diğer.** Her kategori için "Kullanıldı" ya da "Kullanılmadı" seçilir.
  - Hazır kaynakta kullanılan her kategori için: adı, üreticisi ya da sağlayıcısı, kaynak bağlantısı, lisansı, oyunda nerede kullanıldığı, varsa yapılan değişiklik ve repoda bulunmayan dosyalar.
  - AI'da kullanılan her kategori için: araç, amaç ve oyunda kullanıldığı yer.
- Lisans adı yalnızca kaynağın gerçek koşullarıyla eşleşiyorsa yazılır.

## Teslim

Adres: https://game.ktimo.com.tr/jam/teslim. Temsilci takım adını seçer ve organizasyonun verdiği 6 karakterli kodla girer (en az bir harf ve bir rakam içerir, büyük/küçük harf fark etmez). Ekran, organizasyon teslimi açınca kullanılabilir.

Formda istenenler:

1. Oyun adı ve kısa açıklama
2. Platform: Windows ya da web
3. Test edilmiş build'in **ZIP dosyası** (en fazla 10 GB). Web oyununda ayrıca tarayıcıda oynama bağlantısı.
4. **Video dosyası.** Bağlantı değil, dosyanın kendisi yüklenir: oyun içi görüntü ya da trailer, **en fazla 1 dakika**, MP4 ya da AVI, en fazla 5 GB. Zorunlu.
5. Public Git repo bağlantısı
6. Kurulum, çalıştırma ve kontrol talimatları
7. Hazır kaynak beyanı (beş kategori)
8. AI beyanı (beş kategori)
9. Teslim koşullarının ve güncel kural sürümünün kabulü

Teslimle ilgili diğer kurallar:

- Web oyunu ve repo bağlantıları HTTPS olmalı, hesapla giriş ya da özel izin istememeli. Organizasyon her şeyi giriş yapmadan kontrol eder.
- Yalnızca video, ekran görüntüsü ya da kaynak kod göndermek oyun teslimi sayılmaz.
- Son saate kadar yeni sürüm gönderilebilir; son başarılı sürüm değerlendirilir. Başarısız bir güncelleme önceki başarılı teslimi bozmaz.
- Makbuz, ZIP ve videonun ikisi de yüklenip doğrulanınca oluşur. Makbuz numarası, sürüm, kayıt zamanı ve dosya adları kontrol edilmeli. Yüklemeyi başlatmak, teslim tamamlandı demek değildir.
- 18.00'den önce başlatılan aktarım uzun sürerse 18.00'den sonra bitebilir (aynı dosyalar). Bu ek geliştirme süresi değildir.
- Son saatten sonra değerlendirilen sürüm değiştirilemez. Repo ve web oyunu değerlendirme bitene kadar erişilebilir kalmalı.
- Organizasyonun e-postasına yazmak, teslim ekranındaki kaydın ya da makbuzun yerine geçmez.

## Puanlama

| Ölçüt | Puan | Neye bakılıyor |
|---|---|---|
| Oynanabilirlik | 25 | Kontroller, anlaşılabilirlik, oyun deneyimi |
| Temayla ilişki | 25 | Temanın oynanış ve tasarımla ilişkisi |
| Yaratıcılık | 20 | Fikirde ve uygulamada özgünlük |
| Görsel/işitsel bütünlük | 15 | Görsel ve ses öğelerinin oyunla uyumu |
| Teknik bütünlük | 15 | Çalışırlık, kararlılık, bütünleşme |

- Puan, jürilerin verdiği toplam puanların ortalamasıdır. Eşitlikte sırayla tema, oynanabilirlik ve yaratıcılık ortalamalarına bakılır.
- Jüride 14 kişi var. Çoğu oyun sektöründen; ikisi inşaat mühendisi (biri İMO'dan, biri akademisyen).

## Sunum

- **Video dahil toplam 3 dakika.** En fazla 1 dakikalık video, takım anlatırken arkada oynar; ek video süresi yok.
- **Jüri sunum sırasında oyunu oynayıp puanlar.**
- **Soru-cevap yok.**
- Sunum sırası ve sonuç ilanı ayrıca duyurulacak.

## Ödüller

70.000 / 50.000 / 30.000 TL, kişi başına değil takım başına. Ödeme, sonuçlardan sonra en geç üç ay içinde temsilciye yapılır. Yan ödüller sonra duyurulacak.

## Haklar

- Oyunun hakları takımda kalır; takım oyunu geliştirmeye ve satmaya devam edebilir.
- Organizasyona (İMO, LootBAG Studios, ODTÜ KALTEV, CIVIL GAME JAM) bedelsiz, süresiz, dünya çapında, münhasır olmayan ve **ticari olmayan** bir kullanım izni verilir: tanıtım, sergileme, ücretsiz yayın ve eğitim amaçlı uyarlama. Bu izni aynı şartlarla üçüncü kişilere de verebilirler.
- Temsilci, teslimde ekibin onayını aldığını beyan eder.

## Alan kuralları

- 9 öğün ücretsiz, kahve ve soft içecek sınırsız. Uyku tesisi yok; küçük yastık ve battaniye dağıtılıyor. Ulaşım katılımcının sorumluluğunda.
- Binada 7/24 güvenlik kamerası var. Masaya ve ortak alanlara verilen zarardan yarışmacı sorumlu.
- Bina içinde tütün yasak (cezası takımın elenmesi). Kampüste alkol yasak.
- Alanda sağlık personeli yok. Acil durumda 112, kampüs içi telefondan güvenlik 1958; Mediko açık olduğu saatlerde hizmet veriyor.
- İletişim: contact@lootbagstudios.net ya da yarışmacı WhatsApp grubu.

## Bizim için anlamı (Prompt Engineers)

1. **AI yoğunluğu (4.3):** Takım görsel ya da ses üretemiyor. Görseller ve sesler lisanslı hazır paketlerden (tercihen CC0, tek tutarlı tarz) gelirse "hazır kaynak" olarak beyan edilir ve AI yoğunluğunu artırmaz. Yapay zekâyla üretilen görsel ve sesler AI beyanına girer ve jürinin görsel ve yaratıcılık değerlendirmesini (toplam 35 puan) etkileyebilir. Takımın yaratıcı katkısı: fikir, tema yorumu, seçimler, bölüm tasarımı, oyun metinleri. Claude kodu ve teknik işleri yapar.
2. **ZIP şart:** Web oyunu da olsa build ZIP olarak yüklenir. ZIP'teki oyun internetsiz ve sunucusuz, çift tıklayınca açılmalı. `npm run zip` bunu yapıyor (tek dosyalık `OYNA.html`). Görseller ve sesler `src/assets.ts`'de import edilmeli; `public/` klasöründen dosya yükleme `file://` ile çalışmaz.
3. **Video:** En fazla 1 dakika, MP4. Aynı video sunumda arkada oynayacağı için trailer gibi kurgulanmalı.
4. **Sunum 3 dakika ve jüri o sırada oynuyor:** Oyun ilk 30 saniyede anlaşılmalı. Açılış ekranları kısa olmalı, oyun içi ipuçları net olmalı.
5. **Tema 25 puan ve ilk eşitlik bozucu:** Tema oynanışın kendisinde olmalı, sadece görünümde değil.
6. **Beyanlar beş kategori × iki bölüm:** README ve oyun içi Emeği Geçenler ekranı bu yapıya göre tutulmalı; küçük kullanımlar da yazılmalı.
7. **Build ve repo uyumu:** Teslim edilen ZIP, repodaki bir commit'ten derlenmiş olmalı. Son teslimden sonra `main`'e push yapılmamalı.
8. **Erişim kodu:** Teslim ekranına kodu temsilci kendisi girer. Kod hiçbir dosyaya, repoya ya da sohbete yazılmamalı.
9. **Bilgisayar alandan çıkmaz, internet şart:** Claude'un çalışması için salonda internet gerekiyor; telefon hotspot'u yedek.
10. **Takım en az iki kişi kalmalı:** Biri çekilir ve iki kişinin altına düşülürse takım yarışamaz.
