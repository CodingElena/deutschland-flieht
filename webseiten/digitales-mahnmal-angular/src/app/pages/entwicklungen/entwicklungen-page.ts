import { ChangeDetectionStrategy, Component } from '@angular/core';

import {
  ABGABEN_VERGLEICH,
  AUSWERTUNG,
  BEITRAEGE,
  BEITRAEGE_SEKTION,
  ENTWICKLUNGEN,
  WANDERUNG,
} from '../../core/content';
import { anteilBalken, keilBalken } from '../../shared/balken';
import { kurvenEnde, kurvenPfad } from '../../shared/kurve';
import { Reveal } from '../../shared/reveal';

/**
 * Aktuelle Entwicklungen und Daten.
 *
 * Die Startseite behauptet, diese Seite belegt. Dieselben Grafiken, aber auf
 * Papier statt in der Nacht, mit Quelle unter jeder einzelnen und der Reihe
 * als lesbarer Tabelle. Darunter alle Belege, nicht nur die juengsten.
 *
 * Es entstehen hier keine eigenen Zahlen: jeder Block liest aus content.ts,
 * aus dem auch die Startseite liest.
 */
@Component({
  selector: 'app-entwicklungen-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Reveal],
  templateUrl: './entwicklungen-page.html',
  styleUrl: './entwicklungen-page.scss',
})
export class EntwicklungenPage {
  protected readonly inhalt = ENTWICKLUNGEN;
  protected readonly wanderung = WANDERUNG;
  protected readonly jahre = WANDERUNG.jahre;
  protected readonly vergleich = ABGABEN_VERGLEICH;
  protected readonly auswertung = AUSWERTUNG;
  protected readonly beitraege = BEITRAEGE;
  /** Derselbe Satz wie auf der Startseite: eigene Sätze, fremde Seiten. */
  protected readonly belegeText = BEITRAEGE_SEKTION.einleitung;

  protected readonly balken = keilBalken(ABGABEN_VERGLEICH.laender);
  protected readonly regionen = anteilBalken(AUSWERTUNG.regionen.zeilen);
  protected readonly gruende = anteilBalken(AUSWERTUNG.gruende.zeilen);

  /* Dieselben Grenzen wie auf der Startseite — sonst sieht dieselbe Reihe
     hier steiler oder flacher aus als dort. */
  protected readonly fortzugPfad = kurvenPfad(
    WANDERUNG.jahre.map((j) => j.fortzuege),
    200_000,
    310_000,
    8,
    102,
  );

  protected readonly saldoPfad = kurvenPfad(
    WANDERUNG.jahre.map((j) => -j.saldo),
    0,
    110_000,
    8,
    102,
  );

  protected readonly saldoEnde = kurvenEnde(
    WANDERUNG.jahre.map((j) => -j.saldo),
    0,
    110_000,
    8,
    102,
  );

  protected betrag(wert: number): string {
    return Math.abs(wert).toLocaleString('de-DE');
  }

  protected anteilText(anteil: number): string {
    return `${anteil} %`;
  }
}
