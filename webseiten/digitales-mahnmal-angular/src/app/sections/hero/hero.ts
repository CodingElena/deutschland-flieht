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

import { RouterLink } from '@angular/router';

import { ENTWICKLUNGEN, HERO, MARKE } from '../../core/content';
import { fensterScroll } from '../../core/scroll-progress';
import { Zaehlwert } from '../../shared/zaehlwert';
import { LICHT_DAUER_MS, planeLichtausfall } from './hero-lichter';

/**
 * Hero — erst ein Gesicht, dann die Wortmarke.
 *
 * Das Gesicht spricht zwei Saetze. Mit dem zweiten ("sie verlassen")
 * erloeschen die Fenster. Danach zaehlt die Zahl hoch, und erst
 * wenn sie steht, kommt die Wortmarke.
 *
 * Die Wortmarke laeuft absichtlich ueber die Viewportbreite hinaus und
 * wird an beiden Raendern beschnitten.
 *
 * Unter der Zahl steht ein Weg: die Daten, solange die Kapitelliste auf
 * der Startseite noch fehlt. Der Aufruf zur Petition kommt erst beim
 * Scrollen, als Knopf in der unteren Ecke.
 */

/** Akt des Auftakts. `warte` ist nur der erste Frame, damit das Einblenden laeuft. */
type HeroAkt = 'warte' | 'liebe' | 'fehlen' | 'zahl' | 'marke';

/** Pause auf dem ersten Satz, bevor der zweite einsetzt. */
const AKT_FEHLEN_MS = 1600;
/** Kurzer Schlag auf der dunklen Stadt, dann die Zahl. */
const PAUSE_NACH_DUNKEL_MS = 120;
/** Hochzaehlen, danach erscheint die Wortmarke. */
const ZAEHL_DAUER_MS = 900;

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
  protected readonly leinwandAktiv = signal(false);
  protected readonly akt = signal<HeroAkt>('warte');
  /** Die Zahl kommt erst, wenn die Fenster aus sind, und bleibt danach stehen. */
  protected readonly zahlSichtbar = computed(
    () => this.akt() === 'zahl' || this.akt() === 'marke',
  );
  protected readonly zaehlDauer = ZAEHL_DAUER_MS;

  private readonly aufnahme = viewChild<ElementRef<HTMLImageElement>>('aufnahme');
  private readonly leinwand = viewChild<ElementRef<HTMLCanvasElement>>('leinwand');
  private readonly bildflaeche = viewChild<ElementRef<HTMLElement>>('bildflaeche');

  private readonly scroll = fensterScroll();

  /**
   * Die Wortmarke ruht auf der Oberkante des Gemaeldes und sinkt beim
   * Scrollen dahinter weg. Sie bewegt sich schneller als die Seite, dadurch
   * wirkt es, als tauche sie hinter der Kante ab, statt nur mitzulaufen.
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

      let pauseNachDunkel = 0;
      let pauseNachZahl = 0;

      const zeigeMarke = (): void => {
        if (abort.signal.aborted || this.akt() === 'marke') {
          return;
        }
        this.akt.set('marke');
      };

      const zeigeZahl = (): void => {
        if (abort.signal.aborted || this.akt() === 'zahl' || this.akt() === 'marke') {
          return;
        }
        this.akt.set('zahl');
        pauseNachZahl = window.setTimeout(zeigeMarke, ZAEHL_DAUER_MS);
      };

      const lichter = (onFertig?: () => void): void => {
        if (abort.signal.aborted || this.leinwandAktiv()) {
          return;
        }
        const img = this.aufnahme()?.nativeElement;
        const canvas = this.leinwand()?.nativeElement;
        const box = this.bildflaeche()?.nativeElement;
        if (!img || !canvas || !box || !img.naturalWidth) {
          return;
        }
        const ok = planeLichtausfall({
          canvas,
          bild: img,
          container: box,
          signal: abort.signal,
          anfang: reduziert ? 1 : 0,
          onFertig,
        });
        this.leinwandAktiv.set(ok);
        if (!ok) {
          onFertig?.();
        }
      };

      const wennBildDa = (danach: () => void): void => {
        const img = this.aufnahme()?.nativeElement;
        if (!img || abort.signal.aborted) {
          return;
        }
        if (img.complete && img.naturalWidth) {
          danach();
          return;
        }
        img.addEventListener('load', () => danach(), { once: true, signal: abort.signal });
      };

      if (reduziert) {
        this.akt.set('marke');
        wennBildDa(lichter);
        return;
      }

      /* Zwei Frames warten, damit der erste Zustand gezeichnet ist
         und das Einblenden des Gesichts als Uebergang laeuft. */
      const rahmen = requestAnimationFrame(() => {
        const rahmen2 = requestAnimationFrame(() => {
          if (abort.signal.aborted) {
            return;
          }
          this.akt.set('liebe');
        });
        abort.signal.addEventListener('abort', () => cancelAnimationFrame(rahmen2), { once: true });
      });

      const zuFehlen = window.setTimeout(() => {
        this.akt.set('fehlen');
        wennBildDa(() =>
          lichter(() => {
            pauseNachDunkel = window.setTimeout(zeigeZahl, PAUSE_NACH_DUNKEL_MS);
          }),
        );
      }, AKT_FEHLEN_MS);

      /* Falls die Aufnahme nicht laedt: Zahl und Wortmarke kommen trotzdem. */
      const notfall = window.setTimeout(
        zeigeZahl,
        AKT_FEHLEN_MS + LICHT_DAUER_MS + PAUSE_NACH_DUNKEL_MS + 400,
      );

      abort.signal.addEventListener(
        'abort',
        () => {
          cancelAnimationFrame(rahmen);
          window.clearTimeout(zuFehlen);
          window.clearTimeout(pauseNachDunkel);
          window.clearTimeout(pauseNachZahl);
          window.clearTimeout(notfall);
        },
        { once: true },
      );
    });
  }
}
