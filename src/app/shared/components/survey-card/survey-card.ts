import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Survey } from '../../interfaces/survey.interface';
import { getSurveyEndsInLabel } from '../../services/survey';

@Component({
  selector: 'app-survey-card',
  imports: [RouterLink],
  templateUrl: './survey-card.html',
  styleUrl: './survey-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SurveyCard {
  readonly survey = input.required<Survey>();
  readonly isPast = input(false);

  readonly endsLabel = computed(() => getSurveyEndsInLabel(this.survey()));
  readonly category = computed(() => this.survey().category ?? 'General');
}
