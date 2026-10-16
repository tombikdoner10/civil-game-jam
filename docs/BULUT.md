# Bulut oturumları

Bilgisayar uyurken (gece) Claude Code bulut oturumları teknik işlere devam edebilir. Repo public olduğu için bulut oturumu repoyu klonlar; bu `CLAUDE.md`'yi, ajanları, komutları ve kancaları (dondurma, push kilidi, AI kaydı) aynen kullanır.

## Kurallar

- Yalnızca `TASKS.md`'de `[bulut]` etiketli **teknik** görevler. Yaratıcı iş yok: fikir, görsel, ses, oyun metni takımındır (madde 4.3).
- `main`'e doğrudan push yok. `bulut/<YYYYAAGG-SSDD>` dalında çalış, her görev ayrı commit, sonunda PR aç. Lider sabah PR'ı test ettirip birleştirir.
- Kod dondurmadan (18 Ekim 15.00, UTC+3) sonra bulut oturumu çalışmaz; son teslimden (18.00) sonra hiçbir push yok. Kancalar da bunu zorlar.
- Tarayıcı paneli yok. Test için `npm run build:single` ve `npm run smoke` (tarayıcı yoksa `CHROME_PATH` ile yol ver; yine yoksa raporda belirt).
- AI beyanı commit kancasıyla otomatik güncellenir; PR açıklamasına yapılan görevleri yaz.

## Zamanlanmış rutin

**Kuruldu (16 Ekim):** "CGJ gece bulut (Prompt Engineers)", kimlik `trig_012ypQupnGRG4bbKvXWhSnFV`, https://claude.ai/code/routines/trig_012ypQupnGRG4bbKvXWhSnFV

- Model: Claude Sonnet 5.5. Saat: her gün 01.00, 04.00 ve 06.00 (UTC+3); cron `0 22,1,3 * * *` (UTC).
- Faz "gelistirme" değilse ya da `[bulut]` görevi yoksa hiçbir şey yapmadan biter.
- Kod dondurmada lider rutini kapatır (`/dondur` adım 1: `RemoteTrigger` `update` → `enabled: false`). Rutinler API ile silinemez; silmek için yukarıdaki bağlantı.

Rutinin promptu (özet):

```
1. CLAUDE.md ve docs/BULUT.md'yi oku, `node scripts/durum.mjs` çalıştır. Faz "gelistirme" değilse dur.
2. Aynı işi tekrarlama: main'e birleşmemiş origin/bulut/* dallarının TASKS.md'sinde "PR bekliyor"
   diye işaretli görevleri atla.
3. Kalan [bulut] görev yoksa dur. Varsa en fazla 3'ünü al; main'den bulut/<tarih-saat> dalı aç;
   her biri için gelistirici, sonra test-oyuncusu ajanı.
4. Görevleri "Bitti (PR bekliyor)" diye işaretle, JOURNAL.md'ye yaz, commit, dalı push'la, PR aç.
Kesin: main'e push yok, yaratıcı içerik yok, hazır kaynak yok, kancaları aşma, gizli bilgiye dokunma.
```

Lider sabah PR'ı test ettirip `gh pr merge <no> --merge --delete-branch` ile birleştirir. Dal silinmezse bulut o görevleri hâlâ bekliyor sayar.

## Notlar

- Bulut oturumu yalnızca GitHub'daki `main`'i görür; yatmadan önce yerel işler push'lanmış ve bulut görevleri `[bulut]` etiketiyle `TASKS.md`'ye yazılmış olmalı.
- Rutinin dal push'layıp PR açabilmesi için claude.ai/code'daki GitHub bağlantısının bu repoya yazma izni olmalı.
- Her çalışma bulut kredisinden düşer; görev yoksa birkaç saniyede biter. %80 kuralı burada da geçerli: kredi azalınca rutinin sıklığını düşür.
