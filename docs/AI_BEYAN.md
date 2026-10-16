# Yapay zekâ beyanı (teslim formu için)

Bu dosya `npm run beyan` ile otomatik üretilir; elle düzenleme. Kaynak: `docs/ai-kayit.jsonl` (Claude Code kancasının
otomatik kaydı) ve `docs/ai-elle.json` (elle eklenenler). Teslim formunda her kategori için aşağıdakini seç ve açıklamayı yapıştır.

## Görsel: Kullanıldı

- **Araç:** Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5, Claude Sonnet 5.5)
- **Amaç:** Arayüz görsellerini (butonlar, menü efektleri, parçacıklar) kodla çizen kodu yazdı; Masa sahnesi belge yazıları, bina cephesi kat bandı ve vitrin çizimi (betikle düzenlendi)
- **Kullanıldığı yer:** Menüler, arayüz ve efektler (jam öncesi şablon), src/desk/documents.ts, src/desk/tiles.ts, src/desk/StampTray.ts, src/desk/props.ts, src/desk/ (11 dosya)

## Ses: Kullanıldı

- **Araç:** Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5)
- **Amaç:** Ses efektlerini ve müziği kodla üreten sentezleyiciyi ve ses ayarlarını yazdı
- **Kullanıldığı yer:** Ses efektleri ve müzik altyapısı (jam öncesi şablon)

## Kod: Kullanıldı

- **Araç:** Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5, Claude Sonnet 5.5)
- **Amaç:** Oyunun kodunu yazdı; Gün dosyası dengesi, masa sınırı, kart boyutu, duman testi bayrakları (betikle düzenlendi); İnceleme modu ve kural kitabı (G3): Bash/Python betiğiyle yapılan kod düzenlemeleri
- **Kullanıldığı yer:** Jam öncesi şablonun bütün kodu, src/game/, src/desk/DocumentCard.ts, src/scenes/, src/ui/, scripts/smoke.mjs, src/scenes/GameScene.ts, src/game/rules.ts, src/game/session.ts, src/desk/documents.ts, src/desk/StampTray.ts, src/game/ (4 dosya), src/scenes/GameScene.ts, scripts/smoke.mjs

## Metin: Kullanıldı

- **Araç:** Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5)
- **Amaç:** Arayüz metinlerini, README'yi ve BENIOKU'yu yazdı
- **Kullanıldığı yer:** Menü ve ayar yazıları, README, BENIOKU

## Diğer: Kullanıldı

- **Araç:** Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5)
- **Amaç:** Tema yorumu için konsept seçenekleri önerdi; seçim ve özgün dokunuş takımın
- **Kullanıldığı yer:** Oyun fikri aşaması
