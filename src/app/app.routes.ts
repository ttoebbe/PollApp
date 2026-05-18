import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { SurveyDetail } from './pages/survey-detail/survey-detail';
import { CreateSurvey } from './pages/create-survey/create-survey';
import { Imprint } from './pages/imprint/imprint';

/** Alle Routen der Anwendung — eager loaded, kein LazyLoading für diesen Kurs */
export const routes: Routes = [
  { path: '', component: Home },
  { path: 'survey/:number', component: SurveyDetail },
  { path: 'create', component: CreateSurvey },
  { path: 'imprint', component: Imprint },
  { path: '**', redirectTo: '' },
];
