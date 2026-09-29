# Użytkownik może usunąć konto

## Decyzja

Użytkownik może usunąć swoje konto. Operacja usuwa konto oraz wszystkie jego aktywne sesje. Zasady retencji lub anonimizacji przyszłych recenzji po usunięciu konta będą osobną decyzją przed wdrożeniem recenzji.

## Powód

Minimalny model danych powinien mieć pełną drogę wyjścia. Użytkownik nie powinien potrzebować kontaktu z administratorem, aby usunąć techniczne powiązanie z Google i zakończyć korzystanie z konta.

## Konsekwencja

Usuwanie musi być idempotentne, wymagać potwierdzenia zalogowanego użytkownika i unieważniać wszystkie sesje. Implementacja nie może po cichu pozostawiać danych konta tylko dlatego, że funkcja recenzji zostanie dodana później.
