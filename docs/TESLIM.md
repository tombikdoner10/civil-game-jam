# Teslim planı ve kontrol listesi (kitapçık v09)

Kurallar: https://game.ktimo.com.tr/kurallar · Teslim ekranı: https://game.ktimo.com.tr/jam/teslim · Destek: contact@lootbagstudios.net

## Zaman çizelgesi (UTC+3)

| Ne zaman | Ne yapılacak |
|---|---|
| Cuma 16 Ekim, 14.00–16.00 | Alanda kayıt (en geç 16.00; geç gelişe ek süre yok) |
| Cuma 18.00 | Tema açıklanır → fikirler → seçim → kısa plan |
| Cuma gecesi | Oynanabilir ilk prototip; eğlenceli mi, erken gör |
| Cumartesi | Bölümler, görseller, sesler, eğitim, cila |
| Pazar 18 Ekim, 12.00 | Yeni özellik yok, yalnızca hata düzeltme |
| Pazar, ~14.00 | İlk teslim (ZIP + video). Sonradan yeni sürüm gönderilebilir; son başarılı sürüm geçerli. |
| Pazar, 18.00 | Yeni teslim başlatmak için son an. Ardından 3'er dakikalık sunumlar. |

## Teslim formunda istenenler

- Oyun adı ve kısa açıklama
- Platform: **Web**
- **ZIP dosyası:** `npm run zip` komutuyla `teslim/` klasöründe oluşur.
  - İçinde `OYNA.html` (çift tıklayınca internetsiz açılır) ve `BENIOKU.txt` (çalıştırma talimatları) var.
  - Önce commit et. Dosya adında `-degisiklikli` yazıyorsa ZIP bir commit'le eşleşmiyor demektir.
- Web oynama bağlantısı: GitHub Pages adresi; hesapsız açılmalı.
- **Video dosyası:** En fazla 1 dakika, MP4. Oyun içi görüntü ya da trailer. Bağlantı değil, dosyanın kendisi yüklenir.
  - **Takım kararı (18 Ekim):** Yüklenecek dosya `teslim/video/kagit-ustunde-trailer.mp4` (57,85 sn, 1920×1080, H.264 + AAC, takımın bestesi, 27,1 MB). Sade yedek: `kagit-ustunde-video.mp4` (sessiz). İkisi de repoda yok (`teslim/` git dışı); beyanda Diğer › yapay zekâ satırında yazılı.
  - Kayıt: Windows'ta Win+Alt+R (Xbox Game Bar) ya da OBS.
  - Kırpma: Windows'taki Clipchamp ile 1 dakikanın altına indir, MP4 olarak dışa aktar.
  - Aynı video sunumda arkada oynayacak; trailer gibi kurgula.
- Public repo bağlantısı
- Kurulum, çalıştırma ve kontrol talimatları (README'deki "Çalıştırma talimatları")
- Hazır kaynak beyanı: görsel, ses, kod, metin ve diğer için ayrı ayrı Kullanıldı ya da Kullanılmadı (README tablosu)
- Yapay zekâ beyanı: aynı beş kategori (README tablosu)
- Teslim koşullarının ve güncel kural sürümünün kabulü

Formu temsilci doldurur ve 6 karakterli erişim kodunu kendisi girer. Kod hiçbir dosyaya ya da repoya yazılmaz.

## Sunum (video dahil toplam 3 dakika)

- Video (en fazla 1 dakika) arkada oynarken anlatılır; ek video süresi yok.
- Jüri bu sırada oyunu oynayıp puanlıyor; soru-cevap yok.
- Anlatım sırası: fikir ve temayla bağı (en önemlisi), nasıl oynandığı, en iyi an. Prova yapın.
- Sunumdan önce oyunu (canlı site ya da `OYNA.html`) açıp ilk ekranı tıklayın (ses açılır) ve ana menüde bırakın: canlı sitenin ilk yüklemesi birkaç saniye sürüyor (eleştirmen 13). Kısa yolu prova edin: 3 dosya → "BÜYÜK DEPREM BU GECE OLSAYDI?" → gazete.

## Son kontrol

- [ ] Takım en az iki kişi; temsilci teslim için yetkili ve ekipten onay aldı
- [ ] ZIP'teki `OYNA.html` başka bir bilgisayarda, internet kapalıyken açılıyor ve baştan sona oynanıyor
- [ ] Web bağlantısı gizli sekmede, hesapsız açılıyor
- [ ] ZIP ve web sürümü repodaki aynı commit'ten derlendi (menüdeki "sürüm" yazısı aynı)
- [ ] Repo public
- [ ] README güncel: oyun açıklaması, çalıştırma talimatları, kontroller, iki beyan tablosu, tema öncesi son commit
- [ ] `docs/BENIOKU.txt` güncel (oyun adı, amaç, kontroller, bağlantılar)
- [ ] Oyundaki Emeği Geçenler ekranı güncel (takım üyelerinin adları!)
- [ ] Video en fazla 1 dakika, MP4; açılıyor, sesi ve görüntüsü düzgün
- [ ] ZIP ve video yüklendi; makbuz numarası, sürüm, kayıt zamanı ve dosya adları kontrol edildi
- [ ] 3 dakikalık sunum provası yapıldı
- [ ] Son teslimden sonra `main`'e push yapılmayacak
