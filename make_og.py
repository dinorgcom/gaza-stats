# -*- coding: utf-8 -*-
"""Rot eingefaerbtes Sentinel-2-Bild des Gazastreifens als (a) Kasten-Hintergrund
fuer die biest.com-Main und (b) OG-Preview-Bild fuer biest.com/gaza.
Quelle: Wikimedia Commons "Gaza Strip S2A 1282 crop 10" — contains modified
Copernicus Sentinel data (2016), frei nutzbar mit Attribution.
"""
import os
from PIL import Image, ImageOps, ImageDraw, ImageFont, ImageEnhance

BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, "assets", "gaza_s2.jpg")
SITE_REPO = r"C:\Users\mike\artmarcovici-next"

# ---------- Rot-Duotone ----------
im = Image.open(SRC).convert("L")
im = im.crop((60, 60, im.width - 210, im.height - 230))   # eingebrannte Rand-Credits der Quelle entfernen
im = ImageOps.autocontrast(im, cutoff=1)

STOPS = [(0, (10, 3, 3)), (110, (122, 24, 16)), (200, (204, 62, 38)), (255, (238, 132, 84))]
def lut(channel):
    out = []
    for v in range(256):
        for (a, ca), (b, cb) in zip(STOPS, STOPS[1:]):
            if a <= v <= b:
                f = (v - a) / (b - a) if b > a else 0
                out.append(round(ca[channel] + f * (cb[channel] - ca[channel])))
                break
    return out
red = im.point(lut(0) + lut(1) + lut(2), mode=None) if False else Image.merge("RGB",
    [im.point(lut(c)) for c in range(3)])

# Querformat: Streifen horizontal legen
red = red.rotate(90, expand=True)          # 5076x3928

def cover(img, w, h):
    return ImageOps.fit(img, (w, h), Image.LANCZOS, centering=(0.5, 0.45))

# ---------- (a) Kasten-Hintergrund Main ----------
card = cover(red, 1600, 900)
card = ImageEnhance.Brightness(card).enhance(0.9)
card.save(os.path.join(SITE_REPO, "public", "images", "gaza-card.jpg"), quality=84)
print("card:", card.size)

# ---------- (b) OG-Bild 1200x630: die Alterspyramide selbst ----------
# Geteilt statt Satellitenbild: die Grafik ist die Aussage. Daten wie auf der Seite,
# inklusive des voreingestellten IDF-Kombattanten-Abzugs als dunkler Anteil.
import json
with open(os.path.join(BASE, "site", "data", "sexratio.json"), encoding="utf-8") as f:
    AGES = json.load(f)["byAge"]

og = Image.new("RGB", (1200, 630), (13, 13, 13))
d = ImageDraw.Draw(og)

CX, STRIP, ROW, BARH = 868, 42, 6.2, 4.8
Y0, HALF, MAXV = 598, 228, 2000
COMBAT = 22000                                    # Default der Seite (IDF-Angabe)
C_M, C_F, C_C = (57, 135, 229), (217, 89, 38), (28, 74, 134)
pool = sum(a["m"] for a in AGES if 16 <= a["age"] <= 59)
sc = lambda v: v / MAXV * HALF

for a in AGES:
    y = Y0 - a["age"] * ROW
    wm, wf = sc(a["m"]), sc(a["f"])
    d.rectangle([CX + STRIP / 2, y, CX + STRIP / 2 + max(wm, 1), y + BARH], fill=C_M)
    d.rectangle([CX - STRIP / 2 - max(wf, 1), y, CX - STRIP / 2, y + BARH], fill=C_F)
    if 16 <= a["age"] <= 59:                      # Kombattanten-Anteil am aeusseren Ende
        wc = sc(COMBAT * a["m"] / pool)
        d.rectangle([CX + STRIP / 2 + wm - wc, y, CX + STRIP / 2 + wm, y + BARH], fill=C_C)

F = r"C:\Windows\Fonts"
tick = ImageFont.truetype(os.path.join(F, "arial.ttf"), 12)
for age in (0, 20, 40, 60, 80):
    d.text((CX, Y0 - age * ROW + BARH / 2), str(age), font=tick, fill=(137, 135, 129), anchor="mm")

# Verlauf nach links, damit der Text auf ruhigem Grund sitzt
mask = Image.new("L", (1200, 1))
for x in range(1200):
    mask.putpixel((x, 0), int(min(1, max(0, (x - 400) / 190)) * 255))
og = Image.composite(og, Image.new("RGB", og.size, (13, 13, 13)), mask.resize(og.size))
d = ImageDraw.Draw(og)   # Composite liefert ein neues Bild — Text braucht ein frisches Draw

serif_b = ImageFont.truetype(os.path.join(F, "georgiab.ttf"), 80)
serif = ImageFont.truetype(os.path.join(F, "georgia.ttf"), 38)
sans = ImageFont.truetype(os.path.join(F, "arial.ttf"), 24)
small = ImageFont.truetype(os.path.join(F, "arial.ttf"), 19)

GOLD, WHITE, GREY = (212, 168, 83), (245, 242, 238), (196, 188, 180)
d.text((58, 118), "GAZA", font=serif_b, fill=GOLD)
d.text((60, 214), "— MAKE UP YOUR MIND", font=serif, fill=WHITE)
d.text((62, 300), "72,835 named dead by age and sex.", font=sans, fill=WHITE)
d.text((62, 336), "The dark share: 22,000 combatants as", font=sans, fill=GREY)
d.text((62, 366), "claimed by the IDF — change it yourself.", font=sans, fill=GREY)
# Legende
for i, (col, lbl) in enumerate([(C_F, "women"), (C_M, "men"), (C_C, "of them combatants")]):
    yy = 426 + i * 30
    d.rectangle([62, yy + 4, 76, yy + 16], fill=col)
    d.text((86, yy), lbl, font=small, fill=GREY)
d.line([(62, 546), (300, 546)], fill=GOLD, width=2)
d.text((62, 556), "biest.com/gaza", font=sans, fill=GOLD)
d.text((62, 592), "English · العربية · עברית · Deutsch", font=small, fill=(137, 135, 129))

og.save(os.path.join(BASE, "site", "og-pyramid.jpg"), quality=88)
print("og-pyramid:", og.size)
