import { ChangeDetectionStrategy, Component } from '@angular/core';

import { MANIFEST } from '../../core/content';

/**
 * Dunkle Display-Headline zwischen Bildsequenz und Fahne.
 * Dreizeilig, die mittlere Zeile kursiv und ueberlappend gesetzt — das
 * wiederkehrende Satzbild der Vorlage.
 */
@Component({
  selector: 'app-manifest',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mf surface-ink inset">
      <h2 class="mf__titel">
        <span class="mf__zeile mf__zeile--gross">{{ inhalt.zeile1 }}</span>
        <span class="mf__zeile mf__zeile--kursiv t-italic">{{ inhalt.zeile2Kursiv }}</span>
        <span class="mf__zeile mf__zeile--gross">{{ inhalt.zeile3 }}</span>
      </h2>
      <p class="mf__unterzeile t-micro">{{ inhalt.unterzeile }}</p>
    </section>
  `,
  styles: `
    @use 'mixins' as *;

    .mf {
      padding-block: var(--spacing-168) var(--spacing-96);
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-32);
    }

    .mf__titel {
      margin: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      font-family: var(--font-davinci);
      color: var(--color-paper);
      line-height: 0.84;
    }

    .mf__zeile {
      display: block;
    }

    .mf__zeile--gross {
      @include serif-section;
      line-height: inherit;
    }

    /* Die kursive Zeile ist groesser und rueckt in die Nachbarzeilen hinein —
       dadurch verschraenken sich die drei Zeilen zu einem Block. */
    .mf__zeile--kursiv {
      @include serif-monument;
      line-height: inherit;
      /* Verschraenkt die Zeilen, ohne dass die Unterlaenge des g in die
         Folgezeile schneidet — oben darf es enger sein als unten. */
      margin-top: -0.14em;
      margin-bottom: -0.02em;
    }

    .mf__unterzeile {
      max-width: 52ch;
      color: rgba(255, 255, 255, 0.6);
      letter-spacing: 0.08em;
      line-height: 1.6;
    }

    @include tablet {
      .mf {
        padding-block: var(--spacing-96) var(--spacing-60);
      }
    }
  `,
})
export class Manifest {
  protected readonly inhalt = MANIFEST;
}
