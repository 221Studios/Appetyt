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

Parser poziomu 1 ich nie rusza. YouTube: w opisach filmów często są linki do prawdziwych stron przepisów — te URL iść przez JSON-LD zanim parsować sam opis.

- `maciej_je` — vlogi / restauracje
- `alice_waters` (`chezpanisse.com`) — menu restauracji
- `nobu_matsuhisa` — sieć lokali
- `ferran_adria` — fundacja
- `ming_tsai` (`ming.com`) — sklep
- `rene_redzepi` (`noma.dk`) — restauracja, nie blog

## Agregatory (za duże na teraz)

- `smaker` — ~23k URL, cudze przepisy; pomijamy w crawlu

## Media / redakcje (nie szef, nie influ)

Poziom 1 ich nie priorytetyzuje:

- `epicurious`, `tasty`, `the_recipe_critic`, `serious_eats`

## Sitemap rozdęta

- `seonkyoung_longest` — tysiące URL, te same tytuły w kółko
- `po_prostu_pycha` — sitemap z tagami/stronami, pełny crawl 0 nowych JSON-LD
- `half_baked_harvest` — ~4,5k URL, plateau ~400 przepisów

## Brak Recipe JSON-LD (poziom 1 nic nie zapisze)

Crawler dopisuje ID do `data/creators_gaps.json` po próbce bez Schema.org Recipe.

- `bake_and_taste` — Blogspot, 668 URL, 0 Recipe schema
- `karol_okrasa` — `kuchnialidla.pl`, 680 URL, 0 Recipe schema w próbce
- `ewa_wachowicz` — 46 URL, 0 Recipe schema
- `mateusz_gessler` — restauracja, 76 URL, 0 Recipe schema

## Brak sitemapy

- `magda_gessler` — `magdagessler.pl`, 0 URL do crawla
- `daria_ladocha` — `darialadocha.pl`, 0 URL do crawla
- `andrzej_polan` — `andrzejpolan.pl`, 0 URL do crawla


## Brak handle (samo youtube.com)

43 twórców bez kanału. Nazwisko może być OK, źródła nie ma.
Lista ID: `data/creators_gaps.json`.
