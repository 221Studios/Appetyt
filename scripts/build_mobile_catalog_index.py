"""Build the lightweight frontend catalog index from the public full catalog."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from scripts.export_mvp_mobile_catalog import build_mobile_catalog_index


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = ROOT / "appetyt-mobile" / "public" / "recipes.json"
DEFAULT_OUTPUT = ROOT / "appetyt-mobile" / "public" / "recipes-index.json"


def build_index(source: Path = DEFAULT_SOURCE, output: Path = DEFAULT_OUTPUT) -> dict[str, int | str]:
    recipes = json.loads(source.read_text(encoding="utf-8"))
    index = [build_mobile_catalog_index(recipe) for recipe in recipes]
    output.write_text(json.dumps(index, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    return {
        "recipes": len(index),
        "source_bytes": source.stat().st_size,
        "index_bytes": output.stat().st_size,
        "output": str(output),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    print(json.dumps(build_index(args.source, args.output), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
