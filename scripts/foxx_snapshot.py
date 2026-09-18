"""Normalize one Foxx Gotuje Markdown page into snapshot recipe data.

The public seam is :func:`parse_foxx_page`: it accepts one page object returned
by n3xusAPI and returns source ingredient lines plus operational-looking source
steps.  It deliberately keeps source wording in the snapshot; the runtime
adapter is responsible for the short user-facing instructions.
"""

from __future__ import annotations

import re
from collections.abc import Mapping


_BULLET_RE = re.compile(r"^\s*(?:[*+-]|\d+[.)])\s+(?P<text>.+?)\s*$")
_QUANTITY_RE = re.compile(
    r"(?<!\w)(?:\d+(?:[.,]\d+)?|\d+\s*/\s*\d+|[½¼¾⅓⅔⅛])"
    r"(?:\s*[-–]\s*(?:\d+(?:[.,]\d+)?|\d+\s*/\s*\d+|[½¼¾⅓⅔⅛]))?"
    r"\s*(?:kg|g|ml|cl|l|łyżeczk(?:a|i)?|łyżk(?:a|i)?|szklank(?:a|i)?|"
    r"szt(?:uk[ai])?|ząbk(?:i|ów)?|plasterk(?:i|ów)?|filet(?:y|ów)?|"
    r"garś(?:ć|ci)|puszk(?:a|i)|opakowan(?:ie|ia)|kub(?:ek|ki)|"
    r"łyż|cup(?:s)?|tbsp|tsp)\b",
    re.IGNORECASE,
)
_ACTION_RE = re.compile(
    r"\b(?:dodaj|dodawać|wymieszaj|mieszaj|zblenduj|blenduj|smaż|smazyc|"
    r"gotuj|zagotuj|piecz|podgrzej|podgrzewaj|pokrój|pokroj|obierz|"
    r"odstaw|pozostaw|włóż|wlóż|wyjmij|przełóż|przelej|wlej|wbij|"
    r"uformuj|rozwałkuj|rozgnieć|wyrabiaj|zagnieć|marynuj|zamarynuj|"
    r"schłodź|wystudź|ostudź|odcedź|wypłucz|posmaruj|polej|posyp|"
    r"podawaj|zawiń|smażymy|redukuj|przykryj|dopraw|nastaw|ugotuj|"
    r"pamiętaj|zrób|zrob|umieść|umieszcz|wymieszać|dodawać)\b",
    re.IGNORECASE,
)
_INGREDIENT_HEADING_RE = re.compile(
    r"(?:składnik|ciasto|sos|marynat|starter|karmel|kawior|sfera|"
    r"posypk|panier|farsz|nadzien|mieszank|kąpiel|ryż|krem|masa|"
    r"dressing|glazur|bulion|sal(?:sa|at)|topping|ser(?:owy)?|"
    r"plantan|vaca|chimi|kurczak|wołow|ryb|brownie|pizza|burger|"
    r"tortill|schab|kapust|kompozyc|finaliz|snickers|mojo)",
    re.IGNORECASE,
)
_STEP_HEADING_RE = re.compile(
    r"(?:przygot|wykon|sposób|sposob|wyrab|formow|wypiek|składani|"
    r"podani|gotowani|smażeni|smazeni|krok|pro tip|czasy|informac|"
    r"dodatkow|finaliz)",
    re.IGNORECASE,
)
_FOOTER_RE = re.compile(r"(?:zobacz również|czytaj więcej|produkty|zaloguj się)", re.IGNORECASE)
_NOISE_LINE_RE = re.compile(r"^(?:\[!\[|\!\[|🚚|updating|koszyk|wstecz|wróć)", re.IGNORECASE)
_SECTION_LABEL_RE = re.compile(
    r"^(?:\d+\.\s*)?(?:sos|ciasto|przepis|składniki|skladniki|marynata|"
    r"panierka|starter|thangzong|pizza|karmel|frosting|przygotowanie|"
    r"dodatkowo|pozostałe składniki|pozostale skladniki|kompozycje|"
    r"podanie|finalizacja|pro tipy?)\b.*:?$",
    re.IGNORECASE,
)
_NON_INGREDIENT_RE = re.compile(
    r"(?:znajdziesz w tym odcinku|znajdziesz poniżej|znajdziesz ponizej|"
    r"link do|w krokach poniżej|w krokach ponizej)$",
    re.IGNORECASE,
)


def _clean_heading(text: str) -> str:
    text = re.sub(r"^#+\s*", "", text.strip())
    text = re.sub(r"^\*+", "", text)
    text = re.sub(r"\*+$", "", text)
    text = re.sub(r"\s+", " ", text).strip(" *:")
    return text


def _heading_from_line(line: str) -> str | None:
    text = line.strip()
    if not text or _NOISE_LINE_RE.search(text):
        return None
    if text.startswith("#"):
        heading = _clean_heading(text)
        return heading or None
    if text.startswith("**") or text.startswith("****"):
        heading = _clean_heading(text)
        return heading if 2 < len(heading) <= 160 else None
    if text.endswith(":") and len(text) <= 100 and not text.startswith(("* ", "- ")):
        candidate = _clean_heading(text)
        if candidate and not re.search(r"[.!?]$", candidate):
            return candidate
    return None


def _kind(heading: str) -> str:
    if _STEP_HEADING_RE.search(heading):
        return "steps"
    if _INGREDIENT_HEADING_RE.search(heading):
        return "ingredients"
    return "content"


def _is_bullet(line: str) -> bool:
    return bool(_BULLET_RE.match(line))


def _bullet_text(line: str) -> str:
    match = _BULLET_RE.match(line)
    return (match.group("text") if match else line).strip().strip("*").strip()


def split_ingredient_line(text: str) -> list[str]:
    """Split one compact source bullet when it contains several quantities."""

    text = re.sub(r"\s+", " ", text).strip()
    depth = 0
    matches = []
    for match in _QUANTITY_RE.finditer(text):
        depth += text[: match.start()].count("(") - text[: match.start()].count(")")
        if depth == 0:
            matches.append(match)
    if len(matches) <= 1:
        return [text] if text else []
    parts: list[str] = []
    for index, match in enumerate(matches):
        start = match.start()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        part = text[start:end].strip(" ,;:+")
        if part:
            parts.append(part)
    return parts or ([text] if text else [])


def _looks_like_recipe_heading(heading: str) -> bool:
    return bool(_INGREDIENT_HEADING_RE.search(heading) or _STEP_HEADING_RE.search(heading))


def _usable_line(line: str) -> str | None:
    text = re.sub(r"\s+", " ", line.strip())
    if not text or _NOISE_LINE_RE.search(text):
        return None
    if text.startswith(("[", "![")) or text in {"---", "***"}:
        return None
    return text


def _is_structured_ingredient(text: str) -> bool:
    """Reject section labels that the extractor sometimes returns as items."""

    if _SECTION_LABEL_RE.match(text) or _NON_INGREDIENT_RE.search(text):
        return False
    if text.endswith(":") and len(text) < 100:
        return False
    return True


def _extract_sections(markdown: str) -> list[dict[str, object]]:
    sections: list[dict[str, object]] = []
    current: dict[str, object] | None = None
    started = False
    for raw in markdown.splitlines():
        heading = _heading_from_line(raw)
        if heading:
            if _FOOTER_RE.search(heading):
                break
            if raw.lstrip().startswith("#") and not started:
                continue
            if raw.lstrip().startswith("#") and started:
                break
            if not started and not _looks_like_recipe_heading(heading):
                continue
            started = True
            current = {"title": heading, "kind": _kind(heading), "lines": []}
            sections.append(current)
            continue
        if not started or current is None:
            continue
        line = _usable_line(raw)
        if line:
            current["lines"].append(line)  # type: ignore[index]
    return sections


def _source_ingredients(sections: list[dict[str, object]]) -> list[str]:
    ingredients: list[str] = []
    for section in sections:
        kind = section["kind"]
        lines = section["lines"]
        if kind == "steps":
            continue
        for line in lines:  # type: ignore[union-attr]
            text = _bullet_text(line) if _is_bullet(line) else ""
            if not text:
                continue
            # Bullets in content sections are ingredients only when they look
            # like a quantity or a known recipe item; this excludes prose.
            if kind == "ingredients" or _QUANTITY_RE.search(text):
                ingredients.extend(split_ingredient_line(text))
    return _unique(ingredients)


def _structured_ingredients(page: Mapping[str, object]) -> list[str]:
    recipe = page.get("recipe")
    if not isinstance(recipe, Mapping):
        return []
    values = recipe.get("recipeIngredient")
    if not isinstance(values, list):
        return []
    ingredients: list[str] = []
    for value in values:
        text = _usable_line(str(value))
        if not text or not _is_structured_ingredient(text):
            continue
        ingredients.extend(split_ingredient_line(text))
    return _unique(ingredients)


def _source_steps(sections: list[dict[str, object]]) -> list[str]:
    steps: list[str] = []
    for section in sections:
        kind = section["kind"]
        for raw in section["lines"]:  # type: ignore[union-attr]
            text = _bullet_text(raw) if _is_bullet(raw) else raw
            if not text or (kind == "ingredients" and _is_bullet(raw)):
                continue
            if kind == "steps" or _ACTION_RE.search(text):
                steps.append(text)
    return _unique(steps)


def _unique(values: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        key = value.casefold()
        if key in seen:
            continue
        seen.add(key)
        result.append(value)
    return result


def parse_foxx_page(page: Mapping[str, object]) -> dict[str, object]:
    """Parse one n3xusAPI page into a source snapshot record."""

    markdown = str(page.get("content_markdown") or page.get("markdown") or "")
    sections = _extract_sections(markdown)
    ingredients = _structured_ingredients(page) or _source_ingredients(sections)
    if not ingredients:
        recipe = page.get("recipe") if isinstance(page.get("recipe"), Mapping) else {}
        ingredients = _unique(
            [str(value).strip() for value in recipe.get("recipeIngredient", []) if str(value).strip()]
        )
    source_steps = _source_steps(sections)
    if not source_steps and isinstance(page.get("source_steps"), list):
        source_steps = _unique(
            [str(value).strip() for value in page["source_steps"] if str(value).strip()]
        )
    return {
        "title": str(page.get("title") or "Przepis").strip(),
        "source_url": str(page.get("source_url") or page.get("url") or "").strip(),
        "language": page.get("language"),
        "ingredients": ingredients,
        "source_steps": source_steps,
        "sections": [
            {"title": item["title"], "kind": item["kind"], "lines": item["lines"]}
            for item in sections
        ],
    }


def parse_foxx_document(document: Mapping[str, object]) -> dict[str, object]:
    """Parse a full n3xusAPI envelope or one page into a recipe record."""

    if "output" in document:
        output = document.get("output") or []
        if not isinstance(output, list) or not output:
            raise ValueError("n3xusAPI document has no output pages")
        return parse_foxx_page(output[0])
    return parse_foxx_page(document)
