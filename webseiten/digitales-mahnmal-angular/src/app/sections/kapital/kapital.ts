import { ChangeDetectionStrategy, Component } from '@angular/core';

import { KAPITAL } from '../../core/content';
import { Reveal } from '../../shared/reveal';

/**
 * Nach den fehlenden Menschen das leere Buero.
 *
 * Die Frage, dann die Folge. Ohne Atlas, ohne Fluesterzeile:
 * das Bild traegt die Leere, der Text die Konsequenz.
 */
@Component({
  selector: 'app-kapital',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Reveal],
  templateUrl: './kapital.html',
  styleUrl: './kapital.scss',
})
export class Kapital {
  protected readonly sektion = KAPITAL;
}
