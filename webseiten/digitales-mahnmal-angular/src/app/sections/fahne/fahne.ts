import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
} from '@angular/core';

import { FAHNE } from '../../core/content';
import { scrollProgress } from '../../core/scroll-progress';
import { BANNER_SEKTION, Fahnenzustand } from './fahne-schnitt';
import { FahnenCanvas } from './fahnen-canvas';

/**
 * Fahnen-Sektion.
 *
 * Drei Ebenen uebereinander:
 *   1. gestapelte Serif-Lettern, die beim Scrollen nach oben wandern
 *   2. feine Wireframe-Geometrie als Raster
 *   3. die 3D-Fahne, die diagonal durchs Bild zieht und dabei verschleisst
 */
@Component({
  selector: 'app-fahne',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FahnenCanvas],
  templateUrl: './fahne.html',
  styleUrl: './fahne.scss',
})
export class Fahne {
  private readonly host = inject(ElementRef<HTMLElement>);

  protected readonly inhalt = FAHNE;
  protected readonly buchstaben = FAHNE.gestapelt.split('');
  protected readonly schnitt = BANNER_SEKTION;

  protected readonly fortschritt = scrollProgress(this.host, { pinned: true });

  /** Verschiebung der Letternspalte in Prozent ihrer eigenen Hoehe. */
  protected readonly letternVersatz = computed(() => {
    const anzahl = this.buchstaben.length;
    /* Die Spalte ist so hoch wie alle Lettern zusammen; sichtbar ist immer
       nur ein Ausschnitt. Sie faehrt genau um die Differenz nach oben. */
    return -this.fortschritt() * (100 - 100 / anzahl);
  });

  /** Der Scroll-Fortschritt als Verschleiss und Flugbahn des Bandes. */
  protected readonly zustand = computed<Fahnenzustand>(() => {
    const p = this.fortschritt();

    /* Verschleiss setzt bewusst erst nach einem Viertel der Strecke ein:
       zuerst sieht man eine intakte Fahne, dann beginnt der Zerfall.
       Der Endwert liegt unter 1, damit die Fahne am Ende verdreckt und
       loechrig, aber intakt genug ist, um noch Fahne zu sein. */
    const verschleiss = Math.min(1, Math.max(0, (p - 0.22) / 0.72)) * 0.8;

    /* Das Band zieht diagonal ueber die volle Breite und laeuft an beiden
       Raendern aus dem Bild. Es wandert deshalb nur langsam durchs Bild —
       ein weiter Weg wuerde es aus dem Ausschnitt schieben, statt den
       Verschleiss zu zeigen. Die Schraeglage oeffnet sich beim Scrollen
       leicht, dadurch wirkt die Bewegung getragen statt statisch. */
    return {
      verschleiss,
      /* Das Band der Sektion franst aus, es bricht nicht. */
      bruch: 0,
      x: -0.55 + p * 1.1,
      y: 0.55 - p * 1.15,
      neigung: -0.4 + p * 0.17,
      kippung: 0.16 - p * 0.26,
    };
  });
}
