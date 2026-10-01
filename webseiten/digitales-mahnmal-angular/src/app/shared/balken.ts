import type { Abgabenland, AuswertungZeile } from '../core/content';

/**
 * Balkenbreiten fuer die Reihen, die zweimal auftreten: einmal knapp auf der
 * Startseite, einmal vollstaendig auf der Seite mit den Daten. Die Skala
 * gehoert zur Aussage — sie darf nicht je Flaeche neu erfunden werden.
 */

/** Anteilszeile mit Balkenbreite, skaliert auf den hoechsten Anteil der Spalte. */
export interface AnteilBalken extends AuswertungZeile {
  readonly breite: number;
}

export function anteilBalken(zeilen: readonly AuswertungZeile[]): readonly AnteilBalken[] {
  const max = Math.max(...zeilen.map((z) => z.anteil));
  return zeilen.map((z) => ({
    ...z,
    breite: max === 0 ? 0 : (z.anteil / max) * 100,
  }));
}

/** Land im Abgabenvergleich, Balken relativ zum hoechsten Keil der Liste. */
export interface KeilBalken extends Abgabenland {
  readonly breite: number;
  readonly wert: string;
}

export function keilBalken(laender: readonly Abgabenland[]): readonly KeilBalken[] {
  const max = Math.max(...laender.map((l) => l.keil));
  return laender.map((land) => ({
    ...land,
    breite: (land.keil / max) * 100,
    wert:
      land.keil.toLocaleString('de-DE', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }) + ' %',
  }));
}
