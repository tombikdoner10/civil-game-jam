# Yapay zekâ beyanı (teslim formu için)

Bu dosya `npm run beyan` ile otomatik üretilir; elle düzenleme. Kaynak: `docs/ai-kayit.jsonl` (Claude Code kancasının
otomatik kaydı), `docs/ai-elle.json` (elle eklenenler) ve `docs/ai-ozet.json` (okunur özet, elle yazılır).

## Teslim formu için (özet)

Teslim formunda her kategori için aşağıdakini seç ve açıklamayı yapıştır. Oyundaki Emeği Geçenler ekranı ve README de bu özeti gösterir.

### Görsel: Kullanıldı

- **Araç:** Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5, Claude Sonnet 5.5)
- **Amaç:** Oyundaki görselleri kodla, piksel piksel çizen kodu yazdı: arayüz ve menü, masa ve belgeler, gişedeki kişilerin portreleri, kaşeler, bina cephesi ayrıntıları, sokak, deprem hasarı ve efektler. Bina ve sokak karoları hazır paketten gelir (Hazır kaynaklar bölümü).
- **Kullanıldığı yer:** Menü sokağı ve bütün arayüz: düğmeler, kâğıt paneller, arka plan, parçacık ve ekran efektleri; Masa: belgeler (yazılar, ada/parsel satırları, imzalar, elle düzeltme izleri), kaşeler ve kaşelik, yönetmelik klasörü, kural notları, inceleme modu, masa eşyaları; Gişe: kişi portreleri, konuşma balonu, zarf ve çekmece, SOR/İSTE düğmeleri, getirilen raporlar; Sokak: bina cephesi ayrıntıları (kat bandı, vitrin), bina etiketleri, deprem çatlakları ve sıva dökülmesi; Saha testi (kolon yakın planı), deprem, gün sonu, gazete ve sonuç ekranları

### Ses: Kullanıldı

- **Araç:** Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5)
- **Amaç:** Ses efektlerini ve müziği kodla üreten sentezleyiciyi, deprem gürlemesini kodla üreten sesi ve ses ayarlarını yazdı. Hazır paketteki Kenney seslerinin hız, perde ve katman ayarlarını yaptı.
- **Kullanıldığı yer:** Arayüz ve oyun ses efektleri, müzik altyapısı; Deprem gürlemesi; Kenney seslerinin çalınışı (hız, perde, katman); Ses düzeyi ayarları

### Kod: Kullanıldı

- **Araç:** Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5, Claude Sonnet 5.5)
- **Amaç:** Oyunun bütün kodunu yazdı (jam öncesi hazırlanan şablon dahil): oynanış ve kurallar, belgeler ve gişe diyaloğu, deprem, gün sonu, gazete ve sonuç ekranları, menüler, ses bağlantıları. Ayrıca oyunun dengesini ve kararların adil sonuçlanmasını denetleyen bir araç ile otomatik ekran testi aracını yazdı.
- **Kullanıldığı yer:** Oyunun tamamı: menü, masa, gişe, sokak, saha testi, deprem, gün sonu, gazete, sonuç, ayarlar, duraklatma; Geliştirme araçları: denge denetimi ve otomatik test (oyunda görünmez)

### Metin: Kullanıldı

- **Araç:** Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5)
- **Amaç:** Arayüz metinlerini, README'yi, BENIOKU'yu, ses listesini ve beyan açıklamalarını yazdı. Gişe diyalogları, zarf ve rapor satırları, kural metinleri, gazete ve deprem anlatımı için yer tutucu metinler yazdı; gişedeki kişiler için beş mizaçta (kibar, sinirli, telaşlı, kurnaz, çekingen) taslak cümleler yazdı (selam, bekleme, sabırsızlık, SOR / İSTE cevapları, zarf ve damga tepkileri); takım bunları düzeltecek ve yeniden yazacak.
- **Kullanıldığı yer:** Menü, ayarlar, oyun içi ipuçları ve göstergeler; Gişe diyalogları: beş mizaçlı taslak cümleler (selam, bekleme, sabırsızlık, SOR, İSTE, zarf ve damga tepkileri; taslak, takım düzeltecek), zarf ve rapor satırları, yönetmelik kuralları (yer tutucu); Gazete, küçük deprem şeridi, kısa yol sorusu ve çerçeve cümlesi (yer tutucu); Emeği Geçenler, README, BENIOKU

### Diğer: Kullanıldı

- **Araç:** Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5, Claude Sonnet 5.5)
- **Amaç:** Tema yorumu için konsept seçenekleri önerdi, Kenney seslerinden ölçüme dayalı adaylar seçti, hazır kaynak beyanını ve ses listesini yazdı; konsept seçimi, son ses seçimi ve kararlar takımın. Geliştirme sürecini görevlere bölüp yönetti, oyunu otomatik oynayarak test etti ve jam ölçütlerine göre değerlendirip öneriler sundu.
- **Kullanıldığı yer:** Oyun fikri aşaması; Ses seçimi ve hazır kaynak beyanı (Emeği Geçenler, README); Geliştirme, test ve değerlendirme süreci (oyunda doğrudan yer almaz)

## Ayrıntılı kayıt

Kancanın ve elle eklenen kayıtların tam dökümü; özet bunların hepsini kapsar.

### Görsel: Kullanıldı

- **Araç:** Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5, Claude Sonnet 5.5)
- **Amaç:** Arayüz görsellerini (butonlar, menü efektleri, parçacıklar) kodla çizen kodu yazdı; Masa sahnesi belge yazıları, bina cephesi kat bandı ve vitrin çizimi (betikle düzenlendi); G4b: sokakta deprem çatlağı ve sıva dökülmesi çizimi (betikle düzenleme); G17 gişedeki kişinin kodla çizilen piksel portresi, konuşma balonu, zarf ve çekmece, SOR/İSTE düğmeleri ve getirilen rapor kartı (Bash betiğiyle düzenlendi); G17b belgelerde ada/parsel satırları, kodla piksel imza, daksil + mavi kalem elle düzeltme çizimi (Python değiştirme betiğiyle düzenlendi)
- **Kullanıldığı yer:** Menüler, arayüz ve efektler (jam öncesi şablon), src/desk/documents.ts, src/desk/tiles.ts, src/desk/StampTray.ts, src/desk/props.ts, src/desk/tiles.ts (hasarCiz), src/desk/Portre.ts, Konusma.ts, Zarf.ts, Window.ts, Inspect.ts, documents.ts, RuleBook.ts, src/desk/documents.ts (ruhsat, vaziyet planı, karot, zemin etüdü, getirilen belgeler), src/desk/ (21 dosya), src/scenes/ (5 dosya), src/ui/ (2 dosya)

### Ses: Kullanıldı

- **Araç:** Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5)
- **Amaç:** Ses efektlerini ve müziği kodla üreten sentezleyiciyi ve ses ayarlarını yazdı; Deprem gürlemesinin tabanını kodla üreten döngü (kahverengi gürültü, filtre, dalgalanma) ve Kenney ses dosyalarının hız/perde/katman ayarları; G32: Kenney Music Jingles havuzundaki jingle'ların süre ve perde ölçümü, seçim (Bash betiği, headless tarayıcı)
- **Kullanıldığı yer:** Ses efektleri ve müzik altyapısı (jam öncesi şablon), Küçük deprem sesi (src/audio/sfx.ts, src/audio/sesler.ts), src/sounds/kenney/music-jingles/ (PIZZI01, PIZZI02, PIZZI03), docs/SESLER.md, src/audio/ (2 dosya)

### Kod: Kullanıldı

- **Araç:** Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5, Claude Sonnet 5.5)
- **Amaç:** Oyunun kodunu yazdı; Gün dosyası dengesi, masa sınırı, kart boyutu, duman testi bayrakları (betikle düzenlendi); İnceleme modu ve kural kitabı (G3): Bash/Python betiğiyle yapılan kod düzenlemeleri; G4b: kalıcı sokak ve küçük deprem bağlantıları (betikle düzenleme); G12: Kenney seslerinin oyuna bağlanması, ses tablosu ve Yeniden Başla düzeltmesi (Python betiğiyle kod düzenlemesi); G5 büyük deprem, gazete ve sonuç ekranı: bazı düzenlemeler Claude'un Python/Bash betikleriyle yapıldı; G4c/G13: belge yerleşimi, sokak turu, fiş yeri, menü masa tarzı (bir kısmı sed ve küçük düzenleme betiğiyle yapıldı); G17 gişe diyaloğu: SOR, İSTE ve zarf mantığı, oturum kaydı, gün sonu/sonuç/gazete bağlantıları ve adalet denetimi (Bash betiğiyle düzenlendi); G17b belge hileleri: geçersiz belge kuralı, üretici, İSTE/SOR genişletmesi ve adalet denetimi (Python değiştirme betiğiyle düzenlendi); G18 kaşelik, yönetmelik klasörü ve gün 1 sadeliği: kod düzenlemelerinin bir kısmı Claude'un Python değiştirme betiğiyle yapıldı; G5b toplu düzeltmeler (küçük deprem etiketleri, klasör, inceleme, gün sonu, tarih paneli, gazete): kod düzenlemelerinin bir kısmı Claude'un Python değiştirme betiğiyle yapıldı; G23b düzeltmeleri (zarf satırı, kısa yol manşeti, Enter koruması, deprem soluklaştırma, etiket/fiş/saha paneli) Python betikleriyle kaynak dosyalara yazıldı; G24: açık klasörün saha notundan kaçması, gazete giriş koruması ve hazır göstergesi, saha süresi göstergesi, kısa yol ve küçük deprem metinlerinin bağlanması (Python betiğiyle düzenleme); G11: menü sokağı, ruhsat kâğıdı ve gün sonu düğmeleri; kâğıt, kenar karartma, sokak lambası ve gün sonu kodunun bir kısmı Python değiştirme betiğiyle düzenlendi; G11 eki: kısa yol açıklaması ve gazete künyesi metinlerinin bağlanması (Python değiştirme betiğiyle düzenleme); G32: gazete ve sonuç ekranı jingle'ları, jingle kesme (Bash içinden Python ile düzenlendi)
- **Kullanıldığı yer:** Jam öncesi şablonun bütün kodu, src/game/, src/desk/DocumentCard.ts, src/scenes/, src/ui/, scripts/smoke.mjs, src/scenes/GameScene.ts, src/game/rules.ts, src/game/session.ts, src/desk/documents.ts, src/desk/StampTray.ts, src/game/session.ts, rules.ts, tuning.ts, src/scenes/GameScene.ts, DayEndScene.ts, src/desk/Window.ts, src/audio/sfx.ts, src/audio/audio.ts, src/assets.ts, src/desk/ (Quake, Inspect, RuleBook, RuleNote, StampTray, DocumentCard), src/scenes/ (Game, Pause, DayEnd, Settings, Boot), src/main.ts, src/game/session.ts, src/desk/props.ts, src/scenes/DayEndScene.ts, GameScene.ts, MenuScene.ts, NewspaperScene.ts, ResultScene.ts, package.json, src/desk, src/scenes, src/ui, src/game/session.ts, rules.ts, building.ts, gazete.ts; src/scenes/GameScene.ts, DayEndScene.ts, ResultScene.ts, NewspaperScene.ts; scripts/adalet.mjs, src/game/{building,rules,kisi,session,days,tuning,ornek}.ts, src/scenes/GameScene.ts, src/desk/{Inspect,RuleBook,Street,yerlesim}.ts, scripts/adalet.mjs, src/scenes/GameScene.ts, src/desk/{Kaselik,Klasor,documents,props,yerlesim}.ts, src/game/days.ts, src/audio/sesler.ts, src/desk/{BinaEtiketi,Inspect,Kaselik,Klasor,Quake,Street,Window,documents}.ts, src/scenes/{Game,DayEnd,Newspaper,Quake,Result}Scene.ts, src/game/gazete.ts, README.md, docs/BENIOKU.txt, src/game, src/scenes, src/desk, scripts/adalet.mjs, src/desk/Klasor.ts, src/desk/props.ts, src/scenes/GameScene.ts, src/scenes/DayEndScene.ts, src/scenes/NewspaperScene.ts, src/ui/kagit.ts, src/ui/backdrop.ts, src/desk/Street.ts, src/scenes/DayEndScene.ts, src/game/gazete.ts, src/scenes/DayEndScene.ts, src/audio/sfx.ts, src/audio/sesler.ts, src/scenes/NewspaperScene.ts, src/scenes/ResultScene.ts, src/game/ (9 dosya), src/scenes/ (6 dosya), scripts/ (4 dosya), src/desk/yerlesim.ts, src/main.ts, src/data/credits.ts

### Metin: Kullanıldı

- **Araç:** Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5)
- **Amaç:** Arayüz metinlerini, README'yi ve BENIOKU'yu yazdı; G17 diyalog, zarf ve rapor kuralı yer tutucu metinleri (takım yeniden yazacak); G17b yer tutucu diyalog satırları ve kural metni (takım yazacak); G24: deprem dili yer tutucuları (küçük deprem şeridi ve rapor satırı, kısa yol sorusu, 'bir gece', çerçeve cümlesi), inceleme ipucu ve saha süresi yer tutucuları (Python betiğiyle düzenleme); G11: README, BENIOKU ve AI beyanı açıklamalarında küçük deprem ve soru biçimli kısa yol ifadeleri (Python betiğiyle düzenleme); G32 (T23): kısa yol açıklama satırı takımın verdiği metne göre değiştirildi (Bash içinden Python ile); BENIOKU ve README'deki kontrol listesini koddaki tuşlara göre tamamladı
- **Kullanıldığı yer:** Menü ve ayar yazıları, README, BENIOKU, src/game/diyalog.ts, src/game/gazete.ts, src/game/rules.ts (rapor kuralı), src/game/diyalog.ts (SOR: elle düzeltme, başka bina, imza; İSTE belge), src/game/rules.ts (geçersiz belge kuralı), src/game/gazete.ts, src/game/diyalog.ts, src/data/credits.ts, README.md, docs/BENIOKU.txt, docs/ai-elle.json, src/game/gazete.ts (KISA_YOL_ACIKLAMA), docs/BENIOKU.txt (teslim ZIP'i), README.md, docs/SESLER.md, src/game/ (3 dosya), README.md

### Diğer: Kullanıldı

- **Araç:** Claude (Anthropic), Claude Code üzerinden (Claude Opus 5.5, Claude Sonnet 5.5)
- **Amaç:** Tema yorumu için konsept seçenekleri önerdi; seçim ve özgün dokunuş takımın; Kenney ses dosyalarını ad, süre ve dalga biçimi ölçümüne göre aday olarak seçti (takım dinleyip değiştirecek); hazır kaynak beyanını ve ses listesini yazdı; Geliştirme sürecini yönetti: işi küçük görevlere böldü, sıraladı ve geliştirici ajanlara görev tanımı yazdı; takımın karar vereceği konular için seçenek hazırladı (kararları takım verdi); Oyunu görünmez tarayıcıda otomatik oynayıp test etti; ekran görüntüleriyle hata ve okunurluk sorunlarını raporladı (test oyuncusu ajanı); Oyunu jam puanlama ölçütlerine göre birkaç saatte bir değerlendirip cila ve anlaşılırlık önerileri sundu (eleştirmen ajanı); yaratıcı önerilerde kararı takım verdi
- **Kullanıldığı yer:** Oyun fikri aşaması, src/sounds/kenney/, docs/SESLER.md, README.md, src/data/credits.ts, Geliştirme süreci (GDD.md, TASKS.md, JOURNAL.md); oyunda doğrudan yer almaz, Test süreci (scripts/smoke.mjs ile); oyunda doğrudan yer almaz, Tasarım ve cila süreci; oyunda doğrudan yer almaz
