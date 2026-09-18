"""Loose recipe extract from HTML, markdown, or YouTube description text."""

from __future__ import annotations

import re
from html import unescape

from scripts.schema_recipe import _text

HEADING_RE = re.compile(
    r"(składniki|skladniki|ingredients|co potrzebujesz|czego potrzebujesz|lista zakupów|lista zakupow)",
    re.IGNORECASE,
)
# Real section titles in HTML are short nodes, not "Dodaj te składniki do garnka…".
HEADING_NODE_RE = re.compile(
    r">\s*(składniki|skladniki|ingredients|co potrzebujesz|czego potrzebujesz|"
    r"lista zakupów|lista zakupow)\s*:?\s*<",
    re.IGNORECASE,
)
ING_HEADING_LINE_RE = re.compile(
    r"^\s*(składniki|skladniki|ingredients|co potrzebujesz|czego potrzebujesz|"
    r"lista zakupów|lista zakupow)\s*:?\s*$",
    re.IGNORECASE,
)
STOP_HEADING_RE = re.compile(
    r"(przygotowanie|wykonanie|sposób|sposob|instrukcj|kroki|przepis|"
    r"method|directions|instructions|opis|uwagi)",
    re.IGNORECASE,
)
LI_RE = re.compile(r"<li\b[^>]*>(.*?)</li>", re.IGNORECASE | re.DOTALL)
H1_RE = re.compile(r"<h1\b[^>]*>(.*?)</h1>", re.IGNORECASE | re.DOTALL)
TITLE_TAG_RE = re.compile(r"<title\b[^>]*>(.*?)</title>", re.IGNORECASE | re.DOTALL)
WPRM_RE = re.compile(
    r'<li\b[^>]*class="[^"]*wprm-recipe-ingredient[^"]*"[^>]*>(.*?)</li>',
    re.IGNORECASE | re.DOTALL,
)
MD_HEADING_RE = re.compile(r"^#{1,3}\s+(.+)$", re.MULTILINE)
STRIP_TAGS_RE = re.compile(r"<[^>]+>")
SCRIPT_STYLE_RE = re.compile(
    r"<script\b[^>]*>.*?</script>|<style\b[^>]*>.*?</style>",
    re.IGNORECASE | re.DOTALL,
)
BULLET_RE = re.compile(r"^\s*[-*•–]\s+(.+)$")
QTY_RE = re.compile(
    r"^\s*(?:ok\.?\s*|oko[łl]o\s*|nieca[łl]e\s*|co najmniej\s*)?"
    r"(\d+[.,]?\d*|\d+\s*/\s*\d+|\d+\s*[-–]\s*\d+[.,]?\d*)"
    r"(?:\s*(g|kg|ml|l|łyżk|lyzk|łyżecz|szkl|szt|dag|oz|cup|tbsp|tsp|pinch|"
    r"puszk|opakowan|zabk|ząbk|plaster|listek|li[śs]c))?"
    r"(?=\s+[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż(]|$)",
    re.IGNORECASE,
)
LEADING_AMOUNT_RE = re.compile(
    r"^\s*(?:ok\.?\s*|oko[łl]o\s*|nieca[łl]e\s*|co najmniej\s*|gar[sś]ć\s*|szczypta\s*)?"
    r"(\d+[.,]?\d*|\d+\s*/\s*\d+|\d+\s*[-–]\s*\d+)"
    r"(?=\s+[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż(]|$)",
    re.IGNORECASE,
)
SKIP_LINE_RE = re.compile(
    r"(subskryb|facebook|instagram|tiktok|patreon|newsletter|cookies|polityka prywatności)",
    re.IGNORECASE,
)
NON_INGREDIENT_RE = re.compile(
    r"^(krok\s*\d|"
    r"dekoracja\b|"
    r"podawaj\b|"
    r"mieszaj\b|"
    r"gor[aą]cy wok\b|"
    r"strips\s*[–-]|"
    r"bites\s*[–-]|"
    r"wings\s*[–-]|"
    r"udko\b|"
    r"opcjonalne li[sś]cie\b|"
    r"je[sś]li\b|"
    r"nie przesad|"
    r"warto\b|"
    r"pami[eę]taj\b|"
    r"mo[zż]esz\b|"
    r"[\(\)\.,;:\-–—]+$)",
    re.IGNORECASE,
)
TITLE_SUFFIX_RE = re.compile(
    r"\s+[–—]\s*(?:Foxx Gotuje|Adi Foxx|.*\bsklep\b).*$"
    r"|\s*[|].*$",
    re.IGNORECASE,
)
ACTION_STEP_RE = re.compile(
    r"\b(dodaj|dodawać|wymieszaj|mieszaj|zblenduj|blenduj|smaż|smażyć|gotuj|"
    r"zagotuj|piecz|podgrzej|pokrój|obierz|odstaw|pozostaw|włóż|wyjmij|"
    r"przełóż|przelej|wlej|wbij|uformuj|rozwałkuj|wyrabiaj|marynuj|"
    r"schłodź|odcedź|posmaruj|polej|posyp|podawaj|dopraw|zrób|umieść|"
    r"następnie|najpierw|teraz uformuj|wszystkie składniki)\b",
    re.IGNORECASE,
)
STEP_STOP_RE = re.compile(
    r"^(zobacz również|czytaj więcej|blog|kontakt|regulamin|polityka|produkty|©)\b",
    re.IGNORECASE,
)
RELATED_STOP_RE = re.compile(
    r"^(zobacz również|czytaj więcej)\b",
    re.IGNORECASE,
)


def _plain(html_fragment: str) -> str:
    text = STRIP_TAGS_RE.sub(" ", html_fragment)
    text = unescape(text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _html_plain_lines(html: str) -> list[str]:
    text = SCRIPT_STYLE_RE.sub("\n", html or "")
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    text = re.sub(r"</(?:p|li|h\d|div)>", "\n", text, flags=re.I)
    text = STRIP_TAGS_RE.sub(" ", text)
    text = unescape(text)
    lines = [re.sub(r"\s+", " ", ln).strip() for ln in text.splitlines()]
    return [ln for ln in lines if ln]


def _clean_line(line: str) -> str | None:
    text = unescape(line).strip().strip("-*•–").strip()
    text = re.sub(r"\s+", " ", text)
    if len(text) < 2 or len(text) > 180:
        return None
    if SKIP_LINE_RE.search(text):
        return None
    if NON_INGREDIENT_RE.search(text):
        return None
    if text.lower() in ("składniki", "skladniki", "ingredients"):
        return None
    if STOP_HEADING_RE.match(text) and len(text) < 40:
        return None
    return text


def _is_ingredient_candidate(text: str) -> bool:
    if not text or NON_INGREDIENT_RE.search(text):
        return False
    if len(text) <= 2 or text in {"(", ")", ",", ".", "-", "–"}:
        return False
    if text.startswith((")", "(", ",")):
        return False
    # Instruction prose with a mid-line amount is not an ingredient line.
    if ACTION_STEP_RE.search(text) and not LEADING_AMOUNT_RE.match(text):
        return False
    if QTY_RE.match(text) or LEADING_AMOUNT_RE.match(text):
        return True
    lowered = text.lower()
    if lowered.startswith(("garść ", "garsc ", "szczypta ", "odrobina ", "kilka ")):
        return True
    return False


def _unique(lines: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for line in lines:
        key = line.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(line)
    return out


def _split_dense_ingredient_line(text: str) -> list[str]:
    """Split '300 g cukru 200 ml śmietanki' into separate ingredient lines."""
    if not text or text.count(" ") < 4:
        return [text] if text else []
    unit = (
        r"g|kg|ml|l|łyżk\w*|lyzk\w*|łyżecz\w*|szklan\w*|szt\w*|dag|oz|cup|tbsp|tsp|"
        r"puszk\w*|opakowan\w*"
    )
    amount = re.compile(
        rf"(?:\d+[.,]?\d*|\d+\s*/\s*\d+|\d+\s*[-–]\s*\d+)\s*(?:{unit})\b",
        re.IGNORECASE,
    )
    matches = list(amount.finditer(text))
    if len(matches) < 2 or matches[0].start() > 3:
        # Parenthetical notes like "kulka (250-300 g)" must stay whole.
        return [text]
    out = []
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        cleaned = _clean_line(text[match.start() : end])
        if cleaned and _is_ingredient_candidate(cleaned):
            out.append(cleaned)
    return out if len(out) >= 2 else [text]


def ingredients_from_plain_lines(lines: list[str]) -> list[str]:
    """Foxx-style: collect amount lines across sections; ignore interleaved prose."""
    found: list[str] = []
    for line in lines:
        stripped = line.strip()
        # Only hard-stop on related-post chrome — nav words like "Produkty"
        # appear in the header of Foxx pages.
        if RELATED_STOP_RE.match(stripped):
            break
        if ING_HEADING_LINE_RE.match(stripped):
            continue
        if STOP_HEADING_RE.match(stripped) and len(stripped) < 40:
            continue
        cleaned = _clean_line(stripped)
        if not cleaned:
            continue
        dense = _split_dense_ingredient_line(cleaned)
        if len(dense) >= 2:
            found.extend(dense)
            continue
        if _is_ingredient_candidate(cleaned):
            found.append(cleaned)
    return _unique(found)


def ingredients_from_html(html: str) -> list[str]:
    if not html:
        return []
    wprm = [_plain(m) for m in WPRM_RE.findall(html)]
    wprm = [line for line in (_clean_line(x) for x in wprm) if line]
    if len(wprm) >= 2:
        return _unique(wprm)

    lowered = html.lower()
    match = HEADING_NODE_RE.search(html) or HEADING_NODE_RE.search(lowered)
    if match:
        start = match.start()
        window = html[start : start + 8000]
        stop = STOP_HEADING_RE.search(window[40:])
        if stop:
            window = window[: 40 + stop.start()]
        items = [_plain(m) for m in LI_RE.findall(window)]
        items = [line for line in (_clean_line(x) for x in items) if line]
        if len(items) >= 2:
            actionish = sum(1 for item in items if ACTION_STEP_RE.search(item))
            if actionish * 2 < len(items):
                return _unique(items)

    return ingredients_from_plain_lines(_html_plain_lines(html))


def title_from_html(html: str) -> str | None:
    for regex in (H1_RE, TITLE_TAG_RE):
        match = regex.search(html or "")
        if not match:
            continue
        title = _plain(match.group(1))
        title = TITLE_SUFFIX_RE.sub("", title).strip()
        if len(title) >= 3:
            return title
    return None


def ingredients_from_text(text: str) -> list[str]:
    if not text:
        return []
    lines = text.replace("\r\n", "\n").split("\n")
    start = None
    for i, line in enumerate(lines):
        if ING_HEADING_LINE_RE.match(line) and len(line.strip()) < 80:
            start = i + 1
            break
    chunk = lines[start:] if start is not None else lines
    found: list[str] = []
    for line in chunk:
        stripped = line.strip()
        if start is not None and STOP_HEADING_RE.match(stripped) and len(stripped) < 80:
            break
        if start is not None and stripped == "":
            if found:
                break
            continue
        bullet = BULLET_RE.match(line)
        candidate = bullet.group(1) if bullet else stripped
        cleaned = _clean_line(candidate)
        if not cleaned:
            continue
        if (
            bullet
            or _is_ingredient_candidate(cleaned)
            or (start is not None and 2 <= len(cleaned) <= 80 and not ACTION_STEP_RE.search(cleaned))
        ):
            found.append(cleaned)
        elif start is None and _is_ingredient_candidate(cleaned):
            found.append(cleaned)
    if len(found) >= 2:
        return _unique(found)
    return ingredients_from_plain_lines(lines)


NUMBERED_STEP_RE = re.compile(r"^\s*(\d+)\s*[.)]\s+(.+)$")


def source_steps_from_html(html: str) -> list[str]:
    """Wyciągnij kroki źródłowe: numerowane Przygotowanie, inaczej proza z czasownikami."""
    if not html:
        return []
    lines = _html_plain_lines(html)

    start = None
    for i, line in enumerate(lines):
        if STOP_HEADING_RE.match(line) and len(line) < 40:
            start = i + 1
            break
    if start is not None:
        steps: list[str] = []
        for line in lines[start:]:
            if RELATED_STOP_RE.match(line) or STEP_STOP_RE.match(line):
                break
            if HEADING_RE.match(line) and len(line) < 40:
                break
            numbered = NUMBERED_STEP_RE.match(line)
            if numbered:
                steps.append(f"{numbered.group(1)}. {numbered.group(2).strip()}")
                continue
            if steps and len(line) > 20 and not RELATED_STOP_RE.match(line):
                steps[-1] = f"{steps[-1]} {line}"
        if steps:
            return steps

    # Fallback: instruction-like prose until related posts.
    steps = []
    for line in lines:
        if RELATED_STOP_RE.match(line):
            break
        if len(line) < 25 or len(line) > 800:
            continue
        if QTY_RE.match(line) and not ACTION_STEP_RE.search(line):
            continue
        if HEADING_RE.match(line) and len(line) < 40:
            continue
        if ACTION_STEP_RE.search(line):
            steps.append(line)
    return steps


def parse_html_recipe(html: str, source_url: str, title_hint: str | None = None) -> dict | None:
    title = title_hint or title_from_html(html)
    ingredients = ingredients_from_html(html)
    if not ingredients:
        stripped = SCRIPT_STYLE_RE.sub("\n", html or "")
        ingredients = ingredients_from_text(_plain(stripped).replace(". ", ".\n"))
        if not ingredients:
            ingredients = ingredients_from_text(html or "")
    recipe = _as_recipe(title, ingredients, source_url)
    if recipe is not None:
        recipe["source_steps"] = source_steps_from_html(html)
    return recipe


def parse_markdown_recipe(markdown: str, source_url: str, title_hint: str | None = None) -> dict | None:
    title = title_hint
    if not title:
        match = MD_HEADING_RE.search(markdown or "")
        if match:
            title = match.group(1).strip()
    ingredients = ingredients_from_text(markdown or "")
    return _as_recipe(title, ingredients, source_url)


def parse_description_recipe(
    description: str,
    source_url: str,
    title_hint: str | None = None,
) -> dict | None:
    return _as_recipe(title_hint, ingredients_from_text(description or ""), source_url)


def _as_recipe(title: str | None, ingredients: list[str], source_url: str) -> dict | None:
    title = _text(title)
    if not title or len(title) < 3 or len(ingredients) < 2:
        return None
    return {
        "title": title,
        "source_url": source_url,
        "prep_minutes": None,
        "cook_minutes": None,
        "total_minutes": None,
        "recipe_yield": None,
        "ingredients": ingredients,
        "source_steps": [],
    }
