# -*- coding: utf-8 -*-
"""Familien-Gruppierung + Suchliste.
Heuristik (palaest. Namenskette: Eigenname – Vater – Grossvater – Familienname):
  famKey  = letzter Token (mit 'abu'-Vorsatz, falls vorhanden)
  Geschwister-Cluster = gleiche (Vater, Grossvater, famKey) bei >= 4 Tokens
Output: site/data/families.json (Aggregat) + site/data/list.json (kompakte Suchliste)
"""
import csv, json, os
from collections import defaultdict

BASE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE, "site", "data")

def fam_key(en):
    t = en.lower().replace("’", "'").split()
    if len(t) < 2:
        return en.lower()
    if len(t) >= 2 and t[-2] in ("abu", "abo", "abou"):
        return t[-2] + " " + t[-1]
    return t[-1]

rows = []
with open(os.path.join(BASE, "data", "killed-in-gaza.csv"), encoding="utf-8") as f:
    for r in csv.DictReader(f):
        rows.append((r["en_name"].strip(), r["ar_name"].strip(),
                     int(r["age"]) if r["age"].isdigit() else None, r["sex"].strip()))

fams = defaultdict(lambda: {"n": 0, "m": 0, "f": 0, "kids": 0, "chains": defaultdict(int)})
for en, ar, age, sex in rows:
    k = fam_key(en)
    F = fams[k]
    F["n"] += 1
    F["m" if sex == "m" else "f"] += 1
    if age is not None and age < 18:
        F["kids"] += 1
    t = en.lower().split()
    if len(t) >= 4:
        F["chains"][(t[1], t[2])] += 1  # Vater+Grossvater innerhalb der Familie

# Getoetete Journalisten (TfP press-Dataset) je Familie zaehlen -> Badge-Daten
press_by_fam = {}
try:
    with open(os.path.join(BASE, "data", "press_killed_in_gaza.json"), encoding="utf-8") as f:
        press = json.load(f)
    for p in press:
        en = (p.get("name_en") or p.get("en_name") or "").strip()
        if en:
            k = fam_key(en)
            press_by_fam[k] = press_by_fam.get(k, 0) + 1
    print(f"Presse-Liste: {len(press)} Eintraege, {len(press_by_fam)} Familien betroffen")
except Exception as e:
    print("Presse-Liste nicht ladbar:", e)

fam_list = []
for k, F in fams.items():
    clusters = [c for c in F["chains"].values() if c >= 2]
    entry = {"k": k, "n": F["n"], "m": F["m"], "f": F["f"], "kids": F["kids"],
             "sib": len(clusters), "big": max(clusters) if clusters else 0}
    if press_by_fam.get(k):
        entry["p"] = press_by_fam[k]
    fam_list.append(entry)
fam_list.sort(key=lambda x: -x["n"])
fam_index = {f["k"]: i for i, f in enumerate(fam_list)}

with open(os.path.join(OUT, "families.json"), "w", encoding="utf-8") as f:
    json.dump(fam_list, f, ensure_ascii=False, separators=(",", ":"))
print(f"families.json: {len(fam_list)} Familiennamen, groesste: "
      + ", ".join(f'{x["k"]} ({x["n"]})' for x in fam_list[:8]))

compact = [[en, ar, age, sex, fam_index[fam_key(en)]] for en, ar, age, sex in rows]
with open(os.path.join(OUT, "list.json"), "w", encoding="utf-8") as f:
    json.dump(compact, f, ensure_ascii=False, separators=(",", ":"))
sz = os.path.getsize(os.path.join(OUT, "list.json")) / 1e6
print(f"list.json: {len(compact)} Eintraege, {sz:.1f} MB")

big_clusters = sorted(((k, c) for k, F in fams.items() for c in F["chains"].values() if c >= 6),
                      key=lambda x: -x[1])[:10]
print("groesste Geschwister-Cluster (Vater+Grossvater+Familie):", big_clusters)
