---
name: dondur
description: Pazar 15.00 kod dondurma planını hazırlar ve uygular; kalan hataları, kesilecekleri, ZIP ve doğrulama adımlarını belirler. Yalnızca kullanıcı çağırır; xhigh eforla çalışır.
disable-model-invocation: true
effort: xhigh
---

Kod dondurma planı (hedef: 18 Ekim 15.00 dondurma, 18.00 son teslim).

1. `node scripts/durum.mjs`, `GDD.md`, `TASKS.md`, `JOURNAL.md` ve son eleştirmen raporunu oku. Bulut rutini varsa kapat (`RemoteTrigger` ile `list`, sonra `update` → `enabled: false`); açık bulut PR'larını birleştir ya da kapat.
2. Gerekirse `elestirmen` ajanını son bir kez çağır (kullanım %80'in üstündeyse `model: "sonnet"` ile).
3. Planı yaz (`JOURNAL.md`'ye "Dondurma planı" başlığıyla):
   - **Kritik hatalar:** Oyunu bozan ya da ilk 30 saniyeyi zorlaştıranlar. Her biri için tahmini süre. Sadece bunlar düzeltilir.
   - **Kesilenler:** Yarım kalan ve riskli her şey kapatılır ya da gizlenir.
   - **Metinler:** README (oyun açıklaması, çalıştırma talimatları, kontroller), `docs/BENIOKU.txt`, oyun adı (`src/config.ts`), Emeği Geçenler (takım adları), "tema öncesi son commit" satırı (`jam-oncesi-sablon` etiketi).
   - **Beyanlar:** `npm run beyan`, sonra `docs/AI_BEYAN.md`'yi ve hazır kaynak tablosunu kontrol et; eksik kullanım kalmasın.
   - **Build:** commit, push, yayın bitince `npm run zip` ve `npm run smoke` (ZIP ve canlı site). ZIP adında `-degisiklikli` olmamalı.
   - **Video ve sunum:** Takımın video kaydı (en fazla 1 dakika, MP4) ve 3 dakikalık sunum provası için saat planı.
4. **Kullanıcı onayı:** Planı göster, onay al. Saat 15.00'ten sonra kod düzenlemesi kanca tarafından engellenir. Onaylı her kritik düzeltme için `.jam/dondurma-izni` dosyasını oluştur, düzeltme ve test bitince sil.
5. Planı uygula; her adımı `JOURNAL.md`'ye işle. Sonunda kullanıcıdan `/teslim-kontrol` çalıştırmasını iste.
