import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { SurveyModel } from '../../models/survey.model';

/** Karte für eine einzelne Umfrage in der Listenansicht */
@Component({
  selector: 'app-survey-card',
  imports: [RouterLink, DatePipe],
  templateUrl: './survey-card.html',
  styleUrl: './survey-card.scss',
})
export class SurveyCard {
  /** Die anzuzeigende Umfrage */
  readonly survey = input.required<SurveyModel>();

  /** true wenn die Umfrage abgelaufen ist (Tab "Past") */
  readonly isPast = input<boolean>(false);
}
