/* ===========================================================================
 * Kampagneninhalte — "Deutschland flieht."
 *
 * ALLE Texte und Zahlen der Seite stehen in dieser Datei. Die Komponenten
 * enthalten keine Inhalte, nur Struktur. Aendern heisst: hier aendern.
 *
 * -------------------------------------------------------------------------
 * WICHTIG — ZAHLEN VOR VEROEFFENTLICHUNG PRUEFEN
 * -------------------------------------------------------------------------
 * Jede Kennzahl hat ein Feld `geprueft`. Fortzüge 2025 und der Abgabenkeil
 * 2023 sind an Destatis bzw. OECD geprüft. Qualifikation und Investitionen
 * sind weiter Platzhalter.
 * Die gesamte Kampagne haengt an der Belastbarkeit dieser Zahlen: eine
 * einzige angreifbare Ziffer kostet die Glaubwuerdigkeit der Seite.
 *
 * Vorgehen: Wert an der genannten Primaerquelle verifizieren, `wert`,
 * `quelle`, `jahr` und `url` eintragen, dann `geprueft: true` setzen.
 * `ZAHLEN_GEPRUEFT` unten meldet den Stand in der Konsole.
 *
 * Empfohlene Primaerquellen:
 *   - Fortzuege / Wanderungssaldo ... Destatis, Wanderungsstatistik (Fachserie 1 R 1.2)
 *   - Abgabenlast ................... OECD, Taxing Wages (Tax Wedge, Single 100% AW)
 *   - Qualifikationsstruktur ........ OECD International Migration Outlook / IAB
 *   - Direktinvestitionen ........... Deutsche Bundesbank, Zahlungsbilanzstatistik
 * ========================================================================= */

/** Eine belegpflichtige Kennzahl. */
export interface Kennzahl {
  /** Anzeigewert, bereits formatiert (z. B. "270.000", "47,9 %"). */
  readonly wert: string;
  /** Ausgeschriebene Bezeichnung, u. a. im Drei-Spalten-Raster. */
  readonly label: string;
  /** Knappe Bezeichnung fuer die Stat-Zeile im Hero (Format "Kurz: Wert"). */
  readonly kurzLabel: string;
  /** Herausgeber der Primaerquelle. */
  readonly quelle: string;
  /** Bezugsjahr des Werts. */
  readonly jahr: string;
  /** Direktlink zur Fundstelle. Leer, solange nicht verifiziert. */
  readonly url?: string;
  /** Erst `true`, wenn der Wert an der Primaerquelle geprueft wurde. */
  readonly geprueft: boolean;
}

/**
 * Ein Bild.
 *
 * Die Frankfurt-Aufnahmen liegen unter public/bilder/ und stammen aus
 * Wikimedia Commons — freie Lizenzen, echte Fotografien. Die Porträts der
 * Forderungs-Karten sind Stockfotos von Unsplash (Unsplash License).
 *
 * WICHTIG: Die CC-BY- und CC-BY-SA-Lizenzen verlangen die Nennung von
 * Urheber und Lizenz. Deshalb traegt jedes Bild seinen Nachweis mit, und
 * die Fusszeile listet sie vollstaendig auf. Wer ein Bild austauscht, muss
 * den Nachweis mit austauschen.
 */
export interface Bild {
  readonly pfad: string;
  readonly alt: string;
  /** Werk und Urheber, fuer den Bildnachweis. */
  readonly nachweis: string;
}

/** Ein vollstaendiger Bildnachweis fuer die Fusszeile. */
export interface Bildnachweis {
  readonly werk: string;
  readonly urheber: string;
  readonly lizenz: string;
}

/** Ein Schritt der gepinnten Scroll-Sequenz. */
export interface SequenzSchritt {
  readonly id: string;
  /** Kleine Zeile ueber der Ueberschrift — Rolle, Zahl oder Zeitraum. */
  readonly kicker: string;
  readonly ueberschrift: string;
  readonly text: string;
  readonly bild: Bild;
}

/** Eine Forderung (Karten-Sektion). */
export interface Forderung {
  readonly id: string;
  readonly titel: string;
  readonly text: string;
  /** Festes Stockporträt — kein Wechsel, ein Gesicht je Karte. */
  readonly bild: Bild;
}

/** Ein Punkt im Drei-Spalten-Raster mit kreisrundem Bildausschnitt. */
export interface Vignette {
  readonly id: string;
  readonly titel: string;
  readonly kennzahl: Kennzahl;
  readonly bild: Bild;
}

/** Eine Rolle in der Menge — spaeter eine echte, freigegebene Stimme. */
export interface Fortgehende {
  readonly id: string;
  readonly rolle: string;
  /** Ein Satz. Kein Lebenslauf, keine erfundene Biografie. */
  readonly zeile: string;
  readonly bild: Bild;
  /**
   * Erst `true`, wenn die Person diesen Satz so veroeffentlicht haben will.
   * Ohne das bleibt die Luecke eine Beispielrolle, kein Testimonial.
   */
  readonly echt?: boolean;
  /** Optionaler Name, nur mit Zustimmung. */
  readonly name?: string;
  /** Kurzer Kontext, etwa Ort und Jahr. */
  readonly kontext?: string;
}

/** Ein freiwilliges Motiv auf der Petitionsseite. */
export interface Motiv {
  readonly id: string;
  readonly label: string;
}

/** Ein Abschnitt eines Rechtstextes (Impressum, Datenschutz). */
export interface RechtsAbschnitt {
  readonly titel: string;
  readonly absaetze: readonly string[];
}

/** Eine Zeile in der Ergebnis-Auswertung (Region oder Grund). */
export interface AuswertungZeile {
  readonly id: string;
  readonly name: string;
  /** Anteil in Prozent. Bei Gruenden keine Summe von 100 — Mehrfachnennung. */
  readonly anteil: number;
}

/* ---------------------------------------------------------------------------
 * Bilder — Frankfurt am Main, Wikimedia Commons, freie Lizenzen
 *
 * Frankfurt ist hier nicht Dekoration, sondern Argument: die Skyline ist das
 * Bild, das Deutschland selbst benutzt, wenn es von Wohlstand, Kapital und
 * Zukunft spricht. Genau davor spielt der Vorgang, um den es auf dieser
 * Seite geht.
 * ------------------------------------------------------------------------- */

export const BILDER = {
  hero: {
    pfad: '/bilder/hero.jpg',
    alt: 'Frankfurt am Main bei Nacht, die beleuchtete Innenstadt vom anderen Mainufer aus',
    nachweis:
      'Leonhard Lenz, „Frankfurt am Main city center from other side of the Main at night“, 2020 (CC0)',
  },
  sequenz1: {
    pfad: '/bilder/seq-1.jpg',
    alt: 'Die Frankfurter Skyline bei Nacht, hell erleuchtete Bürotürme vor dunklem Himmel',
    nachweis: 'Ghorog, „Skyline Frankfurt am Main bei Nacht“ (CC BY-SA 4.0)',
  },
  sequenz2: {
    pfad: '/bilder/seq-2.jpg',
    alt: 'Die nächtliche Skyline spiegelt sich im Wasser des Mains',
    nachweis: 'Gerda Arendt, „Frankfurt skyline reflected at night“ (CC BY-SA 4.0)',
  },
  sequenz3: {
    pfad: '/bilder/seq-3.jpg',
    alt: 'Die Frankfurter Skyline bei Nacht, beleuchtete Bürotürme über dem dunklen Fluss',
    nachweis: 'Jörg Braukmann, „Frankfurt Skyline bei Nacht“, 2022 (CC BY-SA 4.0)',
  },
  kreis1: {
    pfad: '/bilder/kreis-1.jpg',
    alt: 'Die Ignatz-Bubis-Brücke bei Nacht, Lichtspuren über dem Main',
    nachweis: 'rupp.de, „Ignatz-Bubis-Brücke Frankfurt am Main bei Nacht“ (CC BY-SA 3.0)',
  },
  kreis2: {
    pfad: '/bilder/kreis-2.jpg',
    alt: 'Der Frankfurter Hauptbahnhof in farbigem Licht während der Luminale',
    nachweis: 'Norbert Nagel, „Hauptbahnhof Frankfurt, Luminale 2014“ (CC BY-SA 3.0)',
  },
  kreis3: {
    pfad: '/bilder/kreis-3.jpg',
    alt: 'Das Gebäude der Frankfurter Börse in farbigem Licht während der Luminale',
    nachweis: 'Norbert Nagel, „Börse Frankfurt, Luminale 2014“ (CC BY-SA 3.0)',
  },
  /* Freigestellte Eichenkronen aus Corots Studie von Bas-Bréau. Sie rahmen
     den Hero in den oberen Ecken, wie das Laub in der Vorlage. Der Himmel
     wurde ueber Blaustich und Helligkeit herausgerechnet, die Blattkanten
     sind dadurch unregelmaessig geblieben statt ausgestanzt zu wirken.
     Gemalte Kronen ueber einer Nachtaufnahme sind ein bewusster Bruch:
     das Alte rahmt das Neue ein. */
  eicheLinks: {
    pfad: '/bilder/eiche-links.webp',
    alt: '',
    nachweis: 'Camille Corot, „Fontainebleau: Oak Trees at Bas-Bréau“, 1832/33',
  },
  eicheRechts: {
    pfad: '/bilder/eiche-rechts.webp',
    alt: '',
    nachweis: 'Camille Corot, „Fontainebleau: Oak Trees at Bas-Bréau“, 1832/33',
  },
  buero: {
    pfad: '/bilder/buero-leer.png',
    alt: 'Leerstehendes Großraumbüro bei Nacht, unbesetzte Schreibtische und Stühle, die meisten Lichter sind aus',
    nachweis: 'Illustration eines leerstehenden Großraumbüros, KI-generiert (Platzhalter)',
  },
  atlas: {
    pfad: '/bilder/atlas.png',
    alt: 'Bronzestatue des Atlas, der die Weltkugel auf seinen Schultern trägt',
    nachweis: 'Illustration: Atlas, der die Welt trägt (Platzhalter)',
  },
} as const satisfies Record<string, Bild>;

/* Dummy-Portraets der Stimmen. Keine Fotografien — Silhouetten, bis echte
   Aufnahmen mit Freigabe vorliegen. */
const STIMME = {
  lena: {
    pfad: '/bilder/stimmen/lena.svg',
    alt: 'Platzhalterporträt, Lena Hartmann',
    nachweis: 'Dummy-Porträt, vor Veröffentlichung zu ersetzen',
  },
  malik: {
    pfad: '/bilder/stimmen/malik.svg',
    alt: 'Platzhalterporträt, Malik Rahman',
    nachweis: 'Dummy-Porträt, vor Veröffentlichung zu ersetzen',
  },
  nora: {
    pfad: '/bilder/stimmen/nora.svg',
    alt: 'Platzhalterporträt, Nora Weiss',
    nachweis: 'Dummy-Porträt, vor Veröffentlichung zu ersetzen',
  },
  amina: {
    pfad: '/bilder/stimmen/amina.svg',
    alt: 'Platzhalterporträt, Amina Diallo',
    nachweis: 'Dummy-Porträt, vor Veröffentlichung zu ersetzen',
  },
  tom: {
    pfad: '/bilder/stimmen/tom.svg',
    alt: 'Platzhalterporträt, Tom Berger',
    nachweis: 'Dummy-Porträt, vor Veröffentlichung zu ersetzen',
  },
  julian: {
    pfad: '/bilder/stimmen/julian.svg',
    alt: 'Platzhalterporträt, Julian Krüger',
    nachweis: 'Dummy-Porträt, vor Veröffentlichung zu ersetzen',
  },
  sibel: {
    pfad: '/bilder/stimmen/sibel.svg',
    alt: 'Platzhalterporträt, Sibel Yılmaz',
    nachweis: 'Dummy-Porträt, vor Veröffentlichung zu ersetzen',
  },
  hannah: {
    pfad: '/bilder/stimmen/hannah.svg',
    alt: 'Platzhalterporträt, Hannah Vogt',
    nachweis: 'Dummy-Porträt, vor Veröffentlichung zu ersetzen',
  },
  piotr: {
    pfad: '/bilder/stimmen/piotr.svg',
    alt: 'Platzhalterporträt, Piotr Kowalski',
    nachweis: 'Dummy-Porträt, vor Veröffentlichung zu ersetzen',
  },
} as const satisfies Record<string, Bild>;

/**
 * Stockporträts der Forderungs-Karten.
 *
 * Ein Gesicht je Karte, fest zugeordnet — kein Wechsel. Unsplash License,
 * Platzhalter bis eigene, freigegebene Aufnahmen vorliegen.
 */
const FORDERUNGS_PORTRAET = {
  eins: {
    pfad: '/bilder/forderungen/gesicht-1.jpg',
    alt: '',
    nachweis: 'Joseph Gonzalez, Porträt (Unsplash License)',
  },
  zwei: {
    pfad: '/bilder/forderungen/gesicht-2.jpg',
    alt: '',
    nachweis: 'Štefan Štefančík, Porträt (Unsplash License)',
  },
  drei: {
    pfad: '/bilder/forderungen/gesicht-3.jpg',
    alt: '',
    nachweis: 'Prince Akachi, Porträt (Unsplash License)',
  },
  vier: {
    pfad: '/bilder/forderungen/gesicht-4.jpg',
    alt: '',
    nachweis: 'Jurica Koletić, Porträt (Unsplash License)',
  },
  fuenf: {
    pfad: '/bilder/forderungen/gesicht-5.jpg',
    alt: '',
    nachweis: 'Aiony Haust, Porträt (Unsplash License)',
  },
} as const satisfies Record<string, Bild>;

/* ---------------------------------------------------------------------------
 * Kennzahlen
 * ------------------------------------------------------------------------- */

export const KENNZAHLEN = {
  fortzuege: {
    wert: '288.579',
    label: 'Fortzüge deutscher Staatsbürger',
    kurzLabel: 'Fortzüge',
    quelle: 'Statistisches Bundesamt, Wanderungsstatistik',
    jahr: '2025',
    url: 'https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Bevoelkerung/Wanderungen/Tabellen/wanderungen-zwischen-deutschland-und-dem-ausland-jahr-02.html',
    geprueft: true,
  },
  abgabenlast: {
    wert: '47,9 %',
    label: 'Abgabenlast auf ein Durchschnittseinkommen',
    kurzLabel: 'Abgabenlast',
    quelle: 'OECD, Taxing Wages 2024, Tabelle 1.2',
    jahr: '2023',
    url: 'https://www.oecd.org/content/dam/oecd/en/publications/reports/2024/04/taxing-wages-2024_f869da31/dbcbac85-en.pdf',
    geprueft: true,
  },
  qualifikation: {
    wert: '3 von 4',
    label: 'Auswanderern haben einen Berufs- oder Hochschulabschluss',
    kurzLabel: 'Qualifiziert',
    quelle: 'OECD / IAB',
    jahr: 'PLATZHALTER',
    geprueft: false,
  },
  investitionen: {
    wert: 'PLATZHALTER',
    label: 'Netto-Direktinvestitionen ins Ausland',
    kurzLabel: 'Investitionen',
    quelle: 'Deutsche Bundesbank, Zahlungsbilanzstatistik',
    jahr: 'PLATZHALTER',
    geprueft: false,
  },
} as const satisfies Record<string, Kennzahl>;

/** Meldet in der Entwicklung, wie viele Kennzahlen noch ungeprueft sind. */
export const ZAHLEN_GEPRUEFT = Object.values(KENNZAHLEN).every((k) => k.geprueft);

/* ---------------------------------------------------------------------------
 * Marke und Navigation
 * ------------------------------------------------------------------------- */

export const MARKE = {
  /** Kampagnentitel. Der Punkt macht daraus eine Feststellung. */
  name: 'Deutschland flieht.',
  /** Wird als monumentale Wortmarke im Hero gesetzt. */
  wortmarke: 'Deutschland',
  wortmarkeVerb: 'flieht.',
  monogramm: 'D',
  navLink: { label: 'Petition', pfad: '/petition' },
} as const;

/* ---------------------------------------------------------------------------
 * Kapitel — die Wegmarken am linken Rand
 *
 * Eine Sprungliste durch die Startseite, damit niemand die ganze Strecke
 * scrollen muss. `id` muss der id des Hosts in landing.ts entsprechen.
 * `dunkel` sagt, ob das Kapitel auf einer dunklen Flaeche liegt — daran
 * richtet die Leiste ihre eigene Farbe aus, statt zu raten.
 *
 * Nicht jede Sektion braucht eine eigene Wegmarke. Auswertung haengt an
 * der Petition. Die Kennzahlen gehoeren zur Karte, der Atlas zu den
 * Unterstuetzern — `dazu` haelt das Kapitel aktiv, ohne einen weiteren
 * Punkt in der Leiste.
 * ------------------------------------------------------------------------- */

/** Sektion ohne eigenen Menuepunkt, die ihr Kapitel aktiv haelt. */
export interface KapitelDazu {
  readonly id: string;
  /** Ob diese Sektion auf dunkler Flaeche liegt. */
  readonly dunkel: boolean;
}

export interface Kapitel {
  readonly id: string;
  readonly label: string;
  readonly dunkel: boolean;
  readonly dazu?: readonly KapitelDazu[];
}

export const KAPITEL: readonly Kapitel[] = [
  { id: 'auftakt', label: 'Startseite', dunkel: true },
  { id: 'wer-geht', label: 'Ihre Geschichten', dunkel: true },
  {
    id: 'wohin',
    label: 'Die Zahlen',
    dunkel: true,
    dazu: [{ id: 'zahlen', dunkel: true }],
  },
  { id: 'und-dann', label: 'Und dann?', dunkel: true },
  { id: 'forderungen', label: 'Forderungen', dunkel: true },
  { id: 'petition', label: 'Petition', dunkel: false },
  { id: 'belege', label: 'Aktuelle Entwicklungen', dunkel: false },
  {
    id: 'unterstuetzer',
    label: 'Unterstützer',
    dunkel: false,
    dazu: [{ id: 'atlas', dunkel: true }],
  },
];

export const KAPITEL_NAV = {
  /** Beschriftung der Landmarke fuer Screenreader. */
  ariaLabel: 'Kapitel dieser Seite',
  griffAuf: 'Kapitelliste öffnen',
  griffZu: 'Kapitelliste schließen',
} as const;

/* ---------------------------------------------------------------------------
 * Hero
 * ------------------------------------------------------------------------- */

export const HERO = {
  /** Eine Kennzahl — das Signal des Heros. Zaehlt als Counter hoch. */
  stats: [KENNZAHLEN.fortzuege],
  /** Direkt zum Unterschreiben, ohne den Rest der Seite zu durchlaufen. */
  cta: { label: 'Unterschreiben', pfad: '/petition' },
  /** Aufnahme, aus der die Wortmarke aufsteigt. */
  bild: BILDER.hero,
  /** Eichenkronen, die den Hero oben links und rechts rahmen. */
  eicheLinks: BILDER.eicheLinks,
  eicheRechts: BILDER.eicheRechts,
} as const;

/* ---------------------------------------------------------------------------
 * Wer geht — eine kleine Menge, in der einzelne Luecken Geschichten oeffnen
 *
 * Die Zahl der Figuren folgt nicht dem statistischen Jahresanteil. Sie soll
 * als Gruppe lesbar bleiben. Die benannten Loecher sind die Tueren.
 * ------------------------------------------------------------------------- */

export const WER_GEHT = {
  titel: 'Sie fehlen.',
  hinweis: 'Lies ihre Geschichte.',
  /** Unterstrichen. Öffnet die Petition mit „Geschichte veröffentlichen“. */
  hinweisLink: 'Ergänze deine eigene',
  oeffnenLabel: 'Lies ihre Geschichte',
  schliessen: 'Schließen',
  platzhalter:
    'Dummy-Name und -Bild. Echte Stimmen erscheinen hier, sobald jemand sie für die Übergabe freigibt.',
  cta: { label: 'Eigene Geschichte hinterlassen', pfad: '/petition' },
  menge: 72,
} as const;

export const FORTGEHENDE: readonly Fortgehende[] = [
  {
    id: 'aerztin',
    name: 'Lena Hartmann',
    rolle: 'Ärztin',
    zeile: 'Die Stelle bleibt. Sie nicht.',
    kontext: 'Zürich, 2025',
    bild: STIMME.lena,
  },
  {
    id: 'ingenieur',
    name: 'Malik Rahman',
    rolle: 'Ingenieur',
    zeile: 'Der nächste Entwurf entsteht woanders.',
    kontext: 'Eindhoven, 2024',
    bild: STIMME.malik,
  },
  {
    id: 'gruenderin',
    name: 'Nora Weiss',
    rolle: 'Gründerin',
    zeile: 'Das Büro hier ist nur noch die Hülle.',
    kontext: 'Lissabon, 2025',
    bild: STIMME.nora,
  },
  {
    id: 'pflege',
    name: 'Amina Diallo',
    rolle: 'Pflege',
    zeile: 'Fachkraft. Nicht ersetzbar durch einen Kurs.',
    kontext: 'Wien, 2024',
    bild: STIMME.amina,
  },
  {
    id: 'handwerk',
    name: 'Tom Berger',
    rolle: 'Handwerk',
    zeile: 'Meister. Mitte dreißig.',
    kontext: 'Südtirol, 2025',
    bild: STIMME.tom,
  },
  {
    id: 'it',
    name: 'Julian Krüger',
    rolle: 'IT',
    zeile: 'Remote aus dem Ausland ist immer noch fort.',
    kontext: 'Tallinn, 2024',
    bild: STIMME.julian,
  },
  {
    id: 'lehre',
    name: 'Sibel Yılmaz',
    rolle: 'Lehre',
    zeile: 'Wer unterrichten kann, kann auch gehen.',
    kontext: 'Amsterdam, 2025',
    bild: STIMME.sibel,
  },
  {
    id: 'labor',
    name: 'Hannah Vogt',
    rolle: 'Labor',
    zeile: 'Die nächste Studie trägt eine andere Adresse.',
    kontext: 'Basel, 2024',
    bild: STIMME.hannah,
  },
  {
    id: 'werk',
    name: 'Piotr Kowalski',
    rolle: 'Werk',
    zeile: 'Heute Schicht. Die Investition geht ins Ausland.',
    kontext: 'Breslau, 2025',
    bild: STIMME.piotr,
  },
];

/* ---------------------------------------------------------------------------
 * Geschichte in der Menge — der einen Luecke nach
 *
 * Drei Szenen, die beim Scrollen aus der Menge wachsen: erst die benannte
 * Stelle, dann wer ihre Last erbt, dann was sich stapelt, wenn das jedes
 * Jahr passiert. Kein Lebenslauf, keine erfundenen Motive.
 * ------------------------------------------------------------------------- */

export const SEQUENZ: readonly SequenzSchritt[] = [
  {
    id: 'die-eine',
    kicker: FORTGEHENDE[0].rolle,
    ueberschrift: FORTGEHENDE[0].zeile,
    text: 'Eine aus dreihundert. Genau deshalb fällt es so leicht, sie zu übersehen.',
    bild: BILDER.sequenz1,
  },
  {
    id: 'wer-bleibt',
    kicker: '299',
    ueberschrift: 'Wer bleibt, zahlt deren Stelle',
    text: 'Dieselbe Schicht, dieselbe Last, weniger Schultern. Kein Naturgesetz — eine Entscheidung.',
    bild: BILDER.sequenz2,
  },
  {
    id: 'woanders',
    kicker: 'Jedes Jahr',
    ueberschrift: 'Die nächste Entscheidung entsteht woanders',
    text: 'Nicht als Umzug. Als Entscheidung. Es fällt erst auf, wenn die alten nicht mehr laufen.',
    bild: BILDER.sequenz3,
  },
];

/* ---------------------------------------------------------------------------
 * Ausbluten — Deutschland verliert Farbe, die Wege bleiben
 *
 * Auftakt der Zahlen: sobald die Karte im Blick ist, kriechen die
 * Landesflächen mit der Zeit unregelmäßig aus, die Konturen bleiben. Pfeile
 * und Zahlen stehen von Anfang an. Die Zielliste ist Platzhalter und vor
 * Veroeffentlichung an die Wanderungsstatistik zu haengen.
 * ------------------------------------------------------------------------- */

/** Ein Zielland der Abwanderung (Pfeil auf der Karte). */
export interface Fluchtziel {
  readonly id: string;
  readonly name: string;
  /** Anzahl der Fortzüge. Platzhalter. */
  readonly anzahl: number;
}

export const AUSBLUTEN = {
  titelZeile1: 'Das Land',
  titelZeile2Kursiv: 'blutet aus.',
  ziele: [
    { id: 'ch', name: 'Schweiz', anzahl: 22_700 },
    { id: 'at', name: 'Österreich', anzahl: 13_500 },
    { id: 'es', name: 'Spanien', anzahl: 9_700 },
    { id: 'us', name: 'USA', anzahl: 8_900 },
  ] as readonly Fluchtziel[],
  ariaBeschreibung:
    'Deutschlandkarte mit Bundesländern. Die Flächen bleichen mit der Zeit aus, ' +
    'die Länderkonturen bleiben sichtbar. Pfeile zeigen von Deutschland in die ' +
    'Schweiz, nach Österreich, nach Spanien und in die USA, jeweils mit der Zahl der Fortzüge 2025.',
} as const;

/* ---------------------------------------------------------------------------
 * Kapital — nach den fehlenden Menschen das leere Buero
 *
 * Die Frage steht im Bild. Darunter die Folge, als Kette von Absenzen:
 * was fehlt, wenn Köpfe, Firmen und Kapital mitgehen.
 * ------------------------------------------------------------------------- */

export const KAPITAL = {
  frage: 'Und dann?',
  voraussetzung: 'Ohne Unternehmen, ohne Köpfe, ohne Kapital gibt es',
  folgen: [
    'keinen technischen Fortschritt',
    'keine medizinische Entwicklung',
    'keinen Wohlstand',
  ],
  schluss: 'Irgendwann keine Perspektive mehr.',
  bild: BILDER.buero,
} as const;

/* ---------------------------------------------------------------------------
 * Manifest — dunkle Display-Headline
 * ------------------------------------------------------------------------- */

export const MANIFEST = {
  zeile1: 'STILLE',
  zeile2Kursiv: 'Abwanderung',
  zeile3: 'EINES LANDES',
  unterzeile:
    'Kein Knall, kein Datum, keine Schlagzeile. Eine Bewegung, die man erst bemerkt, wenn sie nicht mehr umkehrbar ist.',
} as const;

/* ---------------------------------------------------------------------------
 * Fahnen-Sektion (3D)
 * ------------------------------------------------------------------------- */

export const FAHNE = {
  /** Wird als grosse Serif-Lettern vertikal gestapelt hinter der Fahne gesetzt. */
  gestapelt: 'FLUCHT',
  titel: 'Eine Fahne,\ndie verschleißt',
  text:
    'Der Stoff ist derselbe. Was sich ändert, ist der Zustand. Je weiter du scrollst, ' +
    'desto mehr Löcher. Genau so verläuft der Vorgang, um den es hier geht: nicht ' +
    'plötzlich, sondern Faden für Faden.',
  /** Barrierefreie Beschreibung der 3D-Szene. */
  ariaBeschreibung:
    'Dreidimensionale Deutschlandfahne, die sich im Wind bewegt und im Verlauf des ' +
    'Scrollens zunehmend verschmutzt und durchlöchert erscheint.',
} as const;

/* ---------------------------------------------------------------------------
 * Zahlen — drei Behauptungen: Reihe, Wertschöpfer, Abgabenkeil
 * ------------------------------------------------------------------------- */

/**
 * Die Qualifikation. Sie steht zwischen der Wanderungsreihe
 * und dem Abgabenvergleich.
 */
export const VIGNETTEN: readonly Vignette[] = [
  {
    id: 'qualifikation',
    titel: 'Es gehen die Wertschöpfer.',
    kennzahl: KENNZAHLEN.qualifikation,
    bild: BILDER.buero,
  },
];

/** Ein Jahr der Wanderungsreihe deutscher Staatsangehöriger. */
export interface Wanderungsjahr {
  readonly jahr: number;
  readonly fortzuege: number;
  /** Zuzüge minus Fortzüge. Negativ heißt: mehr gehen, als zurückkommen. */
  readonly saldo: number;
}

/**
 * Vergleichbare Reihe ab 2017. Destatis stuft die Ergebnisse ab 2016 wegen
 * einer Methodenänderung nur bedingt mit den Vorjahren vergleichbar ein.
 * Stand der Tabelle: 1. Juni 2026.
 */
export const WANDERUNG = {
  titel: 'Die Fortzüge steigen.',
  text:
    'Fortzüge deutscher Staatsangehöriger, und darunter der Saldo, nachdem die Rückkehrer abgezogen sind. ' +
    'Die Reihe beginnt 2017, nach der Methodenänderung von 2016. 2020 ist der Einbruch der Pandemie.',
  stand: 'Stand 1. Juni 2026',
  quelle: 'Statistisches Bundesamt, Wanderungsstatistik',
  url: 'https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Bevoelkerung/Wanderungen/Tabellen/wanderungen-zwischen-deutschland-und-dem-ausland-jahr-02.html',
  geprueft: true,
  jahre: [
    { jahr: 2017, fortzuege: 249_181, saldo: -82_478 },
    { jahr: 2018, fortzuege: 261_851, saldo: -60_320 },
    { jahr: 2019, fortzuege: 270_294, saldo: -57_625 },
    { jahr: 2020, fortzuege: 220_239, saldo: -28_356 },
    { jahr: 2021, fortzuege: 247_829, saldo: -64_179 },
    { jahr: 2022, fortzuege: 268_167, saldo: -83_414 },
    { jahr: 2023, fortzuege: 265_035, saldo: -73_679 },
    { jahr: 2024, fortzuege: 269_986, saldo: -80_879 },
    { jahr: 2025, fortzuege: 288_579, saldo: -96_689 },
  ] as readonly Wanderungsjahr[],
} as const;

/** Ein Land im Abgabenkeil-Vergleich. `promille` ist der Keil in Prozent. */
export interface Abgabenland {
  readonly id: string;
  readonly name: string;
  /** Abgabenkeil in Prozent der Arbeitskosten. */
  readonly keil: number;
  /** Deutschland, die Bezugsgröße der Balken. */
  readonly hier?: boolean;
}

/**
 * OECD Taxing Wages 2024, Tabelle 1.2, Berichtsjahr 2023.
 * Ledige Person ohne Kinder, 100 % des Durchschnittslohns.
 */
export const ABGABEN_VERGLEICH = {
  titel: 'Die Abgabenlast steigt.',
  text:
    'Ledige Person ohne Kinder, Durchschnittslohn. Anteil der Arbeitskosten, der nicht als Nettolohn ankommt. 2023.',
  quelle: 'OECD, Taxing Wages 2024, Tabelle 1.2',
  url: 'https://www.oecd.org/content/dam/oecd/en/publications/reports/2024/04/taxing-wages-2024_f869da31/dbcbac85-en.pdf',
  geprueft: true,
  laender: [
    { id: 'de', name: 'Deutschland', keil: 47.9, hier: true },
    { id: 'at', name: 'Österreich', keil: 47.2 },
    { id: 'es', name: 'Spanien', keil: 40.2 },
    { id: 'nl', name: 'Niederlande', keil: 35.1 },
    { id: 'us', name: 'USA', keil: 29.9 },
    { id: 'ch', name: 'Schweiz', keil: 23.5 },
  ] as readonly Abgabenland[],
} as const;

/** Ein externer Beleg. Der Satz ist eigen, der Link führt zum Herausgeber. */
export interface Beitrag {
  readonly id: string;
  readonly medium: string;
  readonly datum: string;
  readonly zeile: string;
  readonly url: string;
}

export const BEITRAEGE_SEKTION = {
  titelZeile1: 'Aktuelle',
  titelZeile2Kursiv: 'Entwicklungen.',
  einleitung:
    'Eigene Sätze, fremde Seiten. Die Links führen zu den Herausgebern. Es wird nichts von dort übernommen.',
} as const;

export const BEITRAEGE: readonly Beitrag[] = [
  {
    id: 'destatis-ziele',
    medium: 'Statistisches Bundesamt',
    datum: '9. Juni 2026',
    zeile: '2025 zogen mehr Deutsche in die Schweiz, nach Österreich und nach Spanien als in die USA.',
    url: 'https://www.destatis.de/DE/Presse/Pressemitteilungen/Zahl-der-Woche/2026/PD26_24_p002.html',
  },
  {
    id: 'destatis-reihe',
    medium: 'Statistisches Bundesamt',
    datum: '1. Juni 2026',
    zeile: 'Fortzüge und Saldo deutscher Staatsangehöriger, Jahr für Jahr, von 1950 bis 2025.',
    url: 'https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Bevoelkerung/Wanderungen/Tabellen/wanderungen-zwischen-deutschland-und-dem-ausland-jahr-02.html',
  },
  {
    id: 'destatis-regionen',
    medium: 'Statistisches Bundesamt',
    datum: '2025',
    zeile: 'Wohin deutsche Staatsangehörige fortziehen, nach Weltregionen, als amtliche Grafik.',
    url: 'https://www.destatis.de/DE/Themen/Gesellschaft-Umwelt/Bevoelkerung/_Grafik/_Interaktiv/fortzuege-ausland-deutsche-nach-zielgebiet.html',
  },
  {
    id: 'oecd-keil',
    medium: 'OECD',
    datum: '2024',
    zeile: 'Beim Abgabenkeil eines Durchschnittslohns lag Deutschland 2023 in der OECD hinter Belgien.',
    url: 'https://www.oecd.org/content/dam/oecd/en/publications/reports/2024/04/taxing-wages-2024_f869da31/dbcbac85-en.pdf',
  },
];

/** So viele Belege stehen auf der Startseite. Die uebrigen warten auf der Seite. */
export const BEITRAEGE_AUF_START = 3;

/* ---------------------------------------------------------------------------
 * Aktuelle Entwicklungen und Daten — die eigene Seite
 *
 * Die Startseite erzaehlt; sie zeigt jede Grafik einmal und nur die
 * juengsten Belege. Wer nachrechnen will, kommt hierher: dieselben Daten,
 * aber vollstaendig und jede mit ihrer Quelle darunter.
 *
 * Eigene Zahlen stehen hier bewusst nicht. Alles verweist auf die Bloecke,
 * aus denen auch die Startseite schoepft — sonst laufen zwei Staende
 * auseinander, sobald einer gepflegt wird.
 * ------------------------------------------------------------------------- */

export const ENTWICKLUNGEN = {
  pfad: '/entwicklungen',
  /** Eintrag in der Kapitelliste, ganz oben rechts. */
  navLabel: 'Ausführliche Entwicklungen und Daten',
  /** Im Hero, solange die Kapitelliste noch fehlt. */
  startLabel: 'Aktuelle Daten und Entwicklungen',
  /** Der Weg hierher — unter den Grafiken und unter den Belegen. */
  weiterLabel: 'Weitere Daten & aktuelle Entwicklungen',
  titelZeile1: 'Aktuelle Entwicklungen',
  titelZeile2Kursiv: 'und Daten.',
  einleitung:
    'Die Grafiken der Startseite noch einmal in Ruhe, jede mit ihrer Quelle darunter. ' +
    'Danach alle Belege, nicht nur die drei jüngsten.',
  quelleLabel: 'Quelle',
  reiheLabel: 'WANDERUNG',
  keilLabel: 'ABGABEN',
  auswertungLabel: 'AUSWERTUNG',
  belegeLabel: 'BELEGE',
  belegeTitel: 'Was anderswo steht.',
} as const;

/* ---------------------------------------------------------------------------
 * Forderungen
 *
 * Bewusst anschlussfaehig formuliert: die Kampagne soll von unpolitischen
 * Unzufriedenen bis ins liberale Vorfeld tragen. Deshalb keine Maximal-
 * forderungen, sondern Richtungsentscheidungen, hinter denen sich mehrere
 * Lager versammeln koennen.
 *
 * Offen und daher noch nicht aufgenommen (aus dem Konzept, mit Fragezeichen):
 *   - Spekulationsfrist abschaffen
 * Bei Bedarf hier als vierte Forderung ergaenzen.
 * ------------------------------------------------------------------------- */

export const FORDERUNGEN_SEKTION = {
  titelZeile1: 'Es muss sich',
  titelZeile2Kursiv: 'etwas ändern.',
  einleitung:
    'Fünf Richtungsentscheidungen. Keine Maximalforderungen, keine Parteiprogramme — ' +
    'sondern das, worauf sich jeder einigen kann, der möchte, dass Bleiben wieder die ' +
    'naheliegendere Entscheidung ist als Gehen.',
} as const;

export const FORDERUNGEN: readonly Forderung[] = [
  {
    id: 'entlasten',
    titel: 'Entlasten',
    text:
      'Steuern und Abgaben auf Arbeit spürbar senken. Wer arbeitet, muss am Monatsende ' +
      'mehr behalten als heute — das ist die einfachste Antwort auf die Frage, warum ' +
      'jemand bleiben sollte.',
    bild: FORDERUNGS_PORTRAET.eins,
  },
  {
    id: 'bauen',
    titel: 'Bauen',
    text:
      'Bauvorschriften radikal zusammenstreichen. Wohnraum entsteht nicht durch ' +
      'Förderprogramme, sondern dadurch, dass Bauen wieder erlaubt und bezahlbar ist.',
    bild: FORDERUNGS_PORTRAET.zwei,
  },
  {
    id: 'vorsorgen',
    titel: 'Vorsorgen',
    text:
      'Die Altersvorsorge schrittweise vom Umlageverfahren lösen und kapitalgedeckt ' +
      'aufbauen — ohne bestehende Ansprüche zu brechen. Wer jung ist, muss wissen, ' +
      'wofür er einzahlt.',
    bild: FORDERUNGS_PORTRAET.drei,
  },
  {
    id: 'entfesseln',
    titel: 'Entfesseln',
    text:
      'Berichts-, Nachweis- und Dokumentationspflichten zusammenstreichen. Für jede ' +
      'neue Vorschrift müssen zwei alte fallen. Wer gründet, soll arbeiten dürfen ' +
      'statt Formulare auszufüllen.',
    bild: FORDERUNGS_PORTRAET.vier,
  },
  {
    id: 'beschleunigen',
    titel: 'Beschleunigen',
    text:
      'Genehmigungen mit verbindlichen Fristen versehen: Wer als Behörde nicht ' +
      'fristgerecht entscheidet, hat zugestimmt. Verwaltung muss vollständig digital ' +
      'laufen — ohne Papier, ohne Termin, ohne Amtsstube.',
    bild: FORDERUNGS_PORTRAET.fuenf,
  },
];

/* ---------------------------------------------------------------------------
 * Papier — ausfuehrliche Gruende und Aenderungen, folgt
 *
 * Die fünf Forderungen sind die Kurzform. Das Papier soll Belege,
 * Motive und das "wie" nachliefern. Solange `url` leer ist, bleibt
 * die Sektion ein Platzhalter.
 * ------------------------------------------------------------------------- */

export const PAPIER = {
  label: 'COMING SOON',
  titelZeile1: 'Ein Papier',
  titelZeile2Kursiv: 'folgt.',
  text:
    'Zu den Gründen, warum sie gehen — und zu dem, was sich ändern muss. ' +
    'Genau, belegt, zum Weitergeben. Noch nicht da. Bald hier.',
  cta: 'Mehr erfahren …',
  /** Erst setzen, wenn das Papier erreichbar ist. Leer = Platzhalter. */
  url: '',
} as const;

/* ---------------------------------------------------------------------------
 * Unterstuetzer
 *
 * ACHTUNG: Hier stehen ausschliesslich Platzhalter.
 * Es duerfen erst dann echte Namen, Logos oder Zitate erscheinen, wenn eine
 * Zusage vorliegt. Namen ohne Zusage anzuzeigen waere der schnellste Weg,
 * die Kampagne zu beschaedigen — und rechtlich angreifbar.
 * ------------------------------------------------------------------------- */

/** Bekannte Person unter den Unterstützern. Erst nach schriftlicher Zusage eintragen. */
export interface UnterstuetzerPerson {
  name: string;
  /** Funktion, zum Beispiel „Autorin“ oder „Musiker“. */
  rolle: string;
  /** Porträt, optional. Ohne Bild zeigt der Kreis die Initialen. */
  bild?: string;
}

export const UNTERSTUETZER = {
  label: 'UNTERSTÜTZT VON',
  /*
   * `name` ist der Alternativtext des Logos. `url` oeffnet die Seite der
   * Organisation in einem neuen Tab.
   */
  logos: [
    {
      name: 'jung.liberal.kapitalistisch.',
      pfad: '/bilder/unterstuetzer-1.webp',
      url: 'https://jlk-verband.de/',
    },
    {
      name: 'Liberty Rising',
      pfad: '/bilder/unterstuetzer-2.webp',
      url: 'https://libertyrising.de/',
    },
  ],
  /** Freie Logo-Plätze. Erst nach schriftlicher Zusage befüllen. */
  freieSlots: 4,
  personenLabel: 'PERSONEN',
  /*
   * Bekannte Persönlichkeiten. Eintrag erst nach schriftlicher Zusage,
   * sonst bleibt der Platz leer. Beispiel:
   * { name: 'Vorname Nachname', rolle: 'Autorin', bild: '/bilder/unterstuetzer/name.webp' },
   * Namen aus der Petition (Häkchen im Formular) kommen später dazu,
   * sobald Unterschriften gespeichert werden. Ohne diese Freigabe nicht listen.
   */
  personen: [] as UnterstuetzerPerson[],
  /** Porträtrahmen insgesamt. Gefüllte Personen zählen mit. */
  personenPlaetze: 6,
  hinweis: 'Logos und Namen erst nach ausdrücklicher Freigabe einsetzen.',
} as const;

/* ---------------------------------------------------------------------------
 * Abschluss
 * ------------------------------------------------------------------------- */

export const ABSCHLUSS = {
  zeile1Kursiv: 'Bleiben',
  zeile1Rest: 'MUSS SICH',
  zeile2: 'WIEDER LOHNEN',
  text:
    'Diese Seite ist ein Mahnmal, kein Abgesang. Wir können die Entwicklung drehen. Dafür muss die Politik aber erkennen, wie groß das Problem ist.  Unterschreibe darum die Petition und veröffentliche deine eigene Geschichte, falls du ausgewandert bist. Lasst und das Problem gemeinsam sichtbar machen',
  cta: { label: 'Petition unterschreiben', pfad: '/petition' },
} as const;

/* ---------------------------------------------------------------------------
 * Auswertung — Regionen und Gruende zur Petition
 *
 * ACHTUNG: ausschliesslich Beispieldaten.
 * Der Zaehler der Petition steht auf null, solange nichts gespeichert wird.
 * Diese Anteile duerfen vor dem Echtbetrieb nicht wie echte Stimmen wirken.
 * Regionen folgen den Bundeslaendern (aus der Postleitzahl). Die Gruende
 * sind dieselben Motive wie im Petitionsformular; Mehrfachnennung, keine 100-Summe.
 * ------------------------------------------------------------------------- */

export const AUSWERTUNG = {
  label: 'AUSWERTUNG',
  stempel: 'BEISPIELDATEN',
  einleitung: 'Woher die Stimmen kommen — und was den Ausschlag gibt.',
  /** Geschlossen unter der Petition; oeffnet Regionen und Gruende. */
  aufklappen: 'Auswertung ansehen',
  zuklappen: 'Auswertung schließen',
  hinweis:
    'Platzhalter. Es werden noch keine Unterschriften gezählt. Sobald welche ' +
    'bestätigt sind, ersetzen die echten Anteile diese Verteilung.',
  regionen: {
    label: 'REGIONEN',
    text: 'Anteil der Stimmen nach Bundesland, aus der angegebenen Postleitzahl.',
    zeilen: [
      { id: 'by', name: 'Bayern', anteil: 16 },
      { id: 'bw', name: 'Baden-Württemberg', anteil: 14 },
      { id: 'nw', name: 'Nordrhein-Westfalen', anteil: 13 },
      { id: 'he', name: 'Hessen', anteil: 9 },
      { id: 'be', name: 'Berlin', anteil: 8 },
      { id: 'hh', name: 'Hamburg', anteil: 7 },
      { id: 'ni', name: 'Niedersachsen', anteil: 6 },
      { id: 'sn', name: 'Sachsen', anteil: 5 },
      { id: 'rp', name: 'Rheinland-Pfalz', anteil: 4 },
      { id: 'sh', name: 'Schleswig-Holstein', anteil: 4 },
      { id: 'bb', name: 'Brandenburg', anteil: 3 },
      { id: 'th', name: 'Thüringen', anteil: 3 },
      { id: 'st', name: 'Sachsen-Anhalt', anteil: 2 },
      { id: 'mv', name: 'Mecklenburg-Vorpommern', anteil: 2 },
      { id: 'hb', name: 'Bremen', anteil: 2 },
      { id: 'sl', name: 'Saarland', anteil: 2 },
    ],
  },
  gruende: {
    label: 'GRÜNDE',
    text: 'Anteil der Nennungen. Mehrfachauswahl, die Summe ist nicht 100.',
    zeilen: [
      { id: 'steuern', name: 'Steuern und Abgaben', anteil: 72 },
      { id: 'buerokratie', name: 'Bürokratie und Vorschriften', anteil: 61 },
      { id: 'chancen', name: 'Beruf, Löhne, berufliche Chancen', anteil: 48 },
      { id: 'wohnen', name: 'Wohnen und Lebenshaltungskosten', anteil: 37 },
      { id: 'lebenseinstellung', name: 'Lebenseinstellung und persönliche Freiheit', anteil: 29 },
      { id: 'migration', name: 'Migration und innere Sicherheit', anteil: 24 },
    ],
  },
} as const;

/* ---------------------------------------------------------------------------
 * Atlas — Schlussbild ganz am Ende
 *
 * Das Zitat steht allein bei der Figur. Die Kugel muss lesbar bleiben,
 * deshalb eigene Sektion statt Kulisse hinter einer anderen Gruppe.
 * ------------------------------------------------------------------------- */

export const ATLAS = {
  zitat:
    'Wenn du Atlas sehen würdest, den Riesen, der die Welt auf seinen Schultern trägt, ' +
    'wenn du sehen würdest, wie er steht, Blut über seine Brust rinnend, seine Knie ' +
    'einknickend, seine Arme zitternd, mit letzter Kraft die Welt emporhaltend, die je ' +
    'mehr er sich anstrengt, desto schwerer auf seinen Schultern lastet —',
  frage: 'was würdest du ihm raten?',
  bild: BILDER.atlas,
} as const;

/* ---------------------------------------------------------------------------
 * Footer
 * ------------------------------------------------------------------------- */

export const FOOTER = {
  claim: 'Ein digitales Mahnmal zur Abwanderung aus Deutschland.',
  /* Impressum und Datenschutz sind bei einer Kampagne mit Unterschriften-
     sammlung Pflicht, nicht Kür. Die Seiten müssen vor dem Livegang stehen. */
  links: [
    { label: 'Petition', pfad: '/petition' },
    { label: 'Impressum', pfad: '/impressum' },
    { label: 'Datenschutz', pfad: '/datenschutz' },
  ],
  quellenHinweis:
    'Qualifikation und Netto-Direktinvestitionen sind noch Platzhalter. Die übrigen Kennzahlen sind an der Quelle geprüft.',
  /* CC BY und CC BY-SA verlangen die Nennung von Urheber und Lizenz. Das
     ist keine Hoeflichkeit, sondern Bedingung der Nutzung — deshalb steht
     jeder Nachweis einzeln da und nicht als Sammelfloskel. */
  bildnachweisLabel: 'Bildnachweis',
  bildnachweisEinleitung:
    'Nachtaufnahmen von Frankfurt am Main und der Luminale, über Wikimedia Commons ' +
    'unter freien Lizenzen. Die Porträts der Forderungs-Karten sind Stockfotos von Unsplash. ' +
    'Die gemalten Eichenkronen im Kopf der Seite stammen aus dem Open-Access-Bestand ' +
    'des Metropolitan Museum of Art. Das leerstehende Büro ist eine Illustration und ' +
    'vor Veröffentlichung durch ein frei lizenziertes Foto zu ersetzen.',
  bildnachweisListe: [
    {
      werk: 'Frankfurt am Main city center from other side of the Main at night (2020)',
      urheber: 'Leonhard Lenz',
      lizenz: 'CC0',
    },
    { werk: 'Skyline Frankfurt am Main bei Nacht', urheber: 'Ghorog', lizenz: 'CC BY-SA 4.0' },
    {
      werk: 'Frankfurt skyline reflected at night',
      urheber: 'Gerda Arendt',
      lizenz: 'CC BY-SA 4.0',
    },
    {
      werk: 'Frankfurt Skyline bei Nacht (2022)',
      urheber: 'Jörg Braukmann',
      lizenz: 'CC BY-SA 4.0',
    },
    {
      werk: 'Ignatz-Bubis-Brücke Frankfurt am Main bei Nacht',
      urheber: 'rupp.de',
      lizenz: 'CC BY-SA 3.0',
    },
    {
      werk: 'Hauptbahnhof Frankfurt und Börse Frankfurt, Luminale 2014',
      urheber: 'Norbert Nagel',
      lizenz: 'CC BY-SA 3.0',
    },
    {
      werk: 'Stockporträts der Forderungs-Karten',
      urheber:
        'Joseph Gonzalez, Štefan Štefančík, Prince Akachi, Jurica Koletić, Aiony Haust',
      lizenz: 'Unsplash License',
    },
    {
      werk: 'Germany, states (admin-1, 1:10m)',
      urheber: 'Natural Earth',
      lizenz: 'Public domain',
    },
    {
      werk: 'Fontainebleau: Oak Trees at Bas-Bréau (1832/33)',
      urheber: 'Camille Corot, The Metropolitan Museum of Art',
      lizenz: 'CC0',
    },
    {
      werk: 'Leerstehendes Großraumbüro',
      urheber: 'Illustration, KI-generiert',
      lizenz: 'Platzhalter — vor Veröffentlichung ersetzen',
    },
    {
      werk: 'Atlas',
      urheber: 'Illustration, KI-generiert',
      lizenz: 'Platzhalter — vor Veröffentlichung ersetzen',
    },
  ] as readonly Bildnachweis[],
  /* TODO vor Veroeffentlichung: je Bild den Link auf die Commons-Dateiseite
     ergaenzen. Bei CC BY-SA gehoert der Verweis auf Lizenz und Quelle dazu. */
} as const;

/* ---------------------------------------------------------------------------
 * Petitionsseite
 * ------------------------------------------------------------------------- */

/** Freiwillige Motive im Formular. Dieselbe Liste wie in der Auswertung. */
export const PETITION_MOTIVE: readonly Motiv[] = [
  { id: 'steuern', label: 'Steuern und Abgaben' },
  { id: 'buerokratie', label: 'Bürokratie und Vorschriften' },
  { id: 'migration', label: 'Migration und innere Sicherheit' },
  { id: 'lebenseinstellung', label: 'Lebenseinstellung und persönliche Freiheit' },
  { id: 'chancen', label: 'Beruf, Löhne, berufliche Chancen' },
  { id: 'wohnen', label: 'Wohnen und Lebenshaltungskosten' },
];

export const PETITION = {
  titelZeile1: 'JETZT',
  titelZeile2Kursiv: 'unterschreiben',
  einleitung:
    'Deine Unterschrift macht aus einer Beobachtung eine Zahl, die man nicht mehr ' +
    'ignorieren kann. Jeder Fortzug ist für sich genommen eine Privatentscheidung — ' +
    'in der Summe sind es Hunderttausende, und niemand muss darauf antworten, ' +
    'solange niemand sie zählt. Genau das ändert diese Liste.',

  /** Adressat der Übergabe. Steht ganz oben, weil es die erste Rückfrage ist. */
  empfaenger: {
    label: 'ADRESSAT',
    text:
      'Deutscher Bundestag — Petitionsausschuss, sowie die Fraktionsvorsitzenden ' +
      'aller im Bundestag vertretenen Fraktionen.',
  },

  /* Der eigentliche Petitionstext. Das ist der Teil, den Unterzeichnende
     rechtlich und politisch mittragen — er muss ohne die restliche Seite
     verständlich sein und wird bei der Übergabe wörtlich vorgelegt. */
  petitionstext: {
    label: 'PETITIONSTEXT',
    absaetze: [
      'Deutschland verliert Jahr für Jahr Menschen, die es dringend braucht: gut ' +
        'ausgebildet, mitten im Erwerbsleben, oft mit Familie. Sie gehen nicht aus ' +
        'Abenteuerlust, sondern weil sich Arbeit, Aufstieg und Vorsorge anderswo ' +
        'sichtbarer lohnen. Wer bleibt, trägt die gleiche Last auf weniger Schultern.',
      'Die Unterzeichnenden fordern den Deutschen Bundestag auf, die Abwanderung ' +
        'qualifizierter Menschen als das zu behandeln, was sie ist: ein Frühindikator ' +
        'für die Wettbewerbs- und Zukunftsfähigkeit des Landes — und nicht als ' +
        'Randnotiz der Wanderungsstatistik.',
      'Konkret fordern wir eine spürbare Entlastung der Arbeitseinkommen, eine ' +
        'radikale Vereinfachung des Bau- und Genehmigungsrechts sowie den Einstieg ' +
        'in eine kapitalgedeckte Altersvorsorge, ohne bestehende Ansprüche zu brechen. ' +
        'Weiter fordern wir, dass die Bundesregierung dem Bundestag jährlich über ' +
        'Zahl, Qualifikation und Motive der Fortziehenden berichtet.',
      'Wir wollen kein anderes Land. Wir wollen, dass Bleiben sich wieder lohnt.',
    ],
  },

  /** Die drei Forderungen erscheinen auf der Petitionsseite noch einmal. */
  forderungenLabel: 'WOFÜR SIE UNTERSCHREIBEN',

  /* Was mit der Unterschrift geschieht. Ohne diese Auskunft ist ein
     Unterschriftenformular eine Blackbox — und wird entsprechend selten
     ausgefuellt. */
  ablauf: {
    label: 'WAS DANACH PASSIERT',
    schritte: [
      {
        titel: 'Bestätigung per E-Mail',
        text:
          'Du bekommst eine E-Mail mit einem Bestätigungslink. Erst mit dem Klick ' +
          'zählt deine Unterschrift. Ohne diesen Schritt wäre die Liste wertlos, weil ' +
          'jeder jeden eintragen könnte.',
      },
      {
        titel: 'Zählen, nicht weitergeben',
        text:
          'Deine Daten dienen ausschließlich der Petition. Sie werden nicht verkauft, ' +
          'nicht für Werbung genutzt und nicht an Parteien weitergegeben.',
      },
      {
        titel: 'Übergabe',
        text:
          'Nach Abschluss der Sammlung werden Anzahl, Postleitzahlengebiete und — ' +
          'nur bei ausdrücklicher Freigabe — Namen und Begründungen übergeben. ' +
          'Wer es extra erlaubt, erscheint mit Vor- und Nachname bei den Unterstützern auf dieser Seite. ' +
          'Ein Porträt nur, wenn eines mitgeschickt wird.',
      },
      {
        titel: 'Löschung',
        text:
          'Spätestens sechs Monate nach der Übergabe werden die personenbezogenen ' +
          'Daten gelöscht. Nicht bestätigte Eintragungen werden nach 14 Tagen gelöscht.',
      },
    ],
  },

  formular: {
    titelUnterschreiben: 'Deine Unterschrift',
    titelGeschichte: 'Deine Geschichte',
    titelBeides: 'Unterschrift und Geschichte',
    abschnittWahl: 'WAS DU BEITRÄGST',
    unterschreiben: 'Petition unterschreiben',
    veroeffentlichen: 'Geschichte veröffentlichen',
    veroeffentlichenHinweis:
      'Name und Geschichte werden bei der Übergabe öffentlich genannt. ' +
      'Ein Porträt kannst du dazulegen oder weglassen.',
    abschnittPerson: 'ZUR PERSON',
    abschnittMotiv: 'IHR MOTIV (FREIWILLIG)',
    abschnittEinwilligung: 'EINWILLIGUNG',

    vorname: 'Vorname',
    nachname: 'Nachname',
    email: 'E-Mail-Adresse',
    emailHinweis: 'Für die Bestätigung. Wird nicht veröffentlicht.',
    plz: 'Postleitzahl',
    plzHinweis: 'Zeigt, aus welchen Regionen die Stimmen kommen.',
    ort: 'Ort',
    land: 'Land',
    letztePlz: 'Letzte Postleitzahl in Deutschland',
    letztePlzHinweis: 'Freiwillig. Ordnet die Geschichte einer Region zu.',

    geschichte: 'Deine Geschichte',
    geschichteHinweis: 'Ein Satz genügt. Pflicht, sobald du veröffentlichst.',
    geschichtePlatzhalter:
      'Ich bin gegangen, weil …',

    einwilligung:
      'Ich bin damit einverstanden, dass meine Angaben zum Zweck dieser Petition ' +
      'verarbeitet und an die genannten Adressaten übergeben werden. Die Einwilligung ' +
      'kann ich jederzeit formlos widerrufen.',
    einwilligungGeschichte:
      'Ich bin damit einverstanden, dass Name und Geschichte veröffentlicht und ' +
      'bei der Übergabe genannt werden. Die Einwilligung kann ich jederzeit formlos widerrufen.',
    nameAuffuehren: 'Mein Name darf bei den Unterstützern aufgeführt werden.',
    nameAuffuehrenHinweis:
      'Vor- und Nachname auf dieser Seite. Ein Porträt kannst du dazulegen oder weglassen. ' +
      'Geschichte und E-Mail bleiben ungenannt.',
    bild: 'Porträt',
    bildHinweis: 'Freiwillig. JPG, PNG oder WebP, höchstens 2 MB. Ohne Bild bleibt der Platz leer.',
    bildWaehlen: 'Bild auswählen',
    bildAendern: 'Anderes Bild',
    bildEntfernen: 'Bild entfernen',
    bildFehlerTyp: 'Bitte ein Bild im Format JPG, PNG oder WebP.',
    bildFehlerGroesse: 'Das Bild darf höchstens 2 MB groß sein.',
    oeffentlich:
      'Mein Name und meine Begründung dürfen bei der Übergabe öffentlich genannt werden.',
    updates:
      'Sag mir Bescheid, wenn die Petition übergeben wird. Höchstens fünf E-Mails, ' +
      'Abmeldung mit einem Klick.',

    absendenUnterschreiben: 'Unterschreiben',
    absendenVeroeffentlichen: 'Veröffentlichen',
    absendenBeides: 'Unterschreiben und veröffentlichen',
    datenschutzHinweis:
      'Angaben zur Verarbeitung stehen in der Datenschutzerklärung. Es werden keine ' +
      'Tracker, keine Analyse-Dienste und keine externen Schriften geladen.',
  },

  /** Sammelmeldung über dem Formular, wenn das Absenden fehlschlägt. */
  fehlerUeberschrift: 'Bitte prüf noch diese Angaben:',

  /* Der Zaehler ist eine reine Anzeige ohne Backend. Er darf niemals eine
     erfundene Zahl zeigen — bis der Server steht, bleibt er auf null. */
  zaehlerLabel: 'Unterschriften',
  zaehlerZusatz: 'Der Zähler steht auf null, weil noch nichts gezählt wird.',
  zaehlerStart: 0,

  quittung: {
    titel: 'Nichts wurde gesendet.',
    text:
      'Deine Eingaben waren vollständig — sie wurden aber weder gespeichert noch ' +
      'verschickt. Diese Seite läuft im Demo-Modus.',
    fehltTitel: 'Bis zum Echtbetrieb fehlen',
    fehlt: [
      'ein Endpunkt, der Unterschriften entgegennimmt und speichert',
      'Double-Opt-In per E-Mail, sonst ist die Liste angreifbar',
      'Schutz gegen automatisierte Eintragungen',
      'Impressum und Datenschutzerklärung mit den echten Angaben',
    ],
    zurueck: 'Eingaben erneut ansehen',
  },

  hinweisOhneBackend:
    'Demo-Modus: Es wird nichts gespeichert und nichts versendet. Für den Echtbetrieb ' +
    'fehlen Backend, Double-Opt-In, Impressum und Datenschutzerklärung.',
} as const;

/* ---------------------------------------------------------------------------
 * Rechtstexte
 *
 * ACHTUNG — beide Texte sind Geruest, nicht fertige Rechtstexte.
 * Alles in eckigen Klammern muss vor dem Livegang durch die tatsaechlichen
 * Angaben ersetzt werden; danach gehoert der Text einmal ueber den Tisch
 * einer Person, die dafuer geradesteht. Eine Kampagne, die E-Mail-Adressen
 * sammelt, ohne Impressum und Datenschutzerklaerung, ist abmahnfaehig.
 * ------------------------------------------------------------------------- */

export const RECHTSTEXT_WARNUNG =
  'Entwurf. Alle Angaben in eckigen Klammern sind vor der Veröffentlichung durch ' +
  'die tatsächlichen Daten zu ersetzen und rechtlich zu prüfen.';

export const IMPRESSUM = {
  titel: 'Impressum',
  einleitung: 'Angaben gemäß § 5 DDG und § 18 Abs. 2 MStV.',
  abschnitte: [
    {
      titel: 'Anbieter',
      absaetze: [
        '[Vor- und Nachname bzw. vollständiger Name der Organisation]',
        '[Straße und Hausnummer]\n[Postleitzahl und Ort]\n[Land]',
      ],
    },
    {
      titel: 'Kontakt',
      absaetze: [
        'E-Mail: [kontakt@beispiel.de]\nTelefon: [Telefonnummer]',
        'Eine ladungsfähige Anschrift ist Pflicht. Ein Postfach genügt nicht.',
      ],
    },
    {
      titel: 'Vertretungsberechtigt',
      absaetze: [
        '[Bei Verein, GmbH oder UG: vertretungsberechtigte Person, Registergericht ' +
          'und Registernummer, gegebenenfalls Umsatzsteuer-Identifikationsnummer ' +
          'nach § 27a UStG.]',
      ],
    },
    {
      titel: 'Inhaltlich verantwortlich nach § 18 Abs. 2 MStV',
      absaetze: [
        '[Vor- und Nachname]\n[Straße und Hausnummer]\n[Postleitzahl und Ort]',
        'Diese Angabe ist zwingend, weil die Seite journalistisch-redaktionelle ' +
          'Inhalte verbreitet.',
      ],
    },
    {
      titel: 'Streitbeilegung',
      absaetze: [
        'Zur Teilnahme an einem Streitbeilegungsverfahren vor einer ' +
          'Verbraucherschlichtungsstelle sind wir nicht verpflichtet und nicht bereit.',
      ],
    },
    {
      titel: 'Bildnachweis',
      absaetze: [
        'Sämtliche Gemälde stammen aus dem Open-Access-Bestand des Metropolitan ' +
          'Museum of Art, New York, und stehen unter CC0 (Public Domain). Eine ' +
          'Namensnennung ist nicht erforderlich, erfolgt hier aber dennoch.',
      ],
    },
  ] as readonly RechtsAbschnitt[],
} as const;

export const DATENSCHUTZ = {
  titel: 'Datenschutz',
  einleitung:
    'Diese Seite lädt keine externen Schriften, keine Karten, keine Videos und ' +
    'setzt keine Analyse- oder Werbe-Cookies. Verarbeitet werden nur die Daten, ' +
    'die für den Betrieb und für die Petition nötig sind.',
  abschnitte: [
    {
      titel: 'Verantwortlicher',
      absaetze: [
        '[Name, Anschrift und E-Mail-Adresse der verantwortlichen Person oder ' +
          'Organisation — identisch mit dem Impressum.]',
        '[Falls benannt: Kontaktdaten der oder des Datenschutzbeauftragten.]',
      ],
    },
    {
      titel: 'Aufruf der Website (Server-Logdateien)',
      absaetze: [
        'Beim Aufruf werden technisch notwendige Daten verarbeitet: gekürzte ' +
          'IP-Adresse, Datum und Uhrzeit, aufgerufene Adresse, übertragene ' +
          'Datenmenge, Browsertyp und Betriebssystem.',
        'Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Das berechtigte Interesse ' +
          'liegt im sicheren und störungsfreien Betrieb. Die Logdateien werden nach ' +
          '[7] Tagen gelöscht.',
      ],
    },
    {
      titel: 'Petition: welche Daten und wozu',
      absaetze: [
        'Pflichtangaben sind Vorname, Nachname, E-Mail-Adresse und Postleitzahl. ' +
          'Freiwillig sind die Auswahl der Motive, die Begründung in eigenen Worten und ' +
          'ein Porträt — zur veröffentlichten Geschichte oder bei Freigabe des Namens.',
        'Zweck ist die Sammlung, Prüfung und Übergabe der Unterschriften. ' +
          'Rechtsgrundlage ist deine Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO. ' +
          'Ohne diese Angaben kann die Unterschrift nicht gezählt werden.',
        'Namen und Begründungen werden nur dann öffentlich genannt oder übergeben, ' +
          'wenn du das gesondert freigegeben hast. Wer zustimmt, bei den ' +
          'Unterstützern genannt zu werden, erscheint dort mit Vor- und Nachname. ' +
          'Wer eine Geschichte veröffentlicht, wird mit Name und Geschichte genannt. ' +
          'Ein Porträt nur, wenn du eines hochlädst. Kontaktdaten bleiben ungenannt. ' +
          'Ohne Freigabe fließen die Angaben ausschließlich anonymisiert in die ' +
          'Gesamtzahl und die Auswertung nach Postleitzahlgebieten ein.',
      ],
    },
    {
      titel: 'Bestätigungsverfahren (Double-Opt-In)',
      absaetze: [
        'Nach dem Absenden bekommst du eine E-Mail mit einem Bestätigungslink. ' +
          'Erst mit der Bestätigung wird die Unterschrift gültig. Gespeichert werden ' +
          'dabei Zeitpunkt und IP-Adresse der Eintragung und der Bestätigung — als ' +
          'Nachweis, dass die Einwilligung tatsächlich von dir stammt.',
        'Nicht bestätigte Eintragungen werden nach [14] Tagen gelöscht.',
      ],
    },
    {
      titel: 'Speicherdauer',
      absaetze: [
        'Die personenbezogenen Daten der Unterzeichnenden werden spätestens ' +
          '[sechs] Monate nach der Übergabe der Petition gelöscht, sofern keine ' +
          'gesetzlichen Aufbewahrungspflichten entgegenstehen.',
      ],
    },
    {
      titel: 'Empfänger und Auftragsverarbeiter',
      absaetze: [
        '[Hosting-Anbieter mit Anschrift; Auftragsverarbeitungsvertrag nach ' +
          'Art. 28 DSGVO liegt vor.]',
        '[E-Mail-Versanddienstleister, falls eingesetzt.]',
        'Eine Weitergabe an Dritte zu Werbezwecken findet nicht statt. Die Daten ' +
          'werden nicht verkauft und nicht an Parteien übermittelt.',
      ],
    },
    {
      titel: 'Deine Rechte',
      absaetze: [
        'Du hast das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), ' +
          'Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), ' +
          'Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21 DSGVO).',
        'Eine erteilte Einwilligung kannst du jederzeit mit Wirkung für die Zukunft ' +
          'widerrufen — formlos per E-Mail an [kontakt@beispiel.de]. Die ' +
          'Rechtmäßigkeit der bis dahin erfolgten Verarbeitung bleibt unberührt.',
        'Dir steht ein Beschwerderecht bei einer Aufsichtsbehörde zu, in der Regel ' +
          'am Ort deines Wohnsitzes: [zuständige Landesdatenschutzbehörde].',
      ],
    },
  ] as readonly RechtsAbschnitt[],
} as const;
