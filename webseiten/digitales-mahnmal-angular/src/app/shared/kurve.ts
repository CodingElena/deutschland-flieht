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
  const links = 4;
  const rechts = 716;
  return werte
    .map((wert, index) => {
      const x = links + (index * (rechts - links)) / (werte.length - 1);
      const anteil = (wert - min) / (max - min);
      const y = unten - anteil * (unten - oben);
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}
