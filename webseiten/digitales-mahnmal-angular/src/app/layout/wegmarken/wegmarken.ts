import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { ENTWICKLUNGEN, KAPITEL, KAPITEL_NAV } from '../../core/content';

/**
 * Wegmarken — drei Striche rechts oben.
 *
 * Sie liegen von der Startseite an in der Ecke.
 * Geschlossen sind nur die Striche sichtbar. Ein Klick klappt die Kapitel
 * darunter auf; ein weiterer Klick, Escape oder ein Tippen ausserhalb
 * schliesst sie wieder.
 *
 * Das laufende Kapitel ergibt sich aus dem Schnittpunkt mit der Mitte des
 * Viewports (IntersectionObserver mit halbierten Raendern), nicht aus einem
 * Scroll-Handler. Es faerbt die Striche und markiert den offenen Eintrag.
 *
 * Unter den Kapiteln, durch eine Linie abgesetzt, steht der einzige Eintrag,
 * der die Seite verlaesst: die Daten. Er springt nicht, er navigiert.
 */
@Component({
  selector: 'app-wegmarken',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './wegmarken.html',
  styleUrl: './wegmarken.scss',
})
export class Wegmarken {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly kapitel = KAPITEL;
  protected readonly texte = KAPITEL_NAV;
  protected readonly seite = ENTWICKLUNGEN;

  /** Laufendes Kapitel. Markiert den offenen Eintrag. */
  private readonly aktiv = signal(KAPITEL[0].id);
  /** Ob die Flaeche unter den Strichen dunkel ist — auch bei mitlaufenden Sektionen. */
  private readonly flaecheDunkel = signal(KAPITEL[0].dunkel);
  protected readonly offen = signal(false);

  /** Auf dunkler Flaeche schreiben die Striche hell, sonst dunkel. */
  protected readonly aufDunkel = this.flaecheDunkel.asReadonly();

  /** Im Auftakt treten die Striche zurueck, damit der Hero allein steht. */
  protected readonly imAuftakt = computed(
    () => this.aktiv() === KAPITEL[0].id && !this.offen(),
  );

  constructor() {
    afterNextRender(() => {
      this.kapitelBeobachten();
      this.klickAussenSchliesst();
    });
  }

  protected istAktiv(id: string): boolean {
    return this.aktiv() === id;
  }

  /** Zweistellige Kapitelnummer, wie auf einer Saaltafel. */
  protected nummer(index: number): string {
    return String(index + 1).padStart(2, '0');
  }

  protected umschalten(): void {
    this.offen.update((offen) => !offen);
  }

  protected schliessen(): void {
    this.offen.set(false);
  }

  protected springe(id: string): void {
    document.getElementById(id)?.scrollIntoView({
      behavior: this.ruhig() ? 'auto' : 'smooth',
      block: 'start',
    });
    this.offen.set(false);
  }

  private ruhig(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private kapitelBeobachten(): void {
    /* Host-id → Kapitel und Flaeche. Mitlaufende Sektionen (Kennzahlen, Atlas)
       halten das uebergeordnete Kapitel aktiv, ohne eigenen Menuepunkt. */
    const zuordnung = new Map<string, { kapitelId: string; dunkel: boolean }>();
    for (const k of KAPITEL) {
      zuordnung.set(k.id, { kapitelId: k.id, dunkel: k.dunkel });
      for (const extra of k.dazu ?? []) {
        zuordnung.set(extra.id, { kapitelId: k.id, dunkel: extra.dunkel });
      }
    }

    /* Ein Band von einem Pixel quer durch die Mitte des Viewports: was es
       schneidet, ist das laufende Kapitel. Sektionen ohne Wegmarke lassen
       den letzten Wert stehen, statt die Leiste leer zu raeumen. */
    const beobachter = new IntersectionObserver(
      (eintraege) => {
        for (const eintrag of eintraege) {
          if (!eintrag.isIntersecting) {
            continue;
          }
          const ziel = zuordnung.get(eintrag.target.id);
          if (ziel) {
            this.aktiv.set(ziel.kapitelId);
            this.flaecheDunkel.set(ziel.dunkel);
          }
        }
      },
      { rootMargin: '-50% 0px -50% 0px' },
    );

    for (const id of zuordnung.keys()) {
      const el = document.getElementById(id);
      if (el) {
        beobachter.observe(el);
      }
    }

    this.destroyRef.onDestroy(() => beobachter.disconnect());
  }

  private klickAussenSchliesst(): void {
    const aufZeiger = (ereignis: PointerEvent): void => {
      if (!this.offen()) {
        return;
      }
      const ziel = ereignis.target;
      if (ziel instanceof Node && !this.host.nativeElement.contains(ziel)) {
        this.offen.set(false);
      }
    };

    document.addEventListener('pointerdown', aufZeiger, { passive: true });
    this.destroyRef.onDestroy(() =>
      document.removeEventListener('pointerdown', aufZeiger),
    );
  }
}
