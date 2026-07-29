/* Gaza-Statistik — 2D-Module (SVG), Tooltip, Tabellen. */
(async function () {
  const get = async n => (await fetch("data/" + n)).json();
  const [META, PYR, SEX, INF, NAT, TL] = await Promise.all(
    ["meta.json", "pyramid.json", "sexratio.json", "infants.json", "natural.json", "timeline.json"].map(get));
  window.PYR = PYR; // fuer pyramid3d.js
  window.SEXBYAGE = SEX.byAge; // Einzeljahres-Daten fuer die Pyramide
  window.TOTAL_KILLED = META.killed_total;
  document.dispatchEvent(new CustomEvent("pyr-data"));

  const nf = new Intl.NumberFormat("de-DE");
  const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const C = { m: css("--m"), f: css("--f"), est: css("--est"), grid: css("--grid"), axis: css("--axis"),
              muted: css("--muted"), ink: css("--ink"), ink2: css("--ink-2") };

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
    [META.killed_total, "Getötete gesamt (MoH)"],
    [META.named, "davon namentlich erfasst"],
    [META.children, "Kinder"],
    [META.women, "Frauen"],
    [META.injured, "Verletzte"],
    [META.famine, "registrierte Hungertote"],
  ].map(([v, l]) => `<div class="kpi"><b>${nf.format(v)}</b><span>${l}</span></div>`).join("");
  document.getElementById("asof").textContent =
    `Namensliste: Stand 7. Mai 2026 (10. Veröffentlichung, konsolidiert von Iraq Body Count) · Zeitreihe: Stand ${META.data_updated} · 7.10.2023–heute`;

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
          dt.toLocaleDateString("de-DE", { month: "short", year: "2-digit" })));
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
      if (d.top) chron += `<br><span class="tt-h">tödlichster Tag: ${new Date(d.top[0]).toLocaleDateString("de-DE")} (${nf.format(d.top[1])})</span>`;
      const prev = i > 0 ? wk[i - 1].cum : 0;
      if (d.cum && prev && Math.floor(d.cum / 10000) > Math.floor(prev / 10000))
        chron += `<br><span class="tt-h">⚑ Schwelle überschritten: ${nf.format(Math.floor(d.cum / 10000) * 10000)} Tote</span>`;
      const wkEnd = new Date(dt); wkEnd.setDate(wkEnd.getDate() + 7);
      (window.EVENTS || []).forEach(e => {
        const ed = new Date(e.d);
        if (ed >= dt && ed < wkEnd) chron += `<br><span class="tt-h">● ${e.t} — anklicken für Presse</span>`;
      });
      showTip(`<div class="tt-h">Woche ab ${dt.toLocaleDateString("de-DE")}</div><b>${nf.format(d.killed)}</b> neu gemeldete Tote` +
        (d.cum ? `<br><span class="tt-h">kumuliert ${nf.format(d.cum)}</span>` : "") + chron, ev.clientX, ev.clientY);
    });
    hover.addEventListener("mouseleave", hideTip);
    // Ereignis-Punkte
    const panel = document.getElementById("eventPanel");
    function openEvent(e) {
      const side = s => e.press.filter(p => p.side === s).map(p =>
        `<li><a href="${p.url}" target="_blank" rel="noopener">„${p.title}“</a><span class="outlet">${p.outlet}</span></li>`).join("");
      const A = side("A"), B = side("B"), N = side("N");
      panel.hidden = false;
      panel.innerHTML = `<h3>${e.t}</h3><div class="date">${new Date(e.d).toLocaleDateString("de-DE", { dateStyle: "long" })}</div>
        <p class="desc">${e.desc}</p>
        <div class="press">
          <div><h4>GUARDIAN · HAARETZ · AL JAZEERA · +972</h4><ul>${A || '<li class="empty">— noch keine Schlagzeile erfasst</li>'}</ul></div>
          <div><h4>JPOST · TIMES OF ISRAEL · FOX · CAMERA</h4><ul>${B || '<li class="empty">— noch keine Schlagzeile erfasst</li>'}</ul></div>
          ${N ? `<div class="press-wide"><h4>INSTITUTIONEN / AGENTUREN</h4><ul>${N}</ul></div>` : ""}
        </div>`;
    }
    (window.EVENTS || []).forEach(e => {
      const i = wk.findIndex(d => d.w >= e.d);
      const cx = x(i < 0 ? wk.length - 1 : i) + bw / 2;
      const dot = el("circle", { cx, cy: T - 12, r: 5.5, fill: "#242423", stroke: C.ink2, "stroke-width": 1.4, cursor: "pointer" });
      const hit = el("circle", { cx, cy: T - 12, r: 13, fill: "transparent", cursor: "pointer" });
      [dot, hit].forEach(c => {
        c.addEventListener("click", () => { openEvent(e); panel.scrollIntoView({ behavior: "smooth", block: "nearest" }); });
        c.addEventListener("mousemove", ev => showTip(`<div class="tt-h">${new Date(e.d).toLocaleDateString("de-DE")}</div>${e.t}`, ev.clientX, ev.clientY));
        c.addEventListener("mouseleave", hideTip);
      });
      svg.appendChild(dot); svg.appendChild(hit);
    });
    openEvent(window.EVENTS.find(e => e.d === "2023-10-17") || window.EVENTS[0]);
    table("#weeklyTable", ["Woche ab", "neu gemeldet", "kumuliert"],
      wk.map(d => [new Date(d.w).toLocaleDateString("de-DE"), nf.format(d.killed), d.cum ? nf.format(d.cum) : "–"]));
  })();

  // ---------- Saeuglings-Check ----------
  (function infants() {
    const I = INF;
    document.getElementById("infantStats").innerHTML = [
      [I.listed_under1, "Unter-1-Jährige in der Liste"],
      [I.prewar_born, "davon vor dem 7.10.23 geboren"],
      [I.warborn_total, "im Krieg Geborene in der Liste"],
      [I.expected_natural_infant_deaths_war_period, "erwartete natürliche Säuglingstote im Zeitraum*"],
    ].map(([v, l]) => `<div class="stat"><b>${nf.format(v)}</b><span>${l}</span></div>`).join("");
    const months = Object.keys(I.prewar_birthmonth_ramp);
    const vals = months.map(m => I.prewar_birthmonth_ramp[m]);
    const W = 960, H = 300, L = 46, R = 16, T = 16, B = 52, pw = W - L - R, ph = H - T - B;
    const max = 90, bw = pw / months.length;
    const y = v => T + ph - v / max * ph;
    const svg = frame("#infantRamp", W, H);
    for (let g = 0; g <= max; g += 30) yGrid(svg, L, W - R, y(g), g, g);
    svg.appendChild(el("line", { x1: L, x2: W - R, y1: y(0), y2: y(0), class: "axis-line" }));
    const MN = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
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
      hit.addEventListener("mousemove", ev => showTip(`<div class="tt-h">geboren ${MN[+mm - 1]} ${yy}</div><b>${v}</b> vor Vollendung des 1. Lebensjahres getötet`, ev.clientX, ev.clientY));
      hit.addEventListener("mouseleave", hideTip);
      svg.appendChild(hit);
    });
    table("#infantTable", ["Geburtsmonat", "getötete Unter-1-Jährige"], months.map((m, i) => [m, vals[i]]));
    document.getElementById("infantVerdict").innerHTML =
      `<b>Befund:</b> Allein die natürliche Säuglingssterblichkeit hätte im Kriegszeitraum ${nf.format(I.expected_natural_infant_deaths_war_period)}
       Todesfälle erzeugt (${nf.format(I.assumptions.births_per_year)} Geburten/Jahr × ${I.assumptions.imr_per_1000}‰) —
       die Liste enthält aber nur ${nf.format(I.listed_under1)} Unter-1-Jährige <em>insgesamt</em>, deren Geburtsmonate dem
       Kriegs-Expositionsmuster folgen. Die natürlichen Säuglingstode fehlen fast vollständig: ein starkes Indiz,
       dass die Liste natürliche Todesfälle <em>nicht</em> enthält. Zugleich sind ${nf.format(I.warborn_total)} im Krieg
       geborene Kinder erfasst — vor der Registrierung getötete Neugeborene kann eine ID-basierte Liste nicht zählen,
       die wahre Zahl liegt also eher höher.
       <br><span class="fine">*Annahme: ${nf.format(I.assumptions.births_per_year)} Geburten/Jahr (PCBS 2025), Säuglingssterblichkeit ${I.assumptions.imr_per_1000}‰ (PCBS 2022), ${I.assumptions.war_months} Monate.</span>`;
  })();

  // ---------- Geschlechterverhaeltnis ----------
  (function sexratio() {
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
    svg.appendChild(txt(el("text", { x: W / 2, y: H - 6, "text-anchor": "middle", class: "axis-label" }), "Alter"));
    // Referenz: Bevoelkerungsanteil
    const py = y(SEX.popMaleShare * 100);
    svg.appendChild(el("line", { x1: L, x2: W - R, y1: py, y2: py, stroke: C.muted, "stroke-width": 1.2 }));
    svg.appendChild(txt(el("text", { x: W - R, y: py - 6, "text-anchor": "end", fill: C.muted, "font-size": "12" }),
      "Männeranteil Bevölkerung ~51 %"));
    // Marker 12 & 18
    [[12, "12 J."], [18, "18 J."]].forEach(([a, l]) => {
      svg.appendChild(el("line", { x1: x(a), x2: x(a), y1: T, y2: T + ph, stroke: C.axis, "stroke-width": 1 }));
      svg.appendChild(txt(el("text", { x: x(a) + 4, y: T + 12, fill: C.muted, "font-size": "12" }), l));
    });
    const path = smooth.filter(d => d.share != null)
      .map((d, i) => (i ? "L" : "M") + x(d.age).toFixed(1) + " " + y(d.share).toFixed(1)).join(" ");
    svg.appendChild(el("path", { d: path, fill: "none", stroke: C.m, "stroke-width": 2.2, "stroke-linejoin": "round" }));
    const last = smooth[smooth.length - 1];
    svg.appendChild(txt(el("text", { x: x(88), y: y(last.share) - 10, "text-anchor": "end", fill: C.ink2, "font-size": "12.5" }),
      "Männeranteil der Getöteten"));
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
      showTip(`<div class="tt-h">Alter ${d.age}${d.age === 90 ? "+" : ""}</div><b>${d.share.toFixed(1)} %</b> männlich<br>
        <span class="tt-h">${nf.format(d.m)} Männer · ${nf.format(d.f)} Frauen (±1 Jahr geglättet)</span>`, ev.clientX, ev.clientY);
    });
    hover.addEventListener("mouseleave", () => { hideTip(); cross.setAttribute("visibility", "hidden"); });
    const grp = (a0, a1) => { let m = 0, f = 0; rows.forEach(r => { if (r.age >= a0 && r.age <= a1) { m += r.m; f += r.f; } });
      return (m / (m + f) * 100).toFixed(1); };
    table("#sexTable", ["Alter", "Männer", "Frauen", "Männeranteil"],
      [[0,4],[5,9],[10,14],[15,17],[18,29],[30,39],[40,49],[50,59],[60,69],[70,79],[80,90]].map(([a,b]) => {
        let m = 0, f = 0; rows.forEach(r => { if (r.age >= a && r.age <= b) { m += r.m; f += r.f; } });
        return [`${a}–${b}${b===90?"+":""}`, nf.format(m), nf.format(f), (m/(m+f)*100).toFixed(1)+" %"];
      }));
    document.getElementById("sexVerdict").innerHTML =
      `<b>Befund:</b> Bei Kleinkindern entspricht der Männeranteil mit ${grp(0,4)} % fast dem Bevölkerungswert —
       ein Hinweis gegen systematische Erfindung, denn erfundene Listen reproduzieren solche Feinstrukturen selten.
       Ab ~10 Jahren steigt er steil: ${grp(10,14)} % (10–14), ${grp(15,17)} % (15–17), ${grp(18,29)} % (18–29).
       Der Anstieg beginnt also tatsächlich schon vor der Volljährigkeit — vereinbar mit Rekrutierung Minderjähriger,
       aber auch mit dem Risikoprofil von Jungen, die Wege, Botengänge und Bergungen übernehmen. <em>Die Liste selbst
       kann zwischen beidem nicht unterscheiden</em> — genau deshalb zeigen wir die Kurve offen statt einer Deutung.`;
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
        (m.endsWith("-01") ? "Jan " : "Okt ") + m.slice(2, 4))); });
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
        "Lancet-Survey: 75.200 Gewalttote bis 5.1.25"));
      svg.appendChild(el("line", { x1: x(li), x2: x(li), y1: y(75200) + 8, y2: y(NAT.monthly_cum["2025-01"]), stroke: C.est, "stroke-width": 1, opacity: .6 }));
    }
    svg.appendChild(txt(el("text", { x: x(months.length - 1) - 4, y: y(cum[cum.length - 1]) - 10, "text-anchor": "end", fill: C.ink2, "font-size": "12.5" }),
      "offizielle Zählung"));
    const adjLabel = txt(el("text", { x: x(months.length - 1) - 4, y: 0, "text-anchor": "end", fill: C.f, "font-size": "12.5" }), "");
    svg.appendChild(adjLabel);
    const legend = `<div class="legend" style="margin:10px 4px 0">
      <span class="sw" style="background:${C.m}"></span>offizielle kumulierte Zählung
      <span class="sw" style="background:${C.f}"></span>Szenario: bereinigt um unterstellte natürliche Tote
      <span class="sw sw-est"></span>unabhängige Messung (Lancet)</div>`;
    document.getElementById("scenario").insertAdjacentHTML("beforeend", legend);
    const slider = document.getElementById("natSlider"), out = document.getElementById("natOut"),
          warn = document.getElementById("natWarn"), verdict = document.getElementById("natVerdict");
    function years(i) { const [Y, M] = months[i].split("-").map(Number); return (Y - 2023) + (M - 10) / 12; }
    function update() {
      const rate = +slider.value;
      out.textContent = nf.format(rate) + "/Jahr";
      const adj = cum.map((v, i) => v - rate * years(i));
      adjPath.setAttribute("d", adj.map((v, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(Math.max(0, v)).toFixed(1)).join(" "));
      const totalRemoved = Math.round(rate * years(months.length - 1));
      warn.hidden = totalRemoved <= 5000;
      adjLabel.setAttribute("y", y(Math.max(0, adj[adj.length - 1])) + 18);
      adjLabel.textContent = rate ? `Szenario: ${nf.format(Math.round(adj[adj.length - 1]))}` : "";
      verdict.innerHTML = `<b>Lies es so:</b> Bei unterstellten ${nf.format(rate)} natürlichen Toten pro Jahr wären
        ${nf.format(totalRemoved)} der ${nf.format(cum[cum.length - 1])} Erfassten keine Kriegstoten —
        es blieben ${nf.format(cum[cum.length - 1] - totalRemoved)}. Der demografische Deckel liegt bei ~5.000
        (die Liste enthält nur ${nf.format(NAT.list_60plus)} Über-60-Jährige, natürliche Sterblichkeit trifft aber zu ~62 % diese Gruppe).
        In die Gegenrichtung: Der Lancet-Survey misst für Anfang 2025 rund <b>+25.000 mehr</b> Gewalttote als die damalige Zählung,
        und ~${nf.format(NAT.under_rubble)} Vermisste unter Trümmern fehlen noch. Der ehrliche Korridor liegt also eher
        <em>über</em> der offiziellen Zahl als darunter.`;
    }
    slider.addEventListener("input", update); update();
    table("#scenTable", ["Monat", "kumuliert offiziell"], months.map((m, i) => [m, nf.format(cum[i])]));
  })();

  // ---------- Kombattanten-Abzug ----------
  (function combatants() {
    const TOTAL = META.killed_total;
    const SC = [
      { key: "none",  n: 0,     label: "Ohne Abzug",                      sub: "Liste, wie veröffentlicht" },
      { key: "hamas", n: 6000,  label: "6.000 — Hamas-Eigenangabe",       sub: "Feb 2024, sicher veraltet" },
      { key: "intel", n: 8900,  label: "8.900 — geleakte IDF-Intel-DB",   sub: "namentlich, Stand Mai 2025 (Guardian/+972)" },
      { key: "idf",   n: 22000, label: "22.000+ — IDF öffentlich",        sub: "Angabe vor Kriegsende, Okt 2025" },
    ];
    const btns = document.getElementById("combatBtns");
    btns.innerHTML = SC.map(s =>
      `<button data-key="${s.key}" data-n="${s.n}">${s.label}<small>${s.sub}</small></button>`).join("");
    const stats = document.getElementById("combatStats"), verdict = document.getElementById("combatVerdict");
    function apply(n, label) {
      btns.querySelectorAll("button").forEach(b => b.classList.toggle("active", +b.dataset.n === n));
      document.dispatchEvent(new CustomEvent("combat-scenario", { detail: { n } }));
      const rest = TOTAL - n, share = n / TOTAL * 100;
      stats.innerHTML = [
        [nf.format(n), "als Kombattanten abgezogen"],
        [nf.format(rest), "verbleibende Tote (implizite Zivilisten)"],
        [share.toFixed(1) + " %", "Kombattanten-Anteil an allen Toten"],
        [n ? (rest / n).toFixed(1) + " : 1" : "—", "Zivilisten je Kombattant"],
      ].map(([v, l]) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`).join("");
      verdict.innerHTML = `<b>Was das heißt:</b> ${n ? `Unter dieser Quelle wären ${share.toFixed(1)} % der ${nf.format(TOTAL)}
        Toten Kombattanten — auf je einen getöteten Kämpfer kämen ${(rest / n).toFixed(1)} getötete Zivilisten.` :
        "Wähle eine Quelle, um den Abzug zu sehen."}
        Verteilungs-Annahme in der Pyramide: männlich, 16–59, proportional zu den männlichen Toten je Jahrgang —
        eine Modellannahme, keine Information aus der Liste. Zu beachten: Keine der drei Zahlen ist unabhängig verifiziert;
        die Intel-DB (Mai 2025) endet vor den letzten Kriegsmonaten; die ~1.600 am 7.10. in Israel getöteten Angreifer
        sind hier nicht enthalten. Spannweite des Kombattanten-Anteils je nach Quelle: <b>8–30 %</b>.`;
    }
    btns.addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      apply(+b.dataset.n, b.textContent);
    });
    // Eigene Zahl
    const custom = document.getElementById("combatCustom");
    const applyCustom = () => { const v = Math.max(0, Math.min(45000, Math.round(+custom.value || 0))); apply(v); };
    document.getElementById("combatApply").addEventListener("click", applyCustom);
    custom.addEventListener("keydown", e => { if (e.key === "Enter") applyCustom(); });
    apply(0);
  })();

  // ---------- Getoetet durch die eigene Seite ----------
  document.getElementById("ownStats").innerHTML = [
    ["~400", "Tote durch intra-palästinensische Gewalt (ACLED, seit Okt 23)"],
    ["220+", "dokumentierte Gewalt-Vorfälle, ~70 % nach März 2025"],
    ["60", "Tote allein im Nov 2025 (Hamas-Kampagne gegen Clans)"],
    ["33+", "öffentliche Hinrichtungen Sep–Okt 2025"],
    ["100–300", "Tote der Al-Ahli-Explosion (laut US-Intel PIJ-Fehlrakete)"],
    ["550+", "im eigenen Gebiet eingeschlagene Raketen bis Ende 2023"],
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
      info.textContent = "Lade Gesamtliste für Personensuche (6,5 MB) …";
      LIST = await get("list.json");
      info.textContent = `Gesamtliste geladen: ${nf.format(LIST.length)} Personen durchsuchbar.`;
      run();
    }
    const cap = s => s.replace(/(^|[\s-])\p{L}/gu, c => c.toUpperCase());
    // Symbol-System: Kategorie-Badges je Familie (Kaempfer kuratiert, Journalisten automatisch aus Presse-Liste)
    const badges = f => {
      const t = ((window.FAM_NOTES || {})[f.k] || {}).tags || [];
      let s = "";
      if (t.includes("fighter")) s += `<span class="bdg b-f" title="dokumentierte Kämpfer/Kommandeure in der Familie">★</span>`;
      if (f.p) s += `<span class="bdg b-p" title="${f.p} getötete(r) Journalist(en) laut Presse-Datensatz">✎${f.p > 1 ? f.p : ""}</span>`;
      if (t.includes("medic")) s += `<span class="bdg b-m" title="bekannter Sanitäter-/Medizin-Fall">✚</span>`;
      if (t.includes("prisoner")) s += `<span class="bdg b-pr" title="prominenter Austausch-Häftling">⛓</span>`;
      if (t.includes("official")) s += `<span class="bdg b-o" title="dokumentierter Hamas-Funktionär">◆</span>`;
      if (t.includes("victims")) s += `<span class="bdg b-v" title="international bekannter Zivilopfer-Fall">●</span>`;
      return s;
    };
    const famRow = (f, i) => `<div class="famrow" data-i="${i}"><b>${cap(f.k)}</b>${badges(f)}
      <span class="meta">${nf.format(f.n)} Tote · ${f.m} Männer · ${f.f} Frauen · ${f.kids} Minderjährige
      ${f.sib ? `· ${f.sib} Geschwister-Gruppen (größte: ${f.big})` : ""}</span></div>`;
    document.getElementById("famTop").innerHTML =
      `<table><thead><tr><th>Familie</th><th>Tote</th><th>Männer</th><th>Frauen</th><th>&lt;18</th><th>Geschwister-Gruppen</th></tr></thead><tbody>` +
      FAMS.slice(0, 15).map((f, i) => `<tr style="cursor:pointer" data-i="${i}"><td>${cap(f.k)}${badges(f)}</td><td>${nf.format(f.n)}</td>
        <td>${nf.format(f.m)}</td><td>${nf.format(f.f)}</td><td>${nf.format(f.kids)}</td><td>${f.sib}</td></tr>`).join("") +
      "</tbody></table>";
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
        if (sib.length) clusters = `<h4 style="margin:14px 0 6px;color:var(--muted);font-size:13px">MUTMASSLICHE GESCHWISTER-GRUPPEN (gleicher Vater + Großvater)</h4>` +
          sib.slice(0, 12).map(([k, g]) => `<div class="loadhint">Kinder von ${cap(k)}: <b style="color:var(--ink)">${g.length}</b>
            (Alter ${g.map(r => r[2]).sort((a, b) => a - b).join(", ")})</div>`).join("");
        members = `<h4 style="margin:14px 0 4px;color:var(--muted);font-size:13px">ALLE ${nf.format(mem.length)} EINTRÄGE</h4>` +
          mem.sort((a, b) => a[2] - b[2]).slice(0, 400).map(r =>
            `<div class="member"><span class="who">${r[0]}</span><span class="ar">${r[1]}</span>
             <span class="agesex">${r[2]} J. · ${r[3] === "f" ? "♀" : "♂"}</span></div>`).join("") +
          (mem.length > 400 ? `<div class="loadhint">… ${nf.format(mem.length - 400)} weitere</div>` : "");
      } else {
        members = `<div class="loadhint">Für Mitgliederliste und Geschwister-Gruppen die Gesamtliste laden (oben ins Suchfeld klicken).</div>`;
      }
      // Recherchierte Herkunft + bekannte Mitglieder
      let notes = "";
      const FN = (window.FAM_NOTES || {})[f.k];
      if (FN) {
        notes = `<div style="border-left:3px solid var(--m);padding:2px 0 2px 14px;margin:10px 0 4px">
          ${FN.origin ? `<div style="font-size:14px"><span style="color:var(--muted)">Herkunft des Namens:</span> ${FN.origin}</div>` : ""}
          ${(FN.notable || []).map(p => `<div style="font-size:14px;margin-top:6px"><span style="color:var(--muted)">Bekannt:</span>
            <a href="${p.url}" target="_blank" rel="noopener">${p.name}</a> — ${p.info}</div>`).join("")}</div>`;
      }
      detail.hidden = false;
      detail.innerHTML = `<h3>Familie ${cap(f.k)}${badges(f)}</h3>
        <p class="desc">${nf.format(f.n)} Tote — ${f.m} Männer, ${f.f} Frauen, davon ${f.kids} unter 18.
        ${f.sib ? `${f.sib} mutmaßliche Geschwister-Gruppen, die größte mit ${f.big} Kindern.` : ""}</p>${notes}${clusters}${members}`;
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
        if (people.length) html += `<h4 style="margin:12px 0 4px;color:var(--muted);font-size:13px">PERSONEN (max. 40)</h4>` +
          people.map(r => `<div class="member"><span class="who">${r[0]}</span><span class="ar">${r[1]}</span>
            <span class="agesex">${r[2]} J. · ${r[3] === "f" ? "♀" : "♂"}</span></div>`).join("");
      }
      results.innerHTML = html || `<div class="loadhint">Keine Familie gefunden${LIST ? ", keine Person gefunden" : ""}.</div>`;
    }
    input.addEventListener("focus", loadList, { once: true });
    input.addEventListener("input", run);
    document.getElementById("famResults").addEventListener("click", e => {
      const r = e.target.closest(".famrow"); if (r) openFam(+r.dataset.i);
    });
    document.getElementById("famTop").addEventListener("click", e => {
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
    // Jungen-Ueberhang 12-17: maennliche Tote ueber dem demografisch erwarteten Verhaeltnis (105:100)
    const boysSurplus = Math.round(SEX.byAge.filter(d => d.age >= 12 && d.age <= 17)
      .reduce((s, d) => s + Math.max(0, d.m - 1.045 * d.f), 0));
    el("calcBoysN").textContent = nf.format(boysSurplus);
    function update() {
      const baseKey = document.querySelector("input[name=calcBase]:checked").value;
      const base = bases[baseKey];
      const rate = +el("natSlider").value;
      const nat = Math.round(rate * yearsTotal);
      const own = Math.max(0, Math.min(5000, +el("calcOwn").value || 0));
      const boys = el("calcBoys").checked ? boysSurplus : 0;
      const warDead = base - nat;
      const fighters = combatN + boys;
      const civTotal = Math.max(0, warDead - fighters);
      const result = Math.max(0, civTotal - own);
      const civShare = warDead > 0 ? civTotal / warDead * 100 : 0;
      const ratio = fighters > 0 ? civTotal / fighters : null;
      el("calcCombat").textContent = nf.format(combatN);
      el("calcNatural").textContent = nf.format(nat);
      el("calcNaturalHint").textContent = rate
        ? `= ${nf.format(rate)}/Jahr × ${dz(yearsTotal)} Kriegsjahre (Regler aus Check 3)`
        : "(Regler aus Check 3)";
      el("calcResult").textContent = nf.format(result);
      el("calcBreakdown").innerHTML =
        `Rechenweg: ${nf.format(base)} (Basis) − ${nf.format(nat)} natürliche Tote − ${nf.format(combatN)} Kombattanten`
        + (boys ? ` − ${nf.format(boys)} Jungen-Überhang` : "")
        + ` − ${nf.format(own)} durch palästinensische Akteure = <b style="color:var(--ink)">${nf.format(result)}</b>
         &nbsp;·&nbsp; Zivilistenanteil an den Kriegstoten: <b style="color:var(--ink)">${dz(civShare)} %</b>
         &nbsp;·&nbsp; Verhältnis: <b style="color:var(--ink)">${ratio != null ? "1 : " + dz(ratio) : "— (keine Kombattanten gewählt)"}</b>`;
      drawRatio(ratio);
    }
    // Vergleichs-Chart: getoetete Zivilisten je getoetetem Kombattanten (1 : X)
    const ROWS = [
      { label: "Gaza 2023–26 — deine Rechnung", user: true },
      { label: "Gaza 2023–26 — Quellenspanne (IDF 22k ↔ Intel-DB 8,9k)", lo: 2.3, hi: 7.2 },
      { label: "Gaza 2014 (IDF ↔ UN)", lo: 1.0, hi: 3.0 },
      { label: "Gaza 2008–09 (Modell ↔ B'Tselem)", lo: 0.6, hi: 1.9 },
      { label: "Mosul 2016–17 (Kämpferzahl unsicher)", lo: 1.1, hi: 3.7 },
      { label: "Irak-Krieg 2003–23 (IBC-basiert)", lo: 4.4, hi: 4.4 },
      { label: "Afghanistan 2001–21 (Costs of War)", lo: 0.4, hi: 0.4 },
      { label: "UN-Faustregel „90 %“ (umstritten)", lo: 9.0, hi: 9.0, ref: true },
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
      s += `<text x="${(Lp + W - Rp) / 2}" y="${H - 8}" text-anchor="middle" class="axis-label">getötete Zivilisten je getötetem Kombattanten</text>`;
      ROWS.forEach((r, i) => {
        const y = T + i * RH + RH / 2;
        s += `<text x="${Lp - 12}" y="${y + 4}" text-anchor="end" fill="${r.user ? C.f : "var(--ink-2)"}" font-size="12.5">${r.label}</text>`;
        if (r.user) {
          if (userRatio == null) {
            s += `<text x="${x(0) + 6}" y="${y + 4}" fill="var(--muted)" font-size="12" font-style="italic">— wähle oben eine Kombattanten-Quelle oder eigene Zahl</text>`;
          } else {
            const clamped = userRatio > MAXR;
            s += `<line x1="${x(0)}" x2="${x(userRatio)}" y1="${y}" y2="${y}" stroke="${C.f}" stroke-width="3" stroke-linecap="round"/>`;
            s += `<circle cx="${x(userRatio)}" cy="${y}" r="6" fill="${C.f}"/><circle cx="${x(userRatio)}" cy="${y}" r="6" fill="none" stroke="var(--surface)" stroke-width="2"/>`;
            s += `<text x="${x(userRatio) + 11}" y="${y + 4}" fill="${C.f}" font-size="12.5" font-weight="600">1 : ${dz(userRatio)}${clamped ? " (außerhalb)" : ""}</text>`;
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
    el("natSlider").addEventListener("input", update);
    el("calcOwn").addEventListener("input", update);
    el("calcBoys").addEventListener("change", update);
    document.querySelectorAll("input[name=calcBase]").forEach(r => r.addEventListener("change", update));
    update();
  })();
})();
