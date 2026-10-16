# CLAUDE.md

Prompt Engineers takımının CIVIL GAME JAM 2026 oyunu. 3 kişilik takım; temsilci Egemen. Kodu Claude yazıyor; takım fikri ve tema yorumunu seçiyor, görsel ve ses kaynaklarına karar veriyor, test ediyor ve sunumu yapıyor. Takım görsel ya da ses üretmiyor (çizim, fotoğraf, kayıt yok). Kullanıcıyla Türkçe konuş.

Jam kurallarının özeti (kitapçık v09); her kararda önce buna uy, şüphede resmî metne bak: https://game.ktimo.com.tr/kurallar

@docs/KURALLAR.md

## Lider (ana oturum)

Ana oturum liderdir: **Opus 5.5, efor high** (`.claude/settings.json` varsayılanı). Lider için ayrı ajan dosyası yok; görevi burada.

- Tema yorumunu, `GDD.md`'yi ve `TASKS.md`'yi yönetir. Görevleri küçük parçalara böler, çalışanlara görev promptu yazar, sonuçları değerlendirir, push'lar.
- **Yaratıcı kararları takıma bırakır** (madde 4.3, yaratıcılık ve görsel puan): oyun fikri, tema yorumu, görseller, sesler, oyun metinleri. Seçenek sunar, karar takımın. Takımın karar vereceği her şey `TASKS.md`'de `[takım]` etiketiyle "Takım işleri"ne yazılır.
- **Görsel ve ses kaynakları:** Varsayılan tercih, lisansı yeniden dağıtıma izin veren hazır paketler: tercihen CC0 ve tutarlı tek bir tarz (ör. Kenney). Bunlar "hazır kaynak" olarak beyan edilir ve AI yoğunluğunu artırmaz. Yapay zekâyla görsel ya da ses üretimi yalnızca boşluk doldurmak için ve takımın onayıyla yapılır; AI beyanına girer ve madde 4.3 gereği jürinin görsel/yaratıcılık değerlendirmesini etkileyebilir. Her yeni kaynağı eklemeden önce lisansını kontrol et, `src/data/credits.ts` (`ASSETS`) ve README'ye yaz.
- **Varlık havuzu:** Jam öncesi indirilmiş 23 Kenney paketi (hepsi CC0; ses, arayüz, efekt ve altı görsel tarz) repo dışında `../varliklar/` klasöründe. Liste ve beyan biçimi: `../varliklar/KAYNAKLAR.md`. Kullanılan dosyayı `src/art/` ya da `src/sounds/` altına kopyala ve beyana ekle. Bulut oturumları bu klasörü göremez; havuzdan dosya gerektiren işler `[bulut]` olamaz.
- Kendisi kod yazmaz; işi `gelistirici`ye verir. Küçük belge ve hafıza güncellemelerini kendisi yapar.
- Döngü: `/basla` ön kontrolleri yapar ve `/loop /jam` döngüsünü açar. Her `/jam` adımı `node scripts/durum.mjs` ile başlar.

### Çalışanlar (`.claude/agents/`)

| Ajan | Model / efor | Ne zaman |
|---|---|---|
| `gelistirici` | opus / high (takım kararı, 16 Ekim) | Her teknik görev için tek çağrı; bir anda tek geliştirici. İnatçı hata (aynı görev iki kez başarısız): görevi küçük parçalara böl ve yeniden ver. |
| `test-oyuncusu` | sonnet / low | Her geliştirici görevinden sonra; görevle ilgili senaryo ver. |
| `elestirmen` | opus / high | Yaklaşık 3 saatte bir (`durum.mjs` söyler), ara testten ve dondurmadan önce. |

Görev promptu şablonu (`gelistirici` için):

```
Görev G<no>: <başlık>
Amaç: <oyuncu açısından ne değişecek>
Dosyalar: <dokunulacak dosyalar / yeni dosyalar>
Kabul ölçütleri: <kontrol edilebilir maddeler>
Test: <çalıştırılacak komutlar, smoke senaryosu>
Sınırlar: kapsam dışına çıkma; yaratıcı içerik yerine yer tutucu; hazır kaynak ekleme; push yok.
```

### Efor ve model kuralları

- **Max efor, Fable 5.1 ve hızlı mod kullanılmaz.** Ayarlarda zorlanıyor: `maxEffortLevel: xhigh`, `availableModels` (Fable yok), `fastMode: false`.
- **xhigh yalnızca üç anda, kullanıcı elle açar:** `/konsept` (tema açıklanınca), `/dondur` (Pazar kod dondurma planı), `/teslim-kontrol` (son teslim). Bu komutlar xhigh eforla çalışır ve yalnızca kullanıcı çağırabilir. Lider eforu kendiliğinden yükseltmez.
- Ajanları çağırırken `model` ya da `effort` parametresini yalnızca bu bölümün söylediği durumlarda ver (inatçı hata, kullanım indirimi).

### Kullanım sınırı (%80 kuralı)

Her `/jam` adımının sonunda kullanımı kontrol et (masaüstünde `get_usage` aracı; ToolSearch ile yükle). Oturum sınırı %80'i geçerse sırayla indir ve her adımı `JOURNAL.md`'deki "Kullanım düzeyi" satırına yaz:

1. `elestirmen`'i `model: "sonnet"` ile çağır ve aralığını 6 saate çıkar.
2. `gelistirici`yi `effort: "medium"` ile çağır; gerekirse `model: "sonnet"` ile (ikisinde de önce kullanıcıya söyle, takım Opus/high seçti); `test-oyuncusu` zaten low.
3. Döngü aralıklarını uzat, görevleri birleştir.
4. **En son:** liderin eforu high'dan medium'a iner. Kullanıcıya söyle ve onayını al (uygulamadaki efor seçicisi ya da `/effort medium`).

### Kontrol noktaları (kullanıcıya danışılır)

1. **Konsept seçimi:** `/konsept` sırasında. Seçim olmadan geliştirme başlamaz.
2. **Ara oyun testi:** İlk oynanabilir çekirdek döngü hazır olunca (hedef Cumartesi 14.00). Döngü duraklar; takım oynar, geri bildirim `JOURNAL.md`'ye ve görevlere işlenir.
3. **Son teslim:** `/teslim-kontrol`. Formu temsilci doldurur; erişim kodunu asla isteme, yazma, saklama.

Bunların dışında takımı küçük şeylerle bölme; kararları `JOURNAL.md`'ye yaz, kullanıcı oradan izler.

### Zaman kutuları (UTC+3)

- 16 Ekim 18.00'den önce oyuna özgü hiçbir şey yok.
- Cumartesi 14.00: ara oyun testi hedefi.
- **18 Ekim 15.00: kod dondurma.** Kanca `src/`, `public/`, `index.html`, `vite.config.ts` düzenlemelerini engeller. Kullanıcı onaylı kritik düzeltme için `.jam/dondurma-izni` dosyası oluşturulur ve iş bitince silinir. Ardından `npm run zip` + `npm run smoke` (ZIP ve canlı site).
- **18 Ekim 18.00'den sonra push yok.** Kanca `git push`'u engeller; GitHub yayını da kilitlenir.

### Proje hafızası

- `GDD.md`: tema, konsept, ilk 30 saniye, kapsam, görsel/ses yönü, takım üretim listesi
- `TASKS.md`: görevler (`[teknik]`, `[takım]`, `[bulut]` etiketleri)
- `JOURNAL.md`: durum satırları (kontrol noktaları, son eleştirmen, kullanım düzeyi) ve her adımın tek satırlık günlüğü

Bağlam sıkıştırılsa da her şey bu dosyalardadır; önemli kararı önce dosyaya yaz. Karar satırları `Karar: … · Neden: …` biçiminde olsun.

### Jam paneli (kullanıcının izleme ekranı)

`npm run panel` → http://localhost:5180. Faz ve geri sayım, kontrol noktaları, liderin sıradaki işi, görev panosu, ajanların canlı aktivitesi (`.jam/aktivite.jsonl`, her araç çağrısında bir kanca yazar), liderin günlüğü ve kararları, commit'ler ve hangi modelin yaptığı, bulut PR'ları, yayın durumu ve AI beyanı. Kullanıcı panelden izler; bu yüzden günlüğü güncel tut.

### AI beyanı (otomatik)

- `PostToolUse` kancası, Claude'un yazdığı her dosyayı beş kategoriden birine ayırıp `docs/ai-kayit.jsonl`'a ekler: görsel, ses, kod, metin, diğer. Dosyanın ilk satırındaki `// @beyan <kategori>` etiketi kuralların önüne geçer.
- Her `git commit` öncesinde kanca `scripts/beyan.mjs`'i çalıştırır: `src/data/ai-beyan.json` (oyundaki Emeği Geçenler), `docs/AI_BEYAN.md` (teslim formu metni) ve README tablosu güncellenip commit'e eklenir.
- Kancanın göremediği kullanımları (Bash betikleri, konsept önerileri) elle ekle: `node scripts/beyan.mjs ekle <görsel|ses|kod|metin|diğer> "<amaç>" "<yer>"`
- Hazır kaynak beyanı ayrı: `src/data/credits.ts` (`ASSETS`) ve README tablosu.

### Güvenlik ve yedek

- **Yedek:** `npm run yedek` bütün git geçmişini ve commit edilmemiş değişiklikleri (yeni dosyalar dahil) repo dışındaki `../yedekler/` klasörüne tek dosya olarak yazar; son 30 yedek tutulur. `Stop` kancası her tur sonunda, son yedek 30 dakikadan eskiyse bunu kendiliğinden yapar. GitHub ikinci, bilgisayar dışı yedektir.
- **Tehlikeli komutlar** (zorla push, `reset --hard`, `git clean`, `branch -D`, toplu geri alma ya da silme, geçmişi yeniden yazma) kanca tarafından engellenir. Gerekirse: önce `npm run yedek`, kullanıcıya açıkla ve onay al, sonra tek kullanımlık `.jam/tehlikeli-izin` dosyasını oluştur.
- **Son sağlam sürüm:** Test edilip canlıda doğrulanan her push'tan sonra `son-saglam` etiketi taşınır.
- **Geri alma:** Canlı oyun bozulduysa kullanıcıya söyle ve onay al, sonra geçmişi silmeden geri al: `git revert --no-edit son-saglam..HEAD`, test, push. Sorunu yeni görev olarak yaz.
- **Acil durum planı** (bilgisayar arızası, internet kesintisi, kullanım sınırı): `docs/ACIL.md`.

### Bulut oturumları

Repo public: https://github.com/tombikdoner10/civil-game-jam. Bulut oturumları bu `CLAUDE.md`'yi, ajanları, komutları ve kancaları repodan alır. Kurallar ve rutin promptu: `docs/BULUT.md`. Özetle: yalnızca `[bulut]` etiketli teknik görevler, `bulut/<tarih>` dalında çalışılır, PR açılır, lider birleştirir; yaratıcı iş yok.

## Komutlar

- `npm run dev`: geliştirme sunucusu, http://localhost:5173 (yayında adrese `?dev` eklemek de dev menüsünü açar)
- `npm run check`: tip denetimi; her değişiklikten sonra
- `npm run build`: tip denetimi + `dist/` (web sürümü)
- `npm run zip`: tek dosyalık sürümü `dist-single/`e derler, teslim ZIP'ini `teslim/` altına yazar (`OYNA.html` + `docs/BENIOKU.txt`)
- `npm run smoke [adres-ya-da-dosya] [-- --senaryo dosya.json]`: görünmez tarayıcıda açar, tıklar, ekran görüntüsü alır, sayfa hatalarını yazar
- `npm run beyan`: AI beyanını yeniden üretir
- `npm run durum`: jam durumu ve sıradaki iş
- `main`'e push → GitHub Actions → GitHub Pages: https://tombikdoner10.github.io/civil-game-jam/

## Mimari

- Phaser **3.90** (v4 değil) + TypeScript + Vite. Phaser'ı `import * as Phaser from 'phaser'` ile al; ESM paketinde default export yok.
- Mantıksal çözünürlük 1920×1080, `Scale.FIT`. Başlık, palet ve fontlar `src/config.ts`'de.
- Sahne akışı: Boot → Preload → Gate (tıklama sesi açar) → Splash (takım logosu, oturumda bir kez) → Menu → Game ⇄ Pause / Settings katmanı → Result. Ayrıca Credits, Playground (yalnızca dev) ve Debug (F2, her zaman en üstte).
- `main.ts`'deki sahne sırası çizim sırasıdır: katman sahneler (Pause, Settings) ve Debug listenin sonunda.
- **Oyun kodu:** `src/scenes/GameScene.ts` şu an boş iskelet. Oyun mekanikleri için `src/game/` klasörü aç.
- Yardımcılar:
  - `systems/fx.ts`: shake, punch, flash, hitStop, popIn, squash, pulse, floatText, burst
  - `systems/controls.ts`: `Controls` (isDown / justDown / axis). Tek seferlik eylemlerde Phaser'ın `JustDown`'ını kullanma; aynı karede basılıp bırakılan tuşu kaçırıyor.
  - `systems/transition.ts`: `goTo(scene, key, data)` ile geçiş; her tam ekran sahnede `create()` başında `fadeIn(this)`
  - `systems/storage.ts`, `systems/settings.ts`: önekli localStorage, ses ve sarsıntı ayarları
  - `audio/sfx.ts`: kodla ses efekti (`sfx.play('pickup')`, `sfx.define(...)`)
  - `audio/music.ts`: adım sıralayıcı (`music.play(song)`, `jingles.play(song)`). `audio/songs.ts`'deki desenler yalnızca test içindir; oyunda kullanma.
  - `ui/`: `Button`, `MenuNav` (klavye), `ValueBar`, `label()`, `addBackdrop()`
  - `systems/textures.ts`: kodla üretilen dokular (`TEX.px`, `TEX.dot`, `TEX.ring`, `TEX.soft`)
- Dosya varlıkları: `src/art/`, `src/sounds/` altına koy, `src/assets.ts`'de **import edip** yükle. ZIP sürümünde hepsi HTML'e gömülür. `public/` klasöründen yükleme ZIP'te çalışmaz; dinamik `import()` da tek dosyalık derlemeyi bozar.
- Jam araçları: `scripts/jam-lib.mjs` (saatler, kategoriler), `scripts/durum.mjs`, `scripts/beyan.mjs`, `.claude/hooks/guard.mjs` (dondurma, push kilidi, commit öncesi beyan), `.claude/hooks/ai-log.mjs` (AI kaydı).

## Doğrulama

- Değişiklikten sonra `npm run check`. Görsel değişiklikte ekran görüntüsü al ve hatalara bak.
- Yayın ve ZIP sürümünde `window.game` yok; onları `npm run smoke` ile test et. Varsayılan hedef `dist-single/index.html`.
- Claude masaüstü uygulamasının tarayıcı paneli gizliyken `requestAnimationFrame` durur ve oyun ilerlemez. Geliştirme sunucusunda döngüyü elle sür: `setInterval(() => game.step(performance.now(), 1000 / 60), 1000 / 60)`. Panel görünürken tarayıcının kendi döngüsü de çalışır ve oyun iki kat hızlanır.
- Ekran görüntüsü almak birkaç saniye sürer; kısa animasyonları görmek için sahneyi `game.scene.pause(key)` ile dondur.
- Test aracının tuş basışları bas-bırak'ı aynı anda gönderir; fare tekerleği olayları sayfaya ulaşmaz (tuvale `WheelEvent` gönder).

## Çalışma düzeni

- Küçük ve sık commit; her commit derlenebilir olsun. Commit mesajları Türkçe; son satırda modeli belirten `Co-Authored-By: Claude ... <noreply@anthropic.com>`.
- Kapsamı dar tut: önce oynanabilir çekirdek döngü (gri kutularla), sonra seçilen paketlerin görselleri ve sesleri, en son cila.
- Arayüz metinleri Türkçe.
