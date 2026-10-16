---
name: jam
description: Jam döngüsünün tek bir adımı. Durumu okur, faza göre bir sonraki işi yaptırır, test ettirir, hafıza dosyalarını günceller. /basla bunu /loop ile tekrarlar.
---

Jam döngüsünün bir adımını yürüt. Lider sensin; kurallar `CLAUDE.md`'de. Kısa tut: bir adımda bir iş.

## 1. Durum
`node scripts/durum.mjs` çalıştır. Çıktıdaki "→" satırları önceliklidir. Ardından `TASKS.md`'ye ve `JOURNAL.md`'nin son girdilerine bak.

## 2. Faza göre
- **tema-oncesi:** Oyuna özgü hiçbir şey yapma. Tema saatine yakın bir uyanma planla ve adımı bitir.
- **konsept:** Kullanıcıdan temayı iste ve `/konsept` komutunu (xhigh) çalıştırmasını hatırlat. Kontrol 1 kullanıcıyla yapılır; seçim olmadan geliştirmeye geçme. Uzun bir uyanma planla.
- **gelistirme:**
  0. Açık bulut PR'ı varsa (`gh pr list`) önce onu ele al: `test-oyuncusu` ile doğrulat, `gh pr merge <no> --merge --delete-branch`, `git pull`. Gece yatmadan önce bulutun yapabileceği teknik görevlere `[bulut]` etiketi ekle ve push'la; bulut yalnızca GitHub'daki `main`'i görür.
  1. `TASKS.md`'de "Sırada" bölümündeki en üstteki `[teknik]` görevi al ("Şimdi" bölümüne taşı).
  2. `CLAUDE.md`'deki şablonla görev promptu yaz ve `gelistirici` ajanını çağır (bir anda tek geliştirici).
  3. Bittiğinde `test-oyuncusu` ajanını o göreve uygun bir senaryoyla çağır.
  4. Test geçtiyse: `git push` (canlı oyun güncellenir), görevi "Bitti"ye taşı. Geçmediyse hatayı yeni görev olarak yaz ya da aynı görevi tekrar ver. İkinci başarısızlıkta `gelistirici`yi bu görev için `effort: "high"` ile çağır.
  5. Durum çıktısı "Eleştirmen zamanı" diyorsa `elestirmen` ajanını çağır. Raporunu `JOURNAL.md`'ye özetle, teknik önerileri `TASKS.md`'ye ekle, yaratıcı önerileri "Takım işleri"ne yaz. `JOURNAL.md`'deki "Son eleştirmen" satırını güncelle.
  6. İlk oynanabilir çekirdek döngü hazırsa ve Kontrol 2 bekliyorsa: döngüyü duraklat, kullanıcıdan oyunu oynamasını iste (Kontrol 2). Geri bildirimi `JOURNAL.md`'ye ve görevlere işle.
  7. `[takım]` görevlerini asla kendin ya da ajanlarla yapma. Takımdan gelen dosyalar `src/art/` ya da `src/sounds/` altına düştüyse onları oyuna bağlamayı teknik görev olarak ekle.
- **dondurma-teslim:** Yeni özellik yok. Kullanıcı `/dondur` (xhigh) planını yapmadıysa hatırlat. Plan varsa sıradaki maddeyi uygula: yalnızca onaylı kritik düzeltmeler, `npm run zip`, `npm run smoke` (ZIP ve canlı site), sonra kullanıcıdan `/teslim-kontrol` (xhigh) çalıştırmasını iste (Kontrol 3).
- **bitti:** Push yok. `JOURNAL.md`'ye kapanış yaz ve döngüyü durdur (ScheduleWakeup `stop: true`).

## 3. Her adımın sonunda
- Kullanım kontrolü (masaüstünde `get_usage`): %80'i geçtiyse `CLAUDE.md`'deki indirme sırasını uygula ve `JOURNAL.md`'ye yaz.
- `JOURNAL.md`'ye tek satırlık girdi: saat, ne yapıldı, sonuç, sıradaki.
- Kontrol noktasında kullanıcıyı bekliyorsan uzun aralık seç; ajan çalışıyorsa bildirim gelince devam edersin, kısa aralıkla yoklama yapma.
