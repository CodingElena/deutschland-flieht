import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';

import { TAKT } from '../../core/content';
import { Reveal } from '../../shared/reveal';

/**
 * Anteil der statistischen Sekunde. Der Ring soll schließen, bevor der Blick
 * weiterzieht. Satz und Zähler folgen diesem Umlauf; die Fußnote bleibt bei
 * der Rechnung aus dem Jahr.
 */
const UMLAUF_ANTEIL = 0.4;

/**
 * Schluss unter dem Atlas. Der Ring füllt sich einmal je Umlauf und springt
 * dann zurück; die Zahl daneben zählt, wie viele solche Takte seit dem Öffnen
 * der Seite vergangen sind.
 */
@Component({
  selector: 'app-takt',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Reveal],
  templateUrl: './takt.html',
  styleUrl: './takt.scss',
})
export class Takt {
  protected readonly sektion = TAKT;

  /** Sekunden eines Umlaufs. Kürzer als die Statistik, damit der nächste Takt fällig wird. */
  protected readonly umlaufSekunden = Math.max(1, Math.round(TAKT.sekunden * UMLAUF_ANTEIL));

  /** Personen, die seit dem Öffnen rechnerisch fortgezogen sind. */
  protected readonly zaehler = signal(0);
  /** Anteil des laufenden Takts, 0 bis 1. Treibt den Ring. */
  private readonly fortschritt = signal(0);

  protected readonly zaehlerText = computed(() => this.zaehler().toLocaleString('de-DE'));

  /** pathLength ist 100, der Versatz ist der noch leere Rest des Rings. */
  protected readonly versatz = computed(() => (100 * (1 - this.fortschritt())).toFixed(2));

  /** Leitpunkt auf dem Ring, oben beginnend, im Uhrzeigersinn. */
  protected readonly punkt = computed(() => {
    const winkel = -Math.PI / 2 + this.fortschritt() * Math.PI * 2;
    return {
      x: 32 + 26 * Math.cos(winkel),
      y: 32 + 26 * Math.sin(winkel),
    };
  });

  private readonly flaeche = viewChild.required<ElementRef<HTMLElement>>('flaeche');
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      const start = Date.now();
      const taktMs = this.umlaufSekunden * 1000;
      const reduziert = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      let imBild = false;
      let frame = 0;

      const aktualisieren = (): void => {
        const vergangen = Math.max(0, Date.now() - start);
        const naechster = Math.floor(vergangen / taktMs);
        if (naechster !== this.zaehler()) {
          this.zaehler.set(naechster);
        }
        if (!reduziert) {
          this.fortschritt.set((vergangen % taktMs) / taktMs);
        }
      };

      const lauf = (): void => {
        aktualisieren();
        frame = requestAnimationFrame(lauf);
      };

      const starten = (): void => {
        if (frame !== 0) {
          return;
        }
        aktualisieren();
        frame = requestAnimationFrame(lauf);
      };

      const stoppen = (): void => {
        if (frame === 0) {
          return;
        }
        cancelAnimationFrame(frame);
        frame = 0;
      };

      const sync = (): void => {
        aktualisieren();
        if (imBild && !document.hidden && !reduziert) {
          starten();
        } else {
          stoppen();
        }
      };

      const beobachter = new IntersectionObserver(([eintrag]) => {
        imBild = !!eintrag?.isIntersecting;
        sync();
      });
      beobachter.observe(this.flaeche().nativeElement);

      const beiSicht = (): void => sync();
      document.addEventListener('visibilitychange', beiSicht);

      /* Ohne Bewegung bleibt der Ring stehen. Die Zahl wechselt trotzdem,
         sie ist der Inhalt, nicht die Animation. */
      const timer = reduziert ? window.setInterval(aktualisieren, 1000) : 0;

      this.destroyRef.onDestroy(() => {
        stoppen();
        beobachter.disconnect();
        document.removeEventListener('visibilitychange', beiSicht);
        window.clearInterval(timer);
      });
    });
  }
}
