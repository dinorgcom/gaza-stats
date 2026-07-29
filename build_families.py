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

# Getoetete Journalisten (TfP press-Dataset) je Familie zaehlen -> Badge-Daten.
# Zusaetzlich die NAMEN mitfuehren: das Journalisten-Abzeichen soll im Detail-Panel
# sagen, WER es traegt, nicht nur wie viele.
press_by_fam = {}
press_names = defaultdict(list)


def outlet_of(notes):
    """Medium aus dem CPJ-Fliesstext ziehen — konservativ: nur klare Muster,
    sonst lieber nichts als eine falsche Zuschreibung."""
    if not notes:
        return None
    import re
    pats = [r"(?:worked|working|works) (?:as [^,]+ )?(?:for|with|at) ([A-Z][^,.;()]{2,44})",
            r"(?:a|an) [a-z ]*(?:journalist|photojournalist|reporter|correspondent|cameraman|photographer|editor)"
            r" (?:for|with|at) ([A-Z][^,.;()]{2,44})"]
    for p in pats:
        m = re.search(p, notes)
        if m:
            o = m.group(1).strip().rstrip(".,;")
            o = re.sub(r"\s+(?:news agency|news network|TV channel|satellite channel)$", "", o, flags=re.I)
            if 2 < len(o) < 45:
                return o
    return None


try:
    with open(os.path.join(BASE, "data", "press_killed_in_gaza.json"), encoding="utf-8") as f:
        press = json.load(f)
    for p in press:
        en = (p.get("name_en") or p.get("en_name") or "").strip()
        if en:
            k = fam_key(en)
            press_by_fam[k] = press_by_fam.get(k, 0) + 1
            press_names[k].append({"n": en, "o": outlet_of(p.get("notes"))})
    with_outlet = sum(1 for v in press_names.values() for x in v if x["o"])
    print(f"Presse-Liste: {len(press)} Eintraege, {len(press_by_fam)} Familien betroffen, "
          f"{with_outlet} mit erkanntem Medium")
except Exception as e:
    print("Presse-Liste nicht ladbar:", e)

# Getoetete Gesundheitsarbeiter (Healthcare Workers Watch, Namensliste Stand 10.5.2024) je Familie.
# Quelle-PDF: data/hww_report_2024-05.pdf — nummerierte Eintraege "N. Name, Beruf[, Ort]".
hw_by_fam = {}
hw_names = defaultdict(list)
try:
    import re
    from pypdf import PdfReader
    txt = "\n".join(p.extract_text() or "" for p in PdfReader(os.path.join(BASE, "data", "hww_report_2024-05.pdf")).pages)
    # Matching gegen unsere Familien mit Transliterations-Normalisierung (AlShaikh ~ al-sheikh usw.)
    norm = lambda s: re.sub(r"^al", "", s.replace("-", "").replace(" ", "").replace("'", "").replace("’", ""))
    norm_fams = {}
    for k in fams:  # groessere Familien gewinnen bei Kollision
        norm_fams.setdefault(norm(k), k)
    parsed, matched, seen_names = 0, 0, set()
    for m in re.finditer(r"^\s*(\d{1,4})\.\s*(.+)$", txt, re.M):
        num, line = int(m.group(1)), m.group(2).strip()
        if num > 2000:
            continue
        parts = [p.strip() for p in line.split(",")]
        name = re.sub(r"^(Dr|Prof|Mr|Ms|Mrs)\.?\s+", "", parts[0]).strip()
        prof = parts[1] if len(parts) > 1 else ""
        if len(name.split()) < 2 or name.lower() in seen_names:
            continue
        seen_names.add(name.lower())
        parsed += 1
        k = norm_fams.get(norm(fam_key(name)))
        if not k:
            continue
        matched += 1
        hw_by_fam[k] = hw_by_fam.get(k, 0) + 1
        if len(hw_names[k]) < 8:
            hw_names[k].append({"n": name, "o": prof[:60]})
    print(f"HWW-Liste: {parsed} Eintraege geparst, {matched} gematcht, {len(hw_by_fam)} Familien betroffen")
except Exception as e:
    print("HWW-Liste nicht parsebar:", e)

fam_list = []
for k, F in fams.items():
    clusters = [c for c in F["chains"].values() if c >= 2]
    entry = {"k": k, "n": F["n"], "m": F["m"], "f": F["f"], "kids": F["kids"],
             "sib": len(clusters), "big": max(clusters) if clusters else 0}
    if press_by_fam.get(k):
        entry["p"] = press_by_fam[k]
        # Namen der getoeteten Journalisten dieser Familie (fuers Abzeichen im Panel)
        entry["pn"] = [{k2: v2 for k2, v2 in x.items() if v2} for x in press_names[k][:8]]
    if hw_by_fam.get(k):
        entry["hw"] = hw_by_fam[k]
        entry["hwn"] = hw_names[k]
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
