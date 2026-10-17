# Sesler

Oyundaki ses olayları ve çaldıkları Kenney dosyaları (hepsi CC0 1.0, hazır kaynak beyanı: README ve `src/data/credits.ts`). Dosyalar Claude tarafından adlarına, sürelerine ve dalga biçimi ölçümlerine (perde, alçak/yüksek frekans payı) bakılarak seçildi; **dinlenmedi**. Takım ara testte dinleyip değiştirir.

**Nasıl değiştirilir:** Havuzdaki (`../varliklar/<paket>/Audio/`) dosyayı `src/sounds/kenney/<paket>/` altına kopyala, `src/audio/sesler.ts`'de ilgili satırda dosya adını (uzantısız) değiştir. Kullanılmayan dosyayı klasörden sil (ZIP'e gömülmesin). `volume` düzey, `rate` hız ve perde (0.5 = bir oktav pes), `gecikme` saniye. Dosya yüklenemezse eski kodla üretilen ses (son sütun) çalar.

Kısaltmalar: **I** impact-sounds, **R** rpg-audio, **IF** interface-sounds, **U** ui-audio, **J** music-jingles.

| Olay (ad) | Nerede çalar | Dosya(lar) ve ayar | Alternatif adaylar |
|---|---|---|---|
| Kaşe belgeye vurur (`damga`) | `GameScene.damgala`, kaşe ruhsata inince; Ayarlar'da efekt düzeyi önizlemesi | I `impactPunch_heavy_000/001/002` (rate 0.85) + I `impactWood_heavy_000/001/002` (masa) | I `impactSoft_heavy_*`, I `impactPlate_heavy_001/003`, R `bookPlace1-3` (kâğıt katmanı) |
| İADE damgası (`iade`) | `GameScene.damgala`, İADE kaşesi inince (`damga` yerine) | I `impactPunch_heavy_000/001/002` (rate 1.05, daha hafif) + R `bookClose` (dosya kapanır, 0.08 sn sonra); yeni dosya yok | I `impactSoft_medium_*`, R `bookPlace1-3` |
| Belge gişeden kayar (`kagitKay`) | `GameScene.dosyaGetir`, `notGetir`; gün sonu raporu, gazete ve sonuç ekranı açılınca | R `bookFlip2`, `bookFlip3` (rate 1.1) | R `cloth2`, `cloth4`, IF `scratch_004/005` |
| Belgeyi tut (`kagitAl`) | `DocumentCard`, `RuleNote` (fareye basınca) | R `bookFlip3` (sessiz, rate 1.25) | R `handleSmallLeather`, R `cloth4` |
| Belgeyi bırak / belge masaya iner (`kagitBirak`) | `DocumentCard`, `RuleNote` (sürükleme bitince); son belge masaya inince | R `bookPlace1/2/3` (sessiz, rate 1.3) | R `dropLeather`, I `impactSoft_medium_*` |
| Belgeler toplanıp geri verilir (`kagitTopla`) | `GameScene.damgala` (dosya bitince) | R `bookClose` + R `bookFlip2/3` | R `bookPlace*`, R `cloth1` |
| Fiş düşer (`fis`) | `GameScene.damgala` (uyarı fişi) | R `bookFlip3` + R `bookPlace1/3` (rate 1.5, iniş anında) | R `dropLeather`, IF `drop_002/003` |
| Doğru karar (`dogru`) | fişle birlikte | IF `confirmation_001` (sessiz, rate 0.9) | IF `confirmation_004`, J `jingles_PIZZI08` |
| Yanlış karar uyarısı (`uyari`) | fişle birlikte | IF `error_005` (sessiz) | IF `error_006`, IF `error_008`, J `jingles_PIZZI09` |
| Yönetmelik klasörü açılır (`klasorAc`, G18) | `Klasor.ac` | R `metalLatch` (halkalar, rate 1.15) + R `bookOpen` | R `bookFlip3` |
| Yönetmelik klasörü kapanır (`klasorKapa`, G18) | `Klasor.kapa` | R `bookClose` + R `metalClick` (halka kilidi, rate 1.2) | R `bookPlace2` |
| Sekme değiştir (`sekme`, G18) | `Klasor` sol sayfadaki bölüm sekmeleri | R `bookFlip2` (rate 1.3) | R `bookFlip1`, U `click2` |
| Sayfa çevir (`sayfa`) | `Klasor` bölüm içi < > düğmeleri (bölüm sağ sayfaya sığmazsa) | R `bookFlip1` (baştaki 0.26 sn atlanır) | R `bookFlip2` |
| Kaşeyi al (`kaseAl`, G18) | `Kaselik`: kaşe raftan kalkar (tıklama ya da sürükleme) | I `impactWood_light_001` (rate 1.35, tiz tahta) | R `handleSmallLeather` (havuzda) |
| Istampaya bas (`istampa`, G18) | `Kaselik`: tek tıklamalı vuruşta kaşe ıstampaya dokunur | R `bookPlace2` (rate 0.7, keçeye boğuk "tok") | I `impactSoft_medium_*` (havuzda) |
| Kaşe yerine konur (`kaseKoy`, G18) | `Kaselik`: kaşe rafa döner; damga vurulamıyorsa kalkıp iner | I `impactWood_light_001` (rate 1.05) | I `impactWood_light_000/002` (havuzda) |
| Çekmece açılır (`tepsi`) | `Cekmece.ac` (zarf masaya gelince) | I `impactWood_light_001` (gecikmeli) | U `switch22`, R `creak3` |
| İnceleme modu açılır (`inceleAc`) | `Inspect.ac` (Space / İNCELE) | R `metalLatch` | U `switch16/18`, IF `switch_003` |
| İnceleme modu kapanır (`inceleKapa`) | `Inspect.kapa` (Esc / Space) | R `metalClick` | U `switch17`, IF `switch_004` |
| Alan seçimi (`sec`) | `Inspect.tikla` | U `click2` | IF `click_005`, U `click1`, IF `select_002` |
| Seçim bırak (`secBirak`) | `Inspect.tikla` (aynı alana ya da boşluğa) | IF `back_002` | IF `back_004` |
| Kusur bulundu (`kusur`) | `Inspect.degerlendir` | IF `bong_001` (rate 0.8) + I `impactPlate_heavy_001` | IF `switch_003`, J `jingles_HIT03`, I `impactPlate_heavy_003` |
| Tutarsızlık yok (`tutarsizlikYok`) | `Inspect.degerlendir` | IF `error_004` | IF `error_008`, IF `back_002` |
| Mal sahibi (portre) gelir/gider (`siluet`) | `GameScene.dosyaGetir`, dosya bitince | R `footstep00` + R `footstep03` (iki adım) | R `footstep01-09`, I `footstep_concrete_*` |
| Konuşma balonunda harf (`konus`, G17) | `Konusma` (gişedeki kişi konuşurken, iki harfte bir) | U `click2` (çok sessiz, rate 1.9, perde oynar) | U `click1`, IF `tick_001/002` |
| Zarf masaya kayar (`zarfKay`, G17) | `GameScene.zarfGetir` (SOR cevabı zarf olunca) | R `bookFlip2` (rate 0.85) | R `cloth2`, R `bookFlip1` |
| Zarf çekmeceye / çekmece kapanır (`zarfCekmece`, G17) | `Cekmece.kapa` (zarf kabul ya da ret) | R `bookPlace2` + I `impactWood_light_001` | R `handleCoins` (para sesi), R `doorClose_1` |
| Zarf gişeye geri verilir (`zarfRet`, G17) | `GameScene.zarfBirakildi` (ret) | R `bookFlip3` (rate 0.9) | R `cloth4` |
| Saha testi: çekiç vuruşu (`sahaVurus`, G19) | `SahaTesti.vur` (beton yüzeye her tıklama) | I `impactPlate_heavy_001` (rate 1.7, metal tık) + I `impactPunch_heavy_*` (rate 1.6, tok) | I `impactMetal_light_*`, I `impactPlate_light_*` (havuzda) |
| Saha testi: ibre tıkırtısı (`sahaIbre`, G19) | `SahaTesti.ibreGoster` (sürgü R değerine varınca) | R `metalClick` (rate 1.6) | U `click2`, IF `tick_001/002` (havuzda) |
| Saha testi: geçersiz okuma (`sahaGecersiz`, G19) | `SahaTesti.vur` (sıva ya da çatlak üstüne vuruş) | I `impactWood_light_001` (rate 0.7, kuru) + IF `error_004` (sessiz) | I `impactSoft_medium_*`, IF `error_006` (havuzda) |
| Öncü sarsıntı: gürleme | `Quake.oynat`, sarsıntı boyunca (zarfı izler; duraklatınca susar, bitince kapanır) | **Kodla üretilir** (`sfx.gurleme()`, kahverengi gürültü) | Havuzda uzun gürleme sesi yok |
| Öncü sarsıntı: derin vuruş (`depremVurus`) | başta, %22 ve %38'de; tepede ara sıra | I `impactSoft_heavy_003` (rate 0.4) + I `impactPunch_heavy_*` (rate 0.35) | I `impactPlank_medium_*` (rate 0.4) |
| Öncü sarsıntı: moloz (`moloz`) | tik başına olasılıkla, şiddetle artar | I `impactMining_000/002/004` (rate 0.85) | I `impactMining_001/003`, I `footstep_concrete_*` |
| Öncü sarsıntı: çatırtı (`catirti`) | tik başına olasılıkla | R `creak1`, `creak3`, I `impactPlank_medium_001/002` (rate 0.65) | R `creak2`, R `doorOpen_1` |
| Öncü sarsıntı: cam titremesi (`camTitreme`) | tik başına olasılıkla | I `impactGlass_light_000/002` (sessiz) | I `impactGlass_light_001/003/004` |
| Bina çatlar / ağır hasar (`hasar`) | `Quake`, binanın tepkisi | I `impactPlank_medium_001/002` (rate 0.6) + I `impactMining_*` | I `impactPlate_heavy_*` |
| Bina çöker (`cokus`, G5) | `Quake`, `cokme` açıksa | I `impactSoft_heavy_003` + I `impactMining_*` ×2 + I `impactGlass_heavy_000` | I `impactGlass_heavy_001/004` |
| Gün sonu, iyi gün (`gunIyi`) | `DayEndScene` (yanlış ve işlenmeyen dosya yoksa); müzik düzeyine bağlı | J `jingles_PIZZI10` (yükselen 4 nota) | J `jingles_SAX10`, J `jingles_PIZZI02`, J `jingles_STEEL10` |
| Gün sonu, kötü gün (`gunKotu`) | `DayEndScene` (diğer durumlar) | J `jingles_PIZZI07` (yarım tonla inen 4 nota) | J `jingles_SAX07`, J `jingles_PIZZI11`, J `jingles_PIZZI01` |
| Gazete açılır (`gazete`, G32) | `NewspaperScene`, gazete masaya inince (0,45 sn) bir kez, sonuçtan bağımsız; müzik düzeyine bağlı | J `jingles_PIZZI03` (1,15 sn; Do♯ ile Do arasında gidip gelir, Do'da kalır: çözülmeyen, bekleten, nötr) | J `jingles_PIZZI13` (Mi→Fa, 0,9 sn), J `jingles_PIZZI15` (Do→Fa, 0,8 sn), J `jingles_STEEL03` (aynı ezgi, 1,4 sn) |
| Sonuç, iyi (`sonucIyi`, G32) | `ResultScene`, değerlendirme şeridi belirince, değerlendirme `iyi` ise; müzik düzeyine bağlı | J `jingles_PIZZI02` (0,96 sn; Do'dan La♯'a tam tonlarla yükselen 6 nota; zafer değil, ölçülü) | J `jingles_STEEL02` (aynı ezgi, 1,4 sn), J `jingles_PIZZI10` (gün sonuyla aynı) |
| Sonuç, kötü (`sonucKotu`, G32) | `ResultScene`, değerlendirme `orta` ya da `kotu` ise (önceki `gunKotu` kuralı aynen) | J `jingles_PIZZI01` (1,0 sn; La♯'tan Do'ya tam tonlarla inen 6 nota; `sonucIyi`'nin aynası) | J `jingles_PIZZI14` (inen 5 nota, 0,9 sn), J `jingles_STEEL01` (yarım tonlarla inen, 1,4 sn) |
| Menü düğmesi (`confirm`) | bütün `Button`'lar, Gate tıklaması, gün sonu "Sonraki gün" | U `click1` | U `click3`, ui-pack `click-a` |
| Düğme üzerine gelme (`hover`) | `Button` | U `rollover2` (sessiz) | U `rollover5` |
| Geri (`back`) | "Ana Menü" düğmesi | IF `back_003` | IF `back_001` |
| Duraklatma açılır, ayar önizlemesi (`click`) | `PauseScene`, `SettingsScene` | U `click2` | IF `click_001` |

**Jingle'lar (G32):** Havuzdaki 85 jingle'ın hepsi 0,4–1,7 sn; 2 sn'yi aşan yok. Gün sonuyla aynı aile (Pizzicato) seçildi: Steel (çelik davul) ve Sax daha neşeli ya da komik, 8-Bit ve Hit oyunbaz. Seçim ad, süre ve 30 ms'lik perde izine (otokorelasyon) göre yapıldı, **dinlenmedi**. Müzik kanalındaki jingle'lar üst üste binmez: yenisi başlayınca eskisi 0,12 sn'de söner; gazete ve sonuç ekranı kapanınca `sfx.jingleSustur()` çalanı keser (masa ve deprem sessiz kalır). Ayarlarda müzik düzeyi 0 ise çalmaz.

Kodla üretilen (değişmeyen) sesler: açılış ekranındaki yazı tıkırtısı (`type`), ayarlardaki kaydırıcı sesi, deprem gürlemesinin tabanı.

**Ses gücü:** `Quake.oynat(..., { sesGucu })` verilmezse `siddet / 2.5` kullanılır (öncü = 1). Daha büyük değer gürlemeyi yükseltir, moloz ve çatırtıyı sıklaştırır, vuruşları güçlendirir. Büyük deprem (G5, `QuakeScene`) `TUNING.buyukDeprem.sesGucu` = 2 ile çalar; aynı efektler (`depremVurus`, `moloz`, `catirti`, `camTitreme`, `hasar`, `cokus`) kullanılır, yeni dosya eklenmedi. Gazete kâğıdı `kagitKay` + `kagitBirak`.

Toplam boyut: 45 dosya, yaklaşık 440 KB (ZIP'te HTML'e gömülü). Saha testi (G19) yeni dosya eklemedi; var olanları kullanır.
