import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Abschluss } from '../../sections/abschluss/abschluss';
import { Auswertung } from '../../sections/auswertung/auswertung';
import { Beitraege } from '../../sections/beitraege/beitraege';
import { Atlas } from '../../sections/atlas/atlas';
import { Ausbluten } from '../../sections/ausbluten/ausbluten';
import { Forderungen } from '../../sections/forderungen/forderungen';
import { Hero } from '../../sections/hero/hero';
import { Kapital } from '../../sections/kapital/kapital';
import { Unterstuetzer } from '../../sections/unterstuetzer/unterstuetzer';
import { Wegmarken } from '../../layout/wegmarken/wegmarken';
import { WerGeht } from '../../sections/wer-geht/wer-geht';
import { Zahlen } from '../../sections/zahlen/zahlen';

/**
 * Startseite — das eigentliche Mahnmal.
 *
 * Der Strich rechts oben oeffnet die Kapitel; die ids der Hosts
 * sind ihre Ziele und stehen in KAPITEL (content.ts).
 *
 *   Hero (Ink)        Startseite — Behauptung und Wortmarke
 *   Wer geht (Ink)    Ihre Geschichten
 *   Ausbluten (Ink)   Die Zahlen beginnen mit der Karte
 *   Zahlen (Ink)      Reihe, Qualifikation, Abgabenkeil — haelt das Kapitel
 *   Kapital (Ink)     Leeres Buero, Frage: Und dann?
 *   Forderungen (Ink) Es muss sich etwas aendern
 *   Abschluss (Chalk) Petition — direkt hinter den Forderungen
 *   Auswertung (Chalk) Aufklappbar darunter, Regionen und Gruende
 *   Entwicklungen (Bone) Eigene Saetze mit Quelle, Papier in der Nebenspalte
 *   Unterstuetzer     Logos; der Atlas gehoert dazu
 *   Atlas (Ink)       Zitat und Figur, ganz am Ende vor der Fusszeile
 */
@Component({
  selector: 'app-landing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Wegmarken,
    Hero,
    WerGeht,
    Zahlen,
    Ausbluten,
    Kapital,
    Forderungen,
    Abschluss,
    Auswertung,
    Beitraege,
    Unterstuetzer,
    Atlas,
  ],
  template: `
    <app-wegmarken />

    <app-hero id="auftakt" />
    <app-wer-geht id="wer-geht" />
    <app-ausbluten id="wohin" />
    <app-zahlen id="zahlen" />
    <app-kapital id="und-dann" />
    <app-forderungen id="forderungen" />
    <app-abschluss id="petition" />
    <app-auswertung />
    <app-beitraege id="belege" />
    <app-unterstuetzer id="unterstuetzer" />
    <app-atlas id="atlas" />
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class Landing {}
