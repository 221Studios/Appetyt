# Appetyt

Aplikacja z przepisami: kalorie ze składnika USDA, koszt z katalogu sklepowego.

## Language

**Składnik**:
Pozycja z USDA (fdc_id): ogólna żywność do liczenia kcal, np. mąka pszenna.
_Avoid_: produkt, SKU, artykuł

**Produkt sklepowy**:
Konkretna paczka w jednym sklepie: nazwa, opakowanie, cena.
_Avoid_: składnik, food, item

**Katalog sklepu**:
Osobny plik SQLite jednego sklepu (Frisco, Auchan albo Carrefour). Nie miesza się z innymi sklepami ani z bazą USDA.
_Avoid_: wspólna baza cen, tabela z kolumną store

**Koszt zużycia**:
Ułamek ceny opakowania za ilość użytą w przepisie.
_Avoid_: cena przepisu, koszt porcji (dopóki nie liczysz na porcję)

**Koszt koszyka**:
Suma pełnych opakowań, które trzeba kupić, żeby ugotować przepis.
_Avoid_: koszt zużycia, cena jednostkowa

**Twórca**:
Osoba, od której bierzemy przepis (kanał / blog). Ma jedno źródło pierwotne.
_Avoid_: influencer (jako rekord w bazie), kanał, autor bloga

**Źródło pierwotne**:
Gdzie najłatwiej wyciągnąć przepis maszynowo: strona (Schema.org/Recipe), opis filmu YouTube, albo transkrypcja.
_Avoid_: platforma, social media, źródło danych (ogólnie)

**Przepis**:
Ustrukturyzowane składniki z ilościami, czas, skrócone kroki operacyjne + link do oryginału. Tabela `recipes` w `data/recipes.sqlite`.
_Avoid_: post, wideo, artykuł

**Linia składnika**:
Tekst z przepisu z ilością, np. „250 g piersi z kurczaka”, mapowany na `ingredient_id`.
_Avoid_: produkt sklepowy, SKU

**Instrukcja operacyjna**:
Skrócony krok gotowania zapisany w aplikacji. Nie jest kopią literackiego opisu twórcy.
_Avoid_: treść przepisu, opis z bloga

**Przepis app-ready**:
Przepis w runtime API z zmapowanymi składnikami, policzonym kcal/makro oraz kosztami sklepowymi (zużycie + koszyk). Bez tego nie budujemy UI.
_Avoid_: surowy wiersz z crawla, „wygląda jak przepis” tylko po liczbie składników
