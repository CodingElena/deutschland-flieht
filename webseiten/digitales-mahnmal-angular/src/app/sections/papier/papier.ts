import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PAPIER } from '../../core/content';
import { Reveal } from '../../shared/reveal';

/**
 * Platzhalter fuer das ausfuehrliche Papier.
 *
 * Keine eigene Sektion mehr, sondern die Nebenspalte der "Aktuellen
 * Entwicklungen" — dort fremde Belege, hier das eigene Papier. Solange
 * keine URL gesetzt ist, bleibt der CTA sichtbar, aber ohne Ziel.
 */
@Component({
  selector: 'app-papier',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Reveal],
  templateUrl: './papier.html',
  styleUrl: './papier.scss',
})
export class Papier {
  protected readonly sektion = PAPIER;
  protected readonly zeilen = [92, 78, 86, 64, 80, 52];
}
