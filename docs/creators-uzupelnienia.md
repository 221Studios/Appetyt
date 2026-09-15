# Uzupełnienie rejestru twórców (później)

Seed ma 200 wierszy, ale **używalnych źródeł jest mniej**.
To nie blokuje parsera Schema.org. Wracamy tu, żeby realnie dociągnąć do 200.

## Zła tożsamość (wymiana)

- `joanna_krupa` — modelka, nie szef kuchni
- `pod_mikroskopem` — nauka / zdrowie / dieta, nie przepisy
- `nipongos` — brak publicznego kanału kulinarnego

## Handle YouTube nie istnieje

Zostawić URL, znaleźć prawdziwy kanał albo zmienić źródło:

- `rolnik_w_kuchni` `@Rolnikwkuchni`
- `michel_moran` `@MichelMoranOfficial`
- `tomasz_jakubiak` `@tomaszjakubiak`
- `krupniczek` `@Krupniczek`
- `szort_ciastko` `@SzortCiastko`
- `w_15_minut` `@W15Minut`

## Strona nie jest zbiorem przepisów

Parser poziomu 1 ich nie rusza. Trzeba innego URL albo YouTube:

- `maciej_je` — vlogi / restauracje
- `alice_waters` (`chezpanisse.com`) — menu restauracji
- `nobu_matsuhisa` — sieć lokali
- `ferran_adria` — fundacja
- `ming_tsai` (`ming.com`) — sklep
- `rene_redzepi` (`noma.dk`) — restauracja, nie blog

## Brak handle (samo youtube.com)

43 twórców bez kanału. Nazwisko może być OK, źródła nie ma.
Lista ID: `data/creators_gaps.json`.
