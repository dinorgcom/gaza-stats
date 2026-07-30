/* Alterspyramide als flache SVG-Grafik: ein Balken pro Lebensjahr (0–90+).
   Männer rechts (blau), Frauen links (orange); der Kombattanten-Abzug erscheint als
   dunkler Anteil am äußeren Ende der Männer-Balken. Ersetzt die frühere WebGL-Fassung:
   kein Gesten-Konflikt beim Scrollen, keine externe 3D-Bibliothek. */
(function () {
  function ready(fn) { window.SEXBYAGE ? fn() : document.addEventListener("pyr-data", fn, { once: true }); }

  ready(function () {
    const host = document.getElementById("pyrChart");
    if (!host) return;
    const DATA = window.SEXBYAGE;                    // [{age, m, f}] 0..90
    const nf = new Intl.NumberFormat(window.NUMLOC || "de-DE");
    const cssv = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
    const COL_M = cssv("--m"), COL_F = cssv("--f"), COL_C = "#1c4a86";

    const S = "http://www.w3.org/2000/svg";
    const el = (n, a) => { const e = document.createElementNS(S, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
    const txt = (e, s) => { e.textContent = s; return e; };

    const n = DATA.length, ROW = 7.2;
    const W = 960, T = 22, B = 46, CENTER = 54, Rp = 26;
    const ph = n * ROW, H = T + ph + B;
    const half = (W - CENTER) / 2 - Rp;
    const maxV = Math.max(...DATA.map(d => Math.max(d.m, d.f)));
    const step = maxV > 1200 ? 500 : 250;
    const scale = v => v / (Math.ceil(maxV / step) * step) * half;
    const cx = W / 2;
    const xm = v => cx + CENTER / 2 + scale(v);        // Maenner nach rechts
    const xf = v => cx - CENTER / 2 - scale(v);        // Frauen nach links
    const y = i => T + ph - (i + 1) * ROW;            // Alter 0 unten

    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img",
      "aria-label": (window.t ? t("pyr.axis.per") : "Tote pro Lebensjahr") });

    // Raster + Achsenwerte (beide Seiten)
    for (let v = step; v <= Math.ceil(maxV / step) * step; v += step) {
      [xm(v), xf(v)].forEach(X => {
        svg.appendChild(el("line", { x1: X, x2: X, y1: T, y2: T + ph, class: "grid-line" }));
        svg.appendChild(txt(el("text", { x: X, y: T + ph + 18, "text-anchor": "middle", class: "axis-label" }),
          nf.format(v)));
      });
    }
    svg.appendChild(el("line", { x1: xm(0), x2: xm(0), y1: T, y2: T + ph, class: "axis-line" }));
    svg.appendChild(el("line", { x1: xf(0), x2: xf(0), y1: T, y2: T + ph, class: "axis-line" }));
    svg.appendChild(txt(el("text", { x: W / 2, y: H - 8, "text-anchor": "middle", class: "axis-label" }),
      window.t ? t("pyr.axis.per") : "Tote pro Lebensjahr"));

    // Balken je Lebensjahr
    const BH = ROW - 1.6;
    const male = [], overlay = [];
    DATA.forEach((d, i) => {
      const yy = y(i);
      const wf = Math.max(scale(d.f), 0.8), wm = Math.max(scale(d.m), 0.8);
      svg.appendChild(el("rect", { x: xf(d.f), y: yy, width: wf, height: BH, fill: COL_F, rx: 1.2 }));
      const rm = el("rect", { x: xm(0), y: yy, width: wm, height: BH, fill: COL_M, rx: 1.2 });
      svg.appendChild(rm); male.push(rm);
      const ov = el("rect", { x: xm(0), y: yy, width: 0, height: BH, fill: COL_C, rx: 1.2, visibility: "hidden" });
      svg.appendChild(ov); overlay.push(ov);
      // Altersbeschriftung in der Mitte, alle 5 Jahre
      if (d.age % 5 === 0)
        svg.appendChild(txt(el("text", { x: cx, y: yy + BH - 0.6, "text-anchor": "middle",
          fill: cssv("--ink-2"), "font-size": "9.5" }), d.age === 90 ? "90+" : d.age));
    });

    // Zeilenweise Hover: eine unsichtbare Flaeche pro Jahrgang (grosszuegiges Ziel)
    DATA.forEach((d, i) => {
      const hit = el("rect", { x: 0, y: y(i) - 0.8, width: W, height: ROW, fill: "transparent" });
      hit.addEventListener("mousemove", ev => {
        const age = d.age === 90 ? "90+" : d.age;
        const c = combatOf(i);
        window.__tip.showTip(
          `<div class="tt-h">${window.t ? t("pyr.axis.age") : "Alter"} ${age}</div>` +
          `<b>${nf.format(d.m)}</b> ${window.t ? t("pyr.men") : "Männer"} · <b>${nf.format(d.f)}</b> ${window.t ? t("pyr.women") : "Frauen"}` +
          (c ? `<br><span class="tt-h">${t("pyr.tip.combat", nf.format(c))}</span>` : ""),
          ev.clientX, ev.clientY);
      });
      hit.addEventListener("mouseleave", () => window.__tip.hideTip());
      svg.appendChild(hit);
    });

    host.appendChild(svg);

    // Kombattanten-Szenario: N Kaempfer proportional auf maennliche Tote 16–59
    let combatN = window.__combatN || 0;
    const pool = DATA.filter(d => d.age >= 16 && d.age <= 59).reduce((s, d) => s + d.m, 0);
    const combatOf = i => {
      const d = DATA[i];
      return (combatN && d.age >= 16 && d.age <= 59) ? Math.round(combatN * d.m / pool) : 0;
    };
    function drawCombat() {
      DATA.forEach((d, i) => {
        const c = combatOf(i), ov = overlay[i];
        if (!c) { ov.setAttribute("visibility", "hidden"); return; }
        const wc = Math.min(scale(c), scale(d.m));
        ov.setAttribute("visibility", "visible");
        ov.setAttribute("x", xm(d.m) - wc);
        ov.setAttribute("width", Math.max(wc, 0.8));
      });
    }
    document.addEventListener("combat-scenario", e => { combatN = e.detail.n; drawCombat(); });
    drawCombat();

    // Tabellen-Zwilling (5-Jahres-Gruppen)
    const P = window.PYR;
    document.getElementById("pyrTable").innerHTML =
      `<table><thead><tr><th>${window.t ? t("pyr.axis.age") : "Alter"}</th><th>${window.t ? t("pyr.men") : "Männer"}</th>` +
      `<th>${window.t ? t("pyr.women") : "Frauen"}</th><th>${window.t ? t("pyr.col.total") : "gesamt"}</th></tr></thead><tbody>` +
      P.labels.map((l, i) => `<tr><td>${l}</td><td>${nf.format(P.m[i])}</td><td>${nf.format(P.f[i])}</td>` +
        `<td>${nf.format(P.m[i] + P.f[i])}</td></tr>`).join("") + "</tbody></table>";
  });
})();
