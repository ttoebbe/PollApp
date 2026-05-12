import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { SurveyModel } from '../../models/survey.model';

/** Zeigt dringende Umfragen (enden in 48h) chronologisch sortiert */
@Component({
  selector: 'app-urgent-surveys',
  imports: [RouterLink, DatePipe],
  templateUrl: './urgent-surveys.html',
  styleUrl: './urgent-surveys.scss',
})
export class UrgentSurveys {
  /** Liste der dringenden Umfragen — bereits nach Deadline sortiert */
  readonly surveys = input.required<SurveyModel[]>();
}
