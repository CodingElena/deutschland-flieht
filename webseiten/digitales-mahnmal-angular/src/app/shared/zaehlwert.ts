import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  input,
  signal,
} from '@angular/core';

/**
 * Zaehlt eine Kennzahl hoch, sobald sie ins Bild scrollt.
 *
 * Die Werte stehen in content.ts als fertig formatierte Zeichenketten
 * ("270.000", "47,9 %", "3 von 4"). Diese Komponente zerlegt sie in
 * Vorspann, Zahl und Nachspann, zaehlt nur den Zahlenteil hoch und setzt
 * ihn in derselben deutschen Schreibweise wieder zusammen. Enthaelt ein
 * Wert keine Zahl, wird er unveraendert ausgegeben.
 *
 * Das Format bleibt damit in der Inhaltsdatei und wird hier nicht neu
 * erfunden — wer dort "47,9 %" eintraegt, bekommt genau das zu sehen.
 */
@Component({
  selector: 'app-zaehlwert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `{{ anzeige() }}`,
  styles: `
    :host {
      display: inline;
      /* Verhindert Zeilenumbrueche beim Hochzaehlen, wenn die Zahl
         zwischendurch kuerzer ist als am Ende. */
      white-space: nowrap;
      /* Versalziffern: Mediävalziffern lassen 5, 7 und 9 unter die
         Grundlinie rutschen, die Zahl wirkt dann zerbrochen. */
      font-variant-numeric: lining-nums tabular-nums;
    }
  `,
})
export class Zaehlwert {
  /** Fertig formatierter Zielwert aus der Inhaltsdatei. */
  readonly wert = input.required<string>();
  /** Dauer des Hochzaehlens in Millisekunden. */
  readonly dauer = input(1400);

  protected readonly anzeige = signal('');

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      const ziel = this.wert();
      const teile = this.zerlegen(ziel);

      /* Kein Zahlenanteil oder kein Bewegungswunsch: direkt anzeigen. */
      if (!teile || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        this.anzeige.set(ziel);
        return;
      }

      /* Knapp unter dem Ziel: ein kurzes Nachzaehlen, kein Hochrasen. */
      const startwert = teile.zahl * 0.95;
      this.anzeige.set(teile.vor + this.formatieren(startwert, teile.nachkomma) + teile.nach);

      const beobachter = new IntersectionObserver(
        ([eintrag]) => {
          if (!eintrag.isIntersecting) {
            return;
          }
          beobachter.disconnect();
          this.hochzaehlen(teile, startwert);
        },
        { threshold: 0.4 },
      );

      beobachter.observe(this.host.nativeElement);
      this.destroyRef.onDestroy(() => beobachter.disconnect());
    });
  }

  /** Zerlegt "47,9 %" in Vorspann, Zahl und Nachspann. */
  private zerlegen(
    text: string,
  ): { vor: string; zahl: number; nachkomma: number; nach: string } | null {
    const treffer = /^(.*?)([0-9][0-9.]*(?:,[0-9]+)?)(.*)$/s.exec(text);
    if (!treffer) {
      return null;
    }
    const roh = treffer[2];
    const zahl = Number(roh.replace(/\./g, '').replace(',', '.'));
    if (!Number.isFinite(zahl)) {
      return null;
    }
    const komma = roh.split(',')[1];
    return {
      vor: treffer[1],
      zahl,
      nachkomma: komma ? komma.length : 0,
      nach: treffer[3],
    };
  }

  private formatieren(wert: number, nachkomma: number): string {
    return wert.toLocaleString('de-DE', {
      minimumFractionDigits: nachkomma,
      maximumFractionDigits: nachkomma,
    });
  }

  private hochzaehlen(
    teile: {
      vor: string;
      zahl: number;
      nachkomma: number;
      nach: string;
    },
    startwert: number,
  ): void {
    const dauer = this.dauer();
    const start = performance.now();
    const spanne = teile.zahl - startwert;
    let frame = 0;

    const schritt = (jetzt: number): void => {
      const t = Math.min(1, (jetzt - start) / dauer);
      /* Sine ease-in-out: laeuft an und aus, ohne am Anfang zu rasen. */
      const e = 0.5 - 0.5 * Math.cos(t * Math.PI);
      const wert = startwert + spanne * e;

      this.anzeige.set(
        teile.vor + this.formatieren(wert, teile.nachkomma) + teile.nach,
      );

      if (t < 1) {
        frame = requestAnimationFrame(schritt);
      } else {
        /* Zum Schluss exakt den Wert aus der Inhaltsdatei setzen, damit
           keine Rundungsabweichung stehen bleibt. */
        this.anzeige.set(this.wert());
      }
    };

    frame = requestAnimationFrame(schritt);
    this.destroyRef.onDestroy(() => cancelAnimationFrame(frame));
  }
}
