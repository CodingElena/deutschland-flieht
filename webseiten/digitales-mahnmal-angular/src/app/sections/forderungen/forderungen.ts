import { ChangeDetectionStrategy, Component } from '@angular/core';

import { FORDERUNGEN, FORDERUNGEN_SEKTION } from '../../core/content';
import { Reveal } from '../../shared/reveal';

/**
 * Forderungs-Karten.
 *
 * Jede Karte traegt ein festes Stockportraet. Kein Wechsel, kein Takt:
 * die Gesichter bleiben, der Text liegt unten im Schleier.
 */
@Component({
  selector: 'app-forderungen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Reveal],
  templateUrl: './forderungen.html',
  styleUrl: './forderungen.scss',
})
export class Forderungen {
  protected readonly sektion = FORDERUNGEN_SEKTION;
  protected readonly forderungen = FORDERUNGEN;

  /** Laufende Nummer der Karte, zweistellig — „01“ bis „06“. */
  protected nummer(i: number): string {
    return String(i + 1).padStart(2, '0');
  }
}
