#!/usr/bin/env bash
set -u
cd /home/n3xus/Projekty/Appetyt
mkdir -p .sandcastle/logs

# Stop every crawl worker / orchestrator
pkill -9 -f 'scripts/crawl_recipes.py' 2>/dev/null || true
pkill -9 -f 'blog-crawl-w' 2>/dev/null || true
pkill -9 -f 'crawl-queue-' 2>/dev/null || true
sleep 2

python3 - << 'PY'
import re
from pathlib import Path
from scripts.crawl_recipes import website_creators

done = {"policzona_szama", "tomasz_strzelczyk"}
for p in Path(".sandcastle/logs").glob("blog-crawl*.log"):
    text = p.read_text(errors="replace")
    for m in re.finditer(r"FULL DONE (\S+)", text):
        done.add(m.group(1))
# mallory mid-run earlier — treat as not done so a worker finishes it
Path(".sandcastle/crawl-done.txt").write_text("\n".join(sorted(done)) + "\n")
remaining = [r[0] for r in website_creators(allow_no_jsonld=True) if r[0] not in done]
n = 5
for i in range(n):
    q = remaining[i::n]
    Path(f".sandcastle/crawl-queue-{i}.txt").write_text("\n".join(q) + "\n")
    print(f"W{i}: {len(q)} {q[:3]}")
print("remaining", len(remaining), "done", len(done))
PY

for i in 0 1 2 3 4; do
  log=".sandcastle/logs/blog-crawl-w${i}-$(date +%Y%m%d-%H%M%S).log"
  file=".sandcastle/crawl-queue-${i}.txt"
  echo "launch W${i} log=${log}"
  nohup python3 -u ".sandcastle/run-crawl-queue.py" "$file" "w${i}" >>"$log" 2>&1 &
  echo "pid=$!"
done

sleep 3
echo "RUNNING:"
pgrep -af 'scripts/crawl_recipes.py' | grep -v grep || true
pgrep -af 'run-crawl-queue.py' | grep -v grep || true
