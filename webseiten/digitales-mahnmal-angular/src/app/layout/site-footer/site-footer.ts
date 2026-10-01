import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ABGABEN_VERGLEICH, FOOTER, MARKE, WANDERUNG, ZAHLEN_GEPRUEFT } from '../../core/content';

/**
 * Fusszeile auf Chalk — der hellsten Flaeche des Systems, die den
 * Seitenabschluss markiert.
 */
@Component({
  selector: 'app-site-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './site-footer.html',
  styleUrl: './site-footer.scss',
})
export class SiteFooter {
  protected readonly footer = FOOTER;
  protected readonly marke = MARKE;
  protected readonly wanderung = WANDERUNG;
  protected readonly vergleich = ABGABEN_VERGLEICH;
  /** Solange Kennzahlen ungeprueft sind, weist die Seite selbst darauf hin. */
  protected readonly zahlenGeprueft = ZAHLEN_GEPRUEFT;
  protected readonly jahr = new Date().getFullYear();
}
