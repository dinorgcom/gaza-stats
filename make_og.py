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

# ---------- (b) OG-Bild 1200x630 mit Text ----------
og = cover(red, 1200, 630)
og = ImageEnhance.Brightness(og).enhance(0.82)
# dunkler Verlauf unten fuer Textkontrast
grad = Image.new("L", (1, 630))
for y in range(630):
    grad.putpixel((0, y), int(max(0, (y - 240) / 390) ** 1.2 * 235))
og = Image.composite(Image.new("RGB", og.size, (5, 2, 2)), og, grad.resize(og.size))

d = ImageDraw.Draw(og)
F = r"C:\Windows\Fonts"
serif_b = ImageFont.truetype(os.path.join(F, "georgiab.ttf"), 92)
serif = ImageFont.truetype(os.path.join(F, "georgia.ttf"), 44)
sans = ImageFont.truetype(os.path.join(F, "arial.ttf"), 26)

GOLD, WHITE, GREY = (212, 168, 83), (245, 242, 238), (196, 188, 180)
d.text((60, 356), "GAZA", font=serif_b, fill=GOLD)
w = d.textlength("GAZA", font=serif_b)
d.text((60 + w + 24, 396), "— MAKE UP YOUR MIND", font=serif, fill=WHITE)
d.text((62, 486), "72,835 names, examined: age pyramid · combatant deduction · your own calculation",
       font=sans, fill=GREY)
d.text((62, 526), "English · العربية · עברית · Deutsch", font=sans, fill=GREY)
d.line([(62, 572), (330, 572)], fill=GOLD, width=2)
d.text((62, 582), "biest.com/gaza", font=sans, fill=GOLD)

og.save(os.path.join(BASE, "site", "og.jpg"), quality=88)
print("og:", og.size)
