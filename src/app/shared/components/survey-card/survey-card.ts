import { Component, input, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';
import { SurveyModel } from '../../models/survey.model';

@Component({
  selector: 'app-survey-card',
  imports: [RouterLink, NgTemplateOutlet],
  templateUrl: './survey-card.html',
  styleUrl: './survey-card.scss',
})
export class SurveyCard {
  readonly survey = input.required<SurveyModel>();
  readonly isPast = input(false);

  readonly endsLabel = computed(() => this.survey().endsInLabel());
  readonly category = computed(() => this.survey().category ?? 'General');
}
