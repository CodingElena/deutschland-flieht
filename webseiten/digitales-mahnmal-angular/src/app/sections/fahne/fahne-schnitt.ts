/* ===========================================================================
 * Schnitt und Zustand des Tuchs
 *
 * Dasselbe Tuch tritt an zwei Stellen auf: als langes Band, das diagonal
 * durch eine Sektion zieht, und als kleine Flagge am Kopf der Seite. Der
 * Unterschied steckt komplett in diesen beiden Vorgaben — der Renderer
 * (`FahnenCanvas`) kennt keine Sonderfaelle.
 * ========================================================================= */

/** Schnitt des Tuchs und sein Platz im Bild. Wird beim Aufbau einmal gelesen. */
export interface Fahnenschnitt {
  /** Laenge in Welteinheiten, laengs der Streifen. */
  readonly laenge: number;
  /** Breite in Welteinheiten, quer ueber Schwarz-Rot-Gold. */
  readonly breite: number;
  /** Aufloesung des Rasters: [laengs, quer]. */
  readonly segmente: readonly [number, number];
  /** Raster der Bruchstuecke, oder `null` fuer ein Tuch, das nur verschleisst. */
  readonly bruchstuecke: readonly [number, number] | null;
  /** Auslenkung der Wellen, 1 = voller Schwung. */
  readonly schwung: number;
  /** Ob das Tuch weht. Sonst bleibt die Pose stehen. */
  readonly wehen: boolean;
  /**
   * Offene Naehte von Anfang an, 0 bis 1. Die Bahnen bleiben liegen —
   * sie fallen nicht. 0 = geschlossenes Tuch.
   */
  readonly riss: number;
  /**
   * Wenige, weiche Loecher im geschlossenen Tuch, 0 bis 1. Unabhaengig
   * vom Verschleiss: kein Schmutz, kein Ausfransen.
   */
  readonly loecher: number;
  /** Staerke des Seidenglanzes, 1 = voll. */
  readonly glanz: number;
  /** Verdrehung um die Laengsachse, 1 = voller Schwung des Tuchs. */
  readonly drehung: number;
  /**
   * Wie weit die langen Kanten in den Grund auslaufen, 0 bis 1.
   * 0 = nur ein wenig duenner, 1 = der Saum loest sich ganz auf.
   */
  readonly saum: number;
  /**
   * Anteil der Bildhoehe, den die Breite des Tuchs einnimmt — als
   * [hochkant, quer]. Daraus ergibt sich der Kameraabstand, unabhaengig
   * von der Pixelgroesse der Leinwand.
   */
  readonly hoehenanteil: readonly [number, number];
  /** Lage der Tuchmitte in der Leinwand: 0 = Oberkante, 0.5 = Mitte. */
  readonly kopfabstand: number;
}

/** Zustand des Tuchs: Verschleiss, Bruch und Lage. Aendert sich beim Scrollen. */
export interface Fahnenzustand {
  /** Verschmutzung, Ausbleichen, Loecher: 0 bis 1. */
  readonly verschleiss: number;
  /** Zerfall in Bruchstuecke: 0 bis 1. */
  readonly bruch: number;
  /** Versatz im Bild, in Welteinheiten. */
  readonly x: number;
  readonly y: number;
  /** Schraeglage in der Bildebene, im Bogenmass. */
  readonly neigung: number;
  /** Kippung in die Tiefe, im Bogenmass. */
  readonly kippung: number;
}

/**
 * Das lange Band der Fahnen-Sektion: laeuft an beiden Bildraendern hinaus
 * und verschleisst ueber die Scrollstrecke. Es bricht nicht — es franst aus.
 */
export const BANNER_SEKTION: Fahnenschnitt = {
  /* Die Laenge ist bewusst weit ueberdimensioniert: das Band liegt schraeg
     im Bild, bei kurzer Laenge wandern die Enden sichtbar in den
     Ausschnitt. */
  laenge: 26,
  breite: 2.05,
  segmente: [420, 28],
  bruchstuecke: null,
  schwung: 1,
  wehen: true,
  riss: 0,
  loecher: 0,
  glanz: 1,
  drehung: 1,
  saum: 0,
  /* Auf schmalen Fenstern weiter weg, damit vom Band mehr als ein Streifen
     im Bild steht. */
  hoehenanteil: [0.254, 0.356],
  kopfabstand: 0.5,
};

/**
 * Die Flagge am Kopf der Seite. Sie haengt als ein Tuch durch den oberen
 * Bildrand, dort wo die Eichenkronen den Hero gerahmt haben, und laeuft
 * links und rechts aus dem Fenster. Sie weht nicht und bricht nicht: die
 * Streifen bleiben eine Flaeche.
 *
 * Der Schwung bleibt klein, damit das Tuch liegt und den Schriftzug nicht
 * zuschlaegt. Ein paar Loecher sitzen in der Flaeche, ohne sie zu zerlegen.
 */
export const KOPF_FLAGGE: Fahnenschnitt = {
  laenge: 46,
  breite: 4.8,
  segmente: [216, 36],
  bruchstuecke: null,
  schwung: 0.26,
  wehen: false,
  riss: 0,
  /* Wenige Oeffnungen, ueber die Laenge verstreut. */
  loecher: 0.7,
  /* Der Glanz bleibt Stoff, wird aber nicht zum Lichtband. */
  glanz: 0.42,
  /* Fast flach: die Streifen bleiben eine Fahne, kein gerolltes Band. */
  drehung: 0.22,
  /* Der Saum laeuft in den Himmel, die Streifen bleiben lesbar. */
  saum: 0.82,
  hoehenanteil: [0.38, 0.32],
  /* Oben, im Band der ehemaligen Kronen, mit Luft zur Oberkante: die Wellen
     heben das Tuch. */
  kopfabstand: 0.2,
};
