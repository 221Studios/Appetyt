# Pierwsza wersja kont działa w webie

## Decyzja

Pierwsza wersja logowania przez Google obejmuje klienta webowego działającego w przeglądarce oraz backend API. Aplikacja Android nie jest częścią pierwszego przepływu logowania.

## Powód

Webowy OAuth może użyć jednego przekierowania i sesji przeglądarkowej. Obsługa Androida wymaga dodatkowo natywnego otwierania przeglądarki systemowej, deep linku/app linku i osobnego testowania powrotu do aplikacji. Dodanie tych elementów przed ustabilizowaniem modelu kont zwiększyłoby zakres bez wartości potrzebnej do pierwszego działającego logowania.

## Konsekwencja

Backend powinien wystawić interfejs, który później będzie można wykorzystać także z klienta mobilnego, ale pierwsza implementacja i test manualny dotyczą wyłącznie webu.
