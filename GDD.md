# Oyun tasarım belgesi (GDD)

Proje hafızası: lider bu dosyayı günceller, ajanlar okur. Tema açıklanmadan (16 Ekim 18.00) doldurulmaz.

Konsept durumu: SEÇİLDİ (16 Ekim 19.26)

## Tema

_Açıklanan tema, aynen:_ Afete hazırlık ve farkındalık

_Bizim yorumumuz (takımın kararı):_ Afete hazırlığın en kritik ama görünmeyen katmanı binaların kendisi. Farkındalık, kâğıt üstündeki yasallık ile gerçek güvenlik arasındaki farkı görmek; hazırlık, deprem gelmeden doğru damgayı vurmak. ("Deprem değil, bina öldürür.")

## Konsept

Çalışma adı: **Yapı Denetçisi** (son adı takım verecek)

- **Tek cümle:** Kurgusal bir deprem kentinde belediyenin yapı denetçisisin; her gün masana gelen bina dosyalarındaki tutarsızlıkları yakalayıp GÜVENLİ / GÜÇLENDİR / BOŞALT damgası vuruyorsun, bir gün deprem gelip damgalarını sınıyor.
- **Çekirdek döngü (bir dosya, 30–60 sn):** Dosya gelir → belgeleri masaya sürükle → inceleme modunda (Space) iki belgedeki çelişen alanlara tıkla ("Kaçak kat") → kural kitabına bak → damga vur → sıradaki dosya. Gün sonunda maaş, ceza ve aile; yeni gün yeni kurallar.
- **Tema oynanışın neresinde:** Her kural gerçek bir yapı güvenliği ilkesi (kaçak kat, kesik kolon, düşük beton dayanımı, dere yatağı ve fay mesafesi, zemin etüdü). Oyuncunun bütün işi risk işaretini fark etmek (farkındalık) ve depremden önce karar vermek (hazırlık). Deprem günü, kararların sonucunu gösterir.
- **Kazanma / kaybetme:** Gün içinde: yanlış damga ceza, yavaşlık maaş kaybı. Oyun sonu: deprem sabahı gazetesi ve şehir haritası damgalarının sonucunu gösterir; aile bütçesi ve baskı kararlarıyla birlikte birden fazla son (iyi olur kapsamı).
- **Ton:** Ciddi ve gergin; saygılı. Kurban gösterilmez, sayı verilmez; odak önlemede. Örnek manşet: "Boşaltılmış binada kimse yoktu."

### Belgeler

| Belge | Ne gösteriyor | Yakalanacak şey |
|---|---|---|
| Ruhsat / iskân | Kat sayısı, yapım yılı, kullanım | Fotoğrafla uyuşmayan kat, eski yönetmelik |
| Fotoğraf (büyüteçle) | Cephe, zemin kat, kolonlar | Kesik kolon (dükkân vitrini), çapraz çatlak, pas, betonda deniz kabuğu |
| Vaziyet planı (üstten) | Binanın arazideki yeri | Cetvelle ölçünce dere yatağına / fay hattına fazla yakın |
| Karot sonucu | Beton dayanımı | Eşiğin altında beton |
| Zemin etüdü | Zemin türü | Eksik rapor, sıvılaşma riski |
| Proje özeti | Kolon yerleri, kat planı | Fotoğrafta kolonun olması gereken yerde vitrin |

### Gün planı (5 gün; eşikleri takım resmî kaynakla doğrular)

| Gün | Yeni kural | Yeni araç |
|---|---|---|
| 1 | Ruhsattaki kat sayısı gerçekle aynı olmalı | İnceleme modu |
| 2 | Zemin katta kolon kesilmemiş olmalı; çapraz (kesme) çatlak yok | Fotoğraf büyüteci |
| 3 | Beton dayanımı eşiğin üstünde olmalı | Karot sonucu |
| 4 | Dere yatağı ve fay hattına en az X metre; zemin etüdü var ve sıvılaşma riski yok | Vaziyet planı + cetvel |
| 5 | Hepsi + sahte belge | Tarih / mühür kontrolü |

### Gerilim ve duygu

- Mesai saati akar; her dosya maaş; yavaş kalırsan kira ödenmez.
- Baskı: müteahhidin masaya bıraktığı zarf, "bu ay 20 onay" kotası, yalvaran mal sahibi.
- Gün sonu: kira, ısınma, çocuğun okul masrafı.
- Kırılma: son gün masana kendi apartmanının dosyası gelir.
- Deprem günü: üstten şehir haritası, damgalanan binalar, sarsıntı, ertesi sabah gazete manşetleri.

### Papers, Please'ten ayrışma

Cetvelle ölçme (vaziyet planı), büyüteç (kılcal sıva çatlağı ile çapraz kesme çatlağı farkı), karot numunesini prese sürükleme, deprem günü sonucu, kendi binan kırılması. Sunumda ilham kaynağı açıkça söylenir.

## İlk 30 saniye

Jüri oyunu 3 dakikalık sunum sırasında oynuyor. Hiçbir şey okumadan:

1. Gün 1, tek kural, iki dosya. İlk dosya temiz: GÜVENLİ damgası, tok bir "küt" sesi.
2. İkinci dosyada fotoğraftaki fazladan kat göze batar; ruhsattaki kat sayısına ve fotoğrafa tıklanır, "Kaçak kat" etiketi çıkar.
3. BOŞALT damgası; kural okunmadan anlaşılmış olur. Gün 2'de büyüteç gelir.

## Kontroller

| Girdi | Eylem |
|---|---|
| Fare sürükle | Belgeyi masada taşı |
| Space | İnceleme modunu aç / kapat |
| İnceleme modunda iki alana tıkla | Tutarsızlığı işaretle |
| Damgaya tıkla | Karar ver (GÜVENLİ / GÜÇLENDİR / BOŞALT) |
| Esc | Duraklat |

Yalnızca fare ve Space; masaüstü tarayıcı.

## Kapsam

- **Olmazsa olmaz:** Masa ve sürüklenen belgeler; 5 belge türü; inceleme modu; kural kitabı; 3 damga; mesai saati; 5 gün; şablondan üretilen binalar + birkaç elle yazılmış hikâye binası; gün sonu ekranı; deprem günü ve gazete; temel sesler.
- **İyi olur:** Zarf ve baskı olayları, aile bütçesi, kendi binan dosyası, birden fazla son, büyüteç / cetvel / karot presi araçları, sel ve yangın kuralları (dere yatağı, yangın merdiveni).
- **Kesilenler:** Serbest dolaşım, gerçek şehir haritası, seslendirme.

## Görsel ve ses yönü

Takım görsel ya da ses üretmiyor. Kaynaklar: lisanslı hazır paketler (hazır kaynak beyanı; tercihen CC0, tek tutarlı tarz) ve gerekirse takım onayıyla yapay zekâ (AI beyanı, madde 4.3 riski). Seçim takımın.

- **Yön (takım kararı, 16 Ekim 19.50):** Papers, Please gibi. Düşük çözünürlüklü piksel çizim (görünen piksel yaklaşık 4 ekran pikseli), solgun ve kasvetli palet, yoğun piksel tipografi, dokunsal damga.
- **Ekran düzeni:** Üst bant belediye penceresi: dışarıda sokak ve incelenen bina, gişede (buzlu cam arkasında siluet) mal sahibi. Alt bölüm masa: her belge türü kendi kâğıt rengi ve dokusuyla (ruhsat krem ve mühürlü, vaziyet planı mavi kopya, karot raporu tablo, fotoğraf kenarlıklı baskı), sağ kenardan kayarak açılan damga çubuğu, belgeye basılan mürekkep izi, dosya bitince belgeler gişeden geri verilir.
- **Görsel kaynağı (takım kararı):** Bina cepheleri ve sokak Kenney Tiny Town'dan (CC0), Papers Please paletine boyanarak (değişiklik: renk paleti, parçalardan cephe kurma). Kâğıt, masa, damga, mühür ve siluet kodla çizilir (AI beyanı: görsel, kodla çizim).
- **Fontlar (takım kararı):** Arayüz ve başlıklar Pixelify Sans, belgelerdeki değerler VT323 (ikisi de SIL OFL 1.1, Türkçe karakterli).
- **Renkler ve hava (öneri, takım değiştirebilir):** Koyu kahve-gri masa, krem ve kirli beyaz kâğıtlar, soluk mavi plan, mürekkepte kırmızı (BOŞALT), hardal (GÜÇLENDİR), yeşil (GÜVENLİ); dışarıda soluk akşamüstü.
- **Ses kaynağı (öneri):** Kenney Impact Sounds (damga), Interface Sounds (kâğıt, tık), Music Jingles (gün sonu).

## Varlık listesi

| Dosya | Ne | Kaynak (paket / AI) | Lisans | Durum |
|---|---|---|---|---|
| Tiny Town karoları | Bina cepheleri, sokak | Kenney – Tiny Town (renk paleti değiştirildi) | CC0 1.0 | seçildi |
| Pixelify Sans | Arayüz fontu | Stefie Justprince (Google Fonts) | SIL OFL 1.1 | seçildi |
| VT323 | Belge fontu | Peter Hull (Google Fonts) | SIL OFL 1.1 | seçildi |
| Kâğıt, masa, damga, mühür, siluet | Masa ve belgeler | Kodla çizim (AI beyanı: görsel) | – | seçildi |
| (damga, kâğıt sesleri) | Ses efektleri | Kenney – Impact Sounds, Interface Sounds | CC0 1.0 | aday |
| (gün sonu müziği) | Jingle | Kenney – Music Jingles | CC0 1.0 | aday |

## Açık sorular

- Oyunun ve kurgusal şehrin adı (takım).
- Kural eşikleri (beton dayanımı, dere / fay mesafesi): oyun için sadeleştirilmiş ama doğru; TBDY 2018, AFAD ve Çevre, Şehircilik ve İklim Değişikliği Bakanlığı kaynaklarıyla doğrulanacak (takım).
- Deprem hangi gün: 5. gün sonu mu, rastgele mi (takım).
- İmar affı belgesi ("kâğıtta yasal, gerçekte güvensiz") oyunda olacak mı (takım; siyasi hassasiyet).
