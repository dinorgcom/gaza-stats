# -*- coding: utf-8 -*-
"""Datenprofil der Killed-in-Gaza-Liste (Tech for Palestine v3, MoH-Liste bis 7.5.2026)
plus Tageszeitreihe. Reines stdlib-Python, Output: Konsole + profile.json
"""
import csv, json, os, statistics, datetime
from collections import Counter, defaultdict

BASE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(BASE, "data")

def parse_int(s):
    try:
        return int(s)
    except (ValueError, TypeError):
        return None

def parse_date(s):
    try:
        return datetime.date.fromisoformat(s)
    except (ValueError, TypeError):
        return None

# ---------- Namensliste ----------
rows = []
with open(os.path.join(DATA, "killed-in-gaza.csv"), encoding="utf-8") as f:
    for r in csv.DictReader(f):
        rows.append({
            "id": r["id"].strip(),
            "en": r["en_name"].strip(),
            "ar": r["ar_name"].strip(),
            "age": parse_int(r["age"]),
            "dob": parse_date(r["dob"]),
            "sex": r["sex"].strip(),
            "update": parse_int(r["update"]),
        })

total = len(rows)
out = {"total": total}
print(f"=== NAMENSLISTE: {total} Einträge ===\n")

# --- Geschlecht ---
sex_c = Counter(r["sex"] for r in rows)
out["sex"] = dict(sex_c)
print("Geschlecht:", dict(sex_c))

# --- Alter ---
ages = [r["age"] for r in rows if r["age"] is not None]
out["age_known"] = len(ages)
out["age_missing"] = total - len(ages)
print(f"\nAlter bekannt: {len(ages)} | fehlt: {total - len(ages)}")
if ages:
    print(f"Median: {statistics.median(ages)} | Mittel: {statistics.mean(ages):.1f} | Min: {min(ages)} | Max: {max(ages)}")

def bucket(a):
    if a is None: return "unbekannt"
    if a < 1: return "<1"
    edges = [(4,"1-4"),(9,"5-9"),(14,"10-14"),(17,"15-17"),(29,"18-29"),(39,"30-39"),
             (49,"40-49"),(59,"50-59"),(69,"60-69"),(79,"70-79"),(99,"80-99")]
    for e,label in edges:
        if a <= e: return label
    return "100+"

order = ["<1","1-4","5-9","10-14","15-17","18-29","30-39","40-49","50-59","60-69","70-79","80-99","100+","unbekannt"]
bs = Counter(bucket(r["age"]) for r in rows)
bm = Counter(bucket(r["age"]) for r in rows if r["sex"]=="m")
bf = Counter(bucket(r["age"]) for r in rows if r["sex"]=="f")
print("\nAltersgruppen (gesamt / m / f):")
for b in order:
    if bs.get(b):
        print(f"  {b:>9}: {bs[b]:6d}  m={bm.get(b,0):6d}  f={bf.get(b,0):6d}")
out["age_buckets"] = {b: {"total": bs.get(b,0), "m": bm.get(b,0), "f": bf.get(b,0)} for b in order}

minors = sum(1 for r in rows if r["age"] is not None and r["age"] < 18)
minors_m = sum(1 for r in rows if r["age"] is not None and r["age"] < 18 and r["sex"]=="m")
eld = sum(1 for r in rows if r["age"] is not None and r["age"] >= 65)
men1859 = sum(1 for r in rows if r["age"] is not None and 18 <= r["age"] <= 59 and r["sex"]=="m")
women18 = sum(1 for r in rows if r["age"] is not None and r["age"] >= 18 and r["sex"]=="f")
cent = sum(1 for r in rows if r["age"] is not None and r["age"] >= 100)
print(f"\nMinderjaehrige (<18): {minors} ({minors/total*100:.1f}%)  davon m: {minors_m}")
print(f"Frauen 18+: {women18} ({women18/total*100:.1f}%)")
print(f"Maenner 18-59: {men1859} ({men1859/total*100:.1f}%)")
print(f"65+: {eld} ({eld/total*100:.1f}%) | 100+: {cent}")
out.update({"minors": minors, "women_adult": women18, "men_18_59": men1859, "age65plus": eld, "age100plus": cent})

# --- Geburtsdatum / "Geburtsurkunde" ---
dob_known = sum(1 for r in rows if r["dob"])
dob_missing_age_known = sum(1 for r in rows if not r["dob"] and r["age"] is not None)
both_missing = sum(1 for r in rows if not r["dob"] and r["age"] is None)
warborn = sum(1 for r in rows if r["dob"] and r["dob"] >= datetime.date(2023,10,7))
print(f"\nGeburtsdatum vorhanden: {dob_known} ({dob_known/total*100:.1f}%)")
print(f"Nur Alter (kein DOB): {dob_missing_age_known} | weder DOB noch Alter: {both_missing}")
print(f"Im Krieg geboren (DOB >= 7.10.2023): {warborn}")
out.update({"dob_known": dob_known, "dob_missing_age_known": dob_missing_age_known,
            "both_missing": both_missing, "warborn": warborn})

# --- Age-Heaping (Endziffern-Praeferenz bei geschaetztem Alter) ---
def heap_share(group):
    last = Counter(a % 10 for a in group)
    n = sum(last.values())
    return (last.get(0,0)+last.get(5,0))/n*100 if n else 0, n
h_nodob, n1 = heap_share([r["age"] for r in rows if r["age"] is not None and 23 <= r["age"] <= 92 and not r["dob"]])
h_dob, n2 = heap_share([r["age"] for r in rows if r["age"] is not None and 23 <= r["age"] <= 92 and r["dob"]])
print(f"\nAge-Heaping (Anteil Alter endet auf 0/5, erwartet ~20%):")
print(f"  ohne DOB: {h_nodob:.1f}% (n={n1}) | mit DOB: {h_dob:.1f}% (n={n2})")
out["age_heaping"] = {"no_dob_pct": round(h_nodob,1), "no_dob_n": n1, "with_dob_pct": round(h_dob,1), "with_dob_n": n2}

# --- IDs ---
idlen = Counter(len(r["id"]) for r in rows)
id_dupes = {k: v for k, v in Counter(r["id"] for r in rows).items() if v > 1}
synth = sum(1 for r in rows if r["id"].startswith("999"))
first_digit = Counter(r["id"][0] for r in rows if r["id"])
print(f"\nID-Laengen: {dict(sorted(idlen.items()))}")
print(f"IDs mit Praefix '999' (vermutl. Platzhalter): {synth} ({synth/total*100:.1f}%)")
print(f"Erste Ziffer: {dict(sorted(first_digit.items()))}")
print(f"Doppelte IDs: {len(id_dupes)}")
out.update({"id_lengths": {str(k): v for k, v in sorted(idlen.items())},
            "id_999_prefix": synth, "id_dupes": len(id_dupes),
            "id_first_digit": dict(sorted(first_digit.items()))})

# --- Doppelte Namen ---
en_c = Counter(r["en"].lower() for r in rows if r["en"])
en_dupes = {k: v for k, v in en_c.items() if v > 1}
n_dupe_persons = sum(en_dupes.values())
print(f"\nExakt gleicher engl. Name mehrfach: {len(en_dupes)} Namen, {n_dupe_persons} Personen")
print("Top 10 haeufigste vollstaendige Namen:")
for name, c in en_c.most_common(10):
    print(f"  {c:3d}x {name}")
name_age = Counter((r["en"].lower(), r["age"]) for r in rows if r["en"] and r["age"] is not None)
na_dupes = sum(v for v in name_age.values() if v > 1)
name_dob = Counter((r["ar"], r["dob"]) for r in rows if r["ar"] and r["dob"])
nd_dupes = sum(v for v in name_dob.values() if v > 1)
print(f"Gleicher Name UND gleiches Alter: {na_dupes} Personen")
print(f"Gleicher arab. Name UND gleiches Geburtsdatum: {nd_dupes} Personen")
out.update({"name_dupes_distinct": len(en_dupes), "name_dupes_persons": n_dupe_persons,
            "name_age_dupe_persons": na_dupes, "name_dob_dupe_persons": nd_dupes,
            "top_names": en_c.most_common(15)})

# --- Familien-Proxy: fortlaufende ID-Bloecke ---
real_ids = sorted(int(r["id"]) for r in rows if r["id"].isdigit() and not r["id"].startswith("999"))
runs, run = [], 1
for a, b in zip(real_ids, real_ids[1:]):
    if b - a <= 2:
        run += 1
    else:
        if run >= 3: runs.append(run)
        run = 1
if run >= 3: runs.append(run)
print(f"\nID-Cluster (>=3 fast-fortlaufende IDs, Familien-Proxy): {len(runs)} Cluster, "
      f"{sum(runs)} Personen, groesster: {max(runs) if runs else 0}")
out["id_clusters"] = {"count": len(runs), "persons": sum(runs), "max": max(runs) if runs else 0}

# --- Update-Kohorten (welche MoH-Liste hat wen zuerst erfasst) ---
print("\nKohorten nach Listen-Update (update, n, %f, median Alter, %ohne DOB, %65+):")
coh = defaultdict(list)
for r in rows:
    coh[r["update"]].append(r)
out["cohorts"] = []
for u in sorted(coh, key=lambda x: (x is None, x)):
    g = coh[u]
    ga = [r["age"] for r in g if r["age"] is not None]
    f_share = sum(1 for r in g if r["sex"]=="f")/len(g)*100
    nodob = sum(1 for r in g if not r["dob"])/len(g)*100
    e65 = sum(1 for r in g if r["age"] is not None and r["age"]>=65)/len(g)*100
    med = statistics.median(ga) if ga else None
    print(f"  u{u}: n={len(g):6d}  f={f_share:4.1f}%  medAlter={med}  ohneDOB={nodob:4.1f}%  65+={e65:4.1f}%")
    out["cohorts"].append({"update": u, "n": len(g), "f_pct": round(f_share,1),
                           "median_age": med, "no_dob_pct": round(nodob,1), "age65_pct": round(e65,1)})

# ---------- Tageszeitreihe ----------
print("\n=== TAGESZEITREIHE ===")
daily = {}
with open(os.path.join(DATA, "casualties_daily.csv"), encoding="utf-8") as f:
    for r in csv.DictReader(f):
        d = parse_date(r["report_date"])
        if d: daily[d] = r  # letzte Zeile pro Datum gewinnt

dates = sorted(daily)
print(f"Zeitraum: {dates[0]} bis {dates[-1]} ({len(dates)} Tage)")
last = daily[dates[-1]]
def last_val(field):
    for d in reversed(dates):
        v = parse_int(daily[d].get(field) or "")
        if v is not None: return v, d
    return None, None

for field, label in [("killed_cum","killed_cum (offiziell)"), ("ext_killed_cum","ext_killed_cum (extrapoliert)"),
                     ("famine_cum","Hungertote kumuliert"), ("child_famine_cum","davon Kinder"),
                     ("aid_seeker_killed_cum","Aid-Seeker getoetet kumuliert"), ("injured_cum","Verletzte kumuliert")]:
    v, d = last_val(field)
    print(f"  {label}: {v} (Stand {d})")
    out[field] = v

killed_daily = {d: parse_int(daily[d].get("killed") or "") for d in dates}
killed_daily = {d: v for d, v in killed_daily.items() if v is not None}
top_days = sorted(killed_daily.items(), key=lambda x: -x[1])[:8]
print("\nTop-8 Tage (neu gemeldete Tote):")
for d, v in top_days:
    print(f"  {d}: {v}")
out["top_days"] = [(str(d), v) for d, v in top_days]

monthly = defaultdict(int)
for d, v in killed_daily.items():
    monthly[f"{d.year}-{d.month:02d}"] += v
print("\nMonatssummen (neu gemeldete Tote):")
for m in sorted(monthly):
    print(f"  {m}: {monthly[m]:6d}")
out["monthly"] = dict(sorted(monthly.items()))

post_cf = sum(v for d, v in killed_daily.items() if d >= datetime.date(2025,10,11))
print(f"\nSeit Ceasefire 10.10.2025 neu gemeldet: {post_cf}")
out["post_ceasefire_reported"] = post_cf

with open(os.path.join(BASE, "profile.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1, default=str)
print("\n-> profile.json geschrieben")
