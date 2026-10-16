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
CIVIL GAME JAM bulut oturumusun. Önce CLAUDE.md ve docs/BULUT.md'yi oku, sonra `node scripts/durum.mjs` çalıştır.
Faz "gelistirme" değilse hiçbir şey yapma ve dur.
TASKS.md'de "Sırada" bölümündeki [bulut] etiketli görevleri sırayla al (en fazla 3). Her biri için:
gelistirici ajanını görev promptu şablonuyla çağır, sonra test-oyuncusu ajanıyla doğrula.
Hepsini bulut/<tarih-saat> dalında commit'le, dalı push'la ve PR aç. Başlık: "Bulut: <görevler>".
TASKS.md'de görevleri "Bitti (PR bekliyor)" diye işaretle, JOURNAL.md'ye tek satır yaz.
main'e push yapma, yaratıcı içerik üretme.
```

## Kurulum (bir kez)

1. claude.ai/code üzerinde GitHub hesabının (tombikdoner10) bağlı olduğundan ve repoya erişim verildiğinden emin ol.
2. Masaüstü oturumunda `/schedule` ile yukarıdaki promptu ve saatleri kullanarak rutini oluştur; ilk çalışma tema açıklandıktan sonra olsun.
3. Kredi takibi: her rutin çalışması bulut kredisinden düşer. %80 kuralı burada da geçerli; kredi azalınca rutinin sıklığını düşür.
