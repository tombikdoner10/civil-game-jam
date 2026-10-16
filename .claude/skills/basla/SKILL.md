---
name: basla
description: Jam döngüsünü başlatır. Ön kontrolleri yapar, sonra /jam adımını kendi hızında tekrarlayan döngüyü açar. Kullanıcının tek başlatma komutu.
disable-model-invocation: true
---

Jam döngüsünü başlat. Lider sensin (rolün `CLAUDE.md`'de).

1. `node scripts/durum.mjs` çalıştır ve çıktıyı oku.
2. Çalışma dalını güncelle: `git switch main`, `git pull --rebase`. Bekleyen bulut PR'ları varsa (`gh pr list`) incele, uygunsa birleştir.
3. `npm install` (gerekirse) ve `npm run check`. Hata varsa önce onu düzelttir.
4. Kullanımı kontrol et: masaüstünde `get_usage` aracını (ToolSearch ile yükle) çağır. %80'i geçtiyse `CLAUDE.md`'deki indirme sırasını uygula.
5. `GDD.md`, `TASKS.md`, `JOURNAL.md`'yi oku. `JOURNAL.md`'ye "Döngü başladı" girdisi ekle.
6. Kullanıcıya iki satırla durumu söyle: faz, sıradaki iş, kontrol noktaları.
7. Skill aracıyla `loop` becerisini `/jam` argümanıyla çağırarak döngüyü başlat (aralık verme; döngü kendi hızını seçer).

Faz `tema-oncesi` ise döngüyü yine başlat ama oyuna özgü hiçbir şey yapma; tema saatine kadar uzun aralıklarla bekle.
