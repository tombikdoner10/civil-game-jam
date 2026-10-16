---
name: konsept
description: Tema açıklanınca konsept seçeneklerini hazırlar ve takımla Kontrol 1'i (konsept seçimi) yürütür. Yalnızca kullanıcı çağırır; xhigh eforla çalışır.
argument-hint: "[tema]"
disable-model-invocation: true
effort: xhigh
---

Tema: $ARGUMENTS

1. `node scripts/durum.mjs` çalıştır. Faz `tema-oncesi` ise dur: tema 16 Ekim 18.00'den önce açıklanmaz, oyuna özgü hiçbir şey üretilmez (kural 3.1).
2. Tema verilmediyse kullanıcıdan iste. Temayı `GDD.md`'ye aynen yaz.
3. Takımın kendi fikri varsa önce onu al ve geliştir. Sen **ham malzeme** üretiyorsun; seçim, birleştirme ve özgün dokunuş takımın (kural 4.3: yaratıcılık puanı).
4. 8 konsept seçeneği hazırla. Her biri için:
   - Tek cümlelik fikir
   - Çekirdek döngü (oyuncu 10 saniyede ne yapıyor)
   - **Tema oynanışın neresinde?** (görünüşte değil, kararlarda)
   - İlk 30 saniye: oyuncu hiçbir şey okumadan ne yapacağını nasıl anlıyor
   - Görsel ve ses kaynağı: hangi hazır paket ailesiyle yapılabilir (tercihen CC0, tek tutarlı tarz); yapay zekâ üretimi gerekiyorsa nerede (madde 4.3 riski)
   - 48 saatlik kapsam riski: düşük / orta / yüksek
   - Puan tahmini: tema, oynanabilirlik, yaratıcılık
   Jürinin iki inşaat mühendisi üyesi olduğunu unutma, ama temayı zorla inşaata bağlama.
5. En güçlü 3'ünü gerekçesiyle öner. Başka takımların da aklına gelecek bariz yorumları işaretle.
6. **Kontrol 1:** Kullanıcıya sor (AskUserQuestion). Takım seçsin, birleştirsin ya da kendi fikrini getirsin. Seçim yapılmadan devam etme.
7. Seçimden sonra:
   - `GDD.md`'yi doldur: konsept, çekirdek döngü, temanın yeri, ilk 30 saniye, kapsam (olmazsa olmaz / iyi olur / kesilecekler), görsel ve ses yönü, takım üretim listesi. `Konsept durumu: SEÇİLDİ (<saat>)` yap.
   - `TASKS.md`'ye ilk görevleri yaz: önce oynanabilir çekirdek döngü (gri kutularla), sonra diğerleri. Her görev `[teknik]` ya da `[takım]` etiketli.
   - `JOURNAL.md`: Kontrol 1 → TAMAM (saat), kararın kısa gerekçesi.
   - AI beyanı: `node scripts/beyan.mjs ekle diğer "Tema yorumu için konsept seçenekleri önerdi; seçim ve özgün dokunuş takımın" "Oyun fikri aşaması"`
   - Commit at.
8. Kullanıcıya hatırlat: bu komut bitti, oturum normal (high) eforla devam eder. `/basla` ile döngü çalışmıyorsa başlatsın.
