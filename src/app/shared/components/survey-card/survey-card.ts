import { Component, input, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SurveyModel } from '../../models/survey.model';

/**
 * Listen-Eintrag einer Umfrage auf dem Homescreen (Active/Past Tab).
 * Dunkles, halb-transparentes Card-Layout mit asymmetrischem Radius (5/50/5/5).
 * Past-Surveys werden als <article> (nicht klickbar) gerendert.
 */
@Component({
  selector: 'app-survey-card',
  imports: [RouterLink],
  templateUrl: './survey-card.html',
  styleUrl: './survey-card.scss',
})
export class SurveyCard {
  readonly survey = input.required<SurveyModel>();
  readonly isPast = input(false);

  readonly endsLabel = computed(() => this.survey().endsInLabel());
  readonly category = computed(() => this.survey().category ?? 'General');
}
