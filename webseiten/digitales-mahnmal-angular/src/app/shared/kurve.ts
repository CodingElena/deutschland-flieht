/** Ein Punkt der Jahreskurve, in viewBox-Koordinaten. y waechst nach unten. */
export interface Kurvenpunkt {
  readonly x: number;
  readonly y: number;
}

/**
 * Eine Linie ueber eine gemeinsame Jahresachse, als SVG-Pfad.
 *
 * Die Reihe der Fortzuege steht an zwei Stellen — dunkel auf der Startseite,
 * hell auf der Seite mit den Daten. Die Flaechen unterscheiden sich, die
 * Kurve darf es nicht: sonst laeuft dieselbe Zahl je nach Seite anders.
 *
 * `oben` und `unten` sind Koordinaten im viewBox, y waechst nach unten.
 */
export function kurvenPfad(
  werte: readonly number[],
  min: number,
  max: number,
  oben: number,
  unten: number,
): string {
  return kurvenPunkte(werte, min, max, oben, unten)
    .map((punkt, index) => `${index === 0 ? 'M' : 'L'} ${punkt.x.toFixed(1)} ${punkt.y.toFixed(1)}`)
    .join(' ');
}

/** Letzter Punkt derselben Achse — der Anker fuer das aktuelle Jahr. */
export function kurvenEnde(
  werte: readonly number[],
  min: number,
  max: number,
  oben: number,
  unten: number,
): Kurvenpunkt {
  const punkte = kurvenPunkte(werte, min, max, oben, unten);
  return punkte[punkte.length - 1];
}

function kurvenPunkte(
  werte: readonly number[],
  min: number,
  max: number,
  oben: number,
  unten: number,
): Kurvenpunkt[] {
  const links = 4;
  const rechts = 716;
  return werte.map((wert, index) => {
    const x = links + (index * (rechts - links)) / (werte.length - 1);
    const anteil = (wert - min) / (max - min);
    const y = unten - anteil * (unten - oben);
    return { x, y };
  });
}
