"""Loose recipe extract from HTML, markdown, or YouTube description text."""

from __future__ import annotations

import re
from html import unescape

from scripts.schema_recipe import _text

HEADING_RE = re.compile(
    r"(składniki|skladniki|ingredients|co potrzebujesz|czego potrzebujesz|lista zakupów|lista zakupow)",
    re.IGNORECASE,
)
STOP_HEADING_RE = re.compile(
    r"(przygotowanie|wykonanie|sposób|sposob|instrukcj|kroki|method|directions|instructions|opis|uwagi)",
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
    r"^\s*(\d+[.,]?\d*|\d+\s*/\s*\d+)\s*(g|kg|ml|l|łyżk|lyzk|łyżecz|szkl|szt|dag|oz|cup|tbsp|tsp|pinch)\b",
    re.IGNORECASE,
)
SKIP_LINE_RE = re.compile(
    r"(subskryb|facebook|instagram|tiktok|patreon|newsletter|cookies|polityka prywatności)",
    re.IGNORECASE,
)


def _plain(html_fragment: str) -> str:
    text = STRIP_TAGS_RE.sub(" ", html_fragment)
    text = unescape(text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _clean_line(line: str) -> str | None:
    text = unescape(line).strip().strip("-*•–").strip()
    text = re.sub(r"\s+", " ", text)
    if len(text) < 2 or len(text) > 180:
        return None
    if SKIP_LINE_RE.search(text):
        return None
    if text.lower() in ("składniki", "skladniki", "ingredients"):
        return None
    return text


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


def ingredients_from_html(html: str) -> list[str]:
    if not html:
        return []
    wprm = [_plain(m) for m in WPRM_RE.findall(html)]
    wprm = [line for line in (_clean_line(x) for x in wprm) if line]
    if len(wprm) >= 2:
        return _unique(wprm)

    lowered = html.lower()
    match = HEADING_RE.search(lowered)
    if match:
        start = match.start()
        window = html[start : start + 8000]
        stop = STOP_HEADING_RE.search(window[40:])
        if stop:
            window = window[: 40 + stop.start()]
        items = [_plain(m) for m in LI_RE.findall(window)]
        items = [line for line in (_clean_line(x) for x in items) if line]
        if len(items) >= 2:
            return _unique(items)

    return []


def title_from_html(html: str) -> str | None:
    for regex in (H1_RE, TITLE_TAG_RE):
        match = regex.search(html or "")
        if not match:
            continue
        title = _plain(match.group(1))
        title = re.sub(r"\s*[|\-–].*$", "", title).strip()
        if len(title) >= 3:
            return title
    return None


def ingredients_from_text(text: str) -> list[str]:
    if not text:
        return []
    lines = text.replace("\r\n", "\n").split("\n")
    start = None
    for i, line in enumerate(lines):
        if HEADING_RE.search(line) and len(line.strip()) < 80:
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
        if bullet or QTY_RE.match(cleaned) or (start is not None and 2 <= len(cleaned) <= 80):
            found.append(cleaned)
        elif start is None and QTY_RE.match(cleaned):
            found.append(cleaned)
    return _unique(found)


STEP_STOP_RE = re.compile(
    r"^(zobacz również|czytaj więcej|blog|kontakt|regulamin|polityka|produkty|©)\b",
    re.IGNORECASE,
)
RELATED_STOP_RE = re.compile(
    r"^(zobacz również|czytaj więcej)\b",
    re.IGNORECASE,
)
NUMBERED_STEP_RE = re.compile(r"^\s*(\d+)\s*[.)]\s+(.+)$")
ACTION_STEP_RE = re.compile(
    r"\b(dodaj|dodawać|wymieszaj|mieszaj|zblenduj|blenduj|smaż|smażyć|gotuj|"
    r"zagotuj|piecz|podgrzej|pokrój|obierz|odstaw|pozostaw|włóż|wyjmij|"
    r"przełóż|przelej|wlej|wbij|uformuj|rozwałkuj|wyrabiaj|marynuj|"
    r"schłodź|odcedź|posmaruj|polej|posyp|podawaj|dopraw|zrób|umieść|"
    r"następnie|najpierw|teraz uformuj|wszystkie składniki)\b",
    re.IGNORECASE,
)


def _html_plain_lines(html: str) -> list[str]:
    text = SCRIPT_STYLE_RE.sub("\n", html or "")
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    text = re.sub(r"</(?:p|li|h\d|div)>", "\n", text, flags=re.I)
    text = STRIP_TAGS_RE.sub(" ", text)
    text = unescape(text)
    lines = [re.sub(r"\s+", " ", ln).strip() for ln in text.splitlines()]
    return [ln for ln in lines if ln]


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
        if len(line) < 25 or len(line) > 400:
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
