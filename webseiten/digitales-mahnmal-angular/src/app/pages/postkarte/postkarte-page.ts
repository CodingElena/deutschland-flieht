import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { POSTKARTE } from '../../core/content';
import { PostkartenWand } from '../../sections/postkarte/postkarten-wand';

/** Felder, zu denen es eine Fehlermeldung gibt. */
type Pflichtfeld =
  | 'stand'
  | 'versand'
  | 'text'
  | 'vorname'
  | 'nachname'
  | 'email'
  | 'ort'
  | 'land'
  | 'einwilligung'
  | 'aufnahmeFreigabe';

type Textart = 'standard' | 'geschichte';

const TEXT_MAX = 1200;
const BILD_TYPEN = ['image/jpeg', 'image/png', 'image/webp'];
const VIDEO_TYPEN = ['video/mp4', 'video/webm', 'video/quicktime'];
const BILD_MAX_BYTES = 8 * 1024 * 1024;
const VIDEO_MAX_BYTES = 40 * 1024 * 1024;

/**
 * Postkarte ans Kanzleramt.
 *
 * Unabhaengig von der Unterschrift. Der Standardtext ist aenderbar;
 * wer seine Geschichte veroeffentlicht, kann denselben Text nehmen.
 * „Selbst abschicken“ oeffnet den Hinweis auf Foto oder Video.
 */
@Component({
  selector: 'app-postkarte-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, PostkartenWand],
  templateUrl: './postkarte-page.html',
  styleUrl: './postkarte-page.scss',
})
export class PostkartePage {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly hinweis = viewChild<ElementRef<HTMLDialogElement>>('hinweis');
  private readonly dateiEingabe = viewChild<ElementRef<HTMLInputElement>>('dateiEingabe');

  protected readonly inhalt = POSTKARTE;

  protected readonly textMax = TEXT_MAX;
  protected readonly abgeschickt = signal(false);
  protected readonly versucht = signal(false);
  protected readonly adresseKopiert = signal(false);
  protected readonly aufnahmeVorschau = signal<string | null>(null);
  protected readonly aufnahmeVideo = signal(false);
  protected readonly aufnahmeFehler = signal<string | null>(null);

  /** Letzter Entwurf je Textart, damit der Wechsel nichts verwirft. */
  private readonly entwuerfe: Record<Textart, string> = {
    standard: POSTKARTE.standardtext,
    geschichte: '',
  };

  private kopierTimer = 0;
  private hinweisTimer = 0;

  protected readonly formular = this.fb.nonNullable.group({
    stand: ['', Validators.required],
    versand: ['', Validators.required],
    textart: ['standard' as Textart, Validators.required],
    text: [POSTKARTE.standardtext, [nichtLeer, Validators.maxLength(TEXT_MAX)]],
    vorname: ['', [nichtLeer, Validators.maxLength(80)]],
    nachname: ['', [nichtLeer, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    ort: ['', [nichtLeer, Validators.maxLength(80)]],
    land: ['', Validators.maxLength(80)],
    einwilligung: [false, Validators.requiredTrue],
    aufnahmeFreigabe: [false],
    nameBeiAufnahme: [false],
    webseite: [''],
  });

  constructor() {
    const { stand, versand, textart } = this.formular.controls;

    stand.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.landRegeln());

    versand.valueChanges.pipe(takeUntilDestroyed()).subscribe((wert) => {
      if (wert === 'selbst') {
        this.hinweisOeffnen();
        return;
      }
      this.aufnahmeEntfernen();
    });

    textart.valueChanges.pipe(takeUntilDestroyed()).subscribe((neu) => {
      if (!istTextart(neu)) return;
      const alt: Textart = neu === 'standard' ? 'geschichte' : 'standard';
      this.entwuerfe[alt] = this.formular.controls.text.value;
      this.formular.controls.text.setValue(this.entwuerfe[neu]);
    });

    this.destroyRef.onDestroy(() => {
      window.clearTimeout(this.kopierTimer);
      window.clearTimeout(this.hinweisTimer);
      this.aufnahmeFreigeben();
    });
  }

  protected get selbst(): boolean {
    return this.formular.controls.versand.value === 'selbst';
  }

  protected get geschichte(): boolean {
    return this.formular.controls.textart.value === 'geschichte';
  }

  protected get gegangen(): boolean {
    return this.formular.controls.stand.value === 'gegangen';
  }

  protected verbleibend(): number {
    return TEXT_MAX - this.formular.controls.text.value.length;
  }

  protected fehler(feld: Pflichtfeld): boolean {
    const c = this.formular.controls[feld];
    return c.invalid && (c.touched || c.dirty || this.versucht());
  }

  protected fehlerText(feld: Pflichtfeld): string {
    return this.inhalt.fehler[feld];
  }

  protected offeneFehler(): readonly { feld: Pflichtfeld; text: string }[] {
    if (!this.versucht()) return [];
    const felder: Pflichtfeld[] = [
      'stand',
      'versand',
      'text',
      'vorname',
      'nachname',
      'email',
      'ort',
      'einwilligung',
    ];
    if (this.gegangen) felder.push('land');
    if (this.aufnahmeVorschau()) felder.push('aufnahmeFreigabe');
    return felder
      .filter((feld) => this.formular.controls[feld].invalid)
      .map((feld) => ({ feld, text: this.inhalt.fehler[feld] }));
  }

  protected fokussieren(feld: Pflichtfeld): void {
    if (feld === 'text') {
      document.getElementById('ka-textfeld')?.focus();
      return;
    }
    const el = document.getElementById(`ka-${feld}`);
    const radio = el?.querySelector<HTMLInputElement>('input[type="radio"]');
    (radio ?? el)?.focus();
  }

  protected adresseKopieren(): void {
    if (!navigator.clipboard?.writeText) return;
    void navigator.clipboard.writeText(this.inhalt.adresse.join('\n')).then(() => {
      this.adresseKopiert.set(true);
      window.clearTimeout(this.kopierTimer);
      this.kopierTimer = window.setTimeout(() => this.adresseKopiert.set(false), 2400);
    });
  }

  protected aufnahmeAusDialog(): void {
    /* Zuerst schliessen: solange der Dialog offen ist, ist der Rest der Seite
       inert und der Dateidialog geht oft nicht auf. */
    this.hinweis()?.nativeElement.close();
    this.dateiEingabe()?.nativeElement.click();
  }

  protected hinweisSchliessen(): void {
    this.hinweis()?.nativeElement.close();
  }

  protected hintergrundSchliessen(event: MouseEvent): void {
    if (event.target === this.hinweis()?.nativeElement) {
      this.hinweisSchliessen();
    }
  }

  protected aufnahmeGewaehlt(event: Event): void {
    const eingabe = event.target as HTMLInputElement;
    const datei = eingabe.files?.[0];
    if (!datei) return;

    const video = istVideo(datei);
    const bild = istBild(datei);
    if (!video && !bild) {
      this.aufnahmeFehler.set(this.inhalt.formular.aufnahmeFehlerTyp);
      eingabe.value = '';
      return;
    }

    const grenze = video ? VIDEO_MAX_BYTES : BILD_MAX_BYTES;
    if (datei.size > grenze) {
      this.aufnahmeFehler.set(
        video
          ? this.inhalt.formular.aufnahmeFehlerGroesseVideo
          : this.inhalt.formular.aufnahmeFehlerGroesseFoto,
      );
      eingabe.value = '';
      return;
    }

    this.aufnahmeFreigeben();
    this.aufnahmeVideo.set(video);
    this.aufnahmeVorschau.set(URL.createObjectURL(datei));
    this.aufnahmeFehler.set(null);
    this.freigabePflicht(true);
  }

  protected aufnahmeEntfernen(eingabe?: HTMLInputElement): void {
    this.aufnahmeFreigeben();
    this.aufnahmeVorschau.set(null);
    this.aufnahmeVideo.set(false);
    this.aufnahmeFehler.set(null);
    this.formular.controls.aufnahmeFreigabe.setValue(false);
    this.formular.controls.nameBeiAufnahme.setValue(false);
    this.freigabePflicht(false);
    if (eingabe) eingabe.value = '';
  }

  protected absenden(): void {
    this.versucht.set(true);
    if (this.formular.invalid) {
      this.formular.markAllAsTouched();
      const erstes = this.offeneFehler()[0];
      if (erstes) this.fokussieren(erstes.feld);
      return;
    }
    this.abgeschickt.set(true);
  }

  protected zurueckZumFormular(): void {
    this.abgeschickt.set(false);
  }

  /** Erst nach dem Tastendruck, sonst loest Enter im selben Zug den Dialog-Knopf aus. */
  private hinweisOeffnen(): void {
    window.clearTimeout(this.hinweisTimer);
    this.hinweisTimer = window.setTimeout(() => {
      const dialog = this.hinweis()?.nativeElement;
      if (!dialog || dialog.open) return;
      dialog.showModal();
      dialog.focus();
    });
  }

  private landRegeln(): void {
    const land = this.formular.controls.land;
    land.setValidators(
      this.gegangen
        ? [nichtLeer, Validators.maxLength(80)]
        : [Validators.maxLength(80)],
    );
    land.updateValueAndValidity({ emitEvent: false });
  }

  private freigabePflicht(pflicht: boolean): void {
    const feld = this.formular.controls.aufnahmeFreigabe;
    feld.setValidators(pflicht ? [Validators.requiredTrue] : []);
    feld.updateValueAndValidity({ emitEvent: false });
  }

  private aufnahmeFreigeben(): void {
    const url = this.aufnahmeVorschau();
    if (url) URL.revokeObjectURL(url);
  }
}

function nichtLeer(control: AbstractControl): { required: true } | null {
  return String(control.value ?? '').trim() ? null : { required: true };
}

function istTextart(wert: string): wert is Textart {
  return wert === 'standard' || wert === 'geschichte';
}

function istBild(datei: File): boolean {
  return BILD_TYPEN.includes(datei.type) || /\.(jpe?g|png|webp)$/i.test(datei.name);
}

function istVideo(datei: File): boolean {
  return VIDEO_TYPEN.includes(datei.type) || /\.(mp4|webm|mov)$/i.test(datei.name);
}
