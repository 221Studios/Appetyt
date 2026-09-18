# Ingest maksymalizuje kompletność; stary crawl idzie do archiwum

Wyciąganie ze **źródła pierwotnego** (publiczna strona) używa kolejno wszystkich dostępnych warstw (HTML, structured data na stronie, headless przeglądarka itd.) — liczy się wynik (jak najwięcej **przepisów kompletnych**), nie koszt ani prostota. Przy re-ingescie twórcy istniejące wiersze trafiają do osobnego archiwum (`data/archive/…`); kanoniczny korpus budujemy od zera. Odrzucone: Schema.org-only, repair in-place na zanieczyszczonym crawlu.
