import { ChangeDetectionStrategy, Component } from '@angular/core';

import { KOPF_FLAGGE, Fahnenzustand } from '../../sections/fahne/fahne-schnitt';
import { FahnenCanvas } from '../../sections/fahne/fahnen-canvas';

/**
 * Die Flagge am Kopf der Seite.
 *
 * Sie haengt ruhig durch den oberen Rand des Auftakts, dort wo die Kronen
 * sassen. Ein Tuch, kein Wehen, kein Bruch. Ein paar Loecher, sonst nichts.
 * Scrollen verschiebt nichts.
 *
 * Reine Kulisse — der Titel der Seite steht in der Wortmarke des Heros,
 * deshalb ist hier nichts benannt und nichts anklickbar.
 */
@Component({
  selector: 'app-kopffahne',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FahnenCanvas],
  templateUrl: './kopffahne.html',
  styleUrl: './kopffahne.scss',
})
export class Kopffahne {
  protected readonly schnitt = KOPF_FLAGGE;

  protected readonly zustand: Fahnenzustand = {
    /* Die Loecher stehen im Schnitt. Verschleiss wuerde Schmutz dazutun. */
    verschleiss: 0,
    bruch: 0,
    x: 0,
    y: 0,
    neigung: -0.04,
    kippung: 0.1,
  };
}
