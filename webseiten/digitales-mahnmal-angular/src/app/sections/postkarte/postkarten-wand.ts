import { ChangeDetectionStrategy, Component } from '@angular/core';

import { POSTKARTE, POSTKARTEN_AUFNAHMEN } from '../../core/content';
import { Reveal } from '../../shared/reveal';

/**
 * Veroeffentlichte Aufnahmen vom Abschicken.
 *
 * Dieselbe Wand steht in der Section und auf der Postkartenseite.
 * Leer, bis in content.ts ein freigegebener Eintrag steht.
 */
@Component({
  selector: 'app-postkarten-wand',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Reveal],
  templateUrl: './postkarten-wand.html',
  styleUrl: './postkarten-wand.scss',
})
export class PostkartenWand {
  protected readonly wand = POSTKARTE.wand;
  protected readonly aufnahmen = POSTKARTEN_AUFNAHMEN;

  protected zeile(aufnahme: (typeof POSTKARTEN_AUFNAHMEN)[number]): string {
    const medium = aufnahme.medium === 'video' ? this.wand.video : this.wand.foto;
    const wer = [aufnahme.name, aufnahme.kontext].filter(Boolean).join(', ');
    return `${medium} — ${wer}`;
  }
}
