# Oceny przepisów i anonimizacja po usunięciu konta

## Decyzja

Appetyt obsługuje oceny przepisów w skali całkowitej 1–10. Wystawienie, zmiana i usunięcie oceny wymaga aktywnej sesji zalogowanego konta użytkownika. Jedno konto ma jeden bieżący wynik dla danego przepisu; wszystkie sesje tego samego konta, w tym na komputerze i telefonie, widzą ten sam wynik.

Odczyt ocen jest publiczny. Publicznie udostępniamy wyłącznie agregat przepisu: średnią, liczbę ocen i rozkład wyników 1–10. Nie publikujemy listy kont, identyfikatorów użytkowników, tożsamości Google ani pojedynczych wierszy ocen.

Po usunięciu konta powiązanie ocen z tym kontem jest usuwane, ale oceny pozostają w agregacie jako anonimowe. Ocena przepisu nie jest tekstową recenzją; teksty, komentarze i moderacja są osobnym zakresem.

## Powód

Skala 1–10 odpowiada oczekiwanemu sposobowi oceniania przepisów i ogranicza zakres pierwszej wersji do mierzalnego sygnału jakości. Powiązanie z istniejącym kontem Google zapewnia spójność między urządzeniami bez przechowywania dodatkowych danych profilu.

Publiczny agregat pozwala korzystać z katalogu i ocen bez logowania, a ograniczenie zapisu do zalogowanych kont zmniejsza przypadkowe i masowe głosowanie. Brak publicznych wierszy ocen chroni prywatność. Zachowanie ocen po usunięciu konta zapobiega zmianie historycznego sygnału przepisu tylko dlatego, że osoba skorzystała z prawa do usunięcia konta.

## Konsekwencje

- Model ocen musi rozróżniać aktywną ocenę powiązaną z kontem i anonimową ocenę bez tego powiązania.
- Dla aktywnych kont obowiązuje unikat „konto + przepis”; po anonimizacji wiele ocen może nie mieć właściciela.
- Zapis musi walidować wyłącznie całkowite wartości 1–10 i nie może działać anonimowo.
- Publiczne odpowiedzi API nie mogą pozwalać na odtworzenie tożsamości oceniających.
- Późniejsze dodanie tekstowych recenzji wymaga osobnej decyzji o moderacji, zgłoszeniach, edycji i retencji.
