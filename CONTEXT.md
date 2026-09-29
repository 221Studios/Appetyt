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
Publiczna strona twórcy (to, co widać w przeglądarce bez konta i paywalla). YouTube / opis / transkrypt to osobna, późniejsza ścieżka — nie zastępuje katalogu www.
_Avoid_: platforma, social media, agregator, Schema.org (jako jedyne źródło prawdy)

**Przepis**:
Jednostka korpusu: składniki z ilościami, czas, kroki i link do oryginału. W snapshotcie kroki są wiernością źródła; w runtime API — instrukcje operacyjne.
_Avoid_: post, wideo, artykuł

**Linia składnika**:
Tekst z przepisu z ilością, np. „250 g piersi z kurczaka”, mapowany na `ingredient_id` (USDA), a do wyceny — na produkt sklepowy.
_Avoid_: produkt sklepowy, SKU

**Kroki źródłowe**:
Pełna treść kroków jak u twórcy, przechowywana w snapshotcie jako wierność crawl’a. Nie jest tym, co publikujemy użytkownikowi końcowemu.
_Avoid_: instrukcja operacyjna, treść API

**Instrukcja operacyjna**:
Skrócony krok gotowania w runtime API. Powstaje lekką przeróbką kroków źródłowych; nie jest surową kopią prozy twórcy.
_Avoid_: kroki źródłowe, opis z bloga

**Substytut sklepowy**:
Zatwierdzone mapowanie „brakującego” produktu (np. marka US) na konkretny produkt w katalogu PL, żeby domknąć pełną wycenę.
_Avoid_: składnik, luźne „podobne”, domysł bez wpisu w słowniku

**Przepis kompletny**:
Snapshot spełniający łącznie: wszystkie linie jak w źródle, kroki źródłowe 1:1, każda linia → USDA, co najmniej jeden sklep z produktem (lub substytutem) na każdą linię (pełny koszt zużycia + koszyk). Paywall / login = poza zakresem.
_Avoid_: przepis app-ready, „prawie zmapowany”, surowy crawl

**Przepis app-ready**:
Przepis kompletny przeniesiony do runtime API: instrukcje operacyjne, kcal/makro, koszty sklepowe. UI dopiero gdy taki katalog istnieje w API — nie mylić z domykaniem całego korpusu ~50k w snapshotcie.
_Avoid_: surowy wiersz z crawla, przepis kompletny (to wcześniejszy etap)

**Konto użytkownika**:
Tożsamość osoby, która może korzystać z funkcji wymagających zalogowania, a docelowo wystawiać recenzje. Konto przechowuje tylko minimum potrzebne do rozpoznania tej osoby; nie jest profilem społecznym.
_Avoid_: profil użytkownika, konto Google jako pełny zestaw danych

**Tożsamość logowania**:
Zewnętrzna tożsamość użyta do potwierdzenia, że osoba wraca do tego samego konta. W Appetyt pochodzi z Google i służy do połączenia logowania z kontem użytkownika; nie oznacza pobierania ani publikowania danych profilu Google.
_Avoid_: e-mail użytkownika, nazwa wyświetlana, profil Google

**Sesja użytkownika**:
Stan potwierdzający, że użytkownik jest zalogowany i może korzystać z funkcji konta. Sesja trwa do wylogowania użytkownika albo jej unieważnienia z powodów bezpieczeństwa; nie jest profilem użytkownika.
_Avoid_: tożsamość logowania, konto użytkownika, dane profilu

**Logowanie Google**:
Sposób potwierdzenia tożsamości logowania użytkownika przez Google. Google jest dostawcą potwierdzenia tożsamości, a nie właścicielem konta użytkownika ani magazynem profilu w Appetyt.
_Avoid_: profil Google, konto Google jako konto Appetyt

**Sesja urządzenia**:
Pojedyncza aktywna sesja użytkownika w konkretnej przeglądarce lub na konkretnym urządzeniu. Użytkownik może mieć wiele sesji urządzeń i unieważnić jedną albo wszystkie.
_Avoid_: konto użytkownika, tożsamość logowania, jedna globalna sesja

**Usunięcie konta**:
Jednoznaczne zakończenie konta użytkownika na jego żądanie, razem z aktywnymi sesjami i danymi należącymi wyłącznie do tego konta. Przyszłe zasady dotyczące recenzji po usunięciu konta wymagają osobnej decyzji.
_Avoid_: wylogowanie, odłączenie logowania Google, dezaktywacja bez usunięcia
