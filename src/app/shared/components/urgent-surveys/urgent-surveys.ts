import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SurveyModel } from '../../models/survey.model';

/**
 * "Ending soon"-Highlight-Karte (US1).
 * Helle Karte mit asymmetrischem Radius (0/80/0/0) und großem Survey-Titel.
 */
@Component({
  selector: 'app-urgent-surveys',
  imports: [RouterLink],
  templateUrl: './urgent-surveys.html',
  styleUrl: './urgent-surveys.scss',
})
export class UrgentSurveys {
  readonly surveys = input.required<SurveyModel[]>();
}
