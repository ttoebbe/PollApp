import { Routes } from '@angular/router';
// Lädt den Routes-Typ aus Angular, der ein Array von Routen-Objekten beschreibt.

import { Home } from './pages/home/home';
// Lädt die Home-Komponente, die auf der Startseite angezeigt wird.

import { SurveyDetail } from './pages/survey-detail/survey-detail';
// Lädt die SurveyDetail-Komponente für die Detailansicht einer einzelnen Umfrage.

import { CreateSurvey } from './pages/create-survey/create-survey';
// Lädt die CreateSurvey-Komponente für das Formular zum Erstellen einer neuen Umfrage.

import { Imprint } from './pages/imprint/imprint';
// Lädt die Imprint-Komponente für die Impressumsseite.

export const routes: Routes = [
  // Definiert und exportiert das Routen-Array, das Angular für die Navigation der gesamten App verwendet.

  { path: '', component: Home },
  // Leere URL (Startseite) → zeigt die Home-Komponente an.

  { path: 'survey/:number', component: SurveyDetail },
  // URL mit /survey/<zahl> → zeigt die SurveyDetail-Komponente an; :number ist ein dynamischer Parameter.

  { path: 'create', component: CreateSurvey },
  // URL /create → zeigt die CreateSurvey-Komponente an.

  { path: 'imprint', component: Imprint },
  // URL /imprint → zeigt die Imprint-Komponente an.

  { path: '**', redirectTo: '' },
  // Jede unbekannte URL (Wildcard **) leitet automatisch zur Startseite weiter.
];
