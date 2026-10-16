# CLAUDE.md

Prompt Engineers takımının CIVIL GAME JAM 2026 oyunu. Kodu Claude yazıyor; takım yönlendiriyor, test ediyor ve sunumu yapıyor. Kullanıcıyla Türkçe konuş.

## Jam kuralları (ihlal = diskalifiye)

Ayrıntılı özet: üst klasördeki `KURALLAR.md` (repoda yok; oturum `Gamejam` klasöründe açılınca otomatik yüklenir). Resmî metin: https://game.ktimo.com.tr/kurallar (kitapçık v09).

- Oyuna özgü her şey **16 Ekim 2026 18.00 (UTC+3) sonrasında** yazılır. Öncesinde yalnızca genel altyapı.
- Yeni teslim başlatmak için son an **18 Ekim 2026 18.00**. Plan: Pazar 12.00'de özellik dondurma, 14.00 civarı ilk teslim.
- Teslimde: **ZIP** (`npm run zip`; internetsiz çalışan tek dosya) + web bağlantısı + **en fazla 1 dakikalık MP4 video dosyası** + public repo bağlantısı.
- Repo **public** kalmalı. ZIP ve web sürümü repodaki bir commit'ten derlenmiş olmalı.
- Beyanlar **iki bölüm × beş kategori**: hazır kaynaklar ve AI; her birinde görsel, ses, kod, metin, diğer. Kaynak `src/data/credits.ts`, ayrıca README tabloları. En küçük kullanım bile yazılır. Lisansı belirsiz kaynak kullanma; yeniden dağıtımı yasak dosyayı repoya koyma.
- **Madde 4.3:** Yoğun AI kullanımı jürinin yaratıcılık ve görsel/sanatsal değerlendirmesini etkileyebilir. Takımın kendi çizimleri ve sesleri öncelikli; Claude kodu ve teknik işleri yapar.
- Sunum video dahil 3 dakika ve jüri o sırada oynuyor: oyun ilk 30 saniyede anlaşılmalı.
- Teslim ekranının 6 karakterli erişim kodunu asla bir alana yazma; dosyaya ya da repoya koyma.
- Son teslimden sonra `main`'e push yok: yayın otomatik olduğu için oynanan sürüm değişir.

## Komutlar

- `npm run dev`: geliştirme sunucusu, http://localhost:5173 (yayında adrese `?dev` eklemek de dev menüsünü açar)
- `npm run check`: tip denetimi; her değişiklikten sonra çalıştır
- `npm run build`: tip denetimi + `dist/` (web sürümü)
- `npm run zip`: tek dosyalık sürümü `dist-single/`e derler, teslim ZIP'ini `teslim/` altına yazar (`OYNA.html` + `docs/BENIOKU.txt`)
- `main`'e push → GitHub Actions → GitHub Pages. Derlenmeyen kodu push'lama.

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

## Doğrulama

- Değişiklikten sonra `npm run check`. Görsel değişiklikte oyunu tarayıcıda açıp ekran görüntüsü al ve konsol hatalarına bak.
- `npm run smoke [adres-ya-da-dosya]`: görünmez Edge'de oyunu açar, açılışa ve "Oyna"ya tıklar, `teslim/smoke/` altına ekran görüntüsü alır ve sayfa hatalarını yazar. Varsayılan hedef `dist-single/index.html` (ZIP sürümü); canlı site için `npm run smoke https://tombikdoner10.github.io/civil-game-jam/`. Yayın sürümünde `window.game` olmadığı için yayın/ZIP testi bununla yapılır.
- Claude masaüstü uygulamasının tarayıcı paneli gizliyken `requestAnimationFrame` durur ve oyun ilerlemez. Testte döngüyü elle sür:
  `setInterval(() => game.step(performance.now(), 1000 / 60), 1000 / 60)` (`window.game` yalnızca dev sunucusunda var).
- Ekran görüntüsü almak birkaç saniye sürer; kısa animasyonları görmek için sahneyi `game.scene.pause(key)` ile dondur.
- Test aracının tuş basışları bas-bırak'ı aynı anda gönderir; fare tekerleği olayları sayfaya ulaşmaz (tuvale `WheelEvent` gönder).

## Çalışma düzeni

- Küçük ve sık commit; her commit derlenebilir olsun.
- Kapsamı dar tut: önce oynanabilir çekirdek döngü, sonra içerik, en son cila.
- Arayüz metinleri Türkçe.
