import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ABSCHLUSS } from '../../core/content';

/**
 * Der Aufruf zur Petition, direkt hinter den Forderungen. Der harte
 * Flaechenwechsel nach dem langen dunklen Block setzt ihn frei.
 */
@Component({
  selector: 'app-abschluss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section id="abschluss" class="ab surface-chalk inset" aria-labelledby="ab-titel">
      <h2 id="ab-titel" class="ab__titel">
        <span class="ab__zeile">
          <span class="t-italic">{{ inhalt.zeile1Kursiv }}</span>
          {{ inhalt.zeile1Rest }}
        </span>
        <span class="ab__zeile">{{ inhalt.zeile2 }}</span>
      </h2>

      <p class="ab__text">{{ inhalt.text }}</p>

      <a class="pill" [routerLink]="inhalt.cta.pfad">{{ inhalt.cta.label }}</a>
    </section>
  `,
  styles: `
    @use 'mixins' as *;

    .ab {
      padding-block: var(--spacing-96) var(--spacing-40);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-32);
      text-align: center;
    }

    .ab__titel {
      @include serif-section;
      margin: 0;
      color: var(--color-ink);
      display: flex;
      flex-direction: column;
    }

    .ab__zeile {
      display: block;
    }

    .ab__text {
      @include grotesk-body;
      max-width: 52ch;
      color: var(--color-graphite);
    }

    @include tablet {
      .ab {
        padding-block: var(--spacing-60);
      }
    }
  `,
})
export class Abschluss {
  protected readonly inhalt = ABSCHLUSS;
}
