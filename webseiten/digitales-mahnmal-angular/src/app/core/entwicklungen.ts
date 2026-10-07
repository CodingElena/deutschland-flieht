/* ===========================================================================
 * Liveticker „Aktuelle Entwicklungen“ — die EINE Stelle, an der gepflegt wird.
 *
 * Diese Liste speist die Seite /entwicklungen und die Beiträge
 * auf der Startseite (dort erscheinen automatisch die jüngsten Einträge).
 * Wer hier einen Eintrag ergänzt, muss sonst nichts anfassen.
 *
 * NEUEN EINTRAG ANLEGEN
 *   1. Ein Objekt an beliebiger Stelle in EINTRAEGE einfügen (die Reihenfolge
 *      ist egal, sortiert wird nach `datum`).
 *   2. Datum als ISO (JJJJ-MM-TT). Ist nur Monat oder Jahr bekannt, den
 *      Monatsersten nehmen und `datumText` setzen (z. B. 'April 2026').
 *   3. Titel und Text in EIGENEN Worten schreiben. Die Seite verlinkt zur
 *      Quelle, sie übernimmt keine fremden Texte.
 *   4. Nur Zahlen eintragen, die an der verlinkten Quelle nachprüfbar sind.
 *   5. STAND unten auf das Prüfdatum setzen, dann neu bauen und hochladen.
 * ========================================================================= */

export type Typ = 'statistik' | 'studie' | 'umfrage' | 'bericht';

export type Thema = 'Abwanderung' | 'Fachkräfte' | 'Steuern' | 'Bürokratie' | 'Standort' | 'Jugend';

export interface Eintrag {
  readonly id: string;
  /** ISO-Datum JJJJ-MM-TT. Bestimmt die Sortierung. */
  readonly datum: string;
  /** Anzeigetext statt des Datums, wenn nur Monat/Jahr/Stand bekannt ist. */
  readonly datumText?: string;
  /** Herausgeber / Medium. */
  readonly medium: string;
  readonly typ: Typ;
  readonly themen: readonly Thema[];
  /** Eigene Überschrift. */
  readonly titel: string;
  /** Eigene Zusammenfassung in ein bis drei Sätzen. */
  readonly text: string;
  /** Optional: die eine Zahl, die hängen bleiben soll. */
  readonly zahl?: { readonly wert: string; readonly label: string };
  /** Direktlink zur Quelle. */
  readonly url: string;
}

/** Wann der Bestand zuletzt an den Quellen geprüft wurde. */
export const STAND = { iso: '2026-10-04', text: '4. Oktober 2026' } as const;

export const TYP_LABEL: Readonly<Record<Typ, string>> = {
  statistik: 'Amtliche Statistik',
  studie: 'Studie',
  umfrage: 'Umfrage',
  bericht: 'Bericht',
};

export const THEMEN: readonly Thema[] = ['Abwanderung', 'Fachkräfte', 'Steuern', 'Bürokratie', 'Standort', 'Jugend'];

export const EINTRAEGE: readonly Eintrag[] = [
  {
    id: 'webde-akademiker',
    datum: '2026-07-30',
    medium: 'web.de Magazin',
    typ: 'bericht',
    themen: ['Abwanderung', 'Fachkräfte'],
    titel: 'Akademiker, Ärzte, IT-Fachkräfte: Wer geht wirklich?',
    text:
      'Das Magazin ordnet den Rekord von 288.579 Fortzügen ein und weist darauf hin, dass die Daten zu Qualifikation und Zielen unscharf sind. ' +
      'Für den Anteil der Akademiker unter den Auswandernden nennt es rund 70 Prozent.',
    zahl: { wert: '288.579', label: 'Fortzüge deutscher Staatsangehöriger 2025' },
    url: 'https://web.de/magazine/politik/rekord-auswanderung-akademiker-verlassen-deutschland-42535082',
  },
  {
    id: 'iab-buerokratie',
    datum: '2026-07-02',
    medium: 'IAB — Institut für Arbeitsmarkt- und Berufsforschung',
    typ: 'studie',
    themen: ['Bürokratie', 'Abwanderung'],
    titel: 'Bürokratie ist für ein Drittel der Weggezogenen ein Grund',
    text:
      'Das IAB hat Eingewanderte in zwei Befragungswellen begleitet. Von denen, die zwischen den Wellen aus Deutschland weggezogen sind, ' +
      'nennt knapp jeder Dritte aufwändige bürokratische Verfahren als Grund. Häufiger wird nur die Familie genannt.',
    zahl: { wert: '32 %', label: 'der Abgewanderten nennen Bürokratie' },
    url: 'https://iab.de/presseinfo/ein-drittel-der-abgewanderten-nennt-buerokratie-als-abwanderungsgrund/',
  },
  {
    id: 'destatis-ziele',
    datum: '2026-06-09',
    medium: 'Statistisches Bundesamt',
    typ: 'statistik',
    themen: ['Abwanderung'],
    titel: 'Schweiz, Österreich, Spanien: die Hauptziele 2025',
    text:
      '2025 zogen mehr Deutsche in die Schweiz, nach Österreich und nach Spanien als in die USA. ' +
      'In die Schweiz gingen 22.700, nach Österreich 13.500, nach Spanien 9.700, in die USA knapp 8.900.',
    zahl: { wert: '22.700', label: 'Fortzüge in die Schweiz' },
    url: 'https://www.destatis.de/DE/Presse/Pressemitteilungen/Zahl-der-Woche/2026/PD26_24_p002.html',
  },
  {
    id: 'destatis-wanderung-2025',
    datum: '2026-06-01',
    medium: 'Statistisches Bundesamt',
    typ: 'statistik',
    themen: ['Abwanderung'],
    titel: 'Wanderungsverlust deutscher Staatsangehöriger steigt auf 97.000',
    text:
      'Insgesamt sank die Nettozuwanderung 2025 auf rund 235.000 Personen. Bei Deutschen wuchs der Verlust: ' +
      '97.000 mehr zogen fort, als zurückkehrten. 2024 waren es 81.000.',
    zahl: { wert: '−97.000', label: 'Saldo deutscher Staatsangehöriger 2025' },
    url: 'https://www.destatis.de/DE/Presse/Pressemitteilungen/2026/06/PD26_184_12411.html',
  },
  {
    id: 'destatis-reihe',
    datum: '2026-06-01',
    medium: 'Statistisches Bundesamt',
    typ: 'statistik',
    themen: ['Abwanderung'],
    titel: 'Fortzüge und Saldo deutscher Staatsangehöriger seit 1950',
    text:
      'Die vollständige Reihe des Statistischen Bundesamts, Jahr für Jahr mit Zuzügen, Fortzügen und Saldo. ' +
      'Für 2025 weist sie 288.579 Fortzüge und 191.890 Zuzüge aus.',
    url: 'https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Bevoelkerung/Wanderungen/Tabellen/wanderungen-zwischen-deutschland-und-dem-ausland-jahr-02.html',
  },
  {
    id: 'oecd-keil-2025',
    datum: '2026-04-01',
    datumText: 'April 2026',
    medium: 'OECD',
    typ: 'statistik',
    themen: ['Steuern'],
    titel: 'Abgabenkeil: Deutschland liegt 2025 bei 49,3 Prozent',
    text:
      'Taxing Wages 2026 misst, welcher Anteil der Arbeitskosten Alleinstehender mit Durchschnittslohn als Steuern und Sozialabgaben abgeht. ' +
      'Für Deutschland nennt die OECD 2025 einen Wert von 49,3 Prozent. Der OECD-Durchschnitt liegt bei 35,1 Prozent.',
    zahl: { wert: '49,3 %', label: 'Abgabenkeil Deutschland 2025' },
    url: 'https://www.oecd.org/en/publications/2026/04/taxing-wages-2026_d1f39986.html',
  },
  {
    id: 'jugend-2026',
    datum: '2026-03-25',
    medium: 'Forschung & Lehre (Trendstudie „Jugend in Deutschland 2026“)',
    typ: 'umfrage',
    themen: ['Jugend', 'Abwanderung'],
    titel: 'Jeder fünfte junge Mensch plant den Weggang',
    text:
      '21 Prozent der 14- bis 29-Jährigen planen laut der Trendstudie konkret, Deutschland zu verlassen. 41 Prozent können es sich grundsätzlich vorstellen. ' +
      'Grundlage ist eine Online-Befragung von rund 2.000 jungen Menschen.',
    zahl: { wert: '21 %', label: 'der 14- bis 29-Jährigen mit konkreten Plänen' },
    url: 'https://www.forschung-und-lehre.de/zeitfragen/jugend-in-deutschland-2026-ein-fuenftel-will-auswandern-7606',
  },
  {
    id: 'baek-aerzte',
    datum: '2025-12-31',
    datumText: 'Stand 31. Dezember 2025',
    medium: 'Bundesärztekammer',
    typ: 'statistik',
    themen: ['Fachkräfte', 'Abwanderung'],
    titel: '2.234 Ärztinnen und Ärzte verließen Deutschland',
    text:
      'Nach der Ärztestatistik gingen 2025 insgesamt 2.234 Ärztinnen und Ärzte ins Ausland, 1.236 davon mit deutscher Staatsangehörigkeit. ' +
      'Zugleich stieg die Zahl zugewanderter Ärztinnen und Ärzte um 5 Prozent auf 71.480.',
    zahl: { wert: '1.236', label: 'deutsche Ärztinnen und Ärzte gingen 2025 ins Ausland' },
    url: 'https://www.bundesaerztekammer.de/baek/ueber-uns/aerztestatistik/2025',
  },
  {
    id: 'iab-viertel',
    datum: '2025-06-11',
    medium: 'IAB — Institut für Arbeitsmarkt- und Berufsforschung',
    typ: 'studie',
    themen: ['Fachkräfte', 'Abwanderung'],
    titel: 'Ein Viertel der Eingewanderten denkt über Wegzug nach',
    text:
      '26 Prozent der Eingewanderten erwägen, Deutschland zu verlassen, 3 Prozent haben konkrete Pläne. Besonders häufig denken gut ausgebildete, ' +
      'wirtschaftlich erfolgreiche Zugewanderte darüber nach. In IT, Finanzen und Unternehmensdienstleistungen sind es 30 bis 39 Prozent.',
    zahl: { wert: '26 %', label: 'der Eingewanderten erwägen den Wegzug' },
    url: 'https://iab.de/presseinfo/ein-viertel-der-eingewanderten-in-deutschland-zieht-auswanderung-in-betracht/',
  },
  {
    id: 'bdi-forschung',
    datum: '2025-01-21',
    medium: 'BDI, Umfrage des Instituts für Demoskopie Allensbach',
    typ: 'umfrage',
    themen: ['Standort', 'Bürokratie'],
    titel: 'Forschung und Entwicklung wandern ab',
    text:
      'Ein Drittel der großen Industrieunternehmen hat Forschung und Entwicklung ins Ausland verlagert. Als Gründe nennen die 274 befragten Firmen ' +
      'Kosten (58 Prozent), weniger Bürokratie im Ausland (47 Prozent) und größere Innovationsoffenheit (34 Prozent).',
    zahl: { wert: '1 von 3', label: 'großen Industrieunternehmen hat F&E ins Ausland verlagert' },
    url: 'https://bdi.eu/de/articles/presse/unternehmensumfrage-zum-innovationsstandort-deutschland-abwanderung-von-forschung-und-entwicklung-bedroht-wertschoepfung-der-zukunft',
  },
  {
    id: 'destatis-regionen',
    datum: '2025-01-01',
    datumText: '2025',
    medium: 'Statistisches Bundesamt',
    typ: 'statistik',
    themen: ['Abwanderung'],
    titel: 'Wohin Deutsche fortziehen: nach Weltregionen',
    text: 'Die amtliche interaktive Grafik zeigt die Fortzüge deutscher Staatsangehöriger nach Zielgebieten.',
    url: 'https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Bevoelkerung/_Grafik/_Interaktiv/fortzuege-ausland-deutsche-nach-zielgebiet.html',
  },
  {
    id: 'ifo-buerokratie',
    datum: '2024-10-25',
    medium: 'ifo Institut, im Auftrag der Stiftung Familienunternehmen',
    typ: 'umfrage',
    themen: ['Bürokratie', 'Standort'],
    titel: 'Bürokratie hemmt Investitionen',
    text:
      'In einer ifo-Umfrage unter 1.763 Unternehmen sagen rund 91 Prozent, die Bürokratie habe seit 2022 zugenommen. ' +
      'Knapp 46 Prozent stellten Investitionen zurück, knapp 18 Prozent wollen Investitionen ins Ausland verlagern.',
    zahl: { wert: '91 %', label: 'sehen mehr Bürokratie seit 2022' },
    url: 'https://www.familienunternehmen.de/de/publikationen/buerokratie-als-wachstumsbremse-bestandsaufnahme-und-reformansaetze',
  },
  {
    id: 'bib-gerps',
    datum: '2019-12-04',
    medium: 'Bundesinstitut für Bevölkerungsforschung',
    typ: 'studie',
    themen: ['Fachkräfte'],
    titel: 'Drei Viertel der Aus- und Rückwanderer haben einen Hochschulabschluss',
    text:
      'Die GERPS-Studie befragte über 10.000 Deutsche, die zwischen Juli 2017 und Juni 2018 ins Ausland gezogen oder zurückgekehrt sind. ' +
      'Etwa drei Viertel haben einen Hochschulabschluss. In der Bevölkerung ist es nur gut ein Viertel.',
    zahl: { wert: '3 von 4', label: 'mit Hochschulabschluss' },
    url: 'https://www.bib.bund.de/DE/Presse/Pressegespraeche/2019-12-04-Gewinner-der-Globalisierung.html',
  },
];

/** Alle Einträge, neueste zuerst (so liest sie content.ts als BEITRAEGE). */
export const nachDatum = (): readonly Eintrag[] => [...EINTRAEGE].sort((a, b) => b.datum.localeCompare(a.datum));

/** Die jüngsten Einträge — das, was die Startseite zeigt. */
export const neueste = (anzahl: number): readonly Eintrag[] => nachDatum().slice(0, anzahl);

export const eintrag = (id: string): Eintrag => {
  const e = EINTRAEGE.find((x) => x.id === id);
  if (!e) throw new Error(`Eintrag ${id} fehlt in EINTRAEGE`);
  return e;
};

/** Anzeigedatum, z. B. „9. Juni 2026“. */
export const datumAnzeige = (e: Eintrag): string =>
  e.datumText ??
  new Date(`${e.datum}T12:00:00Z`).toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

/** Gilt als „neu“, wenn der Eintrag höchstens 60 Tage vor dem Prüfdatum liegt. */
export const istNeu = (e: Eintrag): boolean => {
  const tage = (new Date(`${STAND.iso}T12:00:00Z`).getTime() - new Date(`${e.datum}T12:00:00Z`).getTime()) / 86_400_000;
  return tage >= 0 && tage <= 60;
};

export const BEITRAEGE_ALLE: readonly Eintrag[] = nachDatum();
