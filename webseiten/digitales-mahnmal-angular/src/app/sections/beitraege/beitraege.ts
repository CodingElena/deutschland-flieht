import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  BEITRAEGE,
  BEITRAEGE_AUF_START,
  BEITRAEGE_SEKTION,
  ENTWICKLUNGEN,
} from '../../core/content';
import { Papier } from '../papier/papier';
import { Reveal } from '../../shared/reveal';

/**
 * Aktuelle Entwicklungen: kurze eigene Sätze mit Link zum Herausgeber.
 * Keine übernommenen Artikel und keine Einbettung.
 *
 * Hier stehen nur die jüngsten Belege — die Startseite soll nicht zum
 * Archiv werden. Die vollständige Liste trägt die eigene Seite.
 *
 * Daneben steht das angekündigte Papier — auf dem Telefon darüber.
 */
@Component({
  selector: 'app-beitraege',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Reveal, RouterLink, Papier],
  templateUrl: './beitraege.html',
  styleUrl: './beitraege.scss',
})
export class Beitraege {
  protected readonly sektion = BEITRAEGE_SEKTION;
  protected readonly beitraege = BEITRAEGE.slice(0, BEITRAEGE_AUF_START);
  protected readonly weiter = ENTWICKLUNGEN;
}
