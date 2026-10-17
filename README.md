# OYUN ADI

**Prompt Engineers** takımının [CIVIL GAME JAM 2026](https://game.ktimo.com.tr/) için geliştirdiği oyun.

> Bu repo şu anda jam öncesinde hazırlanan **genel şablonu** içeriyor. Oyunun kendisi tema açıklandıktan sonra (16 Ekim 2026, 18.00) geliştirilecek.

## Oyna

- **Web:** https://tombikdoner10.github.io/civil-game-jam/ (kurulum ya da hesap gerekmez)
- **İndirilebilir sürüm:** Teslim ZIP'ini çıkar ve `OYNA.html` dosyasına çift tıkla; internet gerekmez.

## Oyun hakkında

_Tema açıklandıktan sonra yazılacak._

## Çalıştırma talimatları

- **Platform ve gereksinimler:** Windows bilgisayarda Chrome, Edge ya da Firefox'un güncel sürümü. Ek yazılım gerekmez.
- **Başlatma:** Web bağlantısını aç ya da ZIP'i çıkarıp `OYNA.html`'e çift tıkla. Ardından ekrana bir kez tıkla; tarayıcılar ilk tıklamaya kadar sesi açmaz.
- **Oynanış:** Her dosyada belgeleri karşılaştır, tutarsızlığı inceleme modunda bul ve kaşeyle karar ver (GÜVENLİ / GÜÇLENDİR / BOŞALT / İADE). Gün 1 kısa sürer ve küçük bir depremle biter; gün sonu raporundaki "[Büyük deprem bu gece olsaydı?]" düğmesi (Enter ya da D) kararlarının sonucunu hemen gösterir.
- **Bilinen sorunlar:** Yok.

### Kontroller

| Girdi | Eylem |
|---|---|
| Fare: belgeyi sürükle | Belgeyi masada taşı |
| Fare: kaşeye tıkla | Kaşe ruhsata vurulur (kararı verir); kaşe ruhsata sürüklenip bırakılabilir de |
| 1 / 2 / 3 / 4 | GÜVENLİ / GÜÇLENDİR / BOŞALT / İADE kaşesi (kaşe rafta varsa) |
| Space (ya da İNCELE düğmesi) | İnceleme modunu aç / kapa |
| İnceleme modunda iki alana tıkla | Tutarsızlığı işaretle (ör. ruhsattaki kat sayısı ile fotoğraf); etiketteki SOR ve İSTE gişedeki kişiye sorar |
| Fare: yönetmelik klasörüne tıkla | Klasörü aç; sekmeler bölümleri, X kapatır (gün 2'den) |
| Esc / P | Duraklat (inceleme modu açıksa önce onu kapatır) |
| Enter / Space | Gün sonu raporunda sonraki gün (gün 1 raporunda kısa yol); gazetede devam |
| N | Gün 1 sonu raporunda sonraki gün |
| D | Gün 1 sonu raporunda "[Büyük deprem bu gece olsaydı?]" (büyük depreme kısa yol) |
| ↑ ↓ (W S), Enter | Menülerde gezinme ve seçim |

### Kaynak koddan çalıştırma

Node.js 20.19 veya üstü gerekir.

```bash
npm install
npm run dev      # geliştirme sunucusu: http://localhost:5173
npm run build    # web sürümü: dist/
npm run zip      # teslim ZIP'i: teslim/ (tek dosyalık, internetsiz çalışan sürüm)
```

Menünün sağ alt köşesindeki "sürüm" yazısı, oyunun derlendiği Git commit'ini gösterir.

## Jam öncesi hazırlık beyanı

Kural 3.1 kapsamında, tema açıklanmadan önce yalnızca genel altyapı hazırlandı: menü ve ayar ekranları, sahne geçişleri, kodla üretilen ses efekti ve müzik sistemi, görsel efekt yardımcıları, klavye kontrolleri, otomatik yayın ve teslim ZIP'ini hazırlayan araç. Bu altyapıda oyuna özgü mekanik, içerik ya da görsel yoktur.

Tema açıklanmadan önceki son commit: _tema açıklanınca eklenecek_

## Hazır kaynak beyanı

| Kategori | Durum | Kaynak ve sağlayıcı | Bağlantı | Lisans | Kullanım ve değişiklik |
|---|---|---|---|---|---|
| Görsel | Kullanıldı | Tiny Town, Kenney (www.kenney.nl) | https://kenney.nl/assets/tiny-town | Creative Commons CC0 1.0 | Bina cepheleri ve sokak; renk paleti değiştirildi, karolardan cephe kuruldu (`src/art/tiny-town/`) |
| Ses | Kullanıldı | Impact Sounds, Kenney (www.kenney.nl) | https://kenney.nl/assets/impact-sounds | Creative Commons CC0 1.0 | Kaşenin belgeye vurması, kaşeyi alma ve yerine koyma, çekmece, kusur bulundu sesi ve depremin vuruş, moloz, çatırtı, cam titremesi ve bina hasarı sesleri; çoğu yavaşlatıldı (hız ve perde değiştirildi), bazıları katmanlandı (`src/sounds/kenney/impact-sounds/`) |
| Ses | Kullanıldı | RPG Audio, Kenney (www.kenney.nl) | https://kenney.nl/assets/rpg-audio | Creative Commons CC0 1.0 | Kâğıt ve belge sesleri (kayma, alma, bırakma, toplama, fiş), yönetmelik klasörü aç/kapa, sekme ve sayfa çevirme, ıstampa, inceleme modu aç/kapa, gişede ayak sesleri, sarsıntıda gıcırtı; hız ve perde değiştirildi, baştaki sessizlik atlandı (`src/sounds/kenney/rpg-audio/`) |
| Ses | Kullanıldı | Interface Sounds, Kenney (www.kenney.nl) | https://kenney.nl/assets/interface-sounds | Creative Commons CC0 1.0 | Menüde geri sesi, inceleme modunda seçim bırakma, kusur bulundu, "tutarsızlık yok", doğru ve yanlış karar uyarısı; hız ve perde hafifçe değiştirildi (`src/sounds/kenney/interface-sounds/`) |
| Ses | Kullanıldı | UI Audio, Kenney (www.kenney.nl) | https://kenney.nl/assets/ui-audio | Creative Commons CC0 1.0 | Menü düğmeleri (tık, üzerine gelme) ve inceleme modunda alan seçimi; değiştirilmedi (`src/sounds/kenney/ui-audio/`) |
| Ses | Kullanıldı | Music Jingles, Kenney (www.kenney.nl) | https://kenney.nl/assets/music-jingles | Creative Commons CC0 1.0 | Gün sonu raporu: iyi gün ve kötü gün jingle'ı (Pizzicato); değiştirilmedi (`src/sounds/kenney/music-jingles/`) |
| Kod | Kullanıldı | Phaser 3.90, Richard Davey / Phaser Studio Inc. | https://phaser.io | MIT | Oyun motoru, değiştirilmedi |
| Metin | Kullanılmadı | | | | |
| Diğer | Kullanıldı | Pixelify Sans yazı tipi, The Pixelify Sans Project Authors (Fontsource paketi) | https://fonts.google.com/specimen/Pixelify+Sans | SIL Open Font License 1.1 | Arayüz ve belge başlıkları yazı tipi, değiştirilmedi |
| Diğer | Kullanıldı | VT323 yazı tipi, The VT323 Project Authors (Fontsource paketi) | https://fonts.google.com/specimen/VT323 | SIL Open Font License 1.1 | Belge değerleri, saat ve paneller yazı tipi, değiştirilmedi |

- Repoda bulunmayan dosyalar: Phaser ve yazı tipleri `npm install` ile kurulur. Lisansları yeniden dağıtıma izin verir; ZIP sürümünün içine gömülüdürler.
- Yalnızca derlemede kullanılan, oyuna dahil olmayan araçlar: Vite (MIT), TypeScript (Apache-2.0), fflate (MIT, ZIP oluşturma).
- Ses efektlerinin çoğu Kenney ses paketlerinden gelir (yukarıdaki tablo; hangi dosyanın nerede çaldığı `docs/SESLER.md`). Deprem gürlemesinin tabanı ve yedek sesler kodla üretilir (`src/audio/sfx.ts`).

## Yapay zekâ beyanı

<!-- AI-BEYAN:BASLA -->
| Kategori | Durum | Araç | Amaç | Kullanıldığı yer |
|---|---|---|---|---|
| Görsel | Kullanıldı | Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5, Claude Sonnet 5.5) | Arayüz görsellerini (butonlar, menü efektleri, parçacıklar) kodla çizen kodu yazdı; Masa sahnesi belge yazıları, bina cephesi kat bandı ve vitrin çizimi (betikle düzenlendi); G4b: sokakta deprem çatlağı ve sıva dökülmesi çizimi (betikle düzenleme); G17 gişedeki kişinin kodla çizilen piksel portresi, konuşma balonu, zarf ve çekmece, SOR/İSTE düğmeleri ve getirilen rapor kartı (Bash betiğiyle düzenlendi); G17b belgelerde ada/parsel satırları, kodla piksel imza, daksil + mavi kalem elle düzeltme çizimi (Python değiştirme betiğiyle düzenlendi) | Menüler, arayüz ve efektler (jam öncesi şablon), src/desk/documents.ts, src/desk/tiles.ts, src/desk/StampTray.ts, src/desk/props.ts, src/desk/tiles.ts (hasarCiz), src/desk/Portre.ts, Konusma.ts, Zarf.ts, Window.ts, Inspect.ts, documents.ts, RuleBook.ts, src/desk/documents.ts (ruhsat, vaziyet planı, karot, zemin etüdü, getirilen belgeler), src/desk/ (21 dosya), src/scenes/ (5 dosya), src/ui/ (2 dosya) |
| Ses | Kullanıldı | Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5, Claude Sonnet 5.5) | Ses efektlerini ve müziği kodla üreten sentezleyiciyi ve ses ayarlarını yazdı; Deprem gürlemesinin tabanını kodla üreten döngü (kahverengi gürültü, filtre, dalgalanma) ve Kenney ses dosyalarının hız/perde/katman ayarları | Ses efektleri ve müzik altyapısı (jam öncesi şablon), Küçük deprem sesi (src/audio/sfx.ts, src/audio/sesler.ts), src/audio/ (2 dosya) |
| Kod | Kullanıldı | Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5, Claude Sonnet 5.5) | Oyunun kodunu yazdı; Gün dosyası dengesi, masa sınırı, kart boyutu, duman testi bayrakları (betikle düzenlendi); İnceleme modu ve kural kitabı (G3): Bash/Python betiğiyle yapılan kod düzenlemeleri; G4b: kalıcı sokak ve küçük deprem bağlantıları (betikle düzenleme); G12: Kenney seslerinin oyuna bağlanması, ses tablosu ve Yeniden Başla düzeltmesi (Python betiğiyle kod düzenlemesi); G5 büyük deprem, gazete ve sonuç ekranı: bazı düzenlemeler Claude'un Python/Bash betikleriyle yapıldı; G4c/G13: belge yerleşimi, sokak turu, fiş yeri, menü masa tarzı (bir kısmı sed ve küçük düzenleme betiğiyle yapıldı); G17 gişe diyaloğu: SOR, İSTE ve zarf mantığı, oturum kaydı, gün sonu/sonuç/gazete bağlantıları ve adalet denetimi (Bash betiğiyle düzenlendi); G17b belge hileleri: geçersiz belge kuralı, üretici, İSTE/SOR genişletmesi ve adalet denetimi (Python değiştirme betiğiyle düzenlendi); G18 kaşelik, yönetmelik klasörü ve gün 1 sadeliği: kod düzenlemelerinin bir kısmı Claude'un Python değiştirme betiğiyle yapıldı; G5b toplu düzeltmeler (küçük deprem etiketleri, klasör, inceleme, gün sonu, tarih paneli, gazete): kod düzenlemelerinin bir kısmı Claude'un Python değiştirme betiğiyle yapıldı; G23b düzeltmeleri (zarf satırı, kısa yol manşeti, Enter koruması, deprem soluklaştırma, etiket/fiş/saha paneli) Python betikleriyle kaynak dosyalara yazıldı; G24: açık klasörün saha notundan kaçması, gazete giriş koruması ve hazır göstergesi, saha süresi göstergesi, kısa yol ve küçük deprem metinlerinin bağlanması (Python betiğiyle düzenleme); G11: menü sokağı, ruhsat kâğıdı ve gün sonu düğmeleri; kâğıt, kenar karartma, sokak lambası ve gün sonu kodunun bir kısmı Python değiştirme betiğiyle düzenlendi; G11 eki: kısa yol açıklaması ve gazete künyesi metinlerinin bağlanması (Python değiştirme betiğiyle düzenleme) | Jam öncesi şablonun bütün kodu, src/game/, src/desk/DocumentCard.ts, src/scenes/, src/ui/, scripts/smoke.mjs, src/scenes/GameScene.ts, src/game/rules.ts, src/game/session.ts, src/desk/documents.ts, src/desk/StampTray.ts, src/game/session.ts, rules.ts, tuning.ts, src/scenes/GameScene.ts, DayEndScene.ts, src/desk/Window.ts, src/audio/sfx.ts, src/audio/audio.ts, src/assets.ts, src/desk/ (Quake, Inspect, RuleBook, RuleNote, StampTray, DocumentCard), src/scenes/ (Game, Pause, DayEnd, Settings, Boot), src/main.ts, src/game/session.ts, src/desk/props.ts, src/scenes/DayEndScene.ts, GameScene.ts, MenuScene.ts, NewspaperScene.ts, ResultScene.ts, package.json, src/desk, src/scenes, src/ui, src/game/session.ts, rules.ts, building.ts, gazete.ts; src/scenes/GameScene.ts, DayEndScene.ts, ResultScene.ts, NewspaperScene.ts; scripts/adalet.mjs, src/game/{building,rules,kisi,session,days,tuning,ornek}.ts, src/scenes/GameScene.ts, src/desk/{Inspect,RuleBook,Street,yerlesim}.ts, scripts/adalet.mjs, src/scenes/GameScene.ts, src/desk/{Kaselik,Klasor,documents,props,yerlesim}.ts, src/game/days.ts, src/audio/sesler.ts, src/desk/{BinaEtiketi,Inspect,Kaselik,Klasor,Quake,Street,Window,documents}.ts, src/scenes/{Game,DayEnd,Newspaper,Quake,Result}Scene.ts, src/game/gazete.ts, README.md, docs/BENIOKU.txt, src/game, src/scenes, src/desk, scripts/adalet.mjs, src/desk/Klasor.ts, src/desk/props.ts, src/scenes/GameScene.ts, src/scenes/DayEndScene.ts, src/scenes/NewspaperScene.ts, src/ui/kagit.ts, src/ui/backdrop.ts, src/desk/Street.ts, src/scenes/DayEndScene.ts, src/game/gazete.ts, src/scenes/DayEndScene.ts, src/game/ (9 dosya), src/scenes/ (5 dosya), scripts/ (2 dosya), src/desk/yerlesim.ts, src/main.ts |
| Metin | Kullanıldı | Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5, Claude Sonnet 5.5) | Arayüz metinlerini, README'yi ve BENIOKU'yu yazdı; G17 diyalog, zarf ve rapor kuralı yer tutucu metinleri (takım yeniden yazacak); G17b yer tutucu diyalog satırları ve kural metni (takım yazacak); G24: deprem dili yer tutucuları (küçük deprem şeridi ve rapor satırı, kısa yol sorusu, 'bir gece', çerçeve cümlesi), inceleme ipucu ve saha süresi yer tutucuları (Python betiğiyle düzenleme); G11: README, BENIOKU ve AI beyanı açıklamalarında küçük deprem ve soru biçimli kısa yol ifadeleri (Python betiğiyle düzenleme) | Menü ve ayar yazıları, README, BENIOKU, src/game/diyalog.ts, src/game/gazete.ts, src/game/rules.ts (rapor kuralı), src/game/diyalog.ts (SOR: elle düzeltme, başka bina, imza; İSTE belge), src/game/rules.ts (geçersiz belge kuralı), src/game/gazete.ts, src/game/diyalog.ts, src/data/credits.ts, README.md, docs/BENIOKU.txt, docs/ai-elle.json, docs/SESLER.md, src/game/ (2 dosya) |
| Diğer | Kullanıldı | Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5) | Tema yorumu için konsept seçenekleri önerdi; seçim ve özgün dokunuş takımın; Kenney ses dosyalarını ad, süre ve dalga biçimi ölçümüne göre aday olarak seçti (takım dinleyip değiştirecek); hazır kaynak beyanını ve ses listesini yazdı | Oyun fikri aşaması, src/sounds/kenney/, docs/SESLER.md, README.md, src/data/credits.ts |
<!-- AI-BEYAN:BITIR -->

Bu tablo `npm run beyan` ile otomatik üretilir: Claude Code'un yazdığı her dosya bir kancayla kategorisine göre `docs/ai-kayit.jsonl`'a kaydedilir, elle eklenenler `docs/ai-elle.json`'da durur. Teslim formu için hazır metin: `docs/AI_BEYAN.md`. Commit'lerdeki `Co-Authored-By: Claude` satırları da bu kullanımı gösterir.

## Takım

Prompt Engineers: _üye adları eklenecek_
