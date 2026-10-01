import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { FORTGEHENDE, WER_GEHT, type Fortgehende } from '../../core/content';
import { Reveal } from '../../shared/reveal';

/** Eine Figur in der Menge: anonym, oder eine oeffenbare Luecke. */
interface Figur {
  readonly id: number;
  readonly geschichte: Fortgehende | null;
}

/**
 * Kompakte Menge unter dem Hero.
 *
 * Wenige Figuren, damit der Block kurz bleibt. Benannte Luecken sind
 * Tueren: ein Klick oeffnet die Geschichte. Echte Stimmen ersetzen spaeter
 * die Beispielrollen.
 */
@Component({
  selector: 'app-wer-geht',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Reveal, RouterLink],
  templateUrl: './wer-geht.html',
  styleUrl: './wer-geht.scss',
  host: {
    '(document:keydown.escape)': 'aufEscape()',
  },
})
export class WerGeht {
  private readonly blatt = viewChild<ElementRef<HTMLElement>>('blatt');
  private zuletzt: HTMLElement | null = null;

  protected readonly sektion = WER_GEHT;
  protected readonly figuren = baueMenge(WER_GEHT.menge, FORTGEHENDE);
  protected readonly aktiv = signal<Fortgehende | null>(null);

  constructor() {
    const destroy = inject(DestroyRef);
    destroy.onDestroy(() => {
      document.body.style.overflow = '';
    });
  }

  protected oeffnen(geschichte: Fortgehende, ev: Event): void {
    this.zuletzt = ev.currentTarget instanceof HTMLElement ? ev.currentTarget : null;
    this.aktiv.set(geschichte);
    document.body.style.overflow = 'hidden';
    setTimeout(() => this.blatt()?.nativeElement.focus(), 0);
  }

  protected schliessen(): void {
    this.aktiv.set(null);
    document.body.style.overflow = '';
    this.zuletzt?.focus();
    this.zuletzt = null;
  }

  protected aufEscape(): void {
    if (this.aktiv()) {
      this.schliessen();
    }
  }
}

/** Setzt die Geschichten als Loecher gleichmaessig in die Menge. */
function baueMenge(anzahl: number, geschichten: readonly Fortgehende[]): Figur[] {
  const figuren: Figur[] = Array.from({ length: anzahl }, (_, i) => ({
    id: i,
    geschichte: null,
  }));

  if (geschichten.length === 0 || anzahl <= 0) {
    return figuren;
  }

  const schritt = anzahl / (geschichten.length + 1);
  for (let i = 0; i < geschichten.length; i += 1) {
    const index = Math.min(anzahl - 1, Math.round(schritt * (i + 1)));
    figuren[index] = { id: index, geschichte: geschichten[i] };
  }

  return figuren;
}
