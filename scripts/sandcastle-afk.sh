#!/usr/bin/env bash
# Local Sandcastle loop. Does not push. Does not git add. Stops after 6 hours.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
if [[ -f .sandcastle/.env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .sandcastle/.env
  set +a
fi
mkdir -p .sandcastle/logs
LOG=".sandcastle/logs/afk-$(date +%Y%m%d-%H%M%S).log"
echo "Sandcastle AFK started $(date -Is) log=$LOG" >>"$LOG"
exec timeout 6h npm run sandcastle >>"$LOG" 2>&1
