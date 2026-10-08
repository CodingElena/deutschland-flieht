import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { POSTKARTE } from '../../core/content';
import { Reveal } from '../../shared/reveal';
import { PostkartenWand } from './postkarten-wand';

/**
 * Schreib eine Postkarte ans Kanzleramt.
 *
 * Die Karte selbst, der Weg dorthin, und die Aufnahmen vom Abschicken.
 * Schreiben und Hochladen passieren auf der eigenen Seite — wie die
 * Unterschrift nicht im Abschluss steht, sondern auf /petition.
 */
@Component({
  selector: 'app-postkarte',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Reveal, PostkartenWand],
  templateUrl: './postkarte.html',
  styleUrl: './postkarte.scss',
})
export class Postkarte {
  protected readonly inhalt = POSTKARTE;
}
