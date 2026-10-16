# Sesler

Oyundaki ses olayları ve çaldıkları Kenney dosyaları (hepsi CC0 1.0, hazır kaynak beyanı: README ve `src/data/credits.ts`). Dosyalar Claude tarafından adlarına, sürelerine ve dalga biçimi ölçümlerine (perde, alçak/yüksek frekans payı) bakılarak seçildi; **dinlenmedi**. Takım ara testte dinleyip değiştirir.

**Nasıl değiştirilir:** Havuzdaki (`../varliklar/<paket>/Audio/`) dosyayı `src/sounds/kenney/<paket>/` altına kopyala, `src/audio/sesler.ts`'de ilgili satırda dosya adını (uzantısız) değiştir. Kullanılmayan dosyayı klasörden sil (ZIP'e gömülmesin). `volume` düzey, `rate` hız ve perde (0.5 = bir oktav pes), `gecikme` saniye. Dosya yüklenemezse eski kodla üretilen ses (son sütun) çalar.

Kısaltmalar: **I** impact-sounds, **R** rpg-audio, **IF** interface-sounds, **U** ui-audio, **J** music-jingles.

| Olay (ad) | Nerede çalar | Dosya(lar) ve ayar | Alternatif adaylar |
|---|---|---|---|
| Damga tokmağı (`damga`) | `GameScene.damgala`, tokmak inince; Ayarlar'da efekt düzeyi önizlemesi | I `impactPunch_heavy_000/001/002` (rate 0.85) + I `impactWood_heavy_000/001/002` (masa) | I `impactSoft_heavy_*`, I `impactPlate_heavy_001/003`, R `bookPlace1-3` (kâğıt katmanı) |
| İADE damgası (`iade`) | `GameScene.damgala`, İADE tokmağı inince (`damga` yerine) | I `impactPunch_heavy_000/001/002` (rate 1.05, daha hafif) + R `bookClose` (dosya kapanır, 0.08 sn sonra); yeni dosya yok | I `impactSoft_medium_*`, R `bookPlace1-3` |
| Belge gişeden kayar (`kagitKay`) | `GameScene.dosyaGetir`, `notGetir`; gün sonu raporu, gazete ve sonuç ekranı açılınca | R `bookFlip2`, `bookFlip3` (rate 1.1) | R `cloth2`, `cloth4`, IF `scratch_004/005` |
| Belgeyi tut (`kagitAl`) | `DocumentCard`, `RuleNote` (fareye basınca) | R `bookFlip3` (sessiz, rate 1.25) | R `handleSmallLeather`, R `cloth4` |
| Belgeyi bırak / belge masaya iner (`kagitBirak`) | `DocumentCard`, `RuleNote` (sürükleme bitince); son belge masaya inince | R `bookPlace1/2/3` (sessiz, rate 1.3) | R `dropLeather`, I `impactSoft_medium_*` |
| Belgeler toplanıp geri verilir (`kagitTopla`) | `GameScene.damgala` (dosya bitince) | R `bookClose` + R `bookFlip2/3` | R `bookPlace*`, R `cloth1` |
| Fiş düşer (`fis`) | `GameScene.damgala` (uyarı fişi) | R `bookFlip3` + R `bookPlace1/3` (rate 1.5, iniş anında) | R `dropLeather`, IF `drop_002/003` |
| Doğru karar (`dogru`) | fişle birlikte | IF `confirmation_001` (sessiz, rate 0.9) | IF `confirmation_004`, J `jingles_PIZZI08` |
| Yanlış karar uyarısı (`uyari`) | fişle birlikte | IF `error_005` (sessiz) | IF `error_006`, IF `error_008`, J `jingles_PIZZI09` |
| Kural kitabı açılır (`kitapAc`) | `RuleBook.ac` | R `bookOpen` (yükseltildi) + R `bookPlace3` | R `bookFlip3` |
| Kural kitabı kapanır (`kitapKapa`) | `RuleBook.kapa` | R `bookClose` | R `bookPlace2` |
| Sayfa çevir (`sayfa`) | `RuleBook` < > düğmeleri | R `bookFlip1` (baştaki 0.26 sn atlanır) | R `bookFlip2` |
| Damga çubuğu aç/kapa (`tepsi`) | `StampTray.ac` / `kapa` (Tab) | I `impactWood_light_001` (kayma bitince) | U `switch22`, R `creak3` |
| İnceleme modu açılır (`inceleAc`) | `Inspect.ac` (Space / İNCELE) | R `metalLatch` | U `switch16/18`, IF `switch_003` |
| İnceleme modu kapanır (`inceleKapa`) | `Inspect.kapa` (Esc / Space) | R `metalClick` | U `switch17`, IF `switch_004` |
| Alan seçimi (`sec`) | `Inspect.tikla` | U `click2` | IF `click_005`, U `click1`, IF `select_002` |
| Seçim bırak (`secBirak`) | `Inspect.tikla` (aynı alana ya da boşluğa) | IF `back_002` | IF `back_004` |
| Kusur bulundu (`kusur`) | `Inspect.degerlendir` | IF `bong_001` (rate 0.8) + I `impactPlate_heavy_001` | IF `switch_003`, J `jingles_HIT03`, I `impactPlate_heavy_003` |
| Tutarsızlık yok (`tutarsizlikYok`) | `Inspect.degerlendir` | IF `error_004` | IF `error_008`, IF `back_002` |
| Mal sahibi gelir/gider (`siluet`) | `GameScene.dosyaGetir`, dosya bitince | R `footstep00` + R `footstep03` (iki adım) | R `footstep01-09`, I `footstep_concrete_*` |
| Öncü sarsıntı: gürleme | `Quake.oynat`, sarsıntı boyunca (zarfı izler; duraklatınca susar, bitince kapanır) | **Kodla üretilir** (`sfx.gurleme()`, kahverengi gürültü) | Havuzda uzun gürleme sesi yok |
| Öncü sarsıntı: derin vuruş (`depremVurus`) | başta, %22 ve %38'de; tepede ara sıra | I `impactSoft_heavy_003` (rate 0.4) + I `impactPunch_heavy_*` (rate 0.35) | I `impactPlank_medium_*` (rate 0.4) |
| Öncü sarsıntı: moloz (`moloz`) | tik başına olasılıkla, şiddetle artar | I `impactMining_000/002/004` (rate 0.85) | I `impactMining_001/003`, I `footstep_concrete_*` |
| Öncü sarsıntı: çatırtı (`catirti`) | tik başına olasılıkla | R `creak1`, `creak3`, I `impactPlank_medium_001/002` (rate 0.65) | R `creak2`, R `doorOpen_1` |
| Öncü sarsıntı: cam titremesi (`camTitreme`) | tik başına olasılıkla | I `impactGlass_light_000/002` (sessiz) | I `impactGlass_light_001/003/004` |
| Bina çatlar / ağır hasar (`hasar`) | `Quake`, binanın tepkisi | I `impactPlank_medium_001/002` (rate 0.6) + I `impactMining_*` | I `impactPlate_heavy_*` |
| Bina çöker (`cokus`, G5) | `Quake`, `cokme` açıksa | I `impactSoft_heavy_003` + I `impactMining_*` ×2 + I `impactGlass_heavy_000` | I `impactGlass_heavy_001/004` |
| Gün sonu, iyi gün (`gunIyi`) | `DayEndScene` (yanlış ve işlenmeyen dosya yoksa); `ResultScene` (değerlendirme iyiyse); müzik düzeyine bağlı | J `jingles_PIZZI10` (yükselen 4 nota) | J `jingles_SAX10`, J `jingles_PIZZI02`, J `jingles_STEEL10` |
| Gün sonu, kötü gün (`gunKotu`) | `DayEndScene` (diğer durumlar); `ResultScene` (değerlendirme orta ya da kötüyse) | J `jingles_PIZZI07` (yarım tonla inen 4 nota) | J `jingles_SAX07`, J `jingles_PIZZI11`, J `jingles_PIZZI01` |
| Menü düğmesi (`confirm`) | bütün `Button`'lar, Gate tıklaması, gün sonu "Sonraki gün" | U `click1` | U `click3`, ui-pack `click-a` |
| Düğme üzerine gelme (`hover`) | `Button` | U `rollover2` (sessiz) | U `rollover5` |
| Geri (`back`) | "Ana Menü" düğmesi | IF `back_003` | IF `back_001` |
| Duraklatma açılır, ayar önizlemesi (`click`) | `PauseScene`, `SettingsScene` | U `click2` | IF `click_001` |

Kodla üretilen (değişmeyen) sesler: açılış ekranındaki yazı tıkırtısı (`type`), ayarlardaki kaydırıcı sesi, deprem gürlemesinin tabanı.

**Ses gücü:** `Quake.oynat(..., { sesGucu })` verilmezse `siddet / 2.5` kullanılır (öncü = 1). Daha büyük değer gürlemeyi yükseltir, moloz ve çatırtıyı sıklaştırır, vuruşları güçlendirir. Büyük deprem (G5, `QuakeScene`) `TUNING.buyukDeprem.sesGucu` = 2 ile çalar; aynı efektler (`depremVurus`, `moloz`, `catirti`, `camTitreme`, `hasar`, `cokus`) kullanılır, yeni dosya eklenmedi. Gazete kâğıdı `kagitKay` + `kagitBirak`.

Toplam boyut: 42 dosya, yaklaşık 390 KB (ZIP'te HTML'e gömülü).
