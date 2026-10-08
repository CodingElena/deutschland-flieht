import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { BILDER, FORTGEHENDE, HERO, WER_GEHT, type Bild } from '../../core/content';
import { Reveal } from '../../shared/reveal';

/** Eine Stimme im Stapel. Die erste Karte ist das Gesicht aus dem Hero. */
interface GeschichteKarte {
  readonly id: string;
  readonly bild: Bild;
  readonly zeilen: readonly string[];
  readonly name?: string;
  readonly rolle?: string;
  readonly kontext?: string;
  /** Dummy-Silhouette: Kreis. Das Hero-Portraet traegt dieselbe Maske wie oben. */
  readonly zeichen: boolean;
  readonly beispiel: boolean;
}

/**
 * Geschichten als Stapel unter dem Hero.
 *
 * Das leere Buero bleibt stehen. Die Personen sitzen darauf und loesen
 * sich an den Raendern ins Bild. Ein Wisch nach rechts gibt die naechste
 * Stimme frei, ein Wisch nach links die vorige.
 */
@Component({
  selector: 'app-wer-geht',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Reveal, RouterLink, NgTemplateOutlet],
  templateUrl: './wer-geht.html',
  styleUrl: './wer-geht.scss',
  host: {
    '(keydown.arrowright)': 'vor()',
    '(keydown.arrowleft)': 'zurueck()',
  },
})
export class WerGeht {
  private readonly buehne = viewChild<ElementRef<HTMLElement>>('buehne');
  private readonly reduziert =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** 1 = naechste Karte (Wisch nach rechts), -1 = vorige. 0 = keine Bewegung. */
  private flug: 0 | 1 | -1 = 0;
  private flugTimer = 0;
  private zeiger: { id: number; x: number; y: number; achse: 'x' | 'y' | null } | null = null;

  protected readonly sektion = WER_GEHT;
  protected readonly buero = BILDER.buero;
  protected readonly karten = baueKarten();
  protected readonly index = signal(0);
  /** Horizontaler Zug der obersten Karte, in Pixeln. Positiv heisst nach rechts. */
  protected readonly zug = signal(0);
  protected readonly zieht = signal(false);
  /** Setzt die neue Karte ohne Transition an ihren Platz, nachdem die alte weg ist. */
  protected readonly sprung = signal(false);

  protected readonly aktuell = computed(() => this.karten[this.index()]);
  protected readonly amAnfang = computed(() => this.index() <= 0);
  protected readonly amEnde = computed(() => this.index() >= this.karten.length - 1);
  protected readonly neigung = computed(() => {
    const grad = this.zug() * 0.012;
    return Math.max(-8, Math.min(8, grad));
  });

  /** Die Karte, die unter der obersten liegt: die naechste, oder beim Rueckwisch die vorige. */
  protected readonly darunter = computed(() => {
    const i = this.index();
    if (this.zug() < -12 && i > 0) {
      return this.karten[i - 1];
    }
    if (i < this.karten.length - 1) {
      return this.karten[i + 1];
    }
    return null;
  });

  /** Die naechste Person wird erst sichtbar, waehrend die oberste wegzieht. */
  protected readonly untergrund = computed(() => Math.min(1, Math.abs(this.zug()) / 160));

  protected readonly ansage = computed(() => {
    const i = this.index();
    const karte = this.karten[i];
    const kopf = [karte.name, karte.rolle, karte.kontext].filter(Boolean).join(', ');
    return [`${i + 1} von ${this.karten.length}`, kopf, ...karte.zeilen].filter(Boolean).join(' ');
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => window.clearTimeout(this.flugTimer));
  }

  protected anfassen(ev: PointerEvent): void {
    if (this.flug !== 0 || ev.button !== 0) {
      return;
    }
    this.zeiger = { id: ev.pointerId, x: ev.clientX, y: ev.clientY, achse: null };
  }

  protected ziehen(ev: PointerEvent): void {
    const z = this.zeiger;
    if (!z || ev.pointerId !== z.id || this.flug !== 0) {
      return;
    }

    const dx = ev.clientX - z.x;
    const dy = ev.clientY - z.y;
    if (!z.achse) {
      if (Math.hypot(dx, dy) < 10) {
        return;
      }
      z.achse = Math.abs(dx) > Math.abs(dy) * 1.15 ? 'x' : 'y';
      if (z.achse === 'y') {
        this.zeiger = null;
        return;
      }
      this.zieht.set(true);
      const flaeche = ev.currentTarget;
      if (flaeche instanceof HTMLElement) {
        try {
          flaeche.setPointerCapture(ev.pointerId);
        } catch {
          // Ohne Capture bleibt der Wisch auf der Karte; die Seite scrollt weiter senkrecht.
        }
      }
    }

    const amEnde = this.index() >= this.karten.length - 1;
    const amAnfang = this.index() <= 0;
    const widerstand = (amEnde && dx > 0) || (amAnfang && dx < 0);
    this.zug.set(widerstand ? dx * 0.28 : dx);
  }

  protected loslassen(ev: PointerEvent): void {
    const z = this.zeiger;
    if (!z || ev.pointerId !== z.id) {
      return;
    }
    const warZiehen = z.achse === 'x';
    this.zeiger = null;
    this.zieht.set(false);
    if (!warZiehen) {
      this.zug.set(0);
      return;
    }

    const zug = this.zug();
    if (zug > 72 && this.index() < this.karten.length - 1) {
      this.animieren(1);
      return;
    }
    if (zug < -72 && this.index() > 0) {
      this.animieren(-1);
      return;
    }
    // Erst die Transition einschalten, im naechsten Frame zuruecksetzen,
    // sonst springt die Karte, statt zurueckzugleiten.
    requestAnimationFrame(() => {
      if (this.flug === 0 && !this.zieht()) {
        this.zug.set(0);
      }
    });
  }

  protected abbrechen(ev: PointerEvent): void {
    if (!this.zeiger || ev.pointerId !== this.zeiger.id) {
      return;
    }
    this.zeiger = null;
    this.zieht.set(false);
    if (this.flug === 0) {
      this.zug.set(0);
    }
  }

  protected vor(): void {
    if (this.flug !== 0 || this.index() >= this.karten.length - 1) {
      return;
    }
    this.animieren(1);
  }

  protected zurueck(): void {
    if (this.flug !== 0 || this.index() <= 0) {
      return;
    }
    this.animieren(-1);
  }

  protected springe(ziel: number): void {
    if (ziel === this.index() || this.flug !== 0 || ziel < 0 || ziel >= this.karten.length) {
      return;
    }
    this.zieht.set(false);
    this.zeiger = null;
    this.sprung.set(true);
    this.zug.set(0);
    this.index.set(ziel);
    requestAnimationFrame(() => this.sprung.set(false));
  }

  protected flugEnde(ev: TransitionEvent): void {
    if (ev.propertyName !== 'transform') {
      return;
    }
    this.flugBeenden();
  }

  private animieren(richtung: 1 | -1): void {
    if (this.reduziert) {
      this.zieht.set(false);
      this.zug.set(0);
      this.index.update((i) => i + richtung);
      return;
    }

    this.flug = richtung;
    this.zieht.set(false);
    const breite = this.buehne()?.nativeElement.clientWidth ?? 480;
    requestAnimationFrame(() => {
      if (this.flug !== richtung) {
        return;
      }
      this.zug.set(richtung * (breite + 64));
    });
    window.clearTimeout(this.flugTimer);
    this.flugTimer = window.setTimeout(() => this.flugBeenden(), 560);
  }

  private flugBeenden(): void {
    if (this.flug === 0) {
      return;
    }
    const richtung = this.flug;
    this.flug = 0;
    window.clearTimeout(this.flugTimer);
    this.sprung.set(true);
    this.zieht.set(false);
    this.index.update((i) => i + richtung);
    this.zug.set(0);
    requestAnimationFrame(() => this.sprung.set(false));
  }
}

function baueKarten(): readonly GeschichteKarte[] {
  const auftakt: GeschichteKarte = {
    id: 'auftakt',
    bild: HERO.gesicht,
    zeilen: [HERO.spruch.liebe, HERO.spruch.verlassen],
    zeichen: false,
    beispiel: false,
  };

  const stimmen: GeschichteKarte[] = FORTGEHENDE.map((person) => ({
    id: person.id,
    bild: person.bild,
    zeilen: [person.zeile],
    name: person.name,
    rolle: person.rolle,
    kontext: person.kontext,
    zeichen: true,
    beispiel: person.echt !== true,
  }));

  return [auftakt, ...stimmen];
}
