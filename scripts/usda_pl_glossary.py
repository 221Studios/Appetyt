"""Normalize USDA English so EN→PL machine translation stays edible."""

# Longer phrases first.
PREPROCESS = (
    ("broilers or fryers", "broiler chicken"),
    ("broiler or fryers", "broiler chicken"),
    ("separable lean and fat", "lean and fat"),
    ("separable lean only", "lean only"),
    ('trimmed to 0" fat', "no external fat"),
    ("trimmed to 0 inch fat", "no external fat"),
    ('trimmed to 1/8" fat', "trimmed to 3 mm fat"),
    ("all-purpose", "universal"),
    ("self-rising", "self raising"),
    ("Babyfood", "Baby food"),
    ("babyfood", "baby food"),
    ("commercial", "store-bought"),
    ("Includes foods for USDA's Food Distribution Program", ""),
    ('(Includes foods for USDA\'s Food Distribution Program)', ""),
)

POSTPROCESS = (
    ("frytkownice", "brojlery"),
    ("Frytkownice", "Brojlery"),
    ("wszystkożerna", "uniwersalna"),
    ("Wszystkożerna", "Uniwersalna"),
    ("komercyjny", "sklepowy"),
    ("Komercyjny", "Sklepowy"),
    ("sklep - kupiony", "sklepowy"),
    ("sklep-kupiony", "sklepowy"),
    ("Sklep - kupiony", "sklepowy"),
)


def prepare_english(name: str) -> str:
    text = name
    for src, dst in PREPROCESS:
        text = text.replace(src, dst)
    text = " ".join(text.split())
    text = text.replace(" ,", ",").strip(" ,")
    return text


def polish_cleanup(name: str) -> str:
    text = name
    for src, dst in POSTPROCESS:
        text = text.replace(src, dst)
    text = " ".join(text.split()).strip(" ,")
    if text:
        text = text[0].upper() + text[1:]
    return text
