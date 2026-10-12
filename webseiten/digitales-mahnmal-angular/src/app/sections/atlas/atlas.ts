import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ATLAS } from '../../core/content';
import { Reveal } from '../../shared/reveal';

/**
 * Schlussbild: Atlas mit der Welt auf den Schultern.
 * Der Takt der Fortzüge folgt direkt darunter.
 */
@Component({
  selector: 'app-atlas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Reveal],
  templateUrl: './atlas.html',
  styleUrl: './atlas.scss',
})
export class Atlas {
  protected readonly sektion = ATLAS;
}
