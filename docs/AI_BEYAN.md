# Yapay zekâ beyanı (teslim formu için)

Bu dosya `npm run beyan` ile otomatik üretilir; elle düzenleme. Kaynak: `docs/ai-kayit.jsonl` (Claude Code kancasının
otomatik kaydı) ve `docs/ai-elle.json` (elle eklenenler). Teslim formunda her kategori için aşağıdakini seç ve açıklamayı yapıştır.

## Görsel: Kullanıldı

- **Araç:** Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5, Claude Sonnet 5.5)
- **Amaç:** Arayüz görsellerini (butonlar, menü efektleri, parçacıklar) kodla çizen kodu yazdı; Masa sahnesi belge yazıları, bina cephesi kat bandı ve vitrin çizimi (betikle düzenlendi); G4b: sokakta deprem çatlağı ve sıva dökülmesi çizimi (betikle düzenleme)
- **Kullanıldığı yer:** Menüler, arayüz ve efektler (jam öncesi şablon), src/desk/documents.ts, src/desk/tiles.ts, src/desk/StampTray.ts, src/desk/props.ts, src/desk/tiles.ts (hasarCiz), src/desk/ (14 dosya), src/scenes/ (4 dosya)

## Ses: Kullanıldı

- **Araç:** Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5, Claude Sonnet 5.5)
- **Amaç:** Ses efektlerini ve müziği kodla üreten sentezleyiciyi ve ses ayarlarını yazdı; Deprem gürlemesinin tabanını kodla üreten döngü (kahverengi gürültü, filtre, dalgalanma) ve Kenney ses dosyalarının hız/perde/katman ayarları
- **Kullanıldığı yer:** Ses efektleri ve müzik altyapısı (jam öncesi şablon), Öncü sarsıntı sesi (src/audio/sfx.ts, src/audio/sesler.ts), src/audio/ (2 dosya)

## Kod: Kullanıldı

- **Araç:** Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5, Claude Sonnet 5.5)
- **Amaç:** Oyunun kodunu yazdı; Gün dosyası dengesi, masa sınırı, kart boyutu, duman testi bayrakları (betikle düzenlendi); İnceleme modu ve kural kitabı (G3): Bash/Python betiğiyle yapılan kod düzenlemeleri; G4b: kalıcı sokak ve öncü sarsıntı bağlantıları (betikle düzenleme); G12: Kenney seslerinin oyuna bağlanması, ses tablosu ve Yeniden Başla düzeltmesi (Python betiğiyle kod düzenlemesi); G5 büyük deprem, gazete ve sonuç ekranı: bazı düzenlemeler Claude'un Python/Bash betikleriyle yapıldı
- **Kullanıldığı yer:** Jam öncesi şablonun bütün kodu, src/game/, src/desk/DocumentCard.ts, src/scenes/, src/ui/, scripts/smoke.mjs, src/scenes/GameScene.ts, src/game/rules.ts, src/game/session.ts, src/desk/documents.ts, src/desk/StampTray.ts, src/game/session.ts, rules.ts, tuning.ts, src/scenes/GameScene.ts, DayEndScene.ts, src/desk/Window.ts, src/audio/sfx.ts, src/audio/audio.ts, src/assets.ts, src/desk/ (Quake, Inspect, RuleBook, RuleNote, StampTray, DocumentCard), src/scenes/ (Game, Pause, DayEnd, Settings, Boot), src/main.ts, src/game/session.ts, src/desk/props.ts, src/scenes/DayEndScene.ts, GameScene.ts, MenuScene.ts, NewspaperScene.ts, ResultScene.ts, package.json, src/game/ (7 dosya), src/scenes/ (2 dosya), scripts/ (2 dosya), src/desk/yerlesim.ts, src/main.ts

## Metin: Kullanıldı

- **Araç:** Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5, Claude Sonnet 5.5)
- **Amaç:** Arayüz metinlerini, README'yi ve BENIOKU'yu yazdı
- **Kullanıldığı yer:** Menü ve ayar yazıları, README, BENIOKU, docs/SESLER.md, src/game/gazete.ts

## Diğer: Kullanıldı

- **Araç:** Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5)
- **Amaç:** Tema yorumu için konsept seçenekleri önerdi; seçim ve özgün dokunuş takımın; Kenney ses dosyalarını ad, süre ve dalga biçimi ölçümüne göre aday olarak seçti (takım dinleyip değiştirecek); hazır kaynak beyanını ve ses listesini yazdı
- **Kullanıldığı yer:** Oyun fikri aşaması, src/sounds/kenney/, docs/SESLER.md, README.md, src/data/credits.ts
