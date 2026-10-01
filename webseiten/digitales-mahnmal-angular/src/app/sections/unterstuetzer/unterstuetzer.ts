import { ChangeDetectionStrategy, Component } from '@angular/core';

import { UNTERSTUETZER } from '../../core/content';

/**
 * Unterstuetzer-Reihe.
 *
 * Oben Organisationen, darunter Personen. Beides bleibt leer, bis eine
 * schriftliche Zusage vorliegt — angebliche Unterstuetzer waeren rechtlich
 * angreifbar und wuerden der Kampagne mehr schaden als eine kurze Liste.
 * Namen aus der Petition gehoeren erst hierher, wenn das Haekchen gesetzt
 * und die Unterschrift bestaetigt ist.
 */
@Component({
  selector: 'app-unterstuetzer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="us surface-chalk inset" aria-labelledby="us-titel">
      <h2 id="us-titel" class="us__label t-micro">{{ inhalt.label }}</h2>

      <ul class="us__reihe">
        @for (logo of inhalt.logos; track logo.pfad) {
          <li class="us__slot">
            <a
              class="us__link"
              [href]="logo.url"
              [attr.aria-label]="logo.name + ', öffnet in neuem Tab'"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img class="us__logo" [src]="logo.pfad" alt="" loading="lazy" decoding="async" />
            </a>
          </li>
        }
        <!-- Noch freie Plaetze, bewusst als leere Rahmen gezeichnet und
             nicht als Fantasielogos. -->
        @for (i of freieSlots; track i) {
          <li class="us__slot">
            <span class="us__strich" aria-hidden="true"></span>
          </li>
        }
      </ul>

      <h3 class="us__zwischen t-micro">{{ inhalt.personenLabel }}</h3>

      <ul class="us__personen">
        @for (person of inhalt.personen; track person.name) {
          <li class="us__person">
            @if (person.bild) {
              <img
                class="us__bild"
                [src]="person.bild"
                alt=""
                width="64"
                height="64"
                loading="lazy"
                decoding="async"
              />
            } @else {
              <span class="us__kreis us__kreis--name" aria-hidden="true">{{ kuerzel(person.name) }}</span>
            }
            <p class="us__name">{{ person.name }}</p>
            @if (person.rolle) {
              <p class="us__rolle t-micro">{{ person.rolle }}</p>
            }
          </li>
        }
        @for (i of freiePersonen; track i) {
          <li class="us__person">
            <span class="us__kreis" aria-hidden="true">
              <svg viewBox="0 0 64 64" focusable="false">
                <circle cx="32" cy="22" r="9" fill="none" stroke="currentColor" stroke-width="1.25" />
                <path
                  d="M14 58c2.2-16 8-24 18-24s15.8 8 18 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.25"
                />
              </svg>
            </span>
            <span class="us__name-strich" aria-hidden="true"></span>
            <span class="sr-only">Platzhalter für eine Persönlichkeit</span>
          </li>
        }
      </ul>

      <p class="us__hinweis t-micro">{{ inhalt.hinweis }}</p>
    </section>
  `,
  styles: `
    @use 'mixins' as *;

    :host {
      display: block;
    }

    .us {
      padding-block: var(--spacing-60) var(--spacing-96);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-32);
      text-align: center;
    }

    .us__label {
      margin: 0;
      color: var(--color-graphite);
      letter-spacing: 0.18em;
    }

    .us__reihe {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      gap: var(--spacing-40);
      margin: 0;
    }

    .us__slot {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 120px;
      height: 64px;
    }

    .us__link {
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
      color: inherit;

      &:hover .us__logo {
        opacity: 1;
      }
    }

    /* Logos laufen einfarbig dunkel mit — die Reihe sitzt auf Chalk,
       vor der Fusszeile, nicht mehr im Ink-Block. */
    .us__logo {
      max-height: 56px;
      max-width: 140px;
      width: auto;
      object-fit: contain;
      filter: grayscale(1) brightness(0);
      opacity: 0.72;
    }

    /* Bewusst als leerer Platz gezeichnet, nicht als Fantasielogo. */
    .us__strich {
      display: block;
      width: 96px;
      height: 22px;
      border: 1px dashed rgba(0, 0, 0, 0.22);
      border-radius: var(--radius-links);
    }

    .us__zwischen {
      margin: 0;
      color: var(--color-ash);
      letter-spacing: 0.18em;
    }

    .us__personen {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: var(--spacing-28) var(--spacing-32);
      margin: 0;
      padding: 0;
      list-style: none;
      max-width: 720px;
    }

    .us__person {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      width: 92px;
    }

    .us__bild {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      object-fit: cover;
      filter: grayscale(1);
    }

    .us__kreis {
      display: grid;
      place-items: center;
      width: 64px;
      height: 64px;
      border-radius: 50%;
      border: 1px dashed rgba(0, 0, 0, 0.22);
      color: var(--color-graphite);

      svg {
        width: 36px;
        height: 36px;
      }
    }

    .us__kreis--name {
      border-style: solid;
      border-color: var(--color-vellum);
      color: var(--color-ink);
      @include grotesk-label;
      letter-spacing: 0.08em;
    }

    .us__name {
      margin: 0;
      @include grotesk-label;
      color: var(--color-ink);
      text-align: center;
      line-height: 1.35;
    }

    .us__rolle {
      margin: 0;
      color: var(--color-graphite);
      letter-spacing: 0.08em;
      text-align: center;
    }

    .us__name-strich {
      display: block;
      width: 72px;
      height: 8px;
      border-bottom: 1px dashed rgba(0, 0, 0, 0.22);
    }

    .us__hinweis {
      color: var(--color-graphite);
      letter-spacing: 0.06em;
      max-width: 48ch;
    }

    @include mobile {
      .us__reihe {
        gap: var(--spacing-20);
      }

      .us__personen {
        gap: var(--spacing-20);
      }
    }
  `,
})
export class Unterstuetzer {
  protected readonly inhalt = UNTERSTUETZER;
  /** Indizes der noch freien Logo-Plätze, nur zum Zeichnen der leeren Rahmen. */
  protected readonly freieSlots = Array.from(
    { length: UNTERSTUETZER.freieSlots },
    (_, i) => i,
  );
  /** Leere Porträtrahmen, nachdem die eingetragenen Personen abgezogen sind. */
  protected readonly freiePersonen = Array.from(
    {
      length: Math.max(0, UNTERSTUETZER.personenPlaetze - UNTERSTUETZER.personen.length),
    },
    (_, i) => i,
  );

  /** Zwei Initialen, wenn ein Name ohne Porträt eingetragen ist. */
  protected kuerzel(name: string): string {
    return name
      .split(/\s+/)
      .filter((teil) => teil.length > 0)
      .slice(0, 2)
      .map((teil) => teil[0]?.toLocaleUpperCase('de') ?? '')
      .join('');
  }
}
