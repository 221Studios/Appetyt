#!/usr/bin/env python3
"""Run crawl_recipes for each creator id listed in a queue file."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("usage: run-crawl-queue.py QUEUE_FILE [NAME]")
    path = Path(sys.argv[1])
    name = sys.argv[2] if len(sys.argv) > 2 else path.stem
    order = [line.strip() for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]
    print(f"worker {name} queue={len(order)}", flush=True)
    for cid in order:
        print(f"FULL START {cid}", flush=True)
        rc = subprocess.call(
            [
                "python3",
                "-u",
                "scripts/crawl_recipes.py",
                "--creator-id",
                cid,
                "--limit",
                "0",
                "--delay",
                "0.25",
                "--html-fallback",
            ]
        )
        print(f"FULL DONE {cid} rc={rc}", flush=True)
    print(f"QUEUE DONE {name}", flush=True)


if __name__ == "__main__":
    main()
