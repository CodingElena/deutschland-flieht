import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { merge } from 'rxjs';

import { FORDERUNGEN, PETITION, PETITION_MOTIVE } from '../../core/content';

/** Felder, zu denen es eine Fehlermeldung gibt. */
type Pflichtfeld =
  | 'vorname'
  | 'nachname'
  | 'email'
  | 'plz'
  | 'ort'
  | 'land'
  | 'letztePlz'
  | 'geschichte'
  | 'einwilligung';

/** Porträts für die Unterstützer-Reihe: nur diese Typen, höchstens 2 MB. */
const BILD_TYPEN = ['image/jpeg', 'image/png', 'image/webp'];
const BILD_MAX_BYTES = 2 * 1024 * 1024;

/**
 * Petitionsseite.
 *
 * Zwei Beiträge, einzeln oder zusammen: die Unterschrift (deutsche
 * Postleitzahl) und die veröffentlichte Geschichte (auch aus dem Ausland,
 * dann mit Ort und Land statt Postleitzahl).
 */
@Component({
  selector: 'app-petition-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, ReactiveFormsModule, RouterLink],
  templateUrl: './petition-page.html',
  styleUrl: './petition-page.scss',
})
export class PetitionPage {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  protected readonly inhalt = PETITION;
  protected readonly forderungen = FORDERUNGEN;
  protected readonly motivOptionen = PETITION_MOTIVE;
  protected readonly motive = signal<readonly string[]>([]);

  protected readonly zaehler = signal(PETITION.zaehlerStart);
  protected readonly abgeschickt = signal(false);
  protected readonly versucht = signal(false);
  /** Gewähltes Porträt. Bleibt lokal, solange nichts gespeichert wird. */
  protected readonly bildVorschau = signal<string | null>(null);
  protected readonly bildFehler = signal<string | null>(null);

  /** Von „ergänze deine eigene“: Geschichte ist schon angehakt. */
  private readonly geschichteGewuenscht =
    this.route.snapshot.queryParamMap.get('teilnahme') === 'geschichte';

  protected readonly formular = this.fb.nonNullable.group(
    {
      unterschreiben: [true],
      veroeffentlichen: [this.geschichteGewuenscht],
      vorname: ['', [Validators.required, Validators.maxLength(80)]],
      nachname: ['', [Validators.required, Validators.maxLength(80)]],
      email: ['', [Validators.required, Validators.email]],
      plz: [''],
      ort: [''],
      land: [''],
      letztePlz: [''],
      geschichte: [''],
      einwilligung: [false, [Validators.requiredTrue]],
      nameAuffuehren: [false],
      oeffentlich: [false],
      updates: [false],
      webseite: [''],
    },
    { validators: [mindestensEineTeilnahme] },
  );

  private readonly fehlerTexte: Readonly<Record<Pflichtfeld, string>> = {
    vorname: 'Bitte trag deinen Vornamen ein.',
    nachname: 'Bitte trag deinen Nachnamen ein.',
    email: 'Bitte eine gültige E-Mail-Adresse angeben — an sie geht die Bestätigung.',
    plz: 'Die Postleitzahl besteht aus fünf Ziffern.',
    ort: 'Bitte trag den Ort ein, an dem du jetzt lebst.',
    land: 'Bitte trag das Land ein.',
    letztePlz: 'Die letzte Postleitzahl in Deutschland besteht aus fünf Ziffern.',
    geschichte: 'Bitte schreib deine Geschichte — ein Satz genügt.',
    einwilligung: 'Ohne Einwilligung dürfen wir das nicht annehmen.',
  };

  constructor() {
    this.regelnAnwenden();
    merge(
      this.formular.controls.unterschreiben.valueChanges,
      this.formular.controls.veroeffentlichen.valueChanges,
    )
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.regelnAnwenden());

    merge(
      this.formular.controls.nameAuffuehren.valueChanges,
      this.formular.controls.veroeffentlichen.valueChanges,
    )
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (!this.nameAufgefuehrt && !this.veroeffentlicht) this.bildEntfernen();
      });

    inject(DestroyRef).onDestroy(() => this.bildVorschauFreigeben());
  }

  protected get unterschreibt(): boolean {
    return this.formular.controls.unterschreiben.value;
  }

  protected get veroeffentlicht(): boolean {
    return this.formular.controls.veroeffentlichen.value;
  }

  protected get nameAufgefuehrt(): boolean {
    return this.formular.controls.nameAuffuehren.value;
  }

  protected get nurGeschichte(): boolean {
    return this.veroeffentlicht && !this.unterschreibt;
  }

  protected formularTitel(): string {
    if (this.unterschreibt && this.veroeffentlicht) {
      return this.inhalt.formular.titelBeides;
    }
    if (this.veroeffentlicht) {
      return this.inhalt.formular.titelGeschichte;
    }
    return this.inhalt.formular.titelUnterschreiben;
  }

  protected absendenLabel(): string {
    if (this.unterschreibt && this.veroeffentlicht) {
      return this.inhalt.formular.absendenBeides;
    }
    if (this.veroeffentlicht) {
      return this.inhalt.formular.absendenVeroeffentlichen;
    }
    return this.inhalt.formular.absendenUnterschreiben;
  }

  protected einwilligungText(): string {
    return this.nurGeschichte
      ? this.inhalt.formular.einwilligungGeschichte
      : this.inhalt.formular.einwilligung;
  }

  protected fehler(feld: Pflichtfeld): boolean {
    const c = this.formular.controls[feld];
    return c.invalid && (c.touched || c.dirty || this.versucht());
  }

  protected fehlerText(feld: Pflichtfeld): string {
    return this.fehlerTexte[feld];
  }

  protected teilnahmeOffen(): boolean {
    return this.versucht() && this.formular.hasError('teilnahme');
  }

  protected offeneFehler(): readonly { feld: string; text: string }[] {
    if (!this.versucht()) {
      return [];
    }
    const felder: Pflichtfeld[] = ['vorname', 'nachname', 'email', 'einwilligung'];
    if (this.unterschreibt) {
      felder.push('plz');
    }
    if (this.nurGeschichte) {
      felder.push('ort', 'land', 'letztePlz');
    }
    if (this.veroeffentlicht) {
      felder.push('geschichte');
    }
    const liste = felder
      .filter((f) => this.formular.controls[f].invalid)
      .map((f) => ({ feld: f, text: this.fehlerTexte[f] }));
    if (this.formular.hasError('teilnahme')) {
      return [
        {
          feld: 'unterschreiben',
          text: 'Wähl aus, ob du unterschreibst, deine Geschichte veröffentlichst oder beides.',
        },
        ...liste,
      ];
    }
    return liste;
  }

  protected fokussieren(feld: string): void {
    document.getElementById(`pt-${feld}`)?.focus();
  }

  protected istMotiv(id: string): boolean {
    return this.motive().includes(id);
  }

  protected motivUmschalten(id: string): void {
    this.motive.update((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
  }

  protected verbleibend(): number {
    return 1200 - this.formular.controls.geschichte.value.length;
  }

  protected bildGewaehlt(event: Event): void {
    const eingabe = event.target as HTMLInputElement;
    const datei = eingabe.files?.[0];
    if (!datei) return;

    if (!BILD_TYPEN.includes(datei.type)) {
      this.bildFehler.set(this.inhalt.formular.bildFehlerTyp);
      eingabe.value = '';
      return;
    }
    if (datei.size > BILD_MAX_BYTES) {
      this.bildFehler.set(this.inhalt.formular.bildFehlerGroesse);
      eingabe.value = '';
      return;
    }

    this.bildVorschauFreigeben();
    this.bildVorschau.set(URL.createObjectURL(datei));
    this.bildFehler.set(null);
  }

  protected bildEntfernen(eingabe?: HTMLInputElement): void {
    this.bildVorschauFreigeben();
    this.bildVorschau.set(null);
    this.bildFehler.set(null);
    if (eingabe) eingabe.value = '';
  }

  protected absenden(): void {
    this.versucht.set(true);

    if (this.formular.invalid) {
      this.formular.markAllAsTouched();
      const erstes = this.offeneFehler()[0];
      if (erstes) {
        document.getElementById(`pt-${erstes.feld}`)?.focus();
      }
      return;
    }

    this.abgeschickt.set(true);
  }

  protected zurueckZumFormular(): void {
    this.abgeschickt.set(false);
  }

  /** Pflichtfelder hängen davon ab, was angehakt ist. */
  private regelnAnwenden(): void {
    const u = this.formular.controls.unterschreiben.value;
    const v = this.formular.controls.veroeffentlichen.value;
    const nurGeschichte = v && !u;
    const { plz, ort, land, letztePlz, geschichte, oeffentlich } = this.formular.controls;

    if (u) {
      plz.setValidators([Validators.required, Validators.pattern(/^\d{5}$/)]);
    } else {
      plz.clearValidators();
    }

    if (nurGeschichte) {
      ort.setValidators([Validators.required, Validators.maxLength(80)]);
      land.setValidators([Validators.required, Validators.maxLength(80)]);
      letztePlz.setValidators([Validators.pattern(/^\d{5}$/)]);
    } else {
      ort.clearValidators();
      land.clearValidators();
      letztePlz.clearValidators();
    }

    if (v) {
      geschichte.setValidators([Validators.required, Validators.maxLength(1200)]);
      oeffentlich.setValue(true, { emitEvent: false });
    } else {
      geschichte.setValidators([Validators.maxLength(1200)]);
      oeffentlich.setValue(false, { emitEvent: false });
    }

    for (const feld of [plz, ort, land, letztePlz, geschichte]) {
      feld.updateValueAndValidity({ emitEvent: false });
    }
  }

  private bildVorschauFreigeben(): void {
    const url = this.bildVorschau();
    if (url) URL.revokeObjectURL(url);
  }
}

function mindestensEineTeilnahme(group: AbstractControl): { teilnahme: true } | null {
  const u = group.get('unterschreiben')?.value;
  const v = group.get('veroeffentlichen')?.value;
  return u || v ? null : { teilnahme: true };
}
