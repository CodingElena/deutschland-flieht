import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

import { AUSWERTUNG } from '../../core/content';
import { anteilBalken } from '../../shared/balken';
import { Reveal } from '../../shared/reveal';

/**
 * Auswertung direkt unter der Petition: Regionen und Gruende.
 * Geschlossen hinter dem Button „Auswertung ansehen“, damit der
 * Petitionsaufruf frei bleibt. Zahlen sind Beispieldaten.
 */
@Component({
  selector: 'app-auswertung',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Reveal],
  templateUrl: './auswertung.html',
  styleUrl: './auswertung.scss',
})
export class Auswertung {
  protected readonly sektion = AUSWERTUNG;
  protected readonly regionen = anteilBalken(AUSWERTUNG.regionen.zeilen);
  protected readonly gruende = anteilBalken(AUSWERTUNG.gruende.zeilen);
  protected readonly geoeffnet = signal(false);

  protected umschalten(): void {
    this.geoeffnet.update((offen) => !offen);
  }

  protected anteilText(anteil: number): string {
    return `${anteil} %`;
  }
}
