import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SurveyModel } from '../../models/survey.model';

@Component({
  selector: 'app-urgent-surveys',
  imports: [RouterLink],
  templateUrl: './urgent-surveys.html',
  styleUrl: './urgent-surveys.scss',
})
export class UrgentSurveys {
  readonly surveys = input.required<SurveyModel[]>();
}
