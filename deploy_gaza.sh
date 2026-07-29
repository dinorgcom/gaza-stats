#!/usr/bin/env bash
# One-shot: rebuild data aggregates -> copy static site into biest.com repo -> push.
#
#   bash deploy_gaza.sh              # deploy as-is
#   REFRESH=1 bash deploy_gaza.sh    # re-download latest casualty data first
#
# Same pattern as gapminder-3d/deploy_gapminder.sh: biest.com is the Vercel-built
# artmarcovici-next repo; static projects live under public/<name>.
set -euo pipefail
ROOT=/c/Users/mike/Documents/kimi/workspace/gaza-stats
SITE=/c/Users/mike/artmarcovici-next

cd "$ROOT"

if [ -n "${REFRESH:-}" ]; then
  echo "== refreshing source data (Tech for Palestine) =="
  curl -sL -o data/killed-in-gaza.csv  https://data.techforpalestine.org/api/v3/killed-in-gaza.csv
  curl -sL -o data/casualties_daily.csv https://data.techforpalestine.org/api/v2/casualties_daily.csv
  curl -sL -o data/summary.json        https://data.techforpalestine.org/api/v3/summary.json
  curl -sL -o data/press_killed_in_gaza.json https://data.techforpalestine.org/api/v2/press_killed_in_gaza.json
fi

echo "== building data aggregates =="
python build_modules.py
python build_families.py

echo "== deploying to biest.com (git push -> Vercel) =="
rm -rf "$SITE/public/gaza"
cp -r "$ROOT/site" "$SITE/public/gaza"
cd "$SITE"
git add public/gaza
git commit -m "gaza: content update (data/build)" || echo "nothing to commit"
git push origin master
echo "done — Vercel builds now; check https://biest.com/gaza in ~3 min"
