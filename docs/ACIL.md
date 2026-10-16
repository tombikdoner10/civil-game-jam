# Acil durum planı

Jam sırasında bir şey ters giderse sırayla bunlara bak. Bütün saatler UTC+3.

## Bilgisayar bozuldu ya da açılmıyor

Kod GitHub'da: https://github.com/tombikdoner10/civil-game-jam. Kurallara göre bilgisayarlar alandan çıkarılamaz, ama alandaki başka bir takım üyesinin bilgisayarı kullanılabilir.

1. O bilgisayara Node.js (20.19+) ve Git kur.
2. `git clone https://github.com/tombikdoner10/civil-game-jam` → `cd civil-game-jam` → `npm ci`
3. Oyunu dene: `npm run dev`. Teslim ZIP'i: `npm run zip` (ZIP `teslim/` klasöründe).
4. Claude Code varsa o klasörde `/basla`. Yoksa teslim için `npm run zip` yeterli; form herhangi bir cihazdan doldurulabilir.
5. Son push'lanmamış işler bozuk bilgisayardaki `Desktop\Gamejam\yedekler\` klasöründe (en fazla 30 dakikalık kayıp). Disk okunabiliyorsa: `git clone <yedek>.bundle kurtarma`.

## Bir değişiklik oyunu bozdu

- Lider geri alır: `git revert --no-edit son-saglam..HEAD` (geçmiş silinmez), test, push. Canlı oyun birkaç dakikada son sağlam sürüme döner.
- Commit edilmemiş iş kaybolduysa: `npm run yedek -- --liste`, en yeni yedekten `git clone ../yedekler/<zaman>.bundle kurtarma`, ardından `git checkout yedek/<zaman>`.

## İnternet kesildi

- Telefon hotspot'una geç. Claude internetsiz çalışmaz, ama oyun yerelde derlenir: `npm run dev`, `npm run zip`.
- Push internet gelince yapılır; teslim formu için internet gerekir. 18.00'e yakınsa hotspot'tan teslim et.

## Claude kullanım sınırı doldu

- `CLAUDE.md`'deki %80 indirme sırası uygulanır. Sınır tamamen dolduysa takım elle devam eder: kalan işler `TASKS.md`'de, teslim adımları `docs/TESLIM.md`'de.

## Takımın ürettiği dosyalar

- Fotoğrafların ve ses kayıtlarının asıllarını telefonda ve bir bulut klasöründe (Drive vb.) de tutun. Oyuna eklenen kopyaları repoda ve yedeklerde.

## Teslim

- İlk teslimi Pazar 14.00 civarı yapın; sonra güncelleme gönderilebilir. Son başarılı teslim geçerlidir; başarısız bir güncelleme öncekini bozmaz.
- Teslim edilen ZIP, GitHub'da "Releases" altında ve `Desktop\Gamejam\teslim-yedek\` klasöründe saklanır.
