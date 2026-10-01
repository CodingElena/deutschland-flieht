import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';

import { AUSBLUTEN, type Fluchtziel } from '../../core/content';
import { rampe } from '../../core/scroll-progress';
import { Reveal } from '../../shared/reveal';
import { LAENDER_PFADE, type LandPfad } from './laender-pfade';

/**
 * Unregelmäßige Ausbleich-Fenster je Bundesland (Verlauf 0–1).
 * Bewusst nicht geografisch sortiert — einzelne Länder setzen früher ein,
 * andere später, mit unterschiedlicher Dauer.
 */
const AUSBLEICH: Readonly<Record<string, { readonly von: number; readonly bis: number }>> = {
  DESH: { von: 0, bis: 0.44 },
  DEHH: { von: 0.16, bis: 0.5 },
  DEMV: { von: 0, bis: 0.53 },
  DEHB: { von: 0.3, bis: 0.64 },
  DENI: { von: 0, bis: 0.6 },
  DEBE: { von: 0.23, bis: 0.55 },
  DEBB: { von: 0, bis: 0.47 },
  DENW: { von: 0.03, bis: 0.7 },
  DEST: { von: 0.1, bis: 0.41 },
  DESN: { von: 0.33, bis: 0.74 },
  DEHE: { von: 0, bis: 0.63 },
  DETH: { von: 0.19, bis: 0.58 },
  DERP: { von: 0.06, bis: 0.46 },
  DESL: { von: 0.37, bis: 0.68 },
  DEBY: { von: 0, bis: 0.77 },
  DEBW: { von: 0.25, bis: 0.66 },
};

/** Wie lange das Ausbleichen dauert, solange die Karte im Blick ist. */
const AUSBLEICH_DAUER_MS = 6000;

/** Bei welchem Verlaufsstand die Anteile ihren Endwert erreicht haben. */
const ANTEIL_ZIEL = 1;

interface PfeilLayout {
  readonly id: string;
  readonly d: string;
  readonly anchor: 'start' | 'middle' | 'end';
  readonly nameX: number;
  readonly nameY: number;
  readonly anteilX: number;
  readonly anteilY: number;
}

/**
 * Pfeile gleicher Länge, Beschriftung mit gleichem Abstand hinter der Spitze.
 * viewBox beginnt links im Negativen, damit USA Platz vor dem Pfeil hat.
 */
const PFEILE: readonly PfeilLayout[] = [
  {
    id: 'ch',
    d: 'M 313 642 C 310 695 307 735 306 752',
    anchor: 'middle',
    nameX: 306,
    nameY: 794,
    anteilX: 306,
    anteilY: 826,
  },
  {
    id: 'at',
    d: 'M 443 628 C 488 640 528 642 548 636',
    anchor: 'start',
    nameX: 576,
    nameY: 642,
    anteilX: 576,
    anteilY: 674,
  },
  {
    id: 'us',
    d: 'M 154 184 C 112 164 74 150 52 142',
    anchor: 'end',
    nameX: 24,
    nameY: 128,
    anteilX: 24,
    anteilY: 160,
  },
  {
    id: 'nl',
    d: 'M 210 141 C 170 120 142 106 118 92',
    anchor: 'middle',
    nameX: 58,
    nameY: 28,
    anteilX: 58,
    anteilY: 60,
  },
  {
    id: 'es',
    d: 'M 193 610 C 158 648 130 672 112 688',
    anchor: 'middle',
    nameX: 70,
    nameY: 730,
    anteilX: 70,
    anteilY: 762,
  },
];

interface ZielAmPfeil extends Fluchtziel {
  readonly layout: PfeilLayout;
}

/**
 * Deutschland bleicht regionenweise aus.
 *
 * Der Verlauf hängt nicht am Scrollen: solange die Karte im Blick ist,
 * kriechen die Flächen mit der Zeit unregelmäßig aus. Pfeile stehen von
 * Anfang an, die Anteile zählen am selben Verlauf hoch — Farbverlust und
 * Zahlen laufen dadurch gleichzeitig.
 */
@Component({
  selector: 'app-ausbluten',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Reveal],
  templateUrl: './ausbluten.html',
  styleUrl: './ausbluten.scss',
})
export class Ausbluten {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly sektion = AUSBLUTEN;
  protected readonly laender = LAENDER_PFADE;
  protected readonly ziele: readonly ZielAmPfeil[];

  /** 0 = satt, 1 = Flächen ausgeblichen. */
  private readonly verlauf = signal(0);

  /** Ohne Bewegung: Endzustand — Flächen weg, Konturen und Endwerte bleiben. */
  private readonly reduziert = signal(false);

  constructor() {
    const nachId = new Map(PFEILE.map((pfeil) => [pfeil.id, pfeil]));
    this.ziele = AUSBLUTEN.ziele.map((ziel) => {
      const layout = nachId.get(ziel.id);
      if (!layout) {
        throw new Error(`Kein Pfeil für Ziel ${ziel.id}`);
      }
      return { ...ziel, layout };
    });

    afterNextRender(() => {
      const reduziert = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.reduziert.set(reduziert);
      if (reduziert) {
        this.verlauf.set(1);
        return;
      }

      this.ausbleichenWennSichtbar();
    });
  }

  /**
   * Deckkraft der Landesfläche: startet satt, kriecht unregelmäßig aus.
   * Konturen (`.ab__rand`) sind davon unabhängig und bleiben sichtbar.
   */
  protected regionOpazitaet(land: LandPfad): number {
    if (this.reduziert()) {
      return 0.08;
    }
    const fenster = AUSBLEICH[land.id] ?? { von: 0.2, bis: 0.7 };
    const verlust = rampe(this.verlauf(), fenster.von, fenster.bis);
    return 0.92 - verlust * 0.92;
  }

  /**
   * Der angezeigte Anteil hängt am selben Verlauf wie das Ausbleichen
   * und zählt über die volle Dauer hoch.
   */
  protected anteilText(id: string): string {
    const anzahl = this.ziele.find((ziel) => ziel.id === id)?.anzahl ?? 0;
    const t = this.reduziert() ? 1 : Math.min(1, this.verlauf() / ANTEIL_ZIEL);
    const e = 0.5 - 0.5 * Math.cos(t * Math.PI);
    return Math.round(anzahl * e).toLocaleString('de-DE');
  }

  /**
   * Der Verlauf läuft nur, solange die Karte im Blick ist, und pausiert,
   * wenn man sie verlässt.
   */
  private ausbleichenWennSichtbar(): void {
    const buehne = this.host.nativeElement.querySelector('.ab__buehne');
    if (!buehne) {
      return;
    }

    let laufzeit = 0;
    let letzter = 0;
    let frame = 0;
    let aktiv = false;

    const stoppen = (): void => {
      aktiv = false;
      letzter = 0;
      if (frame !== 0) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    };

    const tick = (jetzt: number): void => {
      frame = 0;
      if (!aktiv) {
        return;
      }
      if (letzter === 0) {
        letzter = jetzt;
      }
      laufzeit += jetzt - letzter;
      letzter = jetzt;
      const t = Math.min(1, laufzeit / AUSBLEICH_DAUER_MS);
      this.verlauf.set(t);
      if (t < 1 && aktiv) {
        frame = requestAnimationFrame(tick);
      } else {
        aktiv = false;
      }
    };

    const beobachter = new IntersectionObserver(
      ([eintrag]) => {
        const sichtbar = eintrag.isIntersecting && eintrag.intersectionRatio >= 0.45;
        if (sichtbar) {
          if (this.verlauf() < 1 && frame === 0) {
            aktiv = true;
            letzter = 0;
            frame = requestAnimationFrame(tick);
          }
        } else if (aktiv || frame !== 0) {
          stoppen();
        }
      },
      { threshold: [0, 0.45, 0.7] },
    );

    beobachter.observe(buehne);
    this.destroyRef.onDestroy(() => {
      beobachter.disconnect();
      if (frame !== 0) {
        cancelAnimationFrame(frame);
      }
    });
  }
}
