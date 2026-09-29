# Logowanie pozostaje aktywne do wylogowania

## Decyzja

Po pomyślnym logowaniu przez Google sesja użytkownika pozostaje aktywna bez wymuszania cyklicznego logowania. Użytkownik pozostaje zalogowany do chwili wylogowania albo unieważnienia sesji z powodów bezpieczeństwa.

## Powód

Najważniejsza jest wygoda korzystania z aplikacji. Logowanie ma działać podobnie jak w Spotify: jednorazowe zalogowanie wystarcza do normalnego korzystania z konta.

## Konsekwencja

Sesja musi być możliwa do unieważnienia po stronie backendu. Trwałość sesji nie oznacza bezterminowej ważności skradzionego poświadczenia. Mechanizm musi używać bezpiecznego ciasteczka niedostępnego dla JavaScriptu i obsługiwać wylogowanie.
