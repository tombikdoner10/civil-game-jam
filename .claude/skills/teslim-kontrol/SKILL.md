---
name: teslim-kontrol
description: Son teslim kontrolü ve Kontrol 3. ZIP, canlı site, repo, beyanlar ve form metinlerini doğrular, teslim formu için metinleri hazırlar. Yalnızca kullanıcı çağırır; xhigh eforla çalışır.
disable-model-invocation: true
effort: xhigh
---

Son teslim kontrolü. Son teslim 18 Ekim 18.00; teslimi kullanıcı (temsilci) yapar.

**Değişmez kural:** Teslim ekranının 6 karakterli erişim kodunu asla isteme, yazma, saklama. Kullanıcı yazarsa kullanma ve bir dosyaya koyma.

1. `node scripts/durum.mjs`. 18.00'i geçtiyse push yapma; yalnızca mevcut durumu raporla.
2. `docs/TESLIM.md`'deki son kontrol listesini sırayla doğrula ve her maddeyi kanıtıyla işaretle:
   - `git status` temiz; son commit GitHub'da (`git log origin/main -1`); repo public (`gh repo view --json visibility`).
   - Yayın başarılı (`gh run list --limit 1`); canlı sürüm = son commit (`version.json` ya da menüdeki "sürüm").
   - `npm run zip`: ZIP adında `-degisiklikli` yok. `npm run smoke` (ZIP) ve canlı site için smoke hatasız; ekran görüntülerine bak.
   - README: oyun açıklaması, çalıştırma talimatları, kontroller, iki beyan tablosu, tema öncesi son commit. `docs/BENIOKU.txt` güncel.
   - `npm run beyan` sonrası `docs/AI_BEYAN.md` beş kategoride tam; hazır kaynak tablosu beş kategoride tam.
   - Emeği Geçenler'de takım üyelerinin adları var.
3. Teslim formu metinlerini `docs/TESLIM_FORMU.md`'ye yaz: oyun adı, kısa açıklama, platform (Web), oynama bağlantısı, repo bağlantısı, ZIP dosyasının yolu, kurulum/çalıştırma/kontrol talimatları, hazır kaynak beyanı (5 kategori), AI beyanı (5 kategori, `docs/AI_BEYAN.md`'den). Commit at, push'la (18.00'den önce).
4. **Kontrol 3:** Kullanıcıya göster:
   - Yüklenecek ZIP'in tam yolu ve video dosyasının şartları (en fazla 1 dakika, MP4/AVI)
   - Forma yapıştıracağı metinler
   - Teslimden sonra makbuzu (numara, sürüm, kayıt zamanı, dosya adları) kontrol etmesi
   - 18.00'den önce yüklemeyi başlatması
5. Kullanıcı makbuzu aldıktan sonra teslim yedeği:
   - `npm run yedek`
   - ZIP'i GitHub sürümü olarak sakla: `gh release create teslim-<commit> teslim/<zip> --title "Teslim <saat>" --notes "CIVIL GAME JAM teslimi, commit <hash>"`
   - ZIP'i ve kullanıcının video dosyasını repo dışındaki `../teslim-yedek/` klasörüne kopyala.
6. `JOURNAL.md`: Kontrol 3 → TAMAM (saat), teslim edilen commit ve ZIP adı. Bundan sonra push yok.
