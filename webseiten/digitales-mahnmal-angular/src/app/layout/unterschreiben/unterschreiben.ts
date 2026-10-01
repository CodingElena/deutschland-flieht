import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  WritableSignal,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { PETITION_CTA } from '../../core/content';

/**
 * Der Aufruf zur Petition, der mitlaeuft.
 *
 * Im Auftakt steht er als unterstrichenes Wort unter der Zahl. Sobald der
 * Hero nach oben aus dem Bild gelaufen ist, tritt er als Knopf in die untere
 * Ecke und bleibt dort, solange man scrollt.
 *
 * Nur beim Abschluss weicht er: dort steht der Aufruf ohnehin in voller
 * Groesse in der Flaeche, ein zweiter Knopf daneben waere eine Dopplung.
 *
 * Beide Schwellen kommen aus IntersectionObservern, nicht aus einem
 * Scroll-Handler — wie bei den Wegmarken.
 */
@Component({
  selector: 'app-unterschreiben',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './unterschreiben.html',
  styleUrl: './unterschreiben.scss',
})
export class Unterschreiben {
  private readonly destroyRef = inject(DestroyRef);

  protected readonly cta = PETITION_CTA;

  /** Ob der Auftakt noch in der unteren Haelfte des Viewports steht. */
  private readonly imAuftakt = signal(true);
  /** Ob der Abschluss mit seinem eigenen Aufruf im Bild ist. */
  private readonly beimAbschluss = signal(false);

  protected readonly sichtbar = computed(
    () => !this.imAuftakt() && !this.beimAbschluss(),
  );

  constructor() {
    afterNextRender(() => {
      /* Ein Band ueber der unteren Haelfte des Viewports: solange der Hero es
         schneidet, steht sein unterstrichenes Wort noch im Bild. */
      this.beobachten('auftakt', this.imAuftakt, '-50% 0px 0px 0px');
      this.beobachten('petition', this.beimAbschluss);
    });
  }

  private beobachten(
    id: string,
    ziel: WritableSignal<boolean>,
    rootMargin = '0px',
  ): void {
    const el = document.getElementById(id);
    if (!el) {
      return;
    }

    const beobachter = new IntersectionObserver(
      (eintraege) => ziel.set(eintraege[eintraege.length - 1].isIntersecting),
      { rootMargin },
    );
    beobachter.observe(el);

    this.destroyRef.onDestroy(() => beobachter.disconnect());
  }
}
