// Schlüsselereignisse + Pressestimmen (Original-Schlagzeilen, verlinkt, mit Quelle).
// side: "A" = Guardian/Haaretz/Al Jazeera/+972 · "B" = JPost/ToI/Fox/AJC/CAMERA/LWJ · "N" = Institutionen/Agenturen
window.EVENTS = [
  { d: "2023-10-07", t: "Hamas-Überfall auf Israel",
    desc: "Hamas und Verbündete töten in Israel rund 1.200 Menschen und verschleppen 251 Geiseln — der tödlichste Tag der israelischen Geschichte. Beginn des Krieges.",
    press: [
      { side:"N", outlet:"France 24", title:"Hamas terrorist attacks on October 7: The deadliest day in Israel's history", url:"https://www.france24.com/en/middle-east/20241007-hamas-terrorist-attacks-7-october-deadliest-day-israel-history-anniversary" },
      { side:"B", outlet:"ADL", title:"The October 7th War: A Timeline Of Key Events and Issues", url:"https://www.adl.org/resources/backgrounder/october-7th-war-timeline-key-events-and-issues" }
    ] },
  { d: "2023-10-17", t: "Explosion am Al-Ahli-Krankenhaus",
    desc: "Das MoH meldet sofort 471 Tote durch einen israelischen Angriff; US-Geheimdienste schätzen 100–300 Tote, HRW und westliche Analysen sehen eine fehlgegangene Rakete des Islamischen Dschihad als wahrscheinliche Ursache. Bis heute der größte Streitfall einer Einzel-Opferzahl.",
    press: [
      { side:"N", outlet:"Human Rights Watch", title:"Gaza: Findings on October 17 al-Ahli Hospital Explosion", url:"https://www.hrw.org/news/2023/11/26/gaza-findings-october-17-al-ahli-hospital-explosion" },
      { side:"B", outlet:"Times of Israel", title:"Israel says Islamic Jihad rocket misfire caused blast near Gaza hospital", url:"https://www.timesofisrael.com/israel-says-islamic-jihad-rocket-misfire-caused-gaza-hospital-blast/" },
      { side:"B", outlet:"Jerusalem Post", title:"Islamic Jihad misfired rocket strikes Gaza hospital, killing hundreds", url:"https://www.jpost.com/breaking-news/article-768879" },
      { side:"N", outlet:"NBC News", title:"Gaza hospital blast likely a Palestinian Islamic Jihad rocket misfire, U.S. officials say", url:"https://www.nbcnews.com/news/world/live-blog/israel-hamas-war-live-updates-rcna120978" }
    ] },
  { d: "2023-10-27", t: "Beginn der Bodenoffensive",
    desc: "Nach drei Wochen Luftkrieg rücken israelische Bodentruppen in den Norden des Gazastreifens ein. Oktober 2023 bleibt mit 8.525 gemeldeten Toten der tödlichste Monat des Krieges.",
    press: [
      { side:"N", outlet:"CNN", title:"October 27, 2023 Israel-Hamas war news", url:"https://www.cnn.com/middleeast/live-news/israel-hamas-war-gaza-news-10-27-23/index.html" },
      { side:"N", outlet:"Gulf News", title:"Israel ground forces and jets raided central Gaza: army", url:"https://gulfnews.com/world/mena/israel-ground-forces-and-jets-raided-central-gaza-army-1.1698386404250" }
    ] },
  { d: "2023-11-24", t: "Feuerpause und Geisel-Austausch",
    desc: "Einwöchige Feuerpause; Hamas lässt 105 Geiseln frei, Israel entlässt 240 palästinensische Gefangene. 137 Hilfskonvois an einem Tag — Rekord bis dahin. Danach Wiederaufnahme der Kämpfe.",
    press: [
      { side:"A", outlet:"Al Jazeera", title:"Hamas releases 11 more captives from Gaza, Israeli army says", url:"https://www.aljazeera.com/news/2023/11/27/hamas-releases-11-more-captives-from-gaza-israeli-army-says" },
      { side:"N", outlet:"TIME", title:"Hamas and Israel Continue to Release Hostages and Prisoners", url:"https://time.com/6339462/hamas-hostages-israel-palestinian-prisoners/" }
    ] },
  { d: "2024-05-06", t: "Rafah-Offensive",
    desc: "Israel beginnt die lange angekündigte Offensive auf Rafah, wohin rund eine Million Menschen geflohen waren, und übernimmt den Grenzübergang nach Ägypten.",
    press: [
      { side:"A", outlet:"Al Jazeera", title:"Israel seizes key Gaza border crossing as it launches assault on Rafah", url:"https://www.aljazeera.com/news/2024/5/7/israel-seizes-gazas-vital-rafah-border-crossing" },
      { side:"N", outlet:"Axios", title:"Israel moves to capture the Palestinian side of Rafah border crossing, sources say", url:"https://www.axios.com/2024/05/06/israel-gaza-rafah-invasion-hamas-hostage-deal" },
      { side:"N", outlet:"PBS", title:"Israel confirms it is expanding offensive as forces reach central Rafah", url:"https://www.pbs.org/newshour/amp/world/israel-confirms-it-is-expanding-offensive-as-forces-reach-central-rafah" }
    ] },
  { d: "2024-10-16", t: "Jahia Sinwar getötet",
    desc: "Israelische Soldaten töten den Hamas-Chef und Architekten des 7. Oktober bei einem Zufallskontakt in Rafah. Die Schlagzeilen zeigen die Lager im Kontrast: „Architekt des Massakers“ gegen „Geist des Widerstands“.",
    press: [
      { side:"A", outlet:"Al Jazeera", title:"‘Spirit of resistance’: Hamas leader Yahya Sinwar", url:"https://www.aljazeera.com/news/2024/10/17/yahya-sinwar-obituary" },
      { side:"B", outlet:"AJC", title:"5 Things to Know About Hamas Terror Leader Yahya Sinwar, ‘The Architect of October 7’", url:"https://www.ajc.org/news/5-things-to-know-about-hamas-terror-leader-yahya-sinwar-the-architect-of-october-7" },
      { side:"N", outlet:"Washington Post", title:"Yahya Sinwar, architect of Hamas massacre in Israel, killed at 61", url:"https://www.washingtonpost.com/obituaries/2024/10/17/sinwar-hamas-gaza-dies/" }
    ] },
  { d: "2025-01-19", t: "Waffenruhe I",
    desc: "Nach 15 Monaten tritt eine Waffenruhe in Kraft; in Phase 1 kommen 33 Geiseln gegen fast 2.000 Gefangene frei. Die MoH-Zählung steht bei ~46.900.",
    press: [
      { side:"A", outlet:"Al Jazeera", title:"Timeline: The path to the Israel-Hamas ceasefire deal in Gaza", url:"https://www.aljazeera.com/features/2025/1/19/timeline-the-path-to-the-israel-hamas-ceasefire-deal-in-gaza" },
      { side:"B", outlet:"Times of Israel", title:"Gaza ceasefire enters effect as 3 Israeli hostages released, reunited with families", url:"https://www.timesofisrael.com/liveblog-january-19-2025/" },
      { side:"N", outlet:"CNN", title:"First Israeli hostages, Palestinian prisoners freed as Gaza ceasefire takes force", url:"https://www.cnn.com/world/live-news/israel-hamas-ceasefire-war-palestine-01-19-25/index.html" }
    ] },
  { d: "2025-03-18", t: "Bruch der Waffenruhe",
    desc: "Israel nimmt die Angriffe mit einer Welle schwerer Luftschläge wieder auf — über 400 Tote am ersten Tag, einer der tödlichsten des Krieges. Die Schlagzeilen erzählen zwei Geschichten: Wer hat die Waffenruhe beendet?",
    press: [
      { side:"A", outlet:"Al Jazeera", title:"Israel ends ceasefire in Gaza", url:"https://www.aljazeera.com/amp/video/newsfeed/2025/3/18/israel-ends-ceasefire-in-gaza-2" },
      { side:"B", outlet:"Times of Israel", title:"Israel resumes Gaza strikes, says Hamas collapsed truce by refusing to free hostages", url:"https://www.timesofisrael.com/israel-restarts-gaza-strikes-blames-hamas-for-not-releasing-hostages-as-truce-collapses/" },
      { side:"N", outlet:"PBS", title:"Israel resumes strikes in Gaza killing more than 400 Palestinians and shattering ceasefire with Hamas", url:"https://www.pbs.org/newshour/world/israel-resumes-strikes-in-gaza-killing-more-than-400-palestinians-and-shattering-ceasefire-with-hamas" }
    ] },
  { d: "2025-05-27", t: "GHF-Verteilzentren & Tote bei Hilfslieferungen",
    desc: "Die Gaza Humanitarian Foundation übernimmt die Essensverteilung an wenigen Punkten. Bis Oktober werden kumuliert über 2.600 Menschen bei der Suche nach Hilfsgütern getötet — laut UN überwiegend durch israelisches Feuer, teils durch Banden und Contractors.",
    press: [
      { side:"A", outlet:"Al Jazeera", title:"Israel kills nearly 600 Palestinians at aid centres: All you need to know", url:"https://www.aljazeera.com/news/2025/6/29/israel-kills-nearly-600-palestinians-at-aid-centres-all-you-need-to-know" },
      { side:"N", outlet:"UN News", title:"Gaza: Over 400 Palestinians killed around private aid hubs, UN rights office says", url:"https://news.un.org/en/story/2025/06/1164846" },
      { side:"N", outlet:"Ärzte ohne Grenzen", title:"US-backed aid distribution points in Gaza are sites of orchestrated killing", url:"https://www.doctorswithoutborders.org/latest/us-backed-aid-distribution-points-gaza-are-sites-orchestrated-killing" }
    ] },
  { d: "2025-08-21", t: "Recherche: IDF-Datenbank zählt 8.900 tote Kämpfer",
    desc: "Guardian, +972 und Local Call veröffentlichen Zahlen aus einer klassifizierten IDF-Datenbank (Stand Mai 2025): 8.900 namentlich erfasste tote Hamas/PIJ-Kämpfer — 17% der damaligen Gesamttoten. Die offizielle IDF-Angabe lag bei 20.000+.",
    press: [
      { side:"A", outlet:"Al Jazeera", title:"Israeli data shows 83 percent of Gaza war dead are civilians: Report", url:"https://www.aljazeera.com/news/2025/8/21/israeli-data-shows-83-percent-of-gaza-war-dead-are-civilians-report" },
      { side:"A", outlet:"+972 Magazine", title:"IDF database suggests 83% of Gaza dead were civilians", url:"https://www.972mag.com/israeli-intelligence-database-83-percent-civilians-militants/" },
      { side:"B", outlet:"CAMERA", title:"Guardian “83%” civilian death toll claim is farcical", url:"https://www.camera.org/article/guardian-83-civilian-death-toll-claim-is-farcical/" }
    ] },
  { d: "2025-08-22", t: "IPC erklärt Hungersnot",
    desc: "Die IPC bestätigt erstmals eine Hungersnot im Gouvernement Gaza — die erste offiziell festgestellte im Nahen Osten. Das Famine Review Committee nennt sie „entirely man-made“. Das MoH zählt bis Juni 2026 463 Hungertote, darunter 157 Kinder.",
    press: [
      { side:"N", outlet:"WHO", title:"Famine confirmed for first time in Gaza", url:"https://www.who.int/news/item/22-08-2025-famine-confirmed-for-first-time-in-gaza" },
      { side:"N", outlet:"CS Monitor", title:"There’s famine in Gaza, says the IPC. Will the world respond?", url:"https://www.csmonitor.com/World/Middle-East/2025/0825/gaza-palestine-food-famine-ipc-israel" }
    ] },
  { d: "2025-09-16", t: "Großoffensive auf Gaza-Stadt",
    desc: "Drei IDF-Divisionen beginnen die Einnahme von Gaza-Stadt („Gideon's Chariots II“), 60.000 Reservisten einberufen; Hunderttausende fliehen erneut Richtung Süden. Verteidigungsminister Katz: „Gaza brennt.“",
    press: [
      { side:"N", outlet:"CNBC", title:"‘Gaza is burning’: Israel launches ground invasion of strip's largest city", url:"https://www.cnbc.com/2025/09/16/gaza-is-burning-israel-launches-ground-invasion-of-gaza-city.html" },
      { side:"B", outlet:"Long War Journal", title:"IDF completes preparations for next phase of Gaza City offensive", url:"https://www.longwarjournal.org/archives/2025/09/idf-completes-preparations-for-next-phase-of-gaza-city-offensive.php" },
      { side:"N", outlet:"CBS News", title:"Israel says Gaza City ground offensive against Hamas underway", url:"https://www.cbsnews.com/news/israel-gaza-city-war-hamas-ground-offensive-underway/" }
    ] },
  { d: "2025-10-10", t: "Waffenruhe II — Kriegsende",
    desc: "Auf Basis des Trump-Plans tritt die Waffenruhe in Kraft; am 13.10. kommen die letzten 20 lebenden Geiseln frei, Israel entlässt fast 2.000 Gefangene. Seither wurden noch 6.122 Tote nachgemeldet — vor allem Bergungen aus Trümmern.",
    press: [
      { side:"N", outlet:"NPR", title:"Israeli hostages freed, hundreds of Palestinians released, as Trump hails 'historic dawn'", url:"https://www.npr.org/2025/10/13/g-s1-93207/hamas-releasing-israeli-hostages" },
      { side:"N", outlet:"CNN", title:"Israeli hostages and Palestinian detainees released as mediators sign Trump’s Gaza ceasefire deal", url:"https://www.cnn.com/world/live-news/israel-hamas-gaza-hostages-ceasefire-10-13-25" }
    ] },
  { d: "2025-11-15", t: "Hamas-Kampagne gegen die Clans",
    desc: "Nach dem israelischen Teilrückzug konsolidiert Hamas die Kontrolle: Der November wird laut ACLED mit 60 Toten der tödlichste Monat intra-palästinensischer Gewalt — Kampagne gegen mindestens drei große Clans, öffentliche Hinrichtungen inklusive.",
    press: [
      { side:"N", outlet:"ACLED", title:"Middle East Overview: November 2025", url:"https://acleddata.com/update/middle-east-overview-november-2025" },
      { side:"B", outlet:"Jerusalem Post", title:"Gang war in Gaza: Determining the future of Hamas's rule", url:"https://www.jpost.com/opinion/article-870943" },
      { side:"N", outlet:"HSToday", title:"Hamas Conducts Public Executions Amid Internal Power Struggle in Gaza", url:"https://www.hstoday.us/global/hamas-conducts-public-executions-amid-internal-power-struggle-in-gaza/" }
    ] },
  { d: "2026-01-29", t: "IDF akzeptiert die MoH-Gesamtzahl",
    desc: "Die israelische Armee erklärt, sie halte die Gesamtzahl von ~70.000 Toten für zutreffend — bei weiter unklarem Kombattanten-Anteil (eigene Angabe: 22.000+ getötete Kämpfer).",
    press: [
      { side:"A", outlet:"Haaretz", title:"IDF Accepts Gaza Health Ministry Death Toll of Over 71,000 Palestinians Killed During the War", url:"https://www.haaretz.com/israel-news/2026-01-29/ty-article/.premium/idf-accepts-gaza-health-ministry-estimate-of-over-70-000-palestinians-killed-in-the-war/0000019c-0918-dec4-adfd-fd5dde830000" },
      { side:"B", outlet:"Times of Israel", title:"IDF believes 70,000 Gazans killed in war, as claimed by Hamas; civilian-combatant ratio unclear", url:"https://www.timesofisrael.com/idf-believes-70000-gazans-killed-in-war-as-claimed-by-hamas/" },
      { side:"B", outlet:"Fox News", title:"Hamas terror outlet quietly cuts Gaza death count, reveals most killed were combat-age men", url:"https://www.foxnews.com/world/hamas-terror-outlet-quietly-cuts-gaza-death-count-reveals-most-killed-were-combat-age-men" }
    ] }
];
