/* Gaza-Statistik — 2D-Module (SVG), Tooltip, Tabellen. */
(async function () {
  const get = async n => (await fetch("data/" + n)).json();
  const [META, PYR, SEX, INF, NAT, TL] = await Promise.all(
    ["meta.json", "pyramid.json", "sexratio.json", "infants.json", "natural.json", "timeline.json"].map(get));
  window.PYR = PYR; // fuer pyramid3d.js
  window.SEXBYAGE = SEX.byAge; // Einzeljahres-Daten fuer die Pyramide
  window.TOTAL_KILLED = META.killed_total;
  document.dispatchEvent(new CustomEvent("pyr-data"));

  const nf = new Intl.NumberFormat(window.NUMLOC || "de-DE");
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const C = { m: css("--m"), f: css("--f"), est: css("--est"), grid: css("--grid"), axis: css("--axis"),
              muted: css("--muted"), ink: css("--ink"), ink2: css("--ink-2") };

  // Jungen-Ueberhang 12–17: maennliche Tote ueber dem demografisch erwarteten
  // Verhaeltnis (105:100). Wird in Check 2 geregelt und im Rechner verbraucht.
  const BOYS_SURPLUS = Math.round(SEX.byAge.filter(d => d.age >= 12 && d.age <= 17)
    .reduce((s, d) => s + Math.max(0, d.m - 1.045 * d.f), 0));

  // Quickset-Knoepfe unter einem Regler: setzen ihn und markieren sich selbst.
  function wireQuick(quickId, slider, onSet) {
    const box = document.getElementById(quickId);
    box.addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      slider.value = b.dataset.v; onSet();
    });
    return () => box.querySelectorAll("button").forEach(b =>
      b.classList.toggle("active", +b.dataset.v === +slider.value));
  }

  // ---------- Tooltip ----------
  const tip = document.getElementById("tooltip");
  function showTip(html, x, y) {
    tip.innerHTML = html; tip.hidden = false;
    const r = tip.getBoundingClientRect();
    tip.style.left = Math.min(x + 14, innerWidth - r.width - 10) + "px";
    tip.style.top = Math.min(y + 14, innerHeight - r.height - 10) + "px";
  }
  const hideTip = () => { tip.hidden = true; };
  window.__tip = { showTip, hideTip, nf };

  // ---------- KPIs ----------
  document.getElementById("kpis").innerHTML = [
    [META.killed_total, t("kpi.total")],
    [META.named, t("kpi.named")],
    [META.children, t("kpi.children")],
    [META.women, t("kpi.women")],
    [META.injured, t("kpi.injured")],
    [META.famine, t("kpi.famine")],
  ].map(([v, l]) => `<div class="kpi"><b>${nf.format(v)}</b><span>${l}</span></div>`).join("");
  document.getElementById("asof").textContent =
    t("asof", META.data_updated);

  // ---------- SVG-Helfer ----------
  const S = "http://www.w3.org/2000/svg";
  const el = (n, a) => { const e = document.createElementNS(S, n); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const txt = (e, s) => { e.textContent = s; return e; };
  function frame(mount, W, H) {
    const svg = el("svg", { viewBox: `0 0 ${W} ${H}`, role: "img" });
    document.querySelector(mount).appendChild(svg); return svg;
  }
  function yGrid(svg, x0, x1, y, v, fmt) {
    svg.appendChild(el("line", { x1: x0, x2: x1, y1: y, y2: y, class: "grid-line" }));
    svg.appendChild(txt(el("text", { x: x0 - 8, y: y + 4, "text-anchor": "end", class: "axis-label" }), fmt));
  }
  const table = (mount, head, rows) => {
    document.querySelector(mount).innerHTML =
      `<table><thead><tr>${head.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>` +
      rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("") + "</tbody></table>";
  };

  // ---------- Wochen-Chart + Ereignisse ----------
  (function weekly() {
    const wk = TL.weeks, W = 960, H = 330, L = 56, R = 16, T = 30, B = 46;
    const pw = W - L - R, ph = H - T - B;
    const max = Math.ceil(Math.max(...wk.map(d => d.killed)) / 1000) * 1000;
    const x = i => L + i / wk.length * pw, bw = pw / wk.length;
    const y = v => T + ph - v / max * ph;
    const svg = frame("#weekly", W, H);
    for (let g = 0; g <= max; g += 1000) yGrid(svg, L, W - R, y(g), g, nf.format(g));
    // Monats-Ticks (jeder 3.)
    wk.forEach((d, i) => {
      const dt = new Date(d.w);
      if (dt.getDate() <= 7 && dt.getMonth() % 3 === 0)
        svg.appendChild(txt(el("text", { x: x(i), y: H - 24, class: "axis-label" }),
          dt.toLocaleDateString(LOCALE, { month: "short", year: "2-digit" })));
    });
    svg.appendChild(el("line", { x1: L, x2: W - R, y1: y(0), y2: y(0), class: "axis-line" }));
    wk.forEach((d, i) => {
      const h = y(0) - y(d.killed);
      if (h <= 0) return;
      svg.appendChild(el("rect", { x: x(i), y: y(d.killed), width: Math.max(bw - 1, 1.4), height: h, fill: C.m, rx: 1.2 }));
    });
    // Hover (naechste Woche)
    const hover = el("rect", { x: L, y: T, width: pw, height: ph, fill: "transparent" });
    svg.appendChild(hover);
    hover.addEventListener("mousemove", ev => {
      const r = svg.getBoundingClientRect();
      const i = Math.max(0, Math.min(wk.length - 1, Math.floor((ev.clientX - r.left) / r.width * W - L) / bw | 0));
      const d = wk[i], dt = new Date(d.w);
      // Wochen-Chronik: toedlichster Tag, 10.000er-Schwellen, zugehoerige Ereignisse
      let chron = "";
      if (d.top) chron += `<br><span class="tt-h">${t("wk.tip.top", new Date(d.top[0]).toLocaleDateString(LOCALE), nf.format(d.top[1]))}</span>`;
      const prev = i > 0 ? wk[i - 1].cum : 0;
      if (d.cum && prev && Math.floor(d.cum / 10000) > Math.floor(prev / 10000))
        chron += `<br><span class="tt-h">${t("wk.tip.thresh", nf.format(Math.floor(d.cum / 10000) * 10000))}</span>`;
      const wkEnd = new Date(dt); wkEnd.setDate(wkEnd.getDate() + 7);
      (window.EVENTS || []).forEach(e => {
        const ed = new Date(e.d);
        const et = ((window.EVENTS_I18N || {})[e.d] || {})[LANG]?.t || e.t;
        if (ed >= dt && ed < wkEnd) chron += `<br><span class="tt-h">${t("wk.tip.event", et)}</span>`;
      });
      showTip(`<div class="tt-h">${t("wk.tip.week", dt.toLocaleDateString(LOCALE))}</div><b>${nf.format(d.killed)}</b> ${t("wk.tip.new")}` +
        (d.cum ? `<br><span class="tt-h">${t("wk.tip.cum", nf.format(d.cum))}</span>` : "") + chron, ev.clientX, ev.clientY);
    });
    hover.addEventListener("mouseleave", hideTip);
    // Ereignis-Punkte
    const panel = document.getElementById("eventPanel");
    function openEvent(e) {
      const side = s => e.press.filter(p => p.side === s).map(p =>
        `<li><a href="${p.url}" target="_blank" rel="noopener">„${p.title}“</a><span class="outlet">${p.outlet}</span></li>`).join("");
      const A = side("A"), B = side("B"), N = side("N");
      const tr = ((window.EVENTS_I18N || {})[e.d] || {})[LANG] || {};
      panel.hidden = false;
      panel.innerHTML = `<h3>${tr.t || e.t}</h3><div class="date">${new Date(e.d).toLocaleDateString(LOCALE, { dateStyle: "long" })}</div>
        <p class="desc">${tr.d || e.desc}</p>
        <div class="press">
          <div><h4>GUARDIAN · HAARETZ · AL JAZEERA · +972</h4><ul>${A || `<li class="empty">${t("press.empty")}</li>`}</ul></div>
          <div><h4>JPOST · TIMES OF ISRAEL · FOX · CAMERA</h4><ul>${B || `<li class="empty">${t("press.empty")}</li>`}</ul></div>
          ${N ? `<div class="press-wide"><h4>${t("press.inst")}</h4><ul>${N}</ul></div>` : ""}
        </div>`;
    }
    (window.EVENTS || []).forEach(e => {
      const i = wk.findIndex(d => d.w >= e.d);
      const cx = x(i < 0 ? wk.length - 1 : i) + bw / 2;
      const dot = el("circle", { cx, cy: T - 12, r: 5.5, fill: "#242423", stroke: C.ink2, "stroke-width": 1.4, cursor: "pointer" });
      const hit = el("circle", { cx, cy: T - 12, r: 13, fill: "transparent", cursor: "pointer" });
      [dot, hit].forEach(c => {
        c.addEventListener("click", () => { openEvent(e); panel.scrollIntoView({ behavior: "smooth", block: "nearest" }); });
        c.addEventListener("mousemove", ev => showTip(`<div class="tt-h">${new Date(e.d).toLocaleDateString(LOCALE)}</div>${(((window.EVENTS_I18N || {})[e.d] || {})[LANG] || {}).t || e.t}`, ev.clientX, ev.clientY));
        c.addEventListener("mouseleave", hideTip);
      });
      svg.appendChild(dot); svg.appendChild(hit);
    });
    openEvent(window.EVENTS.find(e => e.d === "2023-10-17") || window.EVENTS[0]);
    table("#weeklyTable", [t("wk.col.week"), t("wk.col.new"), t("wk.col.cum")],
      wk.map(d => [new Date(d.w).toLocaleDateString(LOCALE), nf.format(d.killed), d.cum ? nf.format(d.cum) : "–"]));
  })();

  // ---------- Saeuglings-Check ----------
  (function infants() {
    const I = INF;
    document.getElementById("infantStats").innerHTML = [
      [I.listed_under1, t("inf.1")],
      [I.prewar_born, t("inf.2")],
      [I.warborn_total, t("inf.3")],
      [I.expected_natural_infant_deaths_war_period, t("inf.4")],
    ].map(([v, l]) => `<div class="stat"><b>${nf.format(v)}</b><span>${l}</span></div>`).join("");
    // --- Regler: Saeuglinge als natuerliche Tote abziehen -------------------
    // Die Gegenrechnung zum Befund: Weil rechnerisch MEHR natuerliche Saeuglingstode
    // zu erwarten waeren, als die Liste ueberhaupt Unter-1-Jaehrige enthaelt, laesst
    // sich argumentieren, ein Teil davon sei natuerlich gestorben. Beide Richtungen
    // stehen im Hinweistext — der Regler behauptet nichts, er legt offen.
    const infS = document.getElementById("infSlider"), infO = document.getElementById("infOut"),
          infNote = document.getElementById("infDeductNote");
    infS.max = I.listed_under1;
    const markInf = wireQuick("infQuick", infS, () => infUpdate());
    function infUpdate() {
      const v = Math.min(+infS.value, I.listed_under1);
      infO.textContent = nf.format(v);
      markInf();
      const pct = (v / I.listed_under1 * 100).toFixed(0);
      let why = "";
      if (v === I.warborn_under1) why = t("inf.note.why411");
      else if (v === I.prewar_born) why = t("inf.note.why661");
      infNote.innerHTML = v === 0
        ? t("inf.note.none", nf.format(I.listed_under1))
        : t("inf.note.some", nf.format(v), nf.format(I.listed_under1), pct,
            nf.format(I.expected_natural_infant_deaths_war_period)) + why;
      document.dispatchEvent(new CustomEvent("infant-deduct", { detail: { n: v } }));
    }
    infS.addEventListener("input", infUpdate);
    infUpdate();

    const months = Object.keys(I.prewar_birthmonth_ramp);
    const vals = months.map(m => I.prewar_birthmonth_ramp[m]);
    const W = 960, H = 300, L = 46, R = 16, T = 16, B = 52, pw = W - L - R, ph = H - T - B;
    const max = 90, bw = pw / months.length;
    const y = v => T + ph - v / max * ph;
    const svg = frame("#infantRamp", W, H);
    for (let g = 0; g <= max; g += 30) yGrid(svg, L, W - R, y(g), g, g);
    svg.appendChild(el("line", { x1: L, x2: W - R, y1: y(0), y2: y(0), class: "axis-line" }));
    const MN = Array.from({ length: 12 }, (_, i) =>
      new Date(2024, i, 1).toLocaleDateString(LOCALE, { month: "short" }));
    months.forEach((m, i) => {
      const v = vals[i], X = L + i * bw + 3;
      svg.appendChild(el("rect", { x: X, y: y(v), width: bw - 6, height: y(0) - y(v), fill: C.m, rx: 3 }));
      const [yy, mm] = m.split("-");
      svg.appendChild(txt(el("text", { x: X + (bw - 6) / 2, y: H - 30, "text-anchor": "middle", class: "axis-label" }),
        MN[+mm - 1] + " " + yy.slice(2)));
      if (i === months.length - 2) // Endpunkt-Label (selektiv)
        svg.appendChild(txt(el("text", { x: X + (bw - 6) / 2, y: y(v) - 7, "text-anchor": "middle",
          fill: C.ink2, "font-size": "12" }), v));
      const hit = el("rect", { x: L + i * bw, y: T, width: bw, height: ph, fill: "transparent" });
      hit.addEventListener("mousemove", ev => showTip(`<div class="tt-h">${t("inf.tip", MN[+mm - 1] + " " + yy)}</div><b>${v}</b> ${t("inf.tip2")}`, ev.clientX, ev.clientY));
      hit.addEventListener("mouseleave", hideTip);
      svg.appendChild(hit);
    });
    table("#infantTable", [t("inf.col.month"), t("inf.col.n")], months.map((m, i) => [m, vals[i]]));
    document.getElementById("infantVerdict").innerHTML =
      t("inf.verdict", nf.format(I.expected_natural_infant_deaths_war_period), nf.format(I.assumptions.births_per_year),
        I.assumptions.imr_per_1000, nf.format(I.listed_under1), nf.format(I.warborn_total), I.assumptions.war_months);
  })();

  // ---------- Geschlechterverhaeltnis ----------
  (function sexratio() {
    // --- Regler: Anteil des Jungen-Ueberhangs 12–17, der als Kaempfer zaehlt ---
    // Frueher eine Ja/Nein-Checkbox im Rechner. Der Uebergang ist aber graduell,
    // also gehoert er als Regler in das Kapitel, das ihn begruendet.
    document.getElementById("boysTotal").textContent = nf.format(BOYS_SURPLUS);
    const boysS = document.getElementById("boysSlider"), boysO = document.getElementById("boysOut"),
          boysNote = document.getElementById("boysDeductNote");
    const markBoys = wireQuick("boysQuick", boysS, () => boysUpdate());
    function boysUpdate() {
      const pct = +boysS.value, n = Math.round(BOYS_SURPLUS * pct / 100);
      boysO.textContent = pct + " %";
      markBoys();
      boysNote.innerHTML = pct === 0
        ? t("boys.note.none")
        : t("boys.note.some", nf.format(n), nf.format(BOYS_SURPLUS));
      document.dispatchEvent(new CustomEvent("boys-deduct", { detail: { n } }));
    }
    boysS.addEventListener("input", boysUpdate);
    boysUpdate();

    const rows = SEX.byAge, W = 960, H = 360, L = 56, R = 20, T = 18, B = 44, pw = W - L - R, ph = H - T - B;
    const x = a => L + a / 90 * pw, y = p => T + ph - p / 100 * ph;
    const smooth = rows.map((r, i) => {
      const win = rows.slice(Math.max(0, i - 1), i + 2);
      const m = win.reduce((s, w) => s + w.m, 0), f = win.reduce((s, w) => s + w.f, 0);
      return { age: r.age, share: m + f ? m / (m + f) * 100 : null, m: r.m, f: r.f };
    });
    const svg = frame("#sexratio", W, H);
    for (let g = 0; g <= 100; g += 25) yGrid(svg, L, W - R, y(g), g, g + " %");
    for (let a = 0; a <= 90; a += 15)
      svg.appendChild(txt(el("text", { x: x(a), y: H - 22, "text-anchor": "middle", class: "axis-label" }), a));
    svg.appendChild(txt(el("text", { x: W / 2, y: H - 6, "text-anchor": "middle", class: "axis-label" }), t("sex.axis.age")));
    // Referenz: Bevoelkerungsanteil
    const py = y(SEX.popMaleShare * 100);
    svg.appendChild(el("line", { x1: L, x2: W - R, y1: py, y2: py, stroke: C.muted, "stroke-width": 1.2 }));
    svg.appendChild(txt(el("text", { x: W - R, y: py - 6, "text-anchor": "end", fill: C.muted, "font-size": "12" }),
      t("sex.ref")));
    // Marker 12 & 18
    [[12, "12 " + t("unit.yrs")], [18, "18 " + t("unit.yrs")]].forEach(([a, l]) => {
      svg.appendChild(el("line", { x1: x(a), x2: x(a), y1: T, y2: T + ph, stroke: C.axis, "stroke-width": 1 }));
      svg.appendChild(txt(el("text", { x: x(a) + 4, y: T + 12, fill: C.muted, "font-size": "12" }), l));
    });
    const path = smooth.filter(d => d.share != null)
      .map((d, i) => (i ? "L" : "M") + x(d.age).toFixed(1) + " " + y(d.share).toFixed(1)).join(" ");
    svg.appendChild(el("path", { d: path, fill: "none", stroke: C.m, "stroke-width": 2.2, "stroke-linejoin": "round" }));
    const last = smooth[smooth.length - 1];
    svg.appendChild(txt(el("text", { x: x(88), y: y(last.share) - 10, "text-anchor": "end", fill: C.ink2, "font-size": "12.5" }),
      t("sex.line")));
    // Crosshair
    const cross = el("line", { x1: 0, x2: 0, y1: T, y2: T + ph, stroke: C.axis, "stroke-width": 1, visibility: "hidden" });
    svg.appendChild(cross);
    const hover = el("rect", { x: L, y: T, width: pw, height: ph, fill: "transparent" });
    svg.appendChild(hover);
    hover.addEventListener("mousemove", ev => {
      const r = svg.getBoundingClientRect();
      const a = Math.round(((ev.clientX - r.left) / r.width * W - L) / pw * 90);
      const d = smooth[Math.max(0, Math.min(90, a))];
      cross.setAttribute("x1", x(d.age)); cross.setAttribute("x2", x(d.age)); cross.setAttribute("visibility", "visible");
      showTip(`<div class="tt-h">${t("sex.axis.age")} ${d.age}${d.age === 90 ? "+" : ""}</div><b>${d.share.toFixed(1)} %</b> ${t("sex.tip.male")}<br>
        <span class="tt-h">${t("sex.tip.mf", nf.format(d.m), nf.format(d.f))}</span>`, ev.clientX, ev.clientY);
    });
    hover.addEventListener("mouseleave", () => { hideTip(); cross.setAttribute("visibility", "hidden"); });
    const grp = (a0, a1) => { let m = 0, f = 0; rows.forEach(r => { if (r.age >= a0 && r.age <= a1) { m += r.m; f += r.f; } });
      return (m / (m + f) * 100).toFixed(1); };
    table("#sexTable", [t("sex.axis.age"), t("col.men"), t("col.women"), t("sex.col.share")],
      [[0,4],[5,9],[10,14],[15,17],[18,29],[30,39],[40,49],[50,59],[60,69],[70,79],[80,90]].map(([a,b]) => {
        let m = 0, f = 0; rows.forEach(r => { if (r.age >= a && r.age <= b) { m += r.m; f += r.f; } });
        return [`${a}–${b}${b===90?"+":""}`, nf.format(m), nf.format(f), (m/(m+f)*100).toFixed(1)+" %"];
      }));
    document.getElementById("sexVerdict").innerHTML =
      t("sex.verdict", grp(0, 4), grp(10, 14), grp(15, 17), grp(18, 29));
  })();

  // ---------- Szenario natuerliche Tote ----------
  (function scenario() {
    const months = Object.keys(NAT.monthly_cum), cum = months.map(m => NAT.monthly_cum[m]);
    const W = 960, H = 380, L = 64, R = 20, T = 24, B = 44, pw = W - L - R, ph = H - T - B;
    const max = 80000;
    const x = i => L + i / (months.length - 1) * pw, y = v => T + ph - v / max * ph;
    const svg = frame("#scenario", W, H);
    for (let g = 0; g <= max; g += 20000) yGrid(svg, L, W - R, y(g), g, nf.format(g));
    months.forEach((m, i) => { if (m.endsWith("-01") || i === 0)
      svg.appendChild(txt(el("text", { x: x(i), y: H - 22, "text-anchor": "middle", class: "axis-label" }),
        new Date(m + "-01").toLocaleDateString(LOCALE, { month: "short" }) + " " + m.slice(2, 4))); });
    const line = (vals, color, w) => el("path", {
      d: vals.map((v, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(Math.max(0, v)).toFixed(1)).join(" "),
      fill: "none", stroke: color, "stroke-width": w, "stroke-linejoin": "round" });
    svg.appendChild(line(cum, C.m, 2.2));
    const adjPath = line(cum, C.f, 2.2); svg.appendChild(adjPath);
    // Lancet-Punkt
    const li = months.indexOf("2025-01");
    if (li > -1) {
      svg.appendChild(el("circle", { cx: x(li), cy: y(75200), r: 5, fill: C.est }));
      svg.appendChild(el("circle", { cx: x(li), cy: y(75200), r: 5, fill: "none", stroke: css("--surface"), "stroke-width": 2 }));
      svg.appendChild(txt(el("text", { x: x(li) + 9, y: y(75200) + 4, fill: C.ink2, "font-size": "12.5" }),
        t("scen.lancet")));
      svg.appendChild(el("line", { x1: x(li), x2: x(li), y1: y(75200) + 8, y2: y(NAT.monthly_cum["2025-01"]), stroke: C.est, "stroke-width": 1, opacity: .6 }));
    }
    svg.appendChild(txt(el("text", { x: x(months.length - 1) - 4, y: y(cum[cum.length - 1]) - 10, "text-anchor": "end", fill: C.ink2, "font-size": "12.5" }),
      t("scen.official")));
    const adjLabel = txt(el("text", { x: x(months.length - 1) - 4, y: 0, "text-anchor": "end", fill: C.f, "font-size": "12.5" }), "");
    svg.appendChild(adjLabel);
    const legend = `<div class="legend" style="margin:10px 4px 0">${t("scen.legend", C.m, C.f)}</div>`;
    document.getElementById("scenario").insertAdjacentHTML("beforeend", legend);
    const slider = document.getElementById("natSlider"), out = document.getElementById("natOut"),
          warn = document.getElementById("natWarn"), verdict = document.getElementById("natVerdict");
    function years(i) { const [Y, M] = months[i].split("-").map(Number); return (Y - 2023) + (M - 10) / 12; }
    function update() {
      const rate = +slider.value;
      out.textContent = nf.format(rate) + t("unit.year");
      const adj = cum.map((v, i) => v - rate * years(i));
      adjPath.setAttribute("d", adj.map((v, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(Math.max(0, v)).toFixed(1)).join(" "));
      const totalRemoved = Math.round(rate * years(months.length - 1));
      warn.hidden = totalRemoved <= 5000;
      adjLabel.setAttribute("y", y(Math.max(0, adj[adj.length - 1])) + 18);
      adjLabel.textContent = rate ? t("scen.adj", nf.format(Math.round(adj[adj.length - 1]))) : "";
      verdict.innerHTML = t("scen.verdict", nf.format(rate), nf.format(totalRemoved), nf.format(cum[cum.length - 1]),
        nf.format(cum[cum.length - 1] - totalRemoved), nf.format(NAT.list_60plus), nf.format(NAT.under_rubble));
    }
    slider.addEventListener("input", update); update();
    table("#scenTable", [t("scen.col.month"), t("scen.col.cum")], months.map((m, i) => [m, nf.format(cum[i])]));
  })();

  // ---------- Kombattanten-Abzug ----------
  (function combatants() {
    const TOTAL = META.killed_total;
    const SC = [
      { key: "none",  n: 0,     label: t("sc.none"),  sub: t("sc.none.s") },
      { key: "hamas", n: 6000,  label: t("sc.hamas"), sub: t("sc.hamas.s") },
      { key: "intel", n: 8900,  label: t("sc.intel"), sub: t("sc.intel.s") },
      { key: "idf",   n: 22000, label: t("sc.idf"),   sub: t("sc.idf.s") },
    ];
    const btns = document.getElementById("combatBtns");
    btns.innerHTML = SC.map(s =>
      `<button data-key="${s.key}" data-n="${s.n}">${s.label}<small>${s.sub}</small></button>`).join("");
    const stats = document.getElementById("combatStats"), verdict = document.getElementById("combatVerdict");
    function apply(n, label) {
      btns.querySelectorAll("button").forEach(b => b.classList.toggle("active", +b.dataset.n === n));
      // Eigene Zahl: Feld bleibt sichtbar als gewaehlte Quelle markiert
      const customEl = document.getElementById("combatCustom");
      const isCustom = n > 0 && !SC.some(s => s.n === n);
      customEl.classList.toggle("active", isCustom);
      if (!isCustom) customEl.value = "";
      document.dispatchEvent(new CustomEvent("combat-scenario", { detail: { n } }));
      const rest = TOTAL - n, share = n / TOTAL * 100;
      stats.innerHTML = [
        [nf.format(n), t("cs.deducted")],
        [nf.format(rest), t("cs.remaining")],
        [share.toFixed(1) + " %", t("cs.share")],
        [n ? (rest / n).toFixed(1) + " : 1" : "—", t("cs.per")],
      ].map(([v, l]) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`).join("");
      verdict.innerHTML = t("comb.verdict",
        n ? t("comb.verdict.some", share.toFixed(1), nf.format(TOTAL), (rest / n).toFixed(1)) : t("comb.verdict.none"));
    }
    btns.addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      apply(+b.dataset.n, b.textContent);
    });
    // Eigene Zahl: uebernimmt live beim Tippen (der Uebernehmen-Knopf bleibt als expliziter Weg)
    const custom = document.getElementById("combatCustom");
    const applyCustom = () => { const v = Math.max(0, Math.min(45000, Math.round(+custom.value || 0))); if (v) apply(v); };
    let customT;
    custom.addEventListener("input", () => { clearTimeout(customT); customT = setTimeout(applyCustom, 500); });
    document.getElementById("combatApply").addEventListener("click", applyCustom);
    custom.addEventListener("keydown", e => { if (e.key === "Enter") { clearTimeout(customT); applyCustom(); } });
    apply(0);
  })();

  // ---------- Getoetet durch die eigene Seite ----------
  // Der Abzug steht jetzt OBEN in seinem Kapitel (vorher nur unten im Rechner),
  // damit er dort einstellbar ist, wo die Belege dafuer stehen.
  (function ownSide() {
    const s = document.getElementById("ownSlider"), o = document.getElementById("ownOut"),
          note = document.getElementById("ownDeductNote");
    const mark = wireQuick("ownQuick", s, () => update());
    function update() {
      const v = +s.value;
      o.textContent = nf.format(v);
      mark();
      note.innerHTML = v === 0 ? t("own.note.none") : t("own.note.some", nf.format(v));
      document.dispatchEvent(new CustomEvent("own-deduct", { detail: { n: v } }));
    }
    s.addEventListener("input", update);
    update();
  })();

  document.getElementById("ownStats").innerHTML = [
    ["~400", t("own.1")],
    ["220+", t("own.2")],
    ["60", t("own.3")],
    ["33+", t("own.4")],
    ["100–300", t("own.5")],
    ["550+", t("own.6")],
  ].map(([v, l]) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`).join("");

  // ---------- Familien & Suche ----------
  (async function families() {
    const FAMS = await get("families.json");
    const info = document.getElementById("searchInfo"), results = document.getElementById("famResults"),
          detail = document.getElementById("famDetail"), input = document.getElementById("famSearch");
    let LIST = null, listLoading = false;
    async function loadList() {
      if (LIST || listLoading) return;
      listLoading = true;
      info.textContent = t("fam.loading");
      LIST = await get("list.json");
      info.textContent = t("fam.loaded", nf.format(LIST.length));
      run();
    }
    const cap = s => s.replace(/(^|[\s-])\p{L}/gu, c => c.toUpperCase());
    const esc = s => String(s).replace(/[<>&"]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]));

    // --- Abzeichen -----------------------------------------------------------
    // Ein Abzeichen haengt an einer PERSON, nicht an der Familie: kuratierte
    // Eintraege tragen ihr badge-Feld (famnotes.js), Journalisten kommen aus dem
    // Presse-Datensatz (Felder p/pn). Deshalb kann das Detail-Panel immer sagen,
    // WER das Zeichen traegt.
    const BADGE = {
      fighter:  { sym: "★", cls: "b-f",  label: t("b.fighter") },
      press:    { sym: "✎", cls: "b-p",  label: t("b.press") },
      medic:    { sym: "✚", cls: "b-m",  label: t("b.medic") },
      prisoner: { sym: "⛓", cls: "b-pr", label: t("b.prisoner") },
      official: { sym: "◆", cls: "b-o",  label: t("b.official") },
      victims:  { sym: "●", cls: "b-v",  label: t("b.victims") },
    };
    const BADGE_ORDER = ["fighter", "press", "medic", "prisoner", "official", "victims"];

    // Uebersetzte Detailtexte: Overlay ist index-parallel zu famnotes.notable
    const noteInfo = p => (p._k && ((window.FAMNOTES_I18N || {})[p._k]?.notable?.[p._i] || {})[LANG]) || p.info;
    function famBadges(f) {
      const out = {}, FN = (window.FAM_NOTES || {})[f.k] || {};
      (FN.notable || []).forEach((p, _i) => {
        if (!p.badge) return;
        (Array.isArray(p.badge) ? p.badge : [p.badge]).forEach(k => {
          if (BADGE[k]) (out[k] = out[k] || []).push({ ...p, _i, _k: f.k });
        });
      });
      (FN.tags || []).forEach(k => { if (BADGE[k] && !out[k]) out[k] = []; }); // Alt-Format ohne Person
      if (f.p) out.press = (f.pn || []).map(x => ({ name: x.n, info: x.o }));
      // Gesundheitsarbeiter automatisch aus der HWW-Namensliste (Felder hw/hwn)
      if (f.hw) out.medic = (out.medic || []).concat((f.hwn || []).map(x => ({ name: x.n, info: x.o })));
      return BADGE_ORDER.filter(k => out[k]).map(k => ({ key: k, people: out[k] }));
    }

    const badgeHtml = f => famBadges(f).map(b => {
      const B = BADGE[b.key], names = b.people.map(p => p.name).join(", ");
      const cnt = b.key === "press" && f.p > 1 ? f.p : b.key === "medic" && f.hw > 1 ? f.hw : "";
      return `<span class="bdg ${B.cls}" title="${esc(B.label)}${names ? ": " + esc(names) : ""}">${B.sym}${cnt}</span>`;
    }).join("");

    function badgeBlock(f) {
      const bs = famBadges(f);
      if (!bs.length) return "";
      return `<div class="badgebox"><h4>${t("fam.badgebox")}</h4>` + bs.map(b => {
        const B = BADGE[b.key];
        const who = b.people.length ? b.people.map(p =>
            (p.url ? `<a href="${p.url}" target="_blank" rel="noopener">${esc(p.name)}</a>` : `<b>${esc(p.name)}</b>`)
            + (noteInfo(p) ? ` <span class="fine">— ${esc(noteInfo(p))}</span>` : "")).join("<br>")
          : `<span class="fine">${t("fam.badge.undoc")}</span>`;
        return `<div class="badgeline"><span class="bdg ${B.cls}">${B.sym}</span>
          <div><b>${B.label}</b><div class="badgewho">${who}</div></div></div>`;
      }).join("") + `</div>`;
    }

    const famRow = (f, i) => `<div class="famrow" data-i="${i}"><b>${cap(f.k)}</b>${badgeHtml(f)}
      <span class="meta">${t("fam.meta", nf.format(f.n), f.m, f.f, f.kids)}
      ${f.sib ? t("fam.sib", f.sib, f.big) : ""}</span></div>`;

    // --- Top-100-Tabelle, nach jeder Spalte sortierbar ------------------------
    // Menge = die 100 groessten Familien PLUS alle recherchierten (auch kleinere),
    // damit kein dokumentierter Einzelfall aus der Sortierung faellt.
    const TOPN = 100;
    const curated = new Set(Object.keys(window.FAM_NOTES || {}));
    const TOPSET = FAMS.map((f, i) => ({ f, i })).filter(({ f }, r) => r < TOPN || curated.has(f.k));
    const badgeWeight = f => {
      const bs = famBadges(f);
      return bs.length * 1000 + bs.reduce((s, b) => s + b.people.length, 0);
    };
    const COLS = [
      { k: "k",    t: t("col.family"), v: o => o.f.k, txt: true },
      { k: "bdg",  t: t("col.badges"), v: o => badgeWeight(o.f) },
      { k: "n",    t: t("col.dead"),   v: o => o.f.n },
      { k: "m",    t: t("col.men"),    v: o => o.f.m },
      { k: "f",    t: t("col.women"),  v: o => o.f.f },
      { k: "kids", t: "&lt;18",        v: o => o.f.kids },
      { k: "sib",  t: t("col.sib"),    v: o => o.f.sib },
    ];
    let sortK = "n", sortDir = -1;
    function renderTop() {
      const col = COLS.find(c => c.k === sortK);
      const rows = TOPSET.slice().sort((a, b) => {
        const av = col.v(a), bv = col.v(b);
        const d = col.txt ? String(av).localeCompare(String(bv), "de") : av - bv;
        return d !== 0 ? d * sortDir : b.f.n - a.f.n;   // Zweitschluessel: Tote
      });
      document.getElementById("famTop").innerHTML =
        `<table><thead><tr>` + COLS.map(c =>
          `<th data-k="${c.k}"${sortK === c.k ? ' class="sorted"' : ""}>${c.t}` +
          `${sortK === c.k ? (sortDir < 0 ? " ▾" : " ▴") : ""}</th>`).join("") +
        `</tr></thead><tbody>` + rows.map(({ f, i }) =>
          `<tr data-i="${i}"><td>${cap(f.k)}${i >= TOPN ? ` <span class="fine">${t("fam.rank", i + 1)}</span>` : ""}</td>` +
          `<td class="bdgcell">${badgeHtml(f)}</td><td>${nf.format(f.n)}</td><td>${nf.format(f.m)}</td>` +
          `<td>${nf.format(f.f)}</td><td>${nf.format(f.kids)}</td><td>${f.sib}</td></tr>`).join("") +
        `</tbody></table>`;
    }
    renderTop();
    function openFam(i) {
      const f = FAMS[i];
      let members = "", clusters = "";
      if (LIST) {
        const mem = LIST.filter(r => r[4] === i);
        const groups = {};
        mem.forEach(r => {
          const t = r[0].toLowerCase().split(" ");
          if (t.length >= 4) { const k = t[1] + " " + t[2]; (groups[k] = groups[k] || []).push(r); }
        });
        const sib = Object.entries(groups).filter(([, g]) => g.length >= 2).sort((a, b) => b[1].length - a[1].length);
        if (sib.length) clusters = `<h4 style="margin:14px 0 6px;color:var(--muted);font-size:13px">${t("fam.sibhead")}</h4>` +
          sib.slice(0, 12).map(([k, g]) => `<div class="loadhint">${t("fam.kidsof", cap(k))}<b style="color:var(--ink)">${g.length}</b>
            ${t("fam.ages", g.map(r => r[2]).sort((a, b) => a - b).join(", "))}</div>`).join("");
        members = `<h4 style="margin:14px 0 4px;color:var(--muted);font-size:13px">${t("fam.allentries", nf.format(mem.length))}</h4>` +
          mem.sort((a, b) => a[2] - b[2]).slice(0, 400).map(r =>
            `<div class="member"><span class="who">${r[0]}</span><span class="ar">${r[1]}</span>
             <span class="agesex">${r[2]} ${t("unit.yrs")} · ${r[3] === "f" ? "♀" : "♂"}</span></div>`).join("") +
          (mem.length > 400 ? `<div class="loadhint">${t("fam.more", nf.format(mem.length - 400))}</div>` : "");
      } else {
        members = `<div class="loadhint">${t("fam.loadhint")}</div>`;
      }
      // Recherchierte Herkunft + Abzeichen mit Namen + sonstige Anmerkungen
      const FN = (window.FAM_NOTES || {})[f.k];
      let notes = "";
      const orig = ((window.FAMNOTES_I18N || {})[f.k]?.origin || {})[LANG]
        || (FN && FN.origin)
        || ((window.FAM_ORIGINS_I18N || {})[f.k] || {})[LANG]
        || (window.FAM_ORIGINS || {})[f.k];
      if (orig)
        notes += `<div class="origin"><span class="lbl">${t("fam.origin.lbl")}</span> ${orig}</div>`;
      notes += badgeBlock(f);
      const rest = ((FN || {}).notable || []).map((p, _i) => ({ ...p, _i, _k: f.k })).filter(p => !p.badge);
      if (rest.length) notes += `<div class="origin">` + rest.map(p =>
        `<div><span class="lbl">${t("fam.also")}</span> <a href="${p.url}" target="_blank" rel="noopener">${esc(p.name)}</a>
          — ${noteInfo(p)}</div>`).join("") + `</div>`;
      detail.hidden = false;
      detail.innerHTML = `<h3>${t("fam.family", cap(f.k))}${badgeHtml(f)}</h3>
        <p class="desc">${t("fam.meta", nf.format(f.n), f.m, f.f, f.kids)} ${f.sib ? t("fam.sib", f.sib, f.big) : ""}</p>${notes}${clusters}${members}`;
      detail.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    function run() {
      const q = input.value.trim().toLowerCase();
      if (q.length < 2) { results.innerHTML = ""; return; }
      const fams = FAMS.map((f, i) => [f, i]).filter(([f]) => f.k.includes(q)).slice(0, 10);
      let html = fams.map(([f, i]) => famRow(f, i)).join("");
      if (LIST) {
        const people = [];
        for (let i = 0; i < LIST.length && people.length < 40; i++)
          if (LIST[i][0].toLowerCase().includes(q) || LIST[i][1].includes(input.value.trim())) people.push(LIST[i]);
        if (people.length) html += `<h4 style="margin:12px 0 4px;color:var(--muted);font-size:13px">${t("fam.person.head")}</h4>` +
          people.map(r => `<div class="member"><span class="who">${r[0]}</span><span class="ar">${r[1]}</span>
            <span class="agesex">${r[2]} ${t("unit.yrs")} · ${r[3] === "f" ? "♀" : "♂"}</span></div>`).join("");
      }
      results.innerHTML = html || `<div class="loadhint">${t("fam.none", LIST ? t("fam.none.person") : "")}</div>`;
    }
    input.addEventListener("focus", loadList, { once: true });
    input.addEventListener("input", run);
    document.getElementById("famResults").addEventListener("click", e => {
      const r = e.target.closest(".famrow"); if (r) openFam(+r.dataset.i);
    });
    document.getElementById("famTop").addEventListener("click", e => {
      const th = e.target.closest("th[data-k]");
      if (th) {                                   // Spaltenkopf: umsortieren
        if (sortK === th.dataset.k) sortDir = -sortDir;
        else { sortK = th.dataset.k; sortDir = sortK === "k" ? 1 : -1; }
        renderTop(); return;
      }
      const r = e.target.closest("tr[data-i]"); if (r) openFam(+r.dataset.i);
    });
  })();

  // ---------- Der Rechner + Kriegs-Vergleich ----------
  (function calculator() {
    const TOTAL = META.killed_total;
    const mohAtLancet = NAT.lancet.moh_at_date || 45805;
    const lancetBase = Math.round(NAT.lancet.violent_est + (TOTAL - mohAtLancet)); // Survey-Niveau + spaetere Zaehlung
    document.getElementById("lancetBase").textContent = "~" + nf.format(lancetBase);
    const bases = { moh: TOTAL, rubble: TOTAL + NAT.under_rubble, lancet: lancetBase };
    const months = Object.keys(NAT.monthly_cum);
    const [eY, eM] = months[months.length - 1].split("-").map(Number);
    const yearsTotal = (eY - 2023) + (eM - 10) / 12;
    let combatN = 0;
    const el = id => document.getElementById(id);
    const dz = v => v.toFixed(1).replace(".", ",");
    // Alle Abzuege werden in ihren Kapiteln geregelt; hier wird nur noch der
    // Stand der Regler gelesen — so kann es keinen Zustand geben, der zwischen
    // Kapitel und Rechner auseinanderlaeuft.
    function update() {
      const baseKey = document.querySelector("input[name=calcBase]:checked").value;
      const base = bases[baseKey];
      const rate = +el("natSlider").value;
      const nat = Math.round(rate * yearsTotal);
      const infants = +el("infSlider").value;
      const boys = Math.round(BOYS_SURPLUS * +el("boysSlider").value / 100);
      const own = +el("ownSlider").value;
      const warDead = Math.max(0, base - nat - infants);
      const fighters = combatN + boys;
      const civTotal = Math.max(0, warDead - fighters);
      const result = Math.max(0, civTotal - own);
      const civShare = warDead > 0 ? civTotal / warDead * 100 : 0;
      const ratio = fighters > 0 ? civTotal / fighters : null;
      el("calcCombat").textContent = nf.format(combatN);
      el("calcNatural").textContent = nf.format(nat);
      el("calcInfants").textContent = nf.format(infants);
      el("calcBoysN").textContent = nf.format(boys);
      el("calcOwnN").textContent = nf.format(own);
      el("calcNaturalHint").innerHTML = (rate ? t("calc.natHint", nf.format(rate), dz(yearsTotal)) + " " : "")
        + `<a href="#check3">→ Check 3</a>`;
      // Saeuglinge sind eine Teilmenge der natuerlichen Toten — beides zusammen
      // zieht dieselben Menschen zweimal ab.
      el("calcOverlap").hidden = !(nat > 0 && infants > 0);
      el("calcResult").textContent = nf.format(result);
      el("calcBreakdown").innerHTML = t("calc.breakdown",
        nf.format(base), nf.format(nat), nf.format(combatN),
        (infants ? t("calc.infTerm", nf.format(infants)) : "") + (boys ? t("calc.boysTerm", nf.format(boys)) : ""),
        nf.format(own), nf.format(result), dz(civShare),
        ratio != null ? "1 : " + dz(ratio) : t("calc.noCombat"));
      drawRatio(ratio);
    }
    // Vergleichs-Chart: getoetete Zivilisten je getoetetem Kombattanten (1 : X)
    const ROWS = [
      { label: t("ratio.user"), user: true },
      { label: t("ratio.span"), lo: 2.3, hi: 7.2 },
      { label: t("ratio.g14"), lo: 1.0, hi: 3.0 },
      { label: t("ratio.g08"), lo: 0.6, hi: 1.9 },
      { label: t("ratio.mosul"), lo: 1.1, hi: 3.7 },
      { label: t("ratio.iraq"), lo: 4.4, hi: 4.4 },
      { label: t("ratio.afgh"), lo: 0.4, hi: 0.4 },
      { label: t("ratio.un"), lo: 9.0, hi: 9.0, ref: true },
    ];
    const MAXR = 10;
    function drawRatio(userRatio) {
      const holder = document.getElementById("ratioChart");
      const W = 960, RH = 40, T = 14, B = 46, Lp = 350, Rp = 40, H = T + ROWS.length * RH + B;
      const x = v => Lp + Math.min(v, MAXR) / MAXR * (W - Lp - Rp);
      let s = `<svg viewBox="0 0 ${W} ${H}" role="img">`;
      for (let g = 0; g <= MAXR; g += 2) {
        s += `<line x1="${x(g)}" x2="${x(g)}" y1="${T}" y2="${H - B}" class="grid-line"/>`;
        s += `<text x="${x(g)}" y="${H - 26}" text-anchor="middle" class="axis-label">${g}</text>`;
      }
      s += `<text x="${(Lp + W - Rp) / 2}" y="${H - 8}" text-anchor="middle" class="axis-label">${t("ratio.axis")}</text>`;
      ROWS.forEach((r, i) => {
        const y = T + i * RH + RH / 2;
        s += `<text x="${Lp - 12}" y="${y + 4}" text-anchor="end" fill="${r.user ? C.f : "var(--ink-2)"}" font-size="12.5">${r.label}</text>`;
        if (r.user) {
          if (userRatio == null) {
            s += `<text x="${x(0) + 6}" y="${y + 4}" fill="var(--muted)" font-size="12" font-style="italic">${t("ratio.choose")}</text>`;
          } else {
            const clamped = userRatio > MAXR;
            s += `<line x1="${x(0)}" x2="${x(userRatio)}" y1="${y}" y2="${y}" stroke="${C.f}" stroke-width="3" stroke-linecap="round"/>`;
            s += `<circle cx="${x(userRatio)}" cy="${y}" r="6" fill="${C.f}"/><circle cx="${x(userRatio)}" cy="${y}" r="6" fill="none" stroke="var(--surface)" stroke-width="2"/>`;
            s += `<text x="${x(userRatio) + 11}" y="${y + 4}" fill="${C.f}" font-size="12.5" font-weight="600">1 : ${dz(userRatio)}${clamped ? t("ratio.out") : ""}</text>`;
          }
        } else if (r.lo === r.hi) {
          s += `<circle cx="${x(r.lo)}" cy="${y}" r="${r.ref ? 4 : 5}" fill="${r.ref ? C.muted : C.m}"/>`;
          s += `<text x="${x(r.lo) + 10}" y="${y + 4}" fill="var(--muted)" font-size="11.5">1 : ${dz(r.lo)}</text>`;
        } else {
          s += `<line x1="${x(r.lo)}" x2="${x(r.hi)}" y1="${y}" y2="${y}" stroke="${C.m}" stroke-width="3" stroke-linecap="round" opacity=".45"/>`;
          s += `<circle cx="${x(r.lo)}" cy="${y}" r="5" fill="${C.m}"/><circle cx="${x(r.hi)}" cy="${y}" r="5" fill="${C.m}"/>`;
          s += `<text x="${x(r.lo) - 9}" y="${y + 4}" text-anchor="end" fill="var(--muted)" font-size="11.5">${dz(r.lo)}</text>`;
          s += `<text x="${x(r.hi) + 9}" y="${y + 4}" fill="var(--muted)" font-size="11.5">${dz(r.hi)}</text>`;
        }
      });
      s += "</svg>";
      holder.innerHTML = s;
    }
    document.addEventListener("combat-scenario", e => { combatN = e.detail.n; update(); });
    ["infant-deduct", "boys-deduct", "own-deduct"].forEach(ev => document.addEventListener(ev, update));
    el("natSlider").addEventListener("input", update);
    document.querySelectorAll("input[name=calcBase]").forEach(r => r.addEventListener("change", update));
    update();
  })();
})();
