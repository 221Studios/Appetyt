"""Map a recipe ingredient name to USDA fdc_id.

Longest explicit staple phrase wins. Excludes stop wrong IDs
(stock is not chicken breast; vinegar is not wine).
"""

from __future__ import annotations

import re

from scripts.map_store_ingredients import fold, rule_match, tokens

# (phrase, fdc_id, extra tokens that block THIS phrase)
STAPLES: list[tuple[str, int, frozenset[str]]] = [
    ("chicken broth", 174536, frozenset()),
    ("bulion drobiowy", 174536, frozenset()),
    ("bulionu drobiowego", 174536, frozenset()),
    ("oliwa", 171413, frozenset()),
    ("oliwy", 171413, frozenset()),
    ("olive oil", 171413, frozenset()),
    ("czosnek", 1104647, frozenset({"proszek", "sol"})),
    ("czosnku", 1104647, frozenset({"proszek", "sol"})),
    ("cebula", 170000, frozenset()),
    ("cebuli", 170000, frozenset()),
    ("maslo", 173410, frozenset({"orzech"})),
    ("masła", 173410, frozenset({"orzech"})),
    ("smietanka", 170859, frozenset()),
    ("śmietanka", 170859, frozenset()),
    ("smietanki", 170859, frozenset()),
    ("śmietanki", 170859, frozenset()),
    ("szczypiorek", 169994, frozenset()),
    ("ziemniaki", 170026, frozenset()),
    ("ziemniak", 170026, frozenset()),
    ("chleb", 174924, frozenset()),
    ("sol i pieprz", 173468, frozenset()),
    ("sól i pieprz", 173468, frozenset()),
    ("sol", 173468, frozenset({"czosnek"})),
    ("sól", 173468, frozenset({"czosnek"})),
    ("chicken stock", 172884, frozenset()),
    ("vegetable stock", 171583, frozenset()),
    ("vegetable broth", 171583, frozenset()),
    ("beef stock", 172883, frozenset()),
    ("beef broth", 171538, frozenset()),
    ("sos sojowy", 174277, frozenset()),
    ("olej sezamowy", 171016, frozenset()),
    ("sok z cytryny", 167747, frozenset()),
    ("sok z limonki", 168156, frozenset()),
    ("mleko kokosowe", 170173, frozenset()),
    ("coconut milk", 170173, frozenset()),
    ("tomato paste", 170459, frozenset()),
    ("tomato puree", 170460, frozenset()),
    ("koncentrat pomidorowy", 170459, frozenset()),
    ("peanut butter", 2262072, frozenset()),
    ("maslo orzechowe", 2262072, frozenset()),
    ("oyster sauce", 174529, frozenset()),
    ("fish sauce", 174531, frozenset()),
    ("worcestershire sauce", 171610, frozenset()),
    ("soy sauce", 174277, frozenset()),
    ("sesame oil", 171016, frozenset()),
    ("rapeseed oil", 748278, frozenset()),
    ("canola oil", 748278, frozenset()),
    ("vegetable oil", 171411, frozenset()),
    ("neutral oil", 171411, frozenset()),
    ("red wine vinegar", 172240, frozenset()),
    ("balsamic vinegar", 172241, frozenset()),
    ("apple cider vinegar", 173469, frozenset()),
    ("distilled vinegar", 172237, frozenset()),
    ("white vinegar", 172237, frozenset()),
    ("lemon juice", 167747, frozenset()),
    ("lime juice", 168156, frozenset()),
    ("vanilla extract", 173471, frozenset()),
    ("vanilla essence", 173471, frozenset()),
    ("baking powder", 172803, frozenset()),
    ("baking soda", 175040, frozenset()),
    ("bicarbonate of soda", 175040, frozenset()),
    ("garlic powder", 171325, frozenset()),
    ("garlic cloves", 1104647, frozenset()),
    ("garlic clove", 1104647, frozenset()),
    ("ground cinnamon", 171320, frozenset()),
    ("ground cumin", 170923, frozenset()),
    ("cumin seeds", 170923, frozenset()),
    ("cumin seed", 170923, frozenset()),
    ("ground nutmeg", 171326, frozenset()),
    ("fennel seeds", 171323, frozenset()),
    ("fennel seed", 171323, frozenset()),
    ("cayenne pepper", 170932, frozenset()),
    ("sour cream", 2346387, frozenset()),
    ("frozen peas", 170016, frozenset()),
    ("maple syrup", 169661, frozenset()),
    ("butternut squash", 169295, frozenset()),
    ("buttermilk", 172225, frozenset()),
    ("red chillies", 170106, frozenset()),
    ("sesame seeds", 170150, frozenset()),
    ("spring onions", 170005, frozenset()),
    ("green onion", 170005, frozenset()),
    ("green onions", 170005, frozenset()),
    ("dijon mustard", 326698, frozenset()),
    ("smoked paprika", 171329, frozenset()),
    ("kosher salt", 173468, frozenset()),
    ("sea salt", 173468, frozenset()),
    ("table salt", 173468, frozenset()),
    ("chicken breast", 171077, frozenset()),
    ("chicken thighs", 173627, frozenset()),
    ("chicken thigh", 173627, frozenset()),
    ("chicken wings", 2727568, frozenset()),
    ("plain flour", 168894, frozenset()),
    ("all-purpose flour", 168894, frozenset()),
    ("all purpose flour", 168894, frozenset()),
    ("self-raising flour", 168894, frozenset()),
    ("wholemeal flour", 168894, frozenset()),
    ("sirloin steak", 170831, frozenset()),
    ("ribeye steak", 170831, frozenset()),
    ("streaky bacon", 168277, frozenset()),
    ("smoked bacon", 168277, frozenset()),
    ("double cream", 170859, frozenset()),
    ("heavy cream", 170859, frozenset()),
    ("whipping cream", 170859, frozenset()),
    ("caster sugar", 746784, frozenset()),
    ("granulated sugar", 746784, frozenset()),
    ("brown sugar", 168833, frozenset()),
    ("natural yogurt", 171284, frozenset()),
    ("natural yoghurt", 171284, frozenset()),
    ("semi-skimmed milk", 746782, frozenset()),
    ("parmesan cheese", 325036, frozenset()),
    ("bay leaves", 170917, frozenset()),
    ("bay leaf", 170917, frozenset()),
    ("red chilli", 170106, frozenset()),
    ("red chili", 170106, frozenset()),
    ("runny honey", 169640, frozenset()),
    ("fresh coriander", 169997, frozenset()),
    ("fresh mint", 173474, frozenset()),
    ("flat-leaf parsley", 170416, frozenset()),
    ("fresh parsley", 170416, frozenset()),
    ("fresh rosemary", 171333, frozenset()),
    ("ripe tomatoes", 170457, frozenset()),
    ("red onions", 170000, frozenset()),
    ("canned tomatoes", 170457, frozenset()),
    ("rolled oats", 173904, frozenset()),
    ("white wine", 174837, frozenset({"vinegar"})),
    ("red wine", 173190, frozenset({"vinegar"})),
    ("cornstarch", 169698, frozenset()),
    ("cornflour", 169698, frozenset()),
    ("paprika", 171329, frozenset()),
    ("cinnamon", 171320, frozenset()),
    ("cumin", 170923, frozenset()),
    ("nutmeg", 171326, frozenset()),
    ("cayenne", 170932, frozenset()),
    ("mustard", 326698, frozenset()),
    ("vinegar", 172237, frozenset({"wine", "balsamic", "cider", "rice", "apple"})),
    ("honey", 169640, frozenset()),
    ("ginger", 169231, frozenset()),
    ("scallions", 170005, frozenset()),
    ("scallion", 170005, frozenset()),
    ("coriander", 169997, frozenset()),
    ("cilantro", 169997, frozenset()),
    ("parsley", 170416, frozenset()),
    ("rosemary", 171333, frozenset()),
    ("thyme", 170938, frozenset()),
    ("basil", 171317, frozenset()),
    ("mint", 173474, frozenset()),
    ("water", 173647, frozenset()),
    ("butter", 173410, frozenset({"peanut"})),
    ("garlic", 1104647, frozenset({"powder", "salt"})),
    ("onion", 170000, frozenset()),
    ("onions", 170000, frozenset()),
    ("chicken", 171077, frozenset({"stock", "broth", "soup", "bouillon", "fat", "seasoning"})),
    ("steak", 170831, frozenset()),
    ("bacon", 168277, frozenset()),
    ("flour", 168894, frozenset()),
    ("sugar", 746784, frozenset()),
    ("salt", 173468, frozenset({"garlic"})),
    ("pepper", 170931, frozenset({"chili", "chilli", "bell", "sweet", "cayenne"})),
    ("oil", 748278, frozenset({"sesame", "olive", "essential", "sezam"})),
    ("olej", 748278, frozenset({"sezam", "oliwa", "kokos"})),
    ("milk", 746782, frozenset({"coconut", "oat", "soy", "almond", "kokos"})),
    ("yoghurt", 171284, frozenset()),
    ("yogurt", 171284, frozenset()),
    ("rice", 169756, frozenset({"vinegar", "wine", "milk", "paper", "cake", "krispie", "krispies"})),
    ("pasta", 169736, frozenset()),
    ("spaghetti", 169736, frozenset()),
    ("penne", 169736, frozenset()),
    ("bread", 174924, frozenset()),
    ("cheese", 171241, frozenset()),
    ("egg", 171287, frozenset()),
    ("eggs", 171287, frozenset()),
    ("tomato", 170457, frozenset()),
    ("tomatoes", 170457, frozenset()),
    ("potato", 170026, frozenset()),
    ("potatoes", 170026, frozenset()),
    ("carrot", 170393, frozenset()),
    ("carrots", 170393, frozenset()),
    ("lemon", 167746, frozenset({"juice"})),
    ("lemons", 167746, frozenset({"juice"})),
    ("lime", 168155, frozenset({"juice"})),
    ("limes", 168155, frozenset({"juice"})),
    ("shallots", 170499, frozenset()),
    ("shallot", 170499, frozenset()),
    ("celery", 169988, frozenset()),
    ("cucumber", 168409, frozenset()),
    ("mayonnaise", 171009, frozenset()),
    ("mayo", 171009, frozenset()),
    ("woda", 173647, frozenset()),
    ("maka", 168894, frozenset()),
    ("cytryna", 167746, frozenset({"sok"})),
    ("limonka", 168155, frozenset({"sok"})),
    ("apple", 171688, frozenset()),
    ("apples", 171688, frozenset()),
    ("orange", 746771, frozenset()),
    ("spinach", 168462, frozenset()),
    ("asparagus", 168389, frozenset()),
    ("chickpeas", 173756, frozenset()),
    ("parmesan", 325036, frozenset()),
    ("parmigiano", 325036, frozenset()),
]

STAPLES.sort(key=lambda row: len(row[0]), reverse=True)

OR_COLOR = re.compile(
    r"\b(light|dark|white|black|fresh|dried|sweet|hot)\s+or\s+"
    r"(light|dark|white|black|fresh|dried|sweet|hot)\b",
    re.I,
)
SKIP_COMPOUND = {
    "salt and pepper",
    "salt & pepper",
    "salt and black pepper",
}


def _clean(name: str) -> str:
    text = (name or "").strip()
    text = re.sub(r"^[)(/,\s]+", "", text)
    text = re.sub(r"[)(/,\s]+$", "", text)
    text = re.sub(r"\s+", " ", text)
    lowered = fold(text)
    for prefix in ("pure ", "runny ", "fresh ", "ripe ", "bunch of ", "pack ", "sprigs of "):
        if lowered.startswith(prefix):
            text = text[len(prefix) :].strip()
            lowered = fold(text)
    return text


def _phrase_in(folded: str, needle: str) -> bool:
    if not needle:
        return False
    padded = f" {folded} "
    return (
        folded == needle
        or padded.find(f" {needle} ") >= 0
        or folded.startswith(needle + " ")
        or folded.endswith(" " + needle)
    )


def map_recipe_name(name: str) -> int | None:
    text = _clean(name)
    if not text:
        return None
    folded_full = fold(text)
    if folded_full in SKIP_COMPOUND or folded_full.startswith("salt and pepper") or folded_full.startswith("salt & pepper"):
        return 173468  # treat EN salt-and-pepper as salt; PL handled via staple
    if folded_full in {"sol i pieprz", "sól i pieprz"} or folded_full.startswith("sol i pieprz"):
        return 173468
    if ("&" in text or " and " in fold(text)) and "," in text and len(tokens(text)) >= 3:
        return None
    if "," in text:
        text = _clean(text.split(",", 1)[0])
    text = OR_COLOR.sub(r"\1", text)
    folded_or = fold(text)
    if " or " in folded_or:
        text = _clean(text[: folded_or.find(" or ")])
    if not text:
        return None
    folded = fold(text)
    name_tokens = set(tokens(text))
    padded = f" {folded} "
    for phrase, fdc_id, excludes in STAPLES:
        if excludes and any(f" {ex} " in padded or ex in name_tokens for ex in excludes):
            continue
        if _phrase_in(folded, fold(phrase)):
            return fdc_id
    direct = rule_match(text)
    if direct is not None and "stock" not in folded and "broth" not in folded:
        return direct
    return None
