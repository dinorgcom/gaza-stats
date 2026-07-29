# -*- coding: utf-8 -*-
"""Erzeugt die JSON-Datenbausteine fuer die Site aus killed-in-gaza.csv + casualties_daily.csv.
Output: site/data/*.json
"""
import csv, json, os, datetime
from collections import Counter, defaultdict

BASE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(BASE, "data")
OUT = os.path.join(BASE, "site", "data")
os.makedirs(OUT, exist_ok=True)
WAR = datetime.date(2023, 10, 7)

def jdump(name, obj):
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
    print(f"-> {name} ({os.path.getsize(os.path.join(OUT, name))} B)")

# ---------- Liste einlesen ----------
rows = []
with open(os.path.join(DATA, "killed-in-gaza.csv"), encoding="utf-8") as f:
    for r in csv.DictReader(f):
        try:
            dob = datetime.date.fromisoformat(r["dob"])
        except ValueError:
            dob = None
        rows.append((int(r["age"]), r["sex"], dob, int(r["update"] or 0)))
total = len(rows)

# ---------- 1) Pyramide (5-Jahres-Buckets) ----------
def b5(a):
    return min(a // 5, 17)  # 0-4 ... 85+
labels = [f"{i*5}–{i*5+4}" for i in range(17)] + ["85+"]
pm = [0]*18; pf = [0]*18
for a, s, _, _ in rows:
    (pm if s == "m" else pf)[b5(a)] += 1
jdump("pyramid.json", {"labels": labels, "m": pm, "f": pf, "total": total})

# ---------- 2) Geschlechterverhaeltnis je Lebensjahr ----------
am = Counter(); af = Counter()
for a, s, _, _ in rows:
    aa = min(a, 90)
    (am if s == "m" else af)[aa] += 1
sex_by_age = [{"age": a, "m": am.get(a, 0), "f": af.get(a, 0)} for a in range(91)]
jdump("sexratio.json", {"byAge": sex_by_age,
                        "popMaleShare": 0.512,  # Gaza-Bevoelkerung 0-19 (PCBS, Geburtenverhaeltnis ~105:100)
                        "note": "m-Anteil der Getoeteten je Lebensjahr vs. Bevoelkerungsanteil"})

# ---------- 3) Saeuglings-Check ----------
u1 = [(dob, s) for a, s, dob, _ in rows if a == 0]
warborn = [(a, dob) for a, s, dob, _ in rows if dob and dob >= WAR]
pre_ramp = Counter(f"{d.year}-{d.month:02d}" for d, s in u1 if d and d < WAR)
post_by_month = Counter(f"{d.year}-{d.month:02d}" for d, s in u1 if d and d >= WAR)
births_per_year = 48500          # PCBS/MoH 2025
imr = 12.3                       # Saeuglingssterblichkeit 2022 je 1000 Geburten (PCBS)
war_months = 34
exp_nat_infant = round(births_per_year / 12 * war_months * imr / 1000)
jdump("infants.json", {
    "listed_under1": len(u1),
    "prewar_born": sum(1 for d, s in u1 if d and d < WAR),
    "warborn_under1": sum(1 for d, s in u1 if d and d >= WAR),
    "warborn_total": len(warborn),
    "warborn_by_age": dict(Counter(a for a, d in warborn)),
    "prewar_birthmonth_ramp": dict(sorted(pre_ramp.items())),
    "warborn_birthmonth": dict(sorted(post_by_month.items())),
    "expected_natural_infant_deaths_war_period": exp_nat_infant,
    "assumptions": {"births_per_year": births_per_year, "imr_per_1000": imr, "war_months": war_months},
})

# ---------- Tageszeitreihe ----------
daily = {}
with open(os.path.join(DATA, "casualties_daily.csv"), encoding="utf-8") as f:
    for r in csv.DictReader(f):
        try:
            d = datetime.date.fromisoformat(r["report_date"])
        except ValueError:
            continue
        daily[d] = r
dates = sorted(daily)

def iv(row, field):
    v = row.get(field) or ""
    return int(v) if v.isdigit() else None

# Woechentliche Summen (Montag als Key) + kumulativ am Wochenende + toedlichster Tag der Woche
weekly = defaultdict(int); weekly_cum = {}; weekly_top = {}
for d in dates:
    k = (d - datetime.timedelta(days=d.weekday())).isoformat()
    v = iv(daily[d], "killed")
    if v:
        weekly[k] += v
        if v > weekly_top.get(k, (None, 0))[1]:
            weekly_top[k] = (d.isoformat(), v)
    c = iv(daily[d], "killed_cum")
    if c: weekly_cum[k] = c
weeks = sorted(weekly)
jdump("timeline.json", {"weeks": [{"w": w, "killed": weekly[w], "cum": weekly_cum.get(w),
                                   "top": weekly_top.get(w)} for w in weeks]})

# ---------- 4) Szenario-Band natuerliche Tote ----------
moh_lancet_date = None
for d in reversed(dates):
    if d <= datetime.date(2025, 1, 5):
        c = iv(daily[d], "killed_cum")
        if c:
            moh_lancet_date = c
            break
monthly_cum = {}
for d in dates:
    c = iv(daily[d], "killed_cum")
    if c: monthly_cum[f"{d.year}-{d.month:02d}"] = c  # letzter Wert je Monat
jdump("natural.json", {
    "monthly_cum": dict(sorted(monthly_cum.items())),
    "population": 2227000,
    "cdr_low": 2.85, "cdr_high": 3.5,          # je 1000/Jahr (US Census 2023 bzw. PCBS)
    "expected_natural_low": round(2227000*2.85/1000/12*war_months),
    "expected_natural_high": round(2227000*3.5/1000/12*war_months),
    "list_60plus": sum(1 for a, s, _, _ in rows if a >= 60),
    "natural_60plus_share": 0.62,               # Anteil 60+ an natuerlichen Todesfaellen (Sterbetafel-Naeherung)
    "lancet": {"violent_est": 75200, "asof": "2025-01-05", "moh_at_date": moh_lancet_date},
    "under_rubble": 10000,
})

# ---------- Hero/Meta ----------
with open(os.path.join(DATA, "summary.json"), encoding="utf-8") as f:
    s = json.load(f)
g = s.get("gaza", {})
jdump("meta.json", {
    "killed_total": g.get("killed", {}).get("total") or 73333,
    "named": total,
    "children": g.get("killed", {}).get("children") or 20179,
    "women": g.get("killed", {}).get("women") or 12500,
    "press": 262, "medical": 1701, "civil_defence": 140,
    "injured": g.get("injured", {}).get("total") or 174023,
    "famine": 463, "famine_children": 157, "aid_seekers": 2615,
    "list_asof": "2026-05-07", "data_updated": s.get("gaza", {}).get("last_update") or "2026-07-28",
})
print("fertig.")
