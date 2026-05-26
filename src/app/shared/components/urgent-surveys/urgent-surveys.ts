import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Survey } from '../../interfaces/survey.interface';
import { getSurveyEndsInLabel } from '../../services/survey';

@Component({
  selector: 'app-urgent-surveys',
  imports: [RouterLink],
  templateUrl: './urgent-surveys.html',
  styleUrl: './urgent-surveys.scss',
})
export class UrgentSurveys {
  readonly surveys = input.required<Survey[]>();

  endsInLabel(survey: Survey): string {
    return getSurveyEndsInLabel(survey);
  }
}
