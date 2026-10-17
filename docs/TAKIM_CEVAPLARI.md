# Takımın cevapları (17 Ekim)

Bu dosya, takımdan beklenen her şeyin tek listesi. Cevabı her maddenin altındaki `Cevap:` satırına yazın.
İsterseniz bu dosyayı değil, metni sohbete yazın; Claude yerine koyar (G31), taşmaları kontrol eder ve test eder.

- Köşeli parantez `[...]` yer tutucu demek. Sizin yazdığınız son metinde köşeli parantez olmaz.
- Kısa yazın: manşet ve değerlendirme satırı tek satıra sığarsa büyük ve okunur kalır.
- Ton kuralı (gazete, sonuç, "Senin evin"): kurban yok, ölü sayısı yok, odak önlemede.
- Kalan yer tutucuların tam listesi: `npm run yer-tutucu` (şu an ~508 dize).

Son tarihler: metinler bugün 18.00 · özellik dondurma bugün 24.00 · video Pazar 10.00–12.00 · kod dondurma Pazar 15.00 · son teslim Pazar 18.00.

---

## A. Bugün 18.00'e kadar: oyuna girecek metinler

### 1. Adlar (T1)
| Ne | Şu an | Yer |
|---|---|---|
| Oyunun adı | `OYUN ADI` | `src/config.ts` TITLE |
| Kurgusal şehrin adı | `[Şehir adı]` | gazete künyesi |
| Gazetenin adı | `[GAZETE ADI]` | `src/game/gazete.ts` GAZETE_ADI |

Cevap:

### 2. Gün 1'de jürinin ilk 30 saniyede gördükleri (T31, T11)
| Ne | Şu an |
|---|---|
| Çerçeve cümlesi | `[Belediyenin yapı denetçisisin. Deprem her an olabilir.]` |
| Görev satırı | `[Görev: belgeleri karşılaştır, kurala uymayanı damgala]` |
| Gün 1 kuralı | `[Kural: ruhsattaki kat sayısı (zemin dahil) fotoğraftakiyle aynı olmalı. +1 kat → GÜÇLENDİR, +2 ve üstü → BOŞALT]` |
| İnceleme ipucu (fişte) | `[Space ile incele, kusuru kanıtla]` |
| Fiş başlıkları | `Doğru karar` · `Yanlış karar` · `Doğrusu:` (köşeli parantezsiz, değişmesi gerekmiyorsa "aynı kalsın" yazın) |

Cevap:

### 3. Gün sonu raporu ve deprem (T31)
| Ne | Şu an |
|---|---|
| Küçük deprem bandı | `[Küçük bir deprem oldu.]` |
| Kısa yol düğmesi | `[BÜYÜK DEPREM BU GECE OLSAYDI?]` |
| Kısa yol satırı | `[Kararlarının sonucunu şimdi gör.]` |
| Devam notu | `[Sonra 2. günden devam edebilirsin.]` |
| Deprem kartı | `[Bir gece]` |
| Hızlandırma ipucu | `[Enter ya da tıkla: hızlandır]` |
| İkinci basış ipucu | `[Enter: geç]` (test notu: tıklama da çalışıyor ama yazmıyor) |
| Etiket | `[SENİN DAMGAN]` |

Cevap:

### 4. Gazete ve sonuç (T4, T30, T31, G37)
`src/game/gazete.ts`. Her manşet ve değerlendirmenin **tekil** ve **çoğul** biçimi var (tek bina / birden çok bina).

| Durum | Şu an (tekil / çoğul) |
|---|---|
| Onaylanan bina çöktü | `[Manşet: denetimden geçen bina çöktü]` / `…binalar çöktü]` |
| İade edilen bina çöktü | `[Manşet: denetlenmeden kalan bina çöktü]` / `…binalar…` |
| Boşaltılan bina çöktü | `[Manşet: çöken bina boşaltılmıştı]` / `…binalar…` |
| Kimse çökmedi | `[Manşet: sokak ayakta]` · `[Manşet: sokakta hasar var, çöken yok]` |
| Kısa yol, kusursuz jüri | `[Manşet: denetlediğin binalar ayakta, sokakta denetlenmeyen binalar çöktü]` (parçalar: KISA_SENIN, KISA_SOKAK_COKEN) |
| Değerlendirme şeridi | `[Değerlendirme: onayladığın binalar çöktü; birinden zarf almıştın]` vb. (DEGERLENDIRME_ZARFLI) |
| Kısa yol başlıkları | `[Senin binaların]` · `[Bütün sokak]` · `[GÜN 1 + DEPREM]` |
| Fotoğraf altı | `[Fotoğraf: deprem sonrası sokak]` |
| Zarf izi | `[Denetçinin masasında zarf bulundu]` |

Cevap (dosyayı kendiniz düzenleyecekseniz "dosyada" yazın):

### 5. Gişe diyalogları (T28, T17)
`src/game/diyalog-metin.ts`: 393 taslak cümle (5 mizaç: kibar, sinirli, telaşlı, kurnaz, çekingen; 12 kusur × bahane/itiraf/zarf; İSTE; zarf isteği).
- Öncelik: gün 1'de görünenler: 5 mizacın **selamı**, **damga tepkileri**, **zarf** cümleleri, **kaçak kat** bahane/itiraf/zarf cümleleri.
- Beğenmediğinizi silin ya da değiştirin; onayladıklarınızın köşeli parantezini kaldırın.
- Değişkenler cümlede kalabilir: `{kat}`, `{yil}`, `{ada}`, `{bina}`, `{para}`.

Cevap (ör. "dosyada düzenledik" ya da "şu cümleler çıksın: …"):

### 6. Kendi evin (T35)
`src/game/ev-metin.ts`, fiyatlar `src/game/tuning.ts` (G43 ile kademeli: çanta 30/40/50, sabitleme 30/50/60, güçlendirme taksiti 80/100/120).
- Her kalemin her kademesinin adı ve kısa açıklaması (ör. çanta 1: su ve fener; 2: ilk yardım; 3: aile buluşma planı).
- "Senin evin" cümleleri: evin durumu (sağlam/hafif/ağır/çöktü), çanta 0–3, sabitleme 0–3, güçlendirme 0–3, zarf cümleleri.
- Gerçek hazırlık bilgisini AFAD kaynaklarıyla doğrulayın (farkındalık teması).
- Fiyatlar onaylı mı?

Cevap:

### 7. 2–5. gün kuralları ve mühendislik doğruluğu (T2, T12, T21)
Jüri büyük olasılıkla yalnızca gün 1'i oynar; ama jüride iki inşaat mühendisi var. Kısa cevap yeterli:
- Mühür yılı ruhsat mı iskân mı ("Ruhsat tarihi" demek daha mı doğru)?
- Beton eşiği 20 MPa: mevcut binada tahliye nedeni olarak doğru mu (Riskli Yapıların Tespit Esasları 2019)?
- Schmidt çekici tek başına karar verdirir mi? (Şu an: iyi sonuç GÜVENLİ verdirmez, karotla doğrulanmalı.)
- Dere 30 m / fay 150 m mesafelerinin kaynağı var mı, yoksa "oyun kuralı" mı diyelim?
- Sıvılaşma hep BOŞALT mı? Zemin sınıfları (ZA–ZF) gerekli mi?

Cevap:

### 8. Hikâye binaları (T3)
| Bina | Gün | Şu an |
|---|---|---|
| Bina H1 | 2 | sahip `[Mal sahibinin adı]`, söz `[Mal sahibinin sözü]` |
| [Kendi apartmanın] | 5 | sahip `[Komşu]`, söz `[Komşunun sözü]` |

Cevap:

---

## B. Teslimden önce (tercihen bugün): beyan ve takım bilgisi

### 9. Takım (T32)
- Üyelerin adları ve rolleri (oyunda Emeği Geçenler ve README; şu an `[Takım üyesi 2] · [rol]`).
- BENIOKU'daki "Amaç" satırı (oyunun amacı, tek cümle).

Cevap:

### 10. Takımın kararları (T26)
Emeği Geçenler'de AI bölümünden önce ve README'de görünecek 4–5 madde. Madde 4.3: takımın yaratıcı katkısı görünür olsun.
Örnek başlıklar: tema yorumu, gişede insan ve zarf ikilemi, kural kararları (kaçak kat, sahte ruhsat İADE…), kehanetsiz deprem dili, kendi evin hazırlığı, metinler.

Cevap:

### 11. AI beyanı onayı (T27)
`docs/AI_BEYAN.md` üst bölümünü okuyun; teslim formuna bu metin yapıştırılacak. Metinleri siz yazınca "Metin" bölümü "AI taslağı, takım düzenledi" olarak güncellenecek.

Cevap (onay ya da düzeltme):

---

## C. Kısa onaylar (birkaç dakika)

### 12. Sesler (T6)
Canlı sitede bir gün oynayıp dinleyin: damga, ayak sesi düzeyi, gün sonu, gazete ve sonuç jingle'ları. Beğenmediğinizi yazın.

Cevap:

### 13. Görsel (T11, T19)
Portreler (`?dev&portreler`, menüde Oyna), sokak ve renk paleti. İnceleme modunda saat akmaya devam ediyor; yavaşlasın mı? Zarf sıklığı (gün 5'te %60) uygun mu?

Cevap (çoğu için "olduğu gibi kalsın" yeterli):

---

## D. Pazar

### 14. Video (T9): 10.00–12.00
En çok 1 dakika, MP4. Eleştirmen önerisi (`?dev&gun=1&tohum=1`, zarflı akış): sokak → kişi yürüyerek gelir → kaçak kat incelemesi ve damga → zarf → küçük deprem → büyük deprem (zarflı bina çöker) → gazete ve "Senin binaların / Senin evin". Kayıt metinler girdikten sonra.

### 15. Sunum (T25)
- Jüriye ilk cümle (öneri): "Kaşeye tıkla, raporda kırmızı düğmeye bas, depremde bir kez Enter."
- Anlatılacaklar: takımın kararları; Papers, Please ilhamı açıkça, ama ayrışma (kalıcı sokak, depremler, gazete, kendi evin).
- Jüri bilgisayarında oyun önceden açık olsun ya da ZIP sürümü (canlı sitede ilk yükleme birkaç saniye).

### 16. Komutlar (temsilci Egemen)
- `/dondur`: kod dondurmadan (15.00) önce.
- `/teslim-kontrol`: teslimden önce.
- Teslim formunu Egemen doldurur; erişim kodunu yalnızca o girer (dosyaya, sohbete yazılmaz).
