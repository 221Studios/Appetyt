# Open Food Facts — daleki etap, nie MVP

**Status: odłożone. Nie implementować teraz.**

To nie jest zadanie na MVP ani na następną iterację. Wracamy tu dopiero gdy aplikacja z przepisami i bazą USDA już działa u użytkowników.

## Po co w ogóle (kiedyś)

USDA = składniki ogólne (jajko, mąka, pierś z kurczaka).  
Open Food Facts = konkretne produkty ze sklepu (kod kreskowy, marka, etykieta).

Przydatne dopiero gdy użytkownik skanuje EAN albo wybiera konkretny sos / bulion z półki.

## Czego nie robić

- Nie mieszać OFF z tabelą `ingredients`.
- Nie zaciągać masowo przez ich API (blokują). Duża kopia = zrzut z [world.openfoodfacts.org/data](https://world.openfoodfacts.org/data).
- Nie traktować OFF jako listy składników do gotowania.

## Gdy przyjdzie czas

Osobna tabela produktów (EAN, id OFF, nazwa, kcal/makro na 100 g).  
Przepis dalej stoi na `fdc_id`. OFF tylko gdy jest konkretna paczka.  
## Polskie gotowce i produkty sklepowe

Na etapie Frisco mapujemy tylko **składniki do gotowania** (mąka, jajka, schab…) do USDA.  
Świadomie pomijamy: polskie gotowce, sosy w słoiku, wędliny niszowe, słodycze, chemia, karma, amerykańskie pozycje USDA typu Pillsbury.

**Potem:** znaleźć te polskie produkty sklepowe (EAN z Frisco/Auchan/Carrefour) i spiąć z Open Food Facts — kcal/marka z etykiety, nie z USDA.  
Nie wciskać ich na siłę w `ingredients`.

Przykłady do odzyskania później: passata, keczup smakowy, zapiekanki, musy, mleka smakowe, karma (jeśli w ogóle w apce).
