/* Sprachumschalter DE/EN/AR/HE. Strategie: Sprache in localStorage, Wechsel = Reload,
   statisches HTML via [data-i18n], JS-Texte via t(). AR/HE schalten das Dokument auf RTL
   (Charts bleiben LTR). Analyse-Fliesstexte sind v1 nur Deutsch — Banner weist darauf hin. */
(function () {
  const LANGS = ["de", "en", "ar", "he"];
  const LANG = (localStorage.getItem("lang") || "de");
  const RTL = LANG === "ar" || LANG === "he";
  document.documentElement.lang = LANG;
  document.documentElement.dir = RTL ? "rtl" : "ltr";

  const D = {
    // Hero & Chrome
    "hero.kicker":  { de: "biest.com · Statistikprojekt", en: "biest.com · statistics project", ar: "biest.com · مشروع إحصائي", he: "biest.com · פרויקט סטטיסטי" },
    "hero.title":   { de: "Gaza: Die Toten in Zahlen", en: "Gaza: The Dead, in Numbers", ar: "غزة: القتلى بالأرقام", he: "עזה: המתים במספרים" },
    "hero.sub":     { de: "Die Opferliste des Gesundheitsministeriums in Gaza, konsolidiert von Iraq Body Count — namentlich, mit ID, Geburtsdatum, Alter und Geschlecht. Hier wird sie nicht nur gezeigt, sondern geprüft: auf Plausibilität, Lücken und die Streitfragen der Statistik.",
                      en: "The Gaza Health Ministry's casualty list, consolidated by Iraq Body Count — every name with ID, birth date, age and sex. Here it is not just displayed but stress-tested: for plausibility, gaps, and the statistical disputes.",
                      ar: "قائمة قتلى وزارة الصحة في غزة، موحّدة عبر Iraq Body Count — بالأسماء مع الهوية وتاريخ الميلاد والعمر والجنس. هنا لا تُعرض فحسب، بل تُفحص: المعقولية والثغرات والخلافات الإحصائية.",
                      he: "רשימת ההרוגים של משרד הבריאות בעזה, מאוחדת בידי Iraq Body Count — שמית, עם ת\"ז, תאריך לידה, גיל ומין. כאן היא לא רק מוצגת אלא נבחנת: סבירות, פערים והמחלוקות הסטטיסטיות." },
    "hero.banner":  { de: "", en: "Fully translated — only the family detail notes (origins, named individuals) and press headlines remain in their original language for now.",
                      ar: "الصفحة مترجمة بالكامل — فقط ملاحظات تفاصيل العائلات (الأصول والأفراد) وعناوين الصحف تبقى بلغتها الأصلية حالياً.",
                      he: "העמוד מתורגם במלואו — רק הערות פרטי המשפחות (מקורות, מזוהים) וכותרות העיתונות נותרות בינתיים בשפת המקור." },
    // Navigation
    "nav.pyr":      { de: "Pyramide", en: "Pyramid", ar: "الهرم العمري", he: "פירמידה" },
    "nav.komb":     { de: "Kombattanten-Abzug", en: "Combatant deduction", ar: "خصم المقاتلين", he: "ניכוי לוחמים" },
    "nav.zeit":     { de: "Zeitverlauf & Presse", en: "Timeline & press", ar: "الزمن والصحافة", he: "ציר זמן ועיתונות" },
    "nav.c1":       { de: "Säuglinge", en: "Infants", ar: "الرضّع", he: "תינוקות" },
    "nav.c2":       { de: "Jungen ab 12", en: "Boys from 12", ar: "فتيان 12+", he: "נערים מגיל 12" },
    "nav.c3":       { de: "Natürliche Tote", en: "Natural deaths", ar: "وفيات طبيعية", he: "תמותה טבעית" },
    "nav.eigen":    { de: "Eigene Seite", en: "Own side", ar: "نيران داخلية", he: "מהצד שלהם" },
    "nav.rechner":  { de: "Rechner", en: "Calculator", ar: "الحاسبة", he: "מחשבון" },
    "nav.fam":      { de: "Familien & Suche", en: "Families & search", ar: "العائلات والبحث", he: "משפחות וחיפוש" },
    "nav.meth":     { de: "Methodik", en: "Methods", ar: "المنهجية", he: "מתודולוגיה" },
    // Sektions-Ueberschriften
    "h.pyr":     { de: "Wer starb: die Alterspyramide", en: "Who died: the age pyramid", ar: "من قُتل: الهرم العمري", he: "מי נהרג: פירמידת הגילאים" },
    "h.komb":    { de: "Der Kombattanten-Abzug", en: "The combatant deduction", ar: "خصم المقاتلين", he: "ניכוי הלוחמים" },
    "h.zeit":    { de: "Der Verlauf: Woche für Woche", en: "The course: week by week", ar: "المسار أسبوعاً بأسبوع", he: "המהלך: שבוע אחר שבוע" },
    "h.c1":      { de: "Skeptiker-Check 1: Die Säuglinge", en: "Skeptic check 1: the infants", ar: "فحص المتشككين 1: الرضّع", he: "בדיקת ספקנות 1: התינוקות" },
    "h.c2":      { de: "Skeptiker-Check 2: Jungen ab 12", en: "Skeptic check 2: boys from age 12", ar: "فحص المتشككين 2: الفتيان من 12", he: "בדיקת ספקנות 2: נערים מגיל 12" },
    "h.c3":      { de: "Skeptiker-Check 3: Natürliche Tote", en: "Skeptic check 3: natural deaths", ar: "فحص المتشككين 3: الوفيات الطبيعية", he: "בדיקת ספקנות 3: תמותה טבעית" },
    "h.eigen":   { de: "Getötet durch die eigene Seite", en: "Killed by their own side", ar: "قتلى بنيران الجانب الفلسطيني", he: "נהרגו בידי הצד שלהם" },
    "h.rechner": { de: "Der Rechner: deine Schätzung der zivilen Opfer", en: "The calculator: your estimate of civilian deaths", ar: "الحاسبة: تقديرك للضحايا المدنيين", he: "המחשבון: ההערכה שלך להרוגים אזרחיים" },
    "h.fam":     { de: "Familien & Suche", en: "Families & search", ar: "العائلات والبحث", he: "משפחות וחיפוש" },
    "h.meth":    { de: "Methodik & Quellen", en: "Methods & sources", ar: "المنهجية والمصادر", he: "מתודולוגיה ומקורות" },
    // KPIs
    "kpi.total":   { de: "Getötete gesamt (MoH)", en: "Total killed (MoH)", ar: "إجمالي القتلى (وزارة الصحة)", he: "סה\"כ הרוגים (משרד הבריאות)" },
    "kpi.named":   { de: "davon namentlich erfasst", en: "of them named", ar: "منهم مسجّلون بالاسم", he: "מתוכם מזוהים בשם" },
    "kpi.children":{ de: "Kinder", en: "children", ar: "أطفال", he: "ילדים" },
    "kpi.women":   { de: "Frauen", en: "women", ar: "نساء", he: "נשים" },
    "kpi.injured": { de: "Verletzte", en: "injured", ar: "جرحى", he: "פצועים" },
    "kpi.famine":  { de: "registrierte Hungertote", en: "registered starvation deaths", ar: "وفيات جوع مسجّلة", he: "מתי רעב רשומים" },
    // Abzeichen
    "b.fighter":  { de: "dokumentierte Kämpfer/Kommandeure", en: "documented fighters/commanders", ar: "مقاتلون/قادة موثّقون", he: "לוחמים/מפקדים מתועדים" },
    "b.press":    { de: "getötete Journalisten", en: "journalists killed", ar: "صحفيون قُتلوا", he: "עיתונאים שנהרגו" },
    "b.medic":    { de: "getötete Gesundheitsarbeiter", en: "health workers killed", ar: "عاملون صحيون قُتلوا", he: "אנשי רפואה שנהרגו" },
    "b.prisoner": { de: "Austausch-Häftling", en: "prisoner freed in exchange", ar: "أسير محرّر في صفقة", he: "אסיר ששוחרר בעסקה" },
    "b.official": { de: "Hamas-Funktionär", en: "Hamas official", ar: "مسؤول في حماس", he: "בכיר חמאס" },
    "b.victims":  { de: "bekannter Zivilopfer-Fall", en: "known civilian-victim case", ar: "حالة ضحايا مدنيين معروفة", he: "מקרה ידוע של קורבנות אזרחיים" },
    // Kombattanten-Szenarien
    "sc.none":      { de: "Ohne Abzug", en: "No deduction", ar: "بدون خصم", he: "ללא ניכוי" },
    "sc.none.s":    { de: "Liste, wie veröffentlicht", en: "list as published", ar: "القائمة كما نُشرت", he: "הרשימה כפי שפורסמה" },
    "sc.hamas":     { de: "6.000 — Hamas-Eigenangabe", en: "6,000 — Hamas's own figure", ar: "6,000 — رقم حماس نفسها", he: "6,000 — הנתון של חמאס עצמה" },
    "sc.hamas.s":   { de: "Feb 2024, sicher veraltet", en: "Feb 2024, certainly outdated", ar: "شباط 2024، قديم بالتأكيد", he: "פבר׳ 2024, ודאי מיושן" },
    "sc.intel":     { de: "8.900 — geleakte IDF-Intel-DB", en: "8,900 — leaked IDF intel database", ar: "8,900 — قاعدة استخبارات الجيش المسرّبة", he: "8,900 — מאגר המודיעין שהודלף" },
    "sc.intel.s":   { de: "namentlich, Stand Mai 2025 (Guardian/+972)", en: "named, as of May 2025 (Guardian/+972)", ar: "بالأسماء، حتى أيار 2025", he: "שמי, נכון למאי 2025" },
    "sc.idf":       { de: "22.000+ — IDF öffentlich", en: "22,000+ — IDF public claim", ar: "+22,000 — إعلان الجيش الإسرائيلي", he: "22,000+ — הצהרת צה\"ל הפומבית" },
    "sc.idf.s":     { de: "Angabe vor Kriegsende, Okt 2025", en: "stated before war's end, Oct 2025", ar: "قبل نهاية الحرب، تشرين الأول 2025", he: "לפני סוף המלחמה, אוק׳ 2025" },
    // Kombattanten-Statistik
    "cs.deducted":  { de: "als Kombattanten abgezogen", en: "deducted as combatants", ar: "خُصموا كمقاتلين", he: "נוכו כלוחמים" },
    "cs.remaining": { de: "verbleibende Tote (implizite Zivilisten)", en: "remaining dead (implied civilians)", ar: "القتلى المتبقون (مدنيون ضمناً)", he: "הרוגים נותרים (אזרחים במשתמע)" },
    "cs.share":     { de: "Kombattanten-Anteil an allen Toten", en: "combatant share of all dead", ar: "نسبة المقاتلين من الإجمالي", he: "שיעור הלוחמים מכלל ההרוגים" },
    "cs.per":       { de: "Zivilisten je Kombattant", en: "civilians per combatant", ar: "مدنيون لكل مقاتل", he: "אזרחים לכל לוחם" },
    // Tabellen
    "col.family": { de: "Familie", en: "Family", ar: "العائلة", he: "משפחה" },
    "col.badges": { de: "Abzeichen", en: "Badges", ar: "الشارات", he: "תגים" },
    "col.dead":   { de: "Tote", en: "Dead", ar: "القتلى", he: "הרוגים" },
    "col.men":    { de: "Männer", en: "Men", ar: "رجال", he: "גברים" },
    "col.women":  { de: "Frauen", en: "Women", ar: "نساء", he: "נשים" },
    "col.sib":    { de: "Geschwister-Gruppen", en: "Sibling groups", ar: "مجموعات الأشقاء", he: "קבוצות אחים" },
    // Familien-Zeile
    "fam.meta": { de: "{0} Tote · {1} Männer · {2} Frauen · {3} Minderjährige", en: "{0} dead · {1} men · {2} women · {3} minors",
                  ar: "{0} قتلى · {1} رجال · {2} نساء · {3} قاصرون", he: "{0} הרוגים · {1} גברים · {2} נשים · {3} קטינים" },
    "fam.sib":  { de: "· {0} Geschwister-Gruppen (größte: {1})", en: "· {0} sibling groups (largest: {1})",
                  ar: "· {0} مجموعات أشقاء (الأكبر: {1})", he: "· {0} קבוצות אחים (הגדולה: {1})" },
    // Presse-Panel
    "press.inst":  { de: "INSTITUTIONEN / AGENTUREN", en: "INSTITUTIONS / AGENCIES", ar: "مؤسسات / وكالات", he: "מוסדות / סוכנויות" },
    "press.empty": { de: "— noch keine Schlagzeile erfasst", en: "— no headline captured yet", ar: "— لا عناوين بعد", he: "— אין עדיין כותרת" },
    // Eigene-Seite-Kacheln
    "own.1": { de: "Tote durch intra-palästinensische Gewalt (ACLED, seit Okt 23)", en: "killed in intra-Palestinian violence (ACLED, since Oct 23)", ar: "قتلى العنف الفلسطيني الداخلي (ACLED)", he: "הרוגי אלימות פנים-פלסטינית (ACLED)" },
    "own.2": { de: "dokumentierte Gewalt-Vorfälle, ~70 % nach März 2025", en: "documented incidents, ~70% after March 2025", ar: "حوادث موثّقة، ~70% بعد آذار 2025", he: "תקריות מתועדות, ~70% אחרי מרץ 2025" },
    "own.3": { de: "Tote allein im Nov 2025 (Hamas-Kampagne gegen Clans)", en: "killed in Nov 2025 alone (Hamas campaign against clans)", ar: "قتلى تشرين الثاني 2025 وحده (حملة ضد العشائر)", he: "הרוגים בנוב׳ 2025 לבדו (מבצע נגד חמולות)" },
    "own.4": { de: "öffentliche Hinrichtungen Sep–Okt 2025", en: "public executions Sep–Oct 2025", ar: "إعدامات علنية أيلول–تشرين الأول 2025", he: "הוצאות להורג פומביות ספט׳–אוק׳ 2025" },
    "own.5": { de: "Tote der Al-Ahli-Explosion (laut US-Intel PIJ-Fehlrakete)", en: "Al-Ahli blast deaths (per US intel a PIJ misfire)", ar: "قتلى انفجار الأهلي (صاروخ فاشل للجهاد وفق أمريكا)", he: "הרוגי פיצוץ אל-אהלי (רקטת גא\"פ כושלת לפי ארה\"ב)" },
    "own.6": { de: "im eigenen Gebiet eingeschlagene Raketen bis Ende 2023", en: "rockets that fell inside Gaza by end of 2023", ar: "صواريخ سقطت داخل غزة حتى نهاية 2023", he: "רקטות שנפלו בתוך עזה עד סוף 2023" },
    // Saeuglings-Kacheln
    "inf.1": { de: "Unter-1-Jährige in der Liste", en: "under-1-year-olds in the list", ar: "دون سنة واحدة في القائمة", he: "מתחת לגיל שנה ברשימה" },
    "inf.2": { de: "davon vor dem 7.10.23 geboren", en: "of them born before Oct 7, 2023", ar: "منهم وُلدوا قبل 7.10.23", he: "מתוכם נולדו לפני 7.10.23" },
    "inf.3": { de: "im Krieg Geborene in der Liste", en: "born during the war, in the list", ar: "وُلدوا خلال الحرب وفي القائمة", he: "נולדו במלחמה ונמצאים ברשימה" },
    "inf.4": { de: "erwartete natürliche Säuglingstote im Zeitraum*", en: "expected natural infant deaths in the period*", ar: "وفيات الرضّع الطبيعية المتوقعة*", he: "תמותת תינוקות טבעית צפויה בתקופה*" },
  };

  window.LANG = LANG;
  window.LOCALE = { de: "de-DE", en: "en-GB", ar: "ar", he: "he-IL" }[LANG];
  window.NUMLOC = { de: "de-DE", en: "en-GB", ar: "ar-MA", he: "he-IL" }[LANG]; // ar-MA: westliche Ziffern
  window.t = function (k) {
    const e = D[k] || (window.I18N_EXTRA || {})[k];
    let s = e ? (e[LANG] != null ? e[LANG] : e.de) : k;
    for (let i = 1; i < arguments.length; i++) s = s.replaceAll("{" + (i - 1) + "}", arguments[i]);
    return s;
  };
  window.setLang = function (l) {
    if (LANGS.includes(l)) { localStorage.setItem("lang", l); location.reload(); }
  };

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const v = window.t(el.dataset.i18n);
      if (v && v !== el.dataset.i18n) el.textContent = v;
    });
    // Sektions-Ueberschriften + Navigation + Hero per ID-Zuordnung (kein data-i18n im HTML noetig)
    if (LANG !== "de") {
      const SEC = { pyramide: "h.pyr", kombattanten: "h.komb", zeit: "h.zeit", check1: "h.c1", check2: "h.c2",
                    check3: "h.c3", eigen: "h.eigen", rechner: "h.rechner", familien: "h.fam", methodik: "h.meth" };
      const NAV = { "h.pyr": "nav.pyr", "h.komb": "nav.komb", "h.zeit": "nav.zeit", "h.c1": "nav.c1", "h.c2": "nav.c2",
                    "h.c3": "nav.c3", "h.eigen": "nav.eigen", "h.rechner": "nav.rechner", "h.fam": "nav.fam", "h.meth": "nav.meth" };
      for (const [id, k] of Object.entries(SEC)) {
        const h = document.querySelector(`#${id} > h2`);
        if (h) h.textContent = window.t(k);
        const a = document.querySelector(`.toc a[href="#${id}"]`);
        if (a) a.textContent = window.t(NAV[k]);
      }
      const q = (s, k) => { const el = document.querySelector(s); if (el) el.textContent = window.t(k); };
      q(".hero .kicker", "hero.kicker"); q(".hero h1", "hero.title"); q(".hero .sub", "hero.sub");
      document.title = window.t("hero.title") + " — biest.com";
      // Fliesstext-Uebersetzungen (content.js): Selektor mit @Index-Unterstuetzung, ">" = direktes Kind
      const q1 = sel => {
        let ctx = [document], direct = false;
        for (const tok of sel.split(/\s+/)) {
          if (tok === ">") { direct = true; continue; }
          const [css, idx] = tok.split("@");
          const next = [];
          for (const c of ctx) next.push(...c.querySelectorAll(direct ? ":scope > " + css : css));
          ctx = idx !== undefined ? [next[+idx]].filter(Boolean) : next;
          direct = false;
        }
        return ctx[0];
      };
      (window.I18N_CONTENT || []).forEach(([sel, tr]) => {
        const el = q1(sel);
        if (el && tr[LANG]) el.innerHTML = tr[LANG];
      });
      (window.I18N_ATTR || []).forEach(([sel, attr, tr]) => {
        const el = q1(sel);
        if (el && tr[LANG]) el.setAttribute(attr, tr[LANG]);
      });
      document.querySelectorAll(".tbl summary").forEach(s => { s.textContent = window.t("ui.tableview"); });
    }
    // Banner (nur nicht-deutsch)
    if (LANG !== "de") {
      const b = document.createElement("p");
      b.className = "langbanner";
      b.textContent = window.t("hero.banner");
      document.querySelector(".hero .sub")?.after(b);
    }
    // Umschalter in der Sticky-Nav
    const sw = document.createElement("div");
    sw.className = "langswitch";
    sw.innerHTML = LANGS.map(l =>
      `<button data-l="${l}"${l === LANG ? ' class="active"' : ""}>${{ de: "DE", en: "EN", ar: "عربي", he: "עברית" }[l]}</button>`).join("");
    sw.addEventListener("click", e => { const b = e.target.closest("button"); if (b) window.setLang(b.dataset.l); });
    document.querySelector(".toc")?.appendChild(sw);
  });
})();
