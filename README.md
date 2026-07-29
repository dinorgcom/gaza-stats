# Gaza: The Dead, in Numbers — biest.com/gaza

Statistical examination of the Gaza Health Ministry casualty list (consolidated by Iraq Body Count,
72,835 named entries as of May 7, 2026). Interactive site in DE/EN/AR/HE.

- **Live:** https://biest.com/gaza
- **Data:** `data/` (killed-in-gaza.csv, daily time series, press & healthcare-worker lists)
- **Pipeline:** `build_modules.py` (chart aggregates) and `build_families.py` (family/clan index,
  badge matching) generate `site/data/*.json`
- **Site:** `site/` — static HTML/JS (Three.js via CDN), no build step
- `analyze.py` prints the full data profile used in the methods section

Every check on the site is reproducible from this repo. Sources are linked in the
methods section of the site itself.
