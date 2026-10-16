# Jam günlüğü

Proje hafızası: lider her döngü adımında bir satır ekler. `scripts/durum.mjs` aşağıdaki durum satırlarını okur; biçimlerini değiştirme.

## Durum

- Kontrol 1 (konsept seçimi): TAMAM (16 Ekim 19.26)
- Kontrol 2 (ara oyun testi): BEKLİYOR
- Kontrol 3 (son teslim): BEKLİYOR
- Son eleştirmen: YOK
- Kullanım düzeyi: normal

## Günlük

- 16 Ekim, tema öncesi: Jam sistemi hazırlandı (ajanlar, komutlar, kancalar, hafıza dosyaları). Oyuna özgü içerik yok.
- 14:51 · Döngü başladı (tema öncesi): dal güncel, açık PR yok, `npm run check` temiz, kullanım %0 · Oyuna özgü iş yok, saatlik uyanma · Sıradaki: 18.00'de tema, ardından `/konsept`
- 18:08 · Faz konsepte geçti, tema bekleniyor (Kontrol 1); kullanım %4 · Kullanıcıdan tema metni ve `/konsept` (xhigh) istendi · Sıradaki: konsept seçimi
- 18:09 · Tema geldi: "Afete hazırlık ve farkındalık"; GDD'ye aynen yazıldı · Kullanıcıdan `/konsept` (xhigh) bekleniyor · Sıradaki: Kontrol 1
- 19:26 · Karar: Konsept Yapı Denetçisi (Papers, Please tarzı masa oyunu; dosyadaki tutarsızlıkları yakala, damga vur, deprem günü sınar) · Neden: takım yaklaşık 90 seçenek arasından seçti; uzman rolü, masa/üstten görünüm, ciddi-gergin ton tercihine uyuyor, mekaniği deterministik ve 48 saate sığıyor, jürideki inşaat mühendislerine hitap ediyor · Sıradaki: G1 bina veri modeli
- 19:30 · Karar: Eleştirmeni ilk oynanabilir sürüme (G2–G3 sonrası) ertele · Neden: değerlendirecek oyun yok, kullanım boşa gider · Sıradaki: G1 geliştiricide
- 19:50 · G1 bitti (6cab272): bina modeli, kural motoru, tohumlu üretici; check temiz, determinizm doğrulandı · Karar: G1 için test-oyuncusu çağrılmadı · Neden: arayüzü yok, oyunda hiçbir yere bağlı değil · Sıradaki: G2 masa sahnesi
- 19:55 · 9a15eb0 push'landı, canlı smoke hatasız, son-saglam taşındı; G2 (masa sahnesi) geliştiricide · Sıradaki: G2 testi
- 19:52 · Karar: Geliştirici ajanı Opus 5.5 (medium) · Neden: takım istedi; tasarım kalitesi öncelik · Sıradaki: G2b
- 19:52 · Karar: Görsel yön Papers, Please; Tiny Town (solgun palete boyanmış) + kodla kâğıt/damga, fontlar Pixelify Sans + VT323 · Neden: takım istedi ve seçti; hazır kaynak ağırlıklı, AI yoğunluğu düşük · Sıradaki: G2b geliştiricide (G2 testi G2b ile birlikte)
