/* ===========================================================================
 * Seite „Aktuelle Entwicklungen“: Daten, Liveticker, Diagramme
 *
 * ALLE Zahlen stehen in diesem Block. Quellen:
 *   REIHE, MONATE  Statistisches Bundesamt, GENESIS 12711-0005 / 12711-0011
 *                  (Deutsche, Fortzüge/Zuzüge/Saldo), abgerufen 18.10.2026
 *   ZIELE          GENESIS 12711-0008, Fortzüge Deutscher 2025 nach Zielland
 *   KEIL           OECD-Datenbank (Taxing Wages), Berichtsjahr 2023, abgerufen 18.10.2026
 * Neue Meldung: Objekt in EINTRAEGE einfügen, STAND setzen, neu bauen.
 * ========================================================================= */
const STAND = { iso: '2026-10-18', text: '18. Oktober 2026' };

const REIHE = [
  [2000, 191909, 111244, 80665], [2001, 193958, 109507, 84451], [2002, 184202, 117683, 66519], [2003, 167216, 127267, 39949],
  [2004, 177993, 150667, 27326], [2005, 128051, 144815, -16764], [2006, 103388, 155290, -51902], [2007, 106014, 161105, -55091],
  [2008, 108331, 174759, -66428], [2009, 114700, 154988, -40288], [2010, 114752, 141000, -26248], [2011, 116604, 140132, -23528],
  [2012, 115028, 133232, -18204], [2013, 118425, 140282, -21857], [2014, 122195, 148636, -26441], [2015, 120713, 138273, -17560],
  [2016, 146047, 281411, -135364], [2017, 166703, 249181, -82478], [2018, 201531, 261851, -60320], [2019, 212669, 270294, -57625],
  [2020, 191883, 220239, -28356], [2021, 183650, 247829, -64179], [2022, 184753, 268167, -83414], [2023, 191356, 265035, -73679],
  [2024, 189107, 269986, -80879], [2025, 191890, 288579, -96689],
].map(([jahr, zuzug, fortzug, saldo]) => ({ jahr, zuzug, fortzug, saldo }));
/* Januar bis Juli 2026, vorläufig (Summe 172.096) */
const FORTZUG_2026_JAN_JUL = 172096;

const MONATE = {
  2024: [21326, 18889, 21348, 18542, 20855, 21907, 29973, 28972, 27275, 23772, 19883, 23419],
  2025: [22616, 23378, 25033, 22024, 20317, 23269, 27295, 31314, 28892, 24502, 20922, 25629],
  2026: [25174, 22872, 25517, 22286, 21605, 24641, 30001],
};
const MONAT_NAMEN = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

const ZIELE = [
  ['Schweiz', 22730, 20695], ['Österreich', 13549, 13308], ['Spanien', 9676, 8869], ['USA', 8860, 9307], ['Frankreich', 5748, 5543],
  ['Türkei', 5371, 5203], ['Polen', 4942, 4300], ['Vereinigtes Königreich', 4444, 4450], ['Italien', 3735, 3442], ['Niederlande', 3600, 3674],
  ['Vereinigte Arabische Emirate', 3410, 2674], ['Russland', 3306, 3210], ['Dänemark', 3120, 2857], ['Australien', 3087, 2905], ['Thailand', 2894, 2314],
];

const KEIL = [
  ['Belgien', 52.7], ['Deutschland', 47.9, 'hl'], ['Österreich', 47.2], ['Frankreich', 46.8], ['Italien', 45.1], ['Schweden', 42.1],
  ['Spanien', 40.2], ['Dänemark', 36.4], ['Niederlande', 35.1], ['OECD-Durchschnitt', 34.8, 'oecd'], ['Polen', 34.3], ['Kanada', 31.9],
  ['Vereinigtes Königreich', 31.3], ['USA', 29.9], ['Australien', 29.2], ['Schweiz', 23.5],
];

const THEMEN = ['Abwanderung', 'Fachkräfte', 'Steuern', 'Bürokratie', 'Standort', 'Jugend'];
const TYP = { statistik: 'Amtliche Statistik', studie: 'Studie', umfrage: 'Umfrage', bericht: 'Bericht' };

const EINTRAEGE = [
  {
    datum: '2026-10-02', medium: 'Statistisches Bundesamt', typ: 'statistik', themen: ['Abwanderung'],
    titel: 'Juli 2026: mehr Fortzüge als Zuzüge',
    text: 'Nach ersten vorläufigen Ergebnissen zogen im Juli 2026 rund 106.000 Menschen aus dem Ausland zu und rund 121.000 fort. Der Saldo lag bei −15.000, im Juli 2025 bei +5.000. Die Zahlen gelten für alle Staatsangehörigkeiten.',
    zahl: ['−15.000', 'Wanderungssaldo Juli 2026, vorläufig'],
    url: 'https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Bevoelkerung/Wanderungen/Wanderungsueberschuss.html',
  },
  {
    datum: '2026-10-02', medium: 'Statistisches Bundesamt, Monatsstatistik', typ: 'statistik', themen: ['Abwanderung'],
    titel: 'Deutsche Fortzüge Januar bis Juli 2026: 172.096',
    text: 'Die Monatstabelle weist für Januar bis Juli 2026 vorläufig 172.096 Fortzüge deutscher Staatsangehöriger aus. Im Vorjahreszeitraum stehen in derselben Tabelle 163.932, das sind rund 5 Prozent mehr. Der stärkste Monat 2026 war bislang der Juli mit 30.001.',
    zahl: ['172.096', 'Fortzüge Deutscher Januar bis Juli 2026'],
    url: 'https://www-genesis.destatis.de/datenbank/online/table/12711-0011',
  },
  {
    datum: '2026-07-30', medium: 'web.de Magazin', typ: 'bericht', themen: ['Abwanderung', 'Fachkräfte'],
    titel: 'Akademiker, Ärzte, IT-Fachkräfte: Wer geht wirklich?',
    text: 'Das Magazin ordnet den Rekord von 288.579 Fortzügen ein und weist darauf hin, dass die Daten zu Qualifikation und Zielen unscharf sind. Für den Anteil der Akademiker unter den Auswandernden nennt es rund 70 Prozent.',
    zahl: ['288.579', 'Fortzüge deutscher Staatsangehöriger 2025'],
    url: 'https://web.de/magazine/politik/rekord-auswanderung-akademiker-verlassen-deutschland-42535082',
  },
  {
    datum: '2026-07-02', medium: 'IAB, Institut für Arbeitsmarkt- und Berufsforschung', typ: 'studie', themen: ['Bürokratie', 'Abwanderung'],
    titel: 'Bürokratie ist für ein Drittel der Weggezogenen ein Grund',
    text: 'Das IAB hat Eingewanderte in zwei Befragungswellen begleitet. Von denen, die zwischen den Wellen aus Deutschland weggezogen sind, nennt knapp jeder Dritte aufwändige bürokratische Verfahren als Grund. Häufiger wird nur die Familie genannt.',
    zahl: ['32 %', 'der Abgewanderten nennen Bürokratie'],
    url: 'https://iab.de/presseinfo/ein-drittel-der-abgewanderten-nennt-buerokratie-als-abwanderungsgrund/',
  },
  {
    datum: '2026-06-09', medium: 'Statistisches Bundesamt', typ: 'statistik', themen: ['Abwanderung'],
    titel: 'Schweiz, Österreich, Spanien: die Hauptziele 2025',
    text: '2025 zogen mehr Deutsche in die Schweiz, nach Österreich und nach Spanien als in die USA. In die Schweiz gingen 22.700, nach Österreich 13.500, nach Spanien 9.700, in die USA knapp 8.900.',
    zahl: ['22.700', 'Fortzüge in die Schweiz'],
    url: 'https://www.destatis.de/DE/Presse/Pressemitteilungen/Zahl-der-Woche/2026/PD26_24_p002.html',
  },
  {
    datum: '2026-06-01', medium: 'Statistisches Bundesamt', typ: 'statistik', themen: ['Abwanderung'],
    titel: 'Wanderungsverlust deutscher Staatsangehöriger steigt auf 97.000',
    text: 'Insgesamt sank die Nettozuwanderung 2025 auf rund 235.000 Personen. Bei Deutschen wuchs der Verlust: 97.000 mehr zogen fort, als zurückkehrten. 2024 waren es 81.000.',
    zahl: ['−97.000', 'Saldo deutscher Staatsangehöriger 2025'],
    url: 'https://www.destatis.de/DE/Presse/Pressemitteilungen/2026/06/PD26_184_12411.html',
  },
  {
    datum: '2026-04-01', datumText: 'April 2026', medium: 'OECD', typ: 'statistik', themen: ['Steuern'],
    titel: 'Abgabenkeil: Deutschland liegt 2025 bei 49,3 Prozent',
    text: 'Taxing Wages 2026 misst, welcher Anteil der Arbeitskosten Alleinstehender mit Durchschnittslohn als Steuern und Sozialabgaben abgeht. Für Deutschland nennt die OECD 2025 einen Wert von 49,3 Prozent, den zweithöchsten unter 38 Ländern. Der OECD-Durchschnitt liegt bei 35,1 Prozent.',
    zahl: ['49,3 %', 'Abgabenkeil Deutschland 2025'],
    url: 'https://www.oecd.org/en/publications/2026/04/taxing-wages-2026_d1f39986.html',
  },
  {
    datum: '2026-03-25', medium: 'Forschung & Lehre (Trendstudie „Jugend in Deutschland 2026“)', typ: 'umfrage', themen: ['Jugend', 'Abwanderung'],
    titel: 'Jeder fünfte junge Mensch plant den Weggang',
    text: '21 Prozent der 14- bis 29-Jährigen planen laut der Trendstudie konkret, Deutschland zu verlassen. 41 Prozent können es sich grundsätzlich vorstellen. Grundlage ist eine Online-Befragung von rund 2.000 jungen Menschen.',
    zahl: ['21 %', 'der 14- bis 29-Jährigen mit konkreten Plänen'],
    url: 'https://www.forschung-und-lehre.de/zeitfragen/jugend-in-deutschland-2026-ein-fuenftel-will-auswandern-7606',
  },
  {
    datum: '2025-12-31', datumText: 'Stand 31. Dezember 2025', medium: 'Bundesärztekammer', typ: 'statistik', themen: ['Fachkräfte', 'Abwanderung'],
    titel: '2.234 Ärztinnen und Ärzte verließen Deutschland',
    text: 'Nach der Ärztestatistik gingen 2025 insgesamt 2.234 Ärztinnen und Ärzte ins Ausland, 1.236 davon mit deutscher Staatsangehörigkeit. Zugleich stieg die Zahl zugewanderter Ärztinnen und Ärzte um 5 Prozent auf 71.480.',
    zahl: ['1.236', 'deutsche Ärztinnen und Ärzte gingen 2025 ins Ausland'],
    url: 'https://www.bundesaerztekammer.de/baek/ueber-uns/aerztestatistik/2025',
  },
  {
    datum: '2025-06-11', medium: 'IAB, Institut für Arbeitsmarkt- und Berufsforschung', typ: 'studie', themen: ['Fachkräfte', 'Abwanderung'],
    titel: 'Ein Viertel der Eingewanderten denkt über Wegzug nach',
    text: '26 Prozent der Eingewanderten erwägen, Deutschland zu verlassen, 3 Prozent haben konkrete Pläne. Besonders häufig denken gut ausgebildete, wirtschaftlich erfolgreiche Zugewanderte darüber nach. In IT, Finanzen und Unternehmensdienstleistungen sind es 30 bis 39 Prozent.',
    zahl: ['26 %', 'der Eingewanderten erwägen den Wegzug'],
    url: 'https://iab.de/presseinfo/ein-viertel-der-eingewanderten-in-deutschland-zieht-auswanderung-in-betracht/',
  },
  {
    datum: '2025-01-21', medium: 'BDI, Umfrage des Instituts für Demoskopie Allensbach', typ: 'umfrage', themen: ['Standort', 'Bürokratie'],
    titel: 'Forschung und Entwicklung wandern ab',
    text: 'Ein Drittel der großen Industrieunternehmen hat Forschung und Entwicklung ins Ausland verlagert. Als Gründe nennen die 274 befragten Firmen Kosten (58 Prozent), weniger Bürokratie im Ausland (47 Prozent) und größere Innovationsoffenheit (34 Prozent).',
    zahl: ['1 von 3', 'großen Industrieunternehmen hat F&E ins Ausland verlagert'],
    url: 'https://bdi.eu/de/articles/presse/unternehmensumfrage-zum-innovationsstandort-deutschland-abwanderung-von-forschung-und-entwicklung-bedroht-wertschoepfung-der-zukunft',
  },
  {
    datum: '2024-10-25', medium: 'ifo Institut, im Auftrag der Stiftung Familienunternehmen', typ: 'umfrage', themen: ['Bürokratie', 'Standort'],
    titel: 'Bürokratie hemmt Investitionen',
    text: 'In einer ifo-Umfrage unter 1.763 Unternehmen sagen rund 91 Prozent, die Bürokratie habe seit 2022 zugenommen. Knapp 46 Prozent stellten Investitionen zurück, knapp 18 Prozent wollen Investitionen ins Ausland verlagern.',
    zahl: ['91 %', 'sehen mehr Bürokratie seit 2022'],
    url: 'https://www.familienunternehmen.de/de/publikationen/buerokratie-als-wachstumsbremse-bestandsaufnahme-und-reformansaetze',
  },
  {
    datum: '2019-12-04', medium: 'Bundesinstitut für Bevölkerungsforschung', typ: 'studie', themen: ['Fachkräfte'],
    titel: 'Drei Viertel der Aus- und Rückwanderer haben einen Hochschulabschluss',
    text: 'Die GERPS-Studie befragte über 10.000 Deutsche, die zwischen Juli 2017 und Juni 2018 ins Ausland gezogen oder zurückgekehrt sind. Etwa drei Viertel haben einen Hochschulabschluss. In der Bevölkerung ist es nur gut ein Viertel.',
    zahl: ['3 von 4', 'mit Hochschulabschluss'],
    url: 'https://www.bib.bund.de/DE/Presse/Pressegespraeche/2019-12-04-Gewinner-der-Globalisierung.html',
  },
];

const BELEGE = [
  ['288.579', 'Fortzüge deutscher Staatsangehöriger 2025', 'Statistisches Bundesamt, GENESIS 12711-0005', 'Tabellenstand 21.09.2026', 'https://www-genesis.destatis.de/datenbank/online/table/12711-0005'],
  ['−96.689', 'Wanderungssaldo deutscher Staatsangehöriger 2025 (Zuzüge 191.890)', 'Statistisches Bundesamt, GENESIS 12711-0005', 'Tabellenstand 21.09.2026', 'https://www-genesis.destatis.de/datenbank/online/table/12711-0005'],
  ['172.096', 'Fortzüge deutscher Staatsangehöriger Januar bis Juli 2026, vorläufig', 'Statistisches Bundesamt, GENESIS 12711-0011', 'Tabellenstand 02.10.2026', 'https://www-genesis.destatis.de/datenbank/online/table/12711-0011'],
  ['−15.000', 'Wanderungssaldo Juli 2026 (106.000 Zuzüge, 121.000 Fortzüge), alle Staatsangehörigkeiten, vorläufig', 'Statistisches Bundesamt', 'Veröffentlicht 02.10.2026', 'https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Bevoelkerung/Wanderungen/Wanderungsueberschuss.html'],
  ['22.730 · 13.549 · 9.676 · 8.860', 'Fortzüge 2025 in die Schweiz, nach Österreich, Spanien und in die USA', 'Statistisches Bundesamt, GENESIS 12711-0008', 'Tabellenstand 21.09.2026', 'https://www-genesis.destatis.de/datenbank/online/table/12711-0008'],
  ['134.804', 'Fortzüge 2025 ohne Angabe des Ziellandes (46,7 % von 288.579)', 'Statistisches Bundesamt, GENESIS 12711-0008', 'Tabellenstand 21.09.2026', 'https://www-genesis.destatis.de/datenbank/online/table/12711-0008'],
  ['49,3 %', 'Abgabenkeil Deutschland 2025 (OECD-Durchschnitt 35,1 %, Belgien 52,5 %)', 'OECD, Taxing Wages 2026', 'April 2026', 'https://www.oecd.org/en/publications/2026/04/taxing-wages-2026_d1f39986.html'],
  ['47,9 %', 'Abgabenkeil Deutschland, Berichtsjahr 2023, Grundlage des Ländervergleichs', 'OECD-Datenbank Taxing Wages', 'abgerufen 18.10.2026', 'https://www.oecd.org/en/topics/policy-areas/taxation.html'],
];

/* --------------------------------------------------------------------------- */
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const de = (n) => n.toLocaleString('de-DE');
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};
const svgNS = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs = {}, text) => {
  const n = document.createElementNS(svgNS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (text !== undefined) n.textContent = text;
  return n;
};
const datumAnzeige = (e) =>
  e.datumText ?? new Date(e.datum + 'T12:00:00Z').toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const istNeu = (e) => {
  const tage = (Date.parse(STAND.iso + 'T12:00:00Z') - Date.parse(e.datum + 'T12:00:00Z')) / 86400000;
  return tage >= 0 && tage <= 60;
};

/* --- Liveticker ------------------------------------------------------------------ */
(function ticker() {
  const liste = document.getElementById('tk-liste');
  const chips = document.getElementById('tk-chips');
  if (!liste || !chips) return;
  document.getElementById('tk-stand').textContent = 'Zuletzt geprüft: ' + STAND.text;
  const items = [...EINTRAEGE].sort((a, b) => b.datum.localeCompare(a.datum));
  liste.replaceChildren();
  items.forEach((e, idx) => {
    const li = el('li', 'tk__item');
    li.style.setProperty('--i', String(Math.min(idx, 8)));
    li.dataset.themen = e.themen.join('|');
    const meta = el('div', 'tk__meta');
    meta.append(el('span', 'tk__date', datumAnzeige(e)));
    if (istNeu(e)) meta.append(el('span', 'tk__neu', 'Neu'));
    meta.append(el('span', 'tk__typ', TYP[e.typ] + ' · ' + e.themen.join(', ')));
    const body = el('div', 'tk__body');
    body.append(el('h3', 'tk__title', e.titel), el('p', 'tk__text', e.text));
    const link = el('a', 'tk__src');
    link.href = e.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.append(el('span', 'tk__med', e.medium + ' ·'), document.createTextNode(' Zur Quelle '));
    link.insertAdjacentHTML('beforeend', '<svg class="ico ico--ne" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3 9 9 3M4.2 3H9v4.8"/></svg>');
    body.append(link);
    li.append(meta, body);
    if (e.zahl) {
      const z = el('div', 'tk__zahl');
      z.append(el('strong', '', e.zahl[0]), el('span', '', e.zahl[1]));
      li.append(z);
    }
    liste.append(li);
  });
  /* Filter */
  let aktiv = 'alle';
  const knopf = (name, label, anzahl) => {
    const b = el('button', 'chip');
    b.type = 'button';
    b.dataset.thema = name;
    b.setAttribute('aria-pressed', String(name === aktiv));
    b.append(document.createTextNode(label));
    b.append(el('small', '', String(anzahl)));
    return b;
  };
  chips.append(knopf('alle', 'Alle', items.length));
  for (const t of THEMEN) {
    const n = items.filter((e) => e.themen.includes(t)).length;
    if (n) chips.append(knopf(t, t, n));
  }
  chips.addEventListener('click', (ev) => {
    const b = ev.target.closest('.chip');
    if (!b) return;
    aktiv = b.dataset.thema;
    chips.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
    liste.querySelectorAll('.tk__item').forEach((li) => {
      const ok = aktiv === 'alle' || li.dataset.themen.split('|').includes(aktiv);
      li.hidden = !ok;
    });
  });
})();

/* --- Tooltip-Hilfe ------------------------------------------------------------------ */
function tooltip(host, tip) {
  return {
    zeige(html, clientX, clientY) {
      tip.innerHTML = html;
      const box = host.getBoundingClientRect();
      const w = tip.offsetWidth || 200;
      const x = Math.min(Math.max(clientX - box.left + 14, 6), box.width - w - 6);
      tip.style.left = x + 'px';
      tip.style.top = Math.max(clientY - box.top - tip.offsetHeight - 12, 4) + 'px';
      tip.classList.add('is-on');
    },
    weg() {
      tip.classList.remove('is-on');
    },
  };
}
const zeile = (label, wert) => '<span><i>' + label + '</i><b style="font-weight:500;letter-spacing:0;text-transform:none;display:inline;margin:0">' + wert + '</b></span>';

/* --- Diagramm: Reihe 2000–2025 (+2026 Jan–Jul) ------------------------------------- */
(function reihe() {
  const host = document.getElementById('chart-reihe');
  const tip = document.getElementById('tip-reihe');
  if (!host || !tip) return;
  const daten = REIHE.map((d) => ({ ...d }));
  const W = 1000, H = 430, L = 58, R = 12, T = 22, B = 44;
  const eintraege = [...daten, { jahr: 2026, fortzug: FORTZUG_2026_JAN_JUL, prelim: true }];
  const max = 300000;
  const bw = (W - L - R) / eintraege.length;
  const y = (v) => T + (1 - v / max) * (H - T - B);
  const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, focusable: 'false' });
  const defs = svg('defs');
  const pat = svg('pattern', { id: 'schraffur', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' });
  pat.append(svg('rect', { width: 6, height: 6, fill: '#3a0508' }), svg('rect', { width: 3, height: 6, fill: '#c4121b' }));
  defs.append(pat);
  s.append(defs);
  for (let v = 0; v <= max; v += 50000) {
    s.append(svg('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), class: v === 0 ? 'ax' : 'grid' }));
    s.append(svg('text', { x: L - 8, y: y(v) + 4, class: 'ylab' }, v ? (v / 1000).toLocaleString('de-DE') + ' Tsd.' : '0'));
  }
  const punkte = [];
  eintraege.forEach((d, i) => {
    const x = L + i * bw;
    const g = svg('g', { class: 'col', tabindex: 0, role: 'img', 'aria-label': d.prelim ? `2026, Januar bis Juli: ${de(d.fortzug)} Fortzüge, vorläufig` : `${d.jahr}: ${de(d.fortzug)} Fortzüge, ${de(d.zuzug)} Zuzüge, Saldo ${de(d.saldo)}` });
    const hoehe = (H - B) - y(d.fortzug);
    const bar = svg('rect', { x: x + bw * 0.16, y: y(d.fortzug), width: bw * 0.68, height: hoehe, class: 'bar-f' + (d.jahr === 2025 ? ' is-last' : '') + (d.prelim ? ' is-prelim' : '') });
    if (!reduce.matches) {
      bar.style.transformOrigin = `0 ${H - B}px`;
      bar.style.transform = 'scaleY(0)';
      bar.style.transition = `transform 1s cubic-bezier(.2,.8,.2,1) ${i * 0.025}s`;
      bar.dataset.grow = '1';
    }
    g.append(bar, svg('rect', { x, y: T, width: bw, height: H - T - B, class: 'hit' }));
    if (i % 5 === 0 || d.prelim) s.append(svg('text', { x: x + bw / 2, y: H - 16, class: 'xlab' }, d.prelim ? '2026*' : String(d.jahr)));
    const html = d.prelim
      ? `<b>2026, Jan–Jul</b>${zeile('Fortzüge', de(d.fortzug))}${zeile('Status', 'vorläufig')}`
      : `<b>${d.jahr}</b>${zeile('Fortzüge', de(d.fortzug))}${zeile('Zuzüge', de(d.zuzug))}${zeile('Saldo', (d.saldo < 0 ? '−' : '+') + de(Math.abs(d.saldo)))}`;
    const t = tooltip(host.parentElement, tip);
    const an = (ev) => {
      const r = g.getBoundingClientRect();
      t.zeige(html, ev.clientX ?? r.left + r.width / 2, ev.clientY ?? r.top);
    };
    g.addEventListener('pointermove', an);
    g.addEventListener('pointerenter', an);
    g.addEventListener('pointerleave', t.weg);
    g.addEventListener('focus', an);
    g.addEventListener('blur', t.weg);
    s.append(g);
    if (!d.prelim) punkte.push([x + bw / 2, y(d.zuzug)]);
  });
  s.append(svg('polyline', { points: punkte.map((p) => p.join(',')).join(' '), class: 'line-z' }));
  host.append(s);
  /* Balken wachsen beim Hereinscrollen */
  const grow = () => s.querySelectorAll('[data-grow]').forEach((b) => (b.style.transform = 'scaleY(1)'));
  if (reduce.matches || !('IntersectionObserver' in window)) grow();
  else {
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        io.disconnect();
        grow();
      }
    }, { rootMargin: '0px 0px -15% 0px' });
    io.observe(host);
  }
  /* Tabelle */
  const tab = document.getElementById('tab-reihe');
  if (tab) {
    tab.innerHTML = '<thead><tr><th>Jahr</th><th>Fortzüge</th><th>Zuzüge</th><th>Saldo</th></tr></thead><tbody>' +
      [...daten].reverse().map((d) => `<tr><td>${d.jahr}</td><td>${de(d.fortzug)}</td><td>${de(d.zuzug)}</td><td>${(d.saldo < 0 ? '−' : '+') + de(Math.abs(d.saldo))}</td></tr>`).join('') +
      `<tr><td>2026 (Jan–Jul, vorläufig)</td><td>${de(FORTZUG_2026_JAN_JUL)}</td><td>–</td><td>–</td></tr></tbody>`;
  }
})();

/* --- Diagramm: Monate ----------------------------------------------------------------- */
(function monate() {
  const host = document.getElementById('chart-monate');
  const tip = document.getElementById('tip-monate');
  if (!host || !tip) return;
  const W = 640, H = 340, L = 52, R = 14, T = 16, B = 34;
  const min = 15000, max = 35000;
  const x = (i) => L + (i / 11) * (W - L - R);
  const y = (v) => T + (1 - (v - min) / (max - min)) * (H - T - B);
  const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, focusable: 'false' });
  for (let v = min; v <= max; v += 5000) {
    s.append(svg('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), class: v === min ? 'ax' : 'grid' }));
    s.append(svg('text', { x: L - 8, y: y(v) + 4, class: 'ylab' }, (v / 1000).toLocaleString('de-DE') + ' Tsd.'));
  }
  MONAT_NAMEN.forEach((m, i) => s.append(svg('text', { x: x(i), y: H - 12, class: 'xlab' }, m)));
  const reihen = [[2024, '#76726f', 1.4], [2025, '#f1ece8', 1.6], [2026, '#ed1018', 2.6]];
  for (const [jahr, farbe, breite] of reihen) {
    const w = MONATE[jahr];
    const pl = svg('polyline', { points: w.map((v, i) => `${x(i)},${y(v)}`).join(' '), fill: 'none', stroke: farbe, 'stroke-width': breite, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
    if (!reduce.matches) {
      pl.setAttribute('pathLength', '1');
      pl.style.strokeDasharray = '1';
      pl.style.strokeDashoffset = '1';
      pl.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(.2,.8,.2,1)';
      pl.dataset.draw = '1';
    }
    s.append(pl);
    if (jahr === 2026) w.forEach((v, i) => s.append(svg('circle', { cx: x(i), cy: y(v), r: 3.4, fill: farbe })));
  }
  const t = tooltip(host.parentElement, tip);
  MONAT_NAMEN.forEach((m, i) => {
    const hit = svg('rect', { x: x(i) - (W - L - R) / 22, y: T, width: (W - L - R) / 11, height: H - T - B, class: 'hit', tabindex: 0, role: 'img', 'aria-label': `${m}: 2024 ${de(MONATE[2024][i])}, 2025 ${de(MONATE[2025][i])}${MONATE[2026][i] ? ', 2026 ' + de(MONATE[2026][i]) : ''}` });
    const html = `<b>${m}</b>${zeile('2024', de(MONATE[2024][i]))}${zeile('2025', de(MONATE[2025][i]))}${MONATE[2026][i] ? zeile('2026', de(MONATE[2026][i])) : zeile('2026', 'noch nicht veröffentlicht')}`;
    const an = (ev) => {
      const r = hit.getBoundingClientRect();
      t.zeige(html, ev.clientX ?? r.left + r.width / 2, ev.clientY ?? r.top);
    };
    hit.addEventListener('pointermove', an);
    hit.addEventListener('pointerenter', an);
    hit.addEventListener('pointerleave', t.weg);
    hit.addEventListener('focus', an);
    hit.addEventListener('blur', t.weg);
    s.append(hit);
  });
  host.append(s);
  const draw = () => s.querySelectorAll('[data-draw]').forEach((p) => (p.style.strokeDashoffset = '0'));
  if (reduce.matches || !('IntersectionObserver' in window)) draw();
  else {
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        io.disconnect();
        draw();
      }
    }, { rootMargin: '0px 0px -15% 0px' });
    io.observe(host);
  }
})();

/* --- Balken: Zielländer und Abgabenkeil ---------------------------------------------- */
function balken(listeId, zeilen) {
  const ul = document.getElementById(listeId);
  if (!ul) return;
  const max = Math.max(...zeilen.map((z) => z.wert));
  zeilen.forEach((z, i) => {
    const li = el('li', 'bar' + (z.klasse ? ' ' + z.klasse : ''));
    li.style.setProperty('--d', Math.min(i * 0.05, 0.6) + 's');
    li.style.setProperty('--w', (z.wert / max).toFixed(4));
    const name = el('span', 'bar__name', z.name);
    if (z.rang) name.append(el('small', '', 'Platz ' + z.rang));
    const track = el('span', 'bar__track');
    track.append(el('span', 'bar__fill'));
    const val = el('span', 'bar__val');
    val.append(document.createTextNode(z.text));
    if (z.sub) {
      const sm = el('small');
      sm.innerHTML = z.sub;
      val.append(sm);
    }
    li.append(name, track, val);
    ul.append(li);
  });
  if (reduce.matches || !('IntersectionObserver' in window)) ul.classList.add('is-in');
  else {
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        io.disconnect();
        ul.classList.add('is-in');
      }
    }, { rootMargin: '0px 0px -12% 0px' });
    io.observe(ul);
  }
}
balken(
  'bars-ziele',
  ZIELE.map(([name, f25, f24], i) => {
    const p = ((f25 - f24) / f24) * 100;
    const t = Math.abs(p).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return { name, rang: i + 1, wert: f25, text: de(f25), sub: `<span class="${p >= 0 ? 'plus' : 'minus'}">${p >= 0 ? '+' : '−'}${t} %</span> gegenüber 2024` };
  }),
);
balken(
  'bars-keil',
  KEIL.map(([name, v, k]) => ({ name, wert: v, text: v.toLocaleString('de-DE', { minimumFractionDigits: 1 }) + ' %', klasse: k === 'hl' ? 'bar--hl' : k === 'oecd' ? 'bar--oecd' : 'bar--grau', sub: k === 'hl' ? '2025: <b style="color:#ff6a70;font-weight:600">49,3 %</b>' : k === 'oecd' ? '2025: 35,1 %' : '' })),
);

/* --- Belege ---------------------------------------------------------------------------- */
(function belege() {
  const host = document.getElementById('belege');
  if (!host) return;
  for (const [zahl, was, quelle, stand, url] of BELEGE) {
    const row = el('div', 'beleg');
    row.append(el('strong', '', zahl), el('p', '', was));
    const a = el('div');
    const l = el('a');
    l.href = url;
    l.target = '_blank';
    l.rel = 'noopener noreferrer';
    l.append(document.createTextNode(quelle + ' '));
    l.insertAdjacentHTML('beforeend', '<svg class="ico ico--ne" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M3 9 9 3M4.2 3H9v4.8"/></svg>');
    a.append(l, el('small', '', stand));
    row.append(a);
    host.append(row);
  }
})();
