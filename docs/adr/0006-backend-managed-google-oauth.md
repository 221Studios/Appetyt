# Backend prowadzi logowanie Google

## Decyzja

Webowe logowanie Google prowadzi backend przez OAuth 2.0 Authorization Code z PKCE. Backend obsługuje `state` i `nonce`, waliduje odpowiedź Google oraz tworzy sesję użytkownika w Appetyt. Tokeny Google nie są przechowywane ani udostępniane kodowi JavaScript aplikacji.

## Powód

Ten wariant ogranicza powierzchnię ataku po stronie klienta i skupia weryfikację tożsamości oraz reguły sesji w jednym module backendu. Jest też zgodny z decyzją o minimalnym koncie: backend może wykorzystać wyłącznie stabilny identyfikator Google, bez zapisywania danych profilu.

## Konsekwencja

Implementacja musi wymuszać ścisłą listę redirect URI, sprawdzać issuer, audience, czas ważności i nonce, chronić callback przed CSRF przez `state`, a sesję wystawiać w bezpiecznym ciasteczku `HttpOnly`. Samo użycie OAuth bez tych kontroli nie spełnia tej decyzji.
