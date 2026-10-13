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

/**
 * Hero — die belebte Straße, dann die leere.
 *
 * Der Film läuft einmal, stumm, über den ganzen Auftakt. Die Leute
 * verschwinden darin. Wenn die Straße leer ist, bleibt das letzte Bild
 * stehen. Darauf schlägt die Wortmarke ein, danach die Zahl.
 *
 * Die Wortmarke läuft absichtlich über die Viewportbreite hinaus und
 * wird an beiden Rändern beschnitten. Sie sinkt beim Scrollen nach unten.
 *
 * Unter der Zahl steht der Weg zu den Daten, solange die Kapitelliste
 * auf der Startseite noch fehlt.
 */

/** Akt des Auftakts. `film` ist der Lauf, `urteil` die Wortmarke, `zahl` der Zähler. */
type HeroAkt = 'film' | 'urteil' | 'zahl';

/** Die Zahl kommt erst, wenn die Wortmarke schon steht. */
const PAUSE_VOR_ZAHL_MS = 900;
/** Hochzählen. Die Wortmarke steht dann schon. */
const ZAEHL_DAUER_MS = 620;
/** Falls der Film nicht startet, steht der Titel trotzdem. */
const NOTFALL_MS = 6000;

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
  protected readonly akt = signal<HeroAkt>('film');
  /** Die Zahl kommt erst, wenn die Wortmarke steht. */
  protected readonly zahlSichtbar = computed(() => this.akt() === 'zahl');
  protected readonly zaehlDauer = ZAEHL_DAUER_MS;

  private readonly film = viewChild<ElementRef<HTMLVideoElement>>('film');
  private readonly scroll = fensterScroll();

  /**
   * Die Wortmarke sitzt in der Mitte und sinkt beim Scrollen nach unten
   * weg. Sie bewegt sich schneller als die Seite.
   */
  protected readonly markeVersatz = computed(() => Math.min(this.scroll() * 0.9, 420));

  constructor() {
    const destroy = inject(DestroyRef);

    afterNextRender(() => {
      const video = this.film()?.nativeElement;
      if (!video) {
        return;
      }

      const reduziert = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const abort = new AbortController();
      destroy.onDestroy(() => abort.abort());

      let schlussGezeigt = false;
      const zeigeSchluss = (): void => {
        if (abort.signal.aborted || schlussGezeigt) {
          return;
        }
        schlussGezeigt = true;
        this.akt.set('urteil');
        const zuZahl = window.setTimeout(() => {
          if (!abort.signal.aborted) {
            this.akt.set('zahl');
          }
        }, PAUSE_VOR_ZAHL_MS);
        abort.signal.addEventListener('abort', () => window.clearTimeout(zuZahl), { once: true });
      };

      if (reduziert) {
        const ansEnde = (): void => {
          video.pause();
          if (Number.isFinite(video.duration) && video.duration > 0) {
            video.currentTime = Math.max(0, video.duration - 0.05);
          }
        };
        if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
          ansEnde();
        } else {
          video.addEventListener('loadedmetadata', ansEnde, { once: true, signal: abort.signal });
        }
        this.akt.set('zahl');
        return;
      }

      video.muted = true;
      const gestartet = video.play();
      void gestartet?.catch(() => zeigeSchluss());

      video.addEventListener('ended', zeigeSchluss, { signal: abort.signal });

      const notfall = window.setTimeout(zeigeSchluss, NOTFALL_MS);
      abort.signal.addEventListener('abort', () => window.clearTimeout(notfall), { once: true });
    });
  }
}
