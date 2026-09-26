import { Routes } from '@angular/router';

import { Landing } from './pages/landing/landing';

export const routes: Routes = [
  {
    /* Die Startseite kommt fest ins erste Bundle: sie ist der Einstieg, ein
       Nachladen wuerde den Hero nur verzoegern. Die uebrigen Seiten bleiben
       lazy. */
    path: '',
    title: 'Deutschland flieht. — Ein digitales Mahnmal',
    component: Landing,
  },
  {
    path: 'petition',
    title: 'Petition unterschreiben — Deutschland flieht.',
    loadComponent: () => import('./pages/petition/petition-page').then((m) => m.PetitionPage),
  },
  {
    path: 'entwicklungen',
    title: 'Aktuelle Entwicklungen und Daten — Deutschland flieht.',
    loadComponent: () =>
      import('./pages/entwicklungen/entwicklungen-page').then((m) => m.EntwicklungenPage),
  },
  {
    /* Impressum und Datenschutz sind vor dem Livegang Pflicht.
       Bis dahin fuehren die Footer-Links auf eine ehrliche Platzhalterseite,
       statt ins Leere zu laufen. */
    path: 'impressum',
    title: 'Impressum — Deutschland flieht.',
    loadComponent: () => import('./pages/rechtstext/rechtstext').then((m) => m.Rechtstext),
    data: { art: 'impressum' },
  },
  {
    path: 'datenschutz',
    title: 'Datenschutz — Deutschland flieht.',
    loadComponent: () => import('./pages/rechtstext/rechtstext').then((m) => m.Rechtstext),
    data: { art: 'datenschutz' },
  },
  { path: '**', redirectTo: '' },
];
