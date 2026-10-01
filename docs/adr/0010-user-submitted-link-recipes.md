# Zgłoszenia użytkowników publikują przepisy linkowe po ręcznej akceptacji

Status: accepted

Appetyt przyjmuje od zalogowanych kont użytkowników publiczne linki jako osobne zgłoszenia przepisu. Worker pobiera z publicznej strony tytuł, autora źródła, główny obraz i sygnały potwierdzające, że strona jest przepisem; te dane nie są publikowane bez decyzji admina. Admin może poprawić tytuł i autora, wybrać kandydata obrazu albo dodać obraz ręcznie, po czym zatwierdzenie atomowo tworzy w oficjalnym katalogu przepis linkowy z etykietą pochodzenia użytkownikowego, pustymi składnikami/krokami/kosztami i działającymi ocenami.

Automatyczna kontrola służy do oznaczania problemów, nie do ostatecznej moderacji treści. Techniczne blokady bezpieczeństwa (np. niedozwolony schemat, adres prywatny lub przekroczony limit pobierania) są wykonywane przed pobraniem; podejrzenie treści dorosłej, dziwnej albo nieprzepisowej wymaga ręcznej decyzji admina. Publikujemy własny zoptymalizowany asset okładki, a `source_url` prowadzi do oryginalnej strony.

Po usunięciu konta zatwierdzone zgłoszenie i opublikowany przepis pozostają w katalogu, ale tracą powiązanie ze zgłaszającym. Niezaakceptowane zgłoszenia mogą zostać usunięte razem z danymi konta.

## Konsekwencje

- `Recipe` musi rozróżniać zwykły przepis od przepisu linkowego i przechowywać autora źródła oraz własną okładkę bez tworzenia sztucznego rekordu `Creator`.
- Publiczne odpowiedzi muszą informować o pochodzeniu wpisu i jego zewnętrznym charakterze; puste `ingredients`, `steps` i `costs` są prawidłowym stanem.
- Akceptacja musi być idempotentna i jedyną drogą utworzenia publicznego wpisu ze zgłoszenia.
- Oceny korzystają z istniejącego `recipe_id`; usunięcie konta zachowuje zatwierdzone dane katalogowe, ale anonimizuje zgłaszającego.
