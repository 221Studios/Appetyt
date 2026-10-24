# Polityka bezpieczeństwa

## Zgłaszanie podatności

Nie zgłaszaj podatności ani danych umożliwiających ich wykorzystanie w publicznym issue.

Preferowany kanał to prywatny raport przez [GitHub Security Advisories](https://github.com/n3xus47/Appetyt/security/advisories/new). Jeśli ten formularz nie jest dostępny, skontaktuj się prywatnie z właścicielem repozytorium przez dane kontaktowe na jego profilu GitHub i zaznacz, że wiadomość dotyczy bezpieczeństwa Appetyt.

Raport powinien zawierać:

- opis podatności i jej wpływu,
- minimalne kroki reprodukcji lub proof of concept,
- wersję, commit albo konfigurację, której dotyczy,
- proponowany sposób naprawy, jeśli jest znany.

Potwierdzimy odbiór, zweryfikujemy zgłoszenie i uzgodnimy bezpieczny sposób publikacji poprawki. Nie publikuj szczegółów przed zakończeniem koordynowanego ujawnienia.

## Zakres

Wsparciem bezpieczeństwa objęta jest bieżąca gałąź `main`. Sekrety i dane uwierzytelniające należy zawsze przechowywać poza repozytorium, w lokalnym `.env` albo w systemie sekretów środowiska wdrożeniowego.
