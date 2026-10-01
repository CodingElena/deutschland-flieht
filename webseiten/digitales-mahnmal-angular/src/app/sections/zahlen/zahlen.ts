import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ABGABEN_VERGLEICH, ENTWICKLUNGEN, VIGNETTEN, WANDERUNG } from '../../core/content';
import { keilBalken } from '../../shared/balken';
import { kurvenEnde, kurvenPfad } from '../../shared/kurve';
import { Reveal } from '../../shared/reveal';
import { Zaehlwert } from '../../shared/zaehlwert';

/**
 * Nach der Karte drei Behauptungen: die Wanderungsreihe, die Qualifikation,
 * zuletzt der Abgabenvergleich.
 *
 * Am Fuss der Sektion der Weg zu den vollstaendigen Daten — hier stehen
 * die Grafiken knapp, dort mit Quelle und Tabelle.
 */
@Component({
  selector: 'app-zahlen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Reveal, RouterLink, Zaehlwert],
  templateUrl: './zahlen.html',
  styleUrl: './zahlen.scss',
})
export class Zahlen {
  protected readonly vignetten = VIGNETTEN;
  protected readonly wanderung = WANDERUNG;
  protected readonly vergleich = ABGABEN_VERGLEICH;
  protected readonly weiter = ENTWICKLUNGEN;

  protected readonly balken = keilBalken(ABGABEN_VERGLEICH.laender);

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

  protected readonly jahre = WANDERUNG.jahre;

  protected betrag(wert: number): string {
    return Math.abs(wert).toLocaleString('de-DE');
  }
}
