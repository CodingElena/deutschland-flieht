import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
} from '@angular/core';

import { SEQUENZ } from '../../core/content';
import { rampe, scrollProgress } from '../../core/scroll-progress';
import { Reveal } from '../../shared/reveal';


/**
 * Gepinnte Bildsequenz mit dunkler Karte in der Mitte.
 *
 * Drei Szenen folgen der einen Luecke aus der Menge. Die Sektion ist so
 * hoch wie die Anzahl der Schritte mal Viewporthoehe. Waehrend man durch
 * sie hindurchscrollt, bleibt der Inhalt stehen und nur Bild und Kartentext
 * wechseln — der Effekt aus der Vorlage.
 */
@Component({
  selector: 'app-sequenz',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Reveal],
  templateUrl: './sequenz.html',
  styleUrl: './sequenz.scss',
})
export class Sequenz {
  private readonly host = inject(ElementRef<HTMLElement>);

  protected readonly schritte = SEQUENZ;

  /** 0 bis 1 ueber die gesamte gepinnte Strecke. */
  protected readonly fortschritt = scrollProgress(this.host, { pinned: true });

  /** Index des gerade sichtbaren Schritts. */
  protected readonly aktiv = computed(() => {
    const anzahl = this.schritte.length;
    const i = Math.floor(this.fortschritt() * anzahl);
    return Math.min(anzahl - 1, Math.max(0, i));
  });

  /* Beschleunigter Verlauf des Sogs: quadratisch, damit es zum Ende hin
     schneller geht, statt gleichmaessig durchzulaufen. */
  /* Der Kreis bleibt in der ersten Szene geschlossen — die eine Luecke.
     Ab Szene zwei reisst das Loch nach unten auf. */
  private readonly sog = computed(() => {
    const t = rampe(this.fortschritt(), 0.34, 1);
    return t * t;
  });

  /*
   * Der Kegel setzt an der breitesten Stelle des Kreises an und oeffnet
   * sich nach unten auf die volle Bildbreite.
   *
   * Die halbe Breite der Oberkante wird nicht hier berechnet, sondern im
   * Stylesheet direkt aus derselben Variablen abgeleitet wie der Kreis.
   * Eine Rechnung ueber window.innerWidth waere um die Breite der
   * Bildlaufleiste daneben — der Kegel saesse dann sichtbar versetzt.
   * Hier kommt nur dazu, wie weit er sich darueber hinaus oeffnet.
   */

  /** Zusaetzliche halbe Breite an der Unterkante. */
  protected readonly kegelUnten = computed(() => `${(this.sog() * 62).toFixed(2)}vw`);

  /**
   * Wie weit der Kegel unter den Kreisboden hinauswaechst.
   *
   * Der Ansatz selbst liegt fest am unteren Scheitel des Kreises; dieser
   * Wert steuert nur, wie weit die Oeffnung darunter reicht. Bei 0 steckt
   * der Kegel vollstaendig hinter dem Kreis und ist unsichtbar.
   */
  protected readonly kegelWachs = computed(() => `${(this.sog() * 105).toFixed(2)}%`);

  /** Hoehe der Sektion: ein Viewport pro Schritt, plus einer zum Auslaufen. */
  protected readonly hoehe = computed(() => `${(this.schritte.length + 1) * 100}svh`);
}
