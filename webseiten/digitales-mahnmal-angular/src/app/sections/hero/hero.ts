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
  viewChildren,
} from '@angular/core';

import { RouterLink } from '@angular/router';

import { ENTWICKLUNGEN, HERO, MARKE } from '../../core/content';
import { fensterScroll } from '../../core/scroll-progress';
import { Zaehlwert } from '../../shared/zaehlwert';
import { zeichneSilhouette } from './hero-silhouette';

/**
 * Hero — fünf Porträts werden zu leeren Menschen.
 *
 * Zuerst die Gesichter, groß und allein. Kurz danach das Zitat darüber.
 * Dann wird ein Bild nach dem anderen zur Silhouette: dieselbe Kachel,
 * nur noch die leere Form. Wenn alle fünf leer sind, bleibt kurz nur
 * Schwarz. Danach schlägt die Wortmarke ein. Die Zahl kommt erst, wenn
 * der Titel schon steht.
 *
 * Die Wortmarke laeuft absichtlich ueber die Viewportbreite hinaus und
 * wird an beiden Raendern beschnitten.
 *
 * Unter der Zahl steht ein Weg: die Daten, solange die Kapitelliste auf
 * der Startseite noch fehlt. Der Aufruf zur Petition kommt erst beim
 * Scrollen, als Knopf in der unteren Ecke.
 */

/** Akt des Auftakts. `warte` ist nur der erste Frame, damit das Einblenden laeuft. */
type HeroAkt = 'warte' | 'gesichter' | 'zitat' | 'silhouette' | 'schwarz' | 'urteil' | 'zahl';

/** Fünf Aufnahmen, jede einmal. */
const ANZAHL = 5;
/** Die Gesichter stehen allein, bevor das Zitat kommt. */
const FOTOS_MS = 1800;
/** Das Zitat liegt auf den Gesichtern, bevor die erste Form leer wird. */
const ZITAT_MS = 2200;
/** Abstand, in dem die nächste Kachel zur Silhouette wird. */
const STAFFEL_MS = 460;
/** Ein Gesicht wird über diese Spanne zur leeren Form. */
const VERBLASSEN_MS = 1100;
/** Alle fünf Silhouetten bleiben kurz stehen. */
const HALTEN_MS = 1100;
/** Reines Schwarz zwischen den leeren Kacheln und der Wortmarke. */
const SCHWARZ_MS = 700;
/** Die Zahl kommt erst, wenn die Wortmarke schon steht. */
const PAUSE_VOR_ZAHL_MS = 900;
/** Hochzaehlen. Die Wortmarke steht dann schon. */
const ZAEHL_DAUER_MS = 620;

@Component({
  selector: 'app-hero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Zaehlwert],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
})
export class Hero {
  protected readonly hero = HERO;
  protected readonly marke = MARKE;
  protected readonly daten = ENTWICKLUNGEN;
  protected readonly akt = signal<HeroAkt>('warte');
  /** Einmal wahr, sobald die Gesichter zu Silhouetten werden. Bleibt wahr, damit die Animation nicht neu startet. */
  protected readonly geht = computed(() => {
    const akt = this.akt();
    return akt === 'silhouette' || akt === 'schwarz' || akt === 'urteil' || akt === 'zahl';
  });
  /** Die Zahl kommt erst, wenn die Wortmarke steht. */
  protected readonly zahlSichtbar = computed(() => this.akt() === 'zahl');
  protected readonly zaehlDauer = ZAEHL_DAUER_MS;
  protected readonly staffelMs = STAFFEL_MS;
  protected readonly verblassenMs = VERBLASSEN_MS;

  protected readonly kacheln = HERO.gesichter.slice(0, ANZAHL).map((bild, index) => ({
    id: index,
    pfad: bild.pfad,
    verzug: index,
  }));

  private readonly wand = viewChild<ElementRef<HTMLElement>>('wand');
  private readonly aufnahmen = viewChildren<ElementRef<HTMLImageElement>>('aufnahme');
  private readonly leinwaende = viewChildren<ElementRef<HTMLCanvasElement>>('silhouette');

  private readonly scroll = fensterScroll();

  /**
   * Die Wortmarke sitzt in der Mitte des Schwarzes und sinkt beim
   * Scrollen nach unten weg. Sie bewegt sich schneller als die Seite.
   */
  protected readonly markeVersatz = computed(() =>
    Math.min(this.scroll() * 0.9, 420),
  );

  constructor() {
    const destroy = inject(DestroyRef);

    afterNextRender(() => {
      const reduziert = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const abort = new AbortController();
      destroy.onDestroy(() => abort.abort());

      const neuZeichnen = (): void => {
        const flaechen = this.aufnahmen();
        const leinwaende = this.leinwaende();
        flaechen.forEach((aufnahme, index) => {
          const img = aufnahme.nativeElement;
          const canvas = leinwaende[index]?.nativeElement;
          const container = img.parentElement;
          if (!canvas || !container) {
            return;
          }
          const zeichnen = (): void => {
            if (abort.signal.aborted) {
              return;
            }
            zeichneSilhouette(canvas, img, container);
          };
          if (img.complete && img.naturalWidth) {
            zeichnen();
            return;
          }
          img.addEventListener('load', zeichnen, { once: true, signal: abort.signal });
        });
      };

      neuZeichnen();
      const wand = this.wand()?.nativeElement;
      const beobachter = new ResizeObserver(() => neuZeichnen());
      if (wand) {
        beobachter.observe(wand);
      }
      abort.signal.addEventListener('abort', () => beobachter.disconnect(), { once: true });

      if (reduziert) {
        this.akt.set('zahl');
        return;
      }

      const startSilhouette = FOTOS_MS + ZITAT_MS;
      const letzteFertig = startSilhouette + (ANZAHL - 1) * STAFFEL_MS + VERBLASSEN_MS;

      /* Zwei Frames warten, damit die fünf Gesichter als eigener Schlag
         gezeichnet sind, bevor das Zitat kommt. */
      const rahmen = requestAnimationFrame(() => {
        const rahmen2 = requestAnimationFrame(() => {
          if (abort.signal.aborted) {
            return;
          }
          this.akt.set('gesichter');
        });
        abort.signal.addEventListener('abort', () => cancelAnimationFrame(rahmen2), { once: true });
      });

      const zuZitat = window.setTimeout(() => {
        if (abort.signal.aborted) {
          return;
        }
        this.akt.set('zitat');
      }, FOTOS_MS);

      const zuSilhouette = window.setTimeout(() => {
        if (abort.signal.aborted) {
          return;
        }
        this.akt.set('silhouette');
      }, startSilhouette);

      const zuSchwarz = window.setTimeout(() => {
        if (abort.signal.aborted) {
          return;
        }
        this.akt.set('schwarz');
      }, letzteFertig + HALTEN_MS);

      const zuUrteil = window.setTimeout(() => {
        if (abort.signal.aborted) {
          return;
        }
        this.akt.set('urteil');
      }, letzteFertig + HALTEN_MS + SCHWARZ_MS);

      const zuZahl = window.setTimeout(() => {
        if (abort.signal.aborted) {
          return;
        }
        this.akt.set('zahl');
      }, letzteFertig + HALTEN_MS + SCHWARZ_MS + PAUSE_VOR_ZAHL_MS);

      abort.signal.addEventListener(
        'abort',
        () => {
          cancelAnimationFrame(rahmen);
          window.clearTimeout(zuZitat);
          window.clearTimeout(zuSilhouette);
          window.clearTimeout(zuSchwarz);
          window.clearTimeout(zuUrteil);
          window.clearTimeout(zuZahl);
        },
        { once: true },
      );
    });
  }
}
