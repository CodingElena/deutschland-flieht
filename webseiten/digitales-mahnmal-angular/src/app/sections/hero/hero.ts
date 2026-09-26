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
import { planeLichtausfall } from './hero-lichter';

/**
 * Hero — dunkle Flaeche mit Counter und monumentaler Wortmarke.
 *
 * Die Wortmarke ist das Signaturelement: sie laeuft absichtlich ueber die
 * Viewportbreite hinaus und wird an beiden Raendern beschnitten.
 *
 * Unter der Zahl zwei Wege: die Petition, und die Daten, solange
 * die Kapitelliste auf der Startseite noch fehlt.
 */
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
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }

      const img = this.aufnahme()?.nativeElement;
      const canvas = this.leinwand()?.nativeElement;
      const box = this.bildflaeche()?.nativeElement;
      if (!img || !canvas || !box) {
        return;
      }

      const abort = new AbortController();
      destroy.onDestroy(() => abort.abort());

      const start = (): void => {
        if (abort.signal.aborted || !img.naturalWidth) {
          return;
        }
        const ok = planeLichtausfall({
          canvas,
          bild: img,
          container: box,
          signal: abort.signal,
        });
        this.leinwandAktiv.set(ok);
      };

      if (img.complete) {
        start();
      } else {
        img.addEventListener('load', start, { once: true, signal: abort.signal });
      }
    });
  }
}
