# CLAUDE.md

Prompt Engineers takımının CIVIL GAME JAM 2026 oyunu. Kodu Claude yazıyor; takım yönlendiriyor, test ediyor ve sunumu yapıyor. Kullanıcıyla Türkçe konuş.

## Jam kuralları (ihlal = diskalifiye)

Tam metin: https://game.ktimo.com.tr/kurallar

- Oyuna özgü her şey **16 Ekim 2026 18.00 (UTC+3) sonrasında** yazılır. Öncesinde yalnızca genel altyapı.
- Son teslim **18 Ekim 2026 18.00**; geç teslim yok. Plan: Pazar 12.00'de özellik dondurma, 14.00 civarı ilk teslim.
- Repo **public** kalmalı. Teslimde tam commit kimliği verilir; oynanan sürüm o commit'ten derlenmiş olmalı.
- Oyun ve video bağlantıları **hesapsız** açılmalı (GitHub Pages bunu sağlıyor).
- **Her hazır kaynak** (görsel, ses, font, kütüphane) beyan edilir: `src/data/credits.ts` + README tablosu. Lisansı belirsiz kaynak kullanma; yeniden dağıtımı yasak dosyayı repoya koyma.
- Yapay zekâ kullanımı README'de ve oyundaki Emeği Geçenler ekranında beyan edilir; doğru ve eksiksiz tut.
- Son teslimden sonra `main`'e push yok: yayın otomatik olduğu için oynanan sürüm değişir.

## Komutlar

- `npm run dev`: geliştirme sunucusu, http://localhost:5173 (yayında adrese `?dev` eklemek de dev menüsünü açar)
- `npm run check`: tip denetimi; her değişiklikten sonra çalıştır
- `npm run build`: tip denetimi + `dist/`
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
- Dosya varlıkları: `public/assets/` + `src/assets.ts`.

## Doğrulama

- Değişiklikten sonra `npm run check`. Görsel değişiklikte oyunu tarayıcıda açıp ekran görüntüsü al ve konsol hatalarına bak.
- Claude masaüstü uygulamasının tarayıcı paneli gizliyken `requestAnimationFrame` durur ve oyun ilerlemez. Testte döngüyü elle sür:
  `setInterval(() => game.step(performance.now(), 1000 / 60), 1000 / 60)` (`window.game` yalnızca dev sunucusunda var).
- Ekran görüntüsü almak birkaç saniye sürer; kısa animasyonları görmek için sahneyi `game.scene.pause(key)` ile dondur.
- Test aracının tuş basışları bas-bırak'ı aynı anda gönderir; fare tekerleği olayları sayfaya ulaşmaz (tuvale `WheelEvent` gönder).

## Çalışma düzeni

- Küçük ve sık commit; her commit derlenebilir olsun.
- Kapsamı dar tut: önce oynanabilir çekirdek döngü, sonra içerik, en son cila.
- Arayüz metinleri Türkçe.
