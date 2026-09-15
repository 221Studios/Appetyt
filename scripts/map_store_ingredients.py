"""Map store SKUs to USDA ingredients (fdc_id)."""

from __future__ import annotations

import re
import sqlite3
import unicodedata
from collections import defaultdict

STOP = {
    "w", "z", "i", "na", "do", "o", "od", "po", "dla", "typ", "bio", "eko",
    "the", "and", "or", "of", "with", "for", "in", "a", "an", "to",
    "szt", "kg", "ml", "g", "l", "op", "sztuk",
}

PL_EN: dict[str, tuple[str, ...]] = {
    "maka": ("flour", "wheat"),
    "pszenna": ("wheat",),
    "pszenny": ("wheat",),
    "zytnia": ("rye",),
    "zytni": ("rye",),
    "orkiszowa": ("spelt",),
    "kukurydziana": ("corn",),
    "jaglana": ("millet",),
    "ryzowa": ("rice",),
    "gryczana": ("buckwheat",),
    "jajka": ("egg",),
    "jaja": ("egg",),
    "jajko": ("egg",),
    "mleko": ("milk",),
    "maslo": ("butter",),
    "olej": ("oil",),
    "rzepakowy": ("canola",),
    "oliwa": ("olive", "oil"),
    "sol": ("salt",),
    "cukier": ("sugars", "sugar"),
    "cebula": ("onions", "onion"),
    "czosnek": ("garlic",),
    "marchew": ("carrots", "carrot"),
    "ziemniaki": ("potatoes", "potato"),
    "ziemniak": ("potatoes", "potato"),
    "pomidor": ("tomatoes", "tomato"),
    "pomidory": ("tomatoes", "tomato"),
    "ryz": ("rice",),
    "makaron": ("pasta",),
    "kurczak": ("chicken",),
    "kurczaka": ("chicken",),
    "piers": ("breast",),
    "filet": ("breast",),
    "wolowina": ("beef",),
    "banan": ("bananas", "banana"),
    "banany": ("bananas", "banana"),
    "jablko": ("apples", "apple"),
    "jablka": ("apples", "apple"),
    "ser": ("cheese",),
    "jogurt": ("yogurt",),
    "smietana": ("cream",),
    "chleb": ("bread",),
    "szynka": ("ham",),
    "boczek": ("bacon",),
    "indyk": ("turkey",),
    "wieprzowina": ("pork",),
    "schab": ("pork",),
    "tunczyk": ("tuna",),
    "ogorek": ("cucumber",),
    "szpinak": ("spinach",),
    "brokul": ("broccoli",),
    "cytryna": ("lemon", "lemons"),
    "miod": ("honey",),
    "kasza": ("buckwheat",),
    "owsiane": ("oats", "oat"),
    "twarog": ("cheese",),
    "ciecierzyca": ("chickpeas",),
    "soczewica": ("lentils",),
    "fasola": ("beans",),
    "majonez": ("mayonnaise",),
    "musztarda": ("mustard",),
}

PROCESSED = re.compile(
    r"mus |mus$|baton|smaku|nap[oó]j|jogurt|owsian|pianka|serek|kaszka|deser",
    re.I,
)

SKIP_PRODUCT = re.compile(
    r"udra[zż]n|toalet|zmywark|prania|"
    r"żwirek|zwirek|dla kota|dla psa|dla kotów|gryzoni|"
    r"niemowl|modyfikowan|"
    r"karma dla|karma mokra|"
    r"worki na|folia spożywcza|ręcznik papier|"
    r"mydł|szampon|prysznic|płyn do rąk|żel pod prysznic|zel pod prysznic",
    re.I,
)

USDA_PENALTY = re.compile(
    r"babyfood|baby food|industrial|fast foods|restaurant|"
    r"foods for usda|frozen, ready|microwaved",
    re.I,
)

STRONG = {"banana", "bananas", "egg", "salt", "garlic", "honey"}

# (required tokens, exclude substrings, fdc_id)
RULES: list[tuple[tuple[str, ...], tuple[str, ...], int]] = [
    (("maka", "pszenna"), ("graham", "orkisz", "zytni", "kukurydz", "jaglana", "kokos", "migdal", "ryzowa", "grycz", "makaron", "pelnoziarn", "razowa"), 168894),
    (("maka", "grahamka"), ("makaron",), 168893),
    (("maka", "graham"), ("makaron",), 168893),
    (("jaja",), ("kot", "pies", "niespodzian", "czekolad", "makaron", "likier"), 171287),
    (("jajka",), ("kot", "pies", "niespodzian", "czekolad", "makaron", "likier"), 171287),
    (("jajko",), ("kot", "pies", "niespodzian", "czekolad", "makaron", "likier"), 171287),
    (("mleko", "zageszczone"), ("kawowe",), 171275),
    (("mleko", "kokosowe"), ("szampon", "mydl", "napoj"), 170173),
    (("mleko", "owsiane"), ("szampon", "odzywka"), 2257046),
    (("mleko", "sojowe"), ("szampon", "deser"), 172446),
    (("mleko",), ("niemowl", "nastepn", "modyfikow", "smak", "czekolad", "wanili", "ciasteczk", "zageszcz", "skondens", "owsi", "soj", "migdal", "ryzow", "kokos"), 746782),
    (("maslo",), ("orzech", "klarow", "roslinn", "kakaow", "mydl", "zel"), 173410),
    (("cukier", "trzcinowy"), (), 168833),
    (("cukier",), ("puder", "wanili", "trzcino", "brazow", "ksylitol"), 746784),
    (("sol",), ("himalaj", "klodaw", "morska", "czosnek", "ziol"), 173468),
    (("olej", "rzepakowy"), (), 748278),
    (("oliwa",), ("mydl", "zel", "krem", "focac", "pieczyw", "chleb", "sos"), 171413),
    (("cebula",), ("szczypior", "dymka"), 170000),
    (("czosnek",), ("niedzwiedzi", "serek", "sos", "chleb", "bagiet", "pasta", "dip", "marynow", "granul", "mielony", "mlynek", "kostk", "przypraw"), 1104647),
    (("marchew",), ("sok", "chips"), 170393),
    (("banan",), ("chips", "susz", "smak", "mus", "baton", "jogurt", "serek", "owsian", "mleko", "pianka", "napoj", "sok", "smoothie", "zelki", "koktajl", "nektar", "chrup", "liofiliz", "miesiac", "kaszka", "biszkopt", "czekolad"), 173944),
    (("banany",), ("chips", "susz", "smak", "mus", "baton", "jogurt", "serek", "owsian", "mleko", "pianka", "napoj", "sok", "smoothie", "zelki", "koktajl", "nektar", "chrup", "liofiliz", "miesiac", "kaszka", "biszkopt", "czekolad"), 173944),
    (("jablka",), ("susz", "sok", "mus", "napoj", "smak", "miesiac", "kaszka", "biszkopt"), 171688),
    (("jablko",), ("susz", "sok", "mus", "napoj", "smak", "miesiac", "kaszka", "biszkopt"), 171688),
    (("kurczak", "filet"), ("mielon", "pasztet"), 171077),
    (("kurczaka", "filet"), ("mielon", "pasztet"), 171077),
    (("kurczak", "piers"), ("mielon", "pasztet"), 171077),
    (("kurczaka", "piers"), ("mielon", "pasztet"), 171077),
    (("ryz",), ("dziki", "mleko", "wafle", "ciastk", "napoj", "chips", "krakers"), 169756),
    (("makaron",), ("sos",), 169736),
    (("ziemniaki",), ("chips", "puree", "smaz", "frit"), 170026),
    (("ziemniak",), ("chips", "puree", "smaz", "frit"), 170026),
    (("pomidory",), ("sok", "keczup", "ketchup", "passat"), 170457),
    (("pomidor",), ("sok", "keczup", "ketchup", "passat", "koncentrat"), 170457),
    (("jogurt", "naturalny"), (), 171284),
    (("szpinak",), ("pierogi", "lazania", "sos"), 168462),
    (("maka", "zytnia"), ("makaron",), 168887),
    (("maka", "kukurydziana"), ("chips", "platki"), 169695),
    (("kasza", "gryczana"), ("wafle", "ekspand"), 170685),
    (("kasza", "jeczmienna"), (), 170284),
    (("platki", "owsiane"), ("baton", "ciastk", "musli"), 173904),
    (("twarog",), ("sernik", "ciasto"), 172179),
    (("smietana",), ("roslinn", "soj", "kokos", "do kawy"), 2346387),
    (("gouda",), ("plastry w sosie",), 171241),
    (("ser", "zolty"), ("topiony", "plesn", "salatk"), 171241),
    (("mielone", "wolow"), ("pasztet", "baton"), 2514744),
    (("mielone", "wolowe"), ("pasztet", "baton"), 2514744),
    (("mielona", "wolowina"), ("pasztet", "baton"), 2514744),
    (("wolowina", "mielon"), ("pasztet", "baton"), 2514744),
    (("schab",), ("parow", "kielbas", "konserw"), 168263),
    (("szynka",), ("pizza", "parow", "pasztet", "kanapka", "zapiekank"), 168295),
    (("boczek",), ("chips", "chrup"), 168277),
    (("indyk",), ("pasztet", "parow", "kabanos", "karma", "kot"), 171480),
    (("tunczyk",), ("pasta", "salatka gotow"), 334194),
    (("losos",), ("pasta", "kanapka", "pasztet", "karma", "kot"), 175167),
    (("mintaj",), ("paluszki", "panier"), 173725),
    (("ogorek",), ("kisz", "kwasz", "konserw", "marynow"), 2346406),
    (("ogorki",), ("kisz", "kwasz", "konserw", "marynow"), 2346406),
    (("salata",), ("sos",), 169248),
    (("brokul",), ("zupa", "sos"), 747447),
    (("kalafior",), ("zupa",), 2685573),
    (("kapusta", "kiszona"), (), 169279),
    (("kapusta",), ("kisz", "kwasz", "gołąbki", "golabki"), 169975),
    (("papryka", "mielona"), ("chips",), 171329),
    (("papryka",), ("mielona", "wedzona", "ostra", "chips"), 170108),
    (("cukinia",), (), 169291),
    (("pieczarki",), ("sos", "krem"), 169251),
    (("cytryna",), ("sok", "napoj", "herbata", "zelki", "lemoniad", "smak"), 167746),
    (("pomarancza",), ("sok", "napoj", "zelki"), 746771),
    (("pomarancze",), ("sok", "napoj", "zelki"), 746771),
    (("truskawki",), ("dzem", "jogurt", "sok", "lody", "mus", "smak"), 2346409),
    (("majonez",), (), 171009),
    (("musztarda",), (), 326698),
    (("ketchup",), (), 168556),
    (("keczup",), (), 168556),
    (("ocet", "balsamiczny"), (), 172241),
    (("ocet", "jablkowy"), (), 173469),
    (("ocet",), ("balsamic",), 172237),
    (("pieprz",), ("czerwony", "cayenne", "ziol", "mydl", "plynie", "zapas"), 170931),
    (("drozdze",), (), 175043),
    (("kakao",), ("napoj", "baton", "ciastk", "platki", "mydl", "plynie", "zapas"), 169593),
    (("olej", "slonecznikowy"), (), 1750349),
    (("chleb",), ("czosnk", "tost", "hamburger", "kanapka", "tarta", "kaszka", "slodk"), 174924),
    (("kefir",), ("smak",), 170904),
    (("maslanka",), (), 170874),
    (("groszek",), ("chips", "chrup", "ptasie"), 170419),
    (("kukurydza",), ("chips", "platki", "popcorn", "maka", "chleb"), 170409),
    (("fasola",), ("szparag",), 173744),
    (("ciecierzyca",), ("hummus",), 173756),
    (("soczewica",), (), 172420),
    (("pietruszka",), ("sos",), 170416),
    (("koperek",), ("sos", "sosik"), 172233),
    (("imbir",), ("piwo", "ale", "herbat"), 169231),
    (("smalec",), (), 171401),
    (("proszek", "pieczenia"), (), 172804),
    (("udko", "kurczak"), ("panier",), 173627),
    (("udka", "kurczak"), ("panier",), 173627),
    (("udko", "kurczaka"), ("panier",), 173627),
    (("udka", "kurczaka"), ("panier",), 173627),
    (("miod",), ("mydl", "szampon", "zel", "krem"), 169640),
    (("mozzarella",), ("sos", "pizza", "panier", "paluszki", "kanapka", "zapiek"), 329370),
    (("feta",), ("sos", "gotow"), 2259796),
    (("parmezan",), ("sos", "krakers"), 325036),
    (("parmigiano",), ("sos",), 325036),
    (("cheddar",), ("parow", "chips", "krakers", "sos", "kanapka"), 328637),
    (("ricotta",), ("sos", "pesto", "deser", "ciasto"), 746766),
    (("orzeszki", "ziemne"), ("ciescie", "smaku", "wasabi", "czekolad", "miodzie"), 172430),
    (("orzechy", "wloskie"), ("kabanos", "kielbas"), 2346394),
    (("migdaly",), ("mydl", "szampon", "mleko", "napoj", "czekolad", "baton"), 2346393),
    (("oliwki",), (), 169096),
    (("tofu",), ("deser", "sos"), 172448),
    (("kasza", "kuskus"), (), 169699),
    (("kuskus",), ("danie", "gotow"), 169699),
    (("kasza", "bulgur"), ("danie", "sos", "vermicelli"), 2710820),
    (("bulgur",), ("danie", "sos", "ryba"), 2710820),
    (("quinoa",), ("czekolad", "baton", "sloiczek"), 168874),
    (("komosa", "ryzowa"), ("sloiczek",), 168874),
    (("kasza", "jaglana"), (), 169702),
    (("kasza", "manna"), ("deser", "mleczny"), 169715),
    (("kasza", "peczak"), (), 170284),
    (("buraki",), ("sok", "kiszon", "karma", "kaszka"), 2685576),
    (("burak",), ("sok", "kiszon", "karma", "kaszka", "miesiac"), 2685576),
    (("seler", "naciowy"), (), 2346405),
    (("seler",), ("naciowy", "sok", "kiszon"), 170400),
    (("por",), ("karma", "import"), 2727584),
    (("rzodkiewka",), ("marynow", "kimchi"), 169276),
    (("rzodkiewki",), ("marynow",), 169276),
    (("szparagi",), ("zalewie", "konserw"), 168389),
    (("fasolka", "szparagowa"), (), 2346400),
    (("baklazan",), ("sos",), 2685577),
    (("bataty",), ("przypraw", "chips"), 168482),
    (("batat",), ("przypraw", "chips"), 168482),
    (("dynia",), ("pestki", "nasiona", "karma", "pies", "kot", "kaszka", "miesiac", "pierwsza"), 168448),
    (("kurkuma",), ("herbat", "napoj", "lody"), 172231),
    (("cynamon",), ("nalesnik", "owsian", "bulka", "ciast", "smak", "deser"), 171320),
    (("oregano",), ("sos", "pizza"), 171328),
    (("bazylia",), ("sos", "pesto", "pasta", "przecier", "pizza"), 171317),
    (("tymianek",), ("herbat",), 170938),
    (("rozmaryn",), ("grissini", "paluszki", "krakers", "chleb"), 171333),
    (("lisc", "laurowy"), (), 170917),
    (("dorsz",), ("grecku", "karma", "kot", "pies", "panier", "paluszki"), 171955),
    (("awokado",), ("pasta", "mydl", "krem", "sos"), 171705),
    (("gruszki",), ("susz", "sok", "herbat", "karma", "mus", "smak"), 746773),
    (("gruszka",), ("susz", "sok", "herbat", "karma", "mus", "smak"), 746773),
    (("winogrona",), ("sok", "napoj", "olej", "rodzynk"), 174683),
    (("borowki",), ("napoj", "herbat", "jogurt", "mus", "smak"), 2346411),
    (("maliny",), ("herbat", "budyn", "jogurt", "smak", "mus", "napoj", "zelki"), 2346410),
    (("brzoskwinie",), ("herbat", "plyn", "mus", "smak", "kaszka"), 325430),
    (("sliwki",), ("kaszka", "miesiac", "mus", "czekolad", "susz"), 169949),
    (("woda", "mineralna"), ("toalet", "micelar"), 173647),
    (("koncentrat", "pomidorowy"), (), 170459),
    (("passata",), (), 170459),
    (("maka", "ziemniaczana"), (), 2261422),
    (("skrobia", "ziemniaczana"), (), 2261422),
    (("soda", "oczyszczona"), (), 175040),
    (("bulka", "tarta"), (), 174924),
    (("olej", "kokosowy"), ("mydl", "szampon"), 330458),
    (("rodzynki",), ("czekolad", "mieszanka", "musli"), 168165),
    (("daktyle",), ("baton", "czekolad"), 168191),
    (("smietanka",), ("bita", "deser", "lody", "toffi"), 170859),
    (("skrzydelka", "kurczak"), ("panier", "podpask"), 2727568),
    (("skrzydelka", "kurczaka"), ("panier", "podpask"), 2727568),
    (("mielone", "wieprz"), ("pasztet", "parow"), 168372),
    (("mielona", "wieprzowina"), ("pasztet",), 168372),
    (("mielony", "indyk"), ("pasztet",), 171505),
    (("wolowina",), ("mielon", "karma", "kot", "pies", "pasztet", "gulasz", "konserw"), 170831),
    (("rukola",), (), 169387),
    (("sezam",), ("bulki", "bulka", "burger", "chleb", "przypraw"), 170150),
    (("sos", "sojowy"), ("slodko",), 174277),
    (("przecier", "pomidorowy"), ("bazyli", "ziol"), 170460),
    (("orzechy", "nerkowca"), ("maslo", "krem", "sos"), 2515374),
    (("pistacje",), ("czekolad", "lody", "baton"), 2515379),
    (("serek", "wiejski"), ("smak", "owoc", "wanili"), 2346384),
    (("woda", "zrodlana"), ("toalet", "micelar", "kokos"), 173647),
    (("woda", "niegazowana"), ("toalet", "micelar", "kokos"), 173647),
    (("camembert",), ("sos", "panier"), 172178),
    (("mleczko", "kokosowe"), ("szampon", "mydl"), 170173),
]


def fold(text: str) -> str:
    repl = str.maketrans("ąćęłńóśźż", "acelnoszz")
    text = text.lower().translate(repl)
    return "".join(
        ch for ch in unicodedata.normalize("NFKD", text) if not unicodedata.combining(ch)
    )


def tokens(text: str) -> list[str]:
    parts = re.findall(r"[a-z0-9]+", fold(text))
    return [p for p in parts if p not in STOP and len(p) > 1]


def product_en_tokens(name: str) -> set[str]:
    out: set[str] = set()
    for tok in tokens(name):
        mapped = PL_EN.get(tok)
        if mapped:
            out.update(mapped)
    return out


def _has(need: str, toks: set[str], folded: str) -> bool:
    return need in toks


def skip_product(name: str) -> bool:
    return bool(SKIP_PRODUCT.search(name))


def rule_match(name: str) -> int | None:
    toks = set(tokens(name))
    folded = fold(name)
    for need, exclude, fdc_id in RULES:
        if not all(_has(n, toks, folded) for n in need):
            continue
        if any(ex in folded for ex in exclude):
            continue
        if skip_product(name):
            continue
        return fdc_id
    return None


def usda_score(product_name: str, name_en: str, data_type: str) -> int:
    en = product_en_tokens(product_name)
    usda = set(tokens(name_en))
    overlap = en & usda
    if not overlap:
        return 0
    if len(overlap) < 2 and not (overlap & STRONG) and overlap != en:
        return 0
    if "raw" in usda and PROCESSED.search(product_name) and overlap & {
        "bananas",
        "banana",
        "apples",
        "apple",
        "strawberries",
        "lemon",
        "lemons",
    }:
        return 0
    score = 5 * len(overlap)
    if "raw" in usda:
        score += 2
    if data_type == "Foundation":
        score += 1
    if USDA_PENALTY.search(name_en):
        score -= 10
    if "cooked" in usda and "raw" not in usda:
        score -= 2
    return score


def load_ingredients(conn: sqlite3.Connection) -> list[tuple[int, str, str]]:
    return conn.execute(
        "SELECT ingredient_id, name_en, data_type FROM ingredients"
    ).fetchall()


def build_index(
    ingredients: list[tuple[int, str, str]],
) -> dict[str, list[tuple[int, str, str]]]:
    index: dict[str, list[tuple[int, str, str]]] = defaultdict(list)
    for row in ingredients:
        for tok in set(tokens(row[1])):
            index[tok].append(row)
    return index


def best_ingredient(
    product_name: str,
    index: dict[str, list[tuple[int, str, str]]] | None = None,
) -> int | None:
    del index
    return rule_match(product_name)


def map_products(ingredients_conn: sqlite3.Connection, store_conn: sqlite3.Connection) -> dict:
    del ingredients_conn
    rows = store_conn.execute("SELECT product_id, name FROM products").fetchall()
    updates = [(best_ingredient(name), product_id) for product_id, name in rows]
    store_conn.executemany(
        "UPDATE products SET ingredient_id = ? WHERE product_id = ?",
        updates,
    )
    store_conn.commit()
    mapped = sum(1 for fdc_id, _ in updates if fdc_id is not None)
    unique = len({fdc_id for fdc_id, _ in updates if fdc_id is not None})
    return {"products": len(updates), "mapped": mapped, "ingredients": unique}
