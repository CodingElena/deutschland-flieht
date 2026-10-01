import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { DATENSCHUTZ, FOOTER, IMPRESSUM, RECHTSTEXT_WARNUNG } from '../../core/content';

/**
 * Impressum und Datenschutzerklaerung.
 *
 * Beide Texte stehen als vollstaendiges Geruest in content.ts: alle
 * Abschnitte, die eine Kampagne mit Unterschriftensammlung braucht, mit den
 * einschlaegigen Rechtsgrundlagen. Was fehlt, sind die konkreten Angaben —
 * Name, Anschrift, Hoster, Fristen. Sie stehen in eckigen Klammern und
 * muessen von der verantwortlichen Person eingetragen werden.
 *
 * Der Warnhinweis oben bleibt so lange stehen, wie eckige Klammern im Text
 * vorkommen. Das ist bewusst nicht abschaltbar: ein Impressum mit
 * Platzhaltern ist schlimmer als gar keines, weil es fertig aussieht.
 */
@Component({
  selector: 'app-rechtstext',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rt surface-bone inset" aria-labelledby="rt-titel">
      <header class="rt__kopf">
        <h1 id="rt-titel" class="rt__titel">{{ text().titel }}</h1>
        <p class="rt__einleitung">{{ text().einleitung }}</p>
      </header>

      @if (unfertig()) {
        <p class="rt__warnung" role="note">{{ warnung }}</p>
      }

      <div class="rt__abschnitte">
        @for (a of text().abschnitte; track a.titel) {
          <section class="rt__abschnitt">
            <h2 class="rt__abschnitt-titel">{{ a.titel }}</h2>
            @for (absatz of a.absaetze; track absatz) {
              <p class="rt__text">{{ absatz }}</p>
            }
            @if (a.titel === 'Bildnachweis') {
              <ul class="rt__nachweise">
                @for (n of bildnachweis; track n.urheber + n.werk) {
                  <li class="rt__text">
                    @if (n.quelle) {
                      „<a [href]="n.quelle">{{ n.werk }}</a>“
                    } @else {
                      „{{ n.werk }}“
                    }
                    — {{ n.urheber }},
                    @if (n.lizenzUrl) {
                      <a [href]="n.lizenzUrl" rel="license">{{ n.lizenz }}</a>
                    } @else {
                      {{ n.lizenz }}
                    }
                    @if (n.bearbeitung) {
                      ({{ n.bearbeitung }})
                    }
                  </li>
                }
              </ul>
            }
          </section>
        }
      </div>
    </section>
  `,
  styles: `
    @use 'mixins' as *;

    .rt {
      min-height: 70svh;
      padding-block: var(--spacing-168) var(--spacing-96);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-40);
    }

    .rt__kopf {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-16);
    }

    .rt__titel {
      @include serif-section;
      margin: 0;
    }

    .rt__einleitung {
      @include grotesk-body;
      max-width: 62ch;
      color: var(--color-graphite);
      margin: 0;
    }

    /* Deutlich als Entwurf markiert — eine Linie links, kein Warnrot:
       das System kennt keine gesaettigten Farben. */
    .rt__warnung {
      @include grotesk-label;
      max-width: 62ch;
      margin: 0;
      padding: 12px 16px;
      border: 1px solid var(--color-ink);
      border-left-width: 3px;
      border-radius: var(--radius-links);
      line-height: 1.6;
    }

    .rt__abschnitte {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-40);
      max-width: 68ch;
    }

    .rt__abschnitt {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-16);
      padding-top: var(--spacing-20);
      border-top: 1px solid var(--color-vellum);
    }

    .rt__abschnitt-titel {
      @include grotesk-stat;
      margin: 0;
    }

    .rt__text {
      @include grotesk-body;
      color: var(--color-graphite);
      margin: 0;
      /* Anschriften stehen mehrzeilig im Inhalt; die Umbrueche gehoeren zum
         Text und duerfen nicht zusammenfallen. */
      white-space: pre-line;

      a {
        color: inherit;
        text-decoration: underline;
        text-underline-offset: 2px;
      }
    }

    .rt__nachweise {
      margin: 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-16);
    }

    @include tablet {
      .rt {
        padding-block: var(--spacing-96) var(--spacing-60);
      }
    }
  `,
})
export class Rechtstext {
  private readonly route = inject(ActivatedRoute);
  private readonly daten = toSignal(this.route.data, { initialValue: {} as { art?: string } });

  protected readonly warnung = RECHTSTEXT_WARNUNG;
  protected readonly bildnachweis = FOOTER.bildnachweisListe;

  protected readonly istImpressum = computed(() => this.daten().art === 'impressum');

  protected readonly text = computed(() =>
    this.istImpressum() ? IMPRESSUM : DATENSCHUTZ,
  );

  /** Solange eckige Klammern im Text stehen, ist er ein Entwurf. */
  protected readonly unfertig = computed(() =>
    this.text().abschnitte.some((a) => a.absaetze.some((p) => p.includes('['))),
  );
}
