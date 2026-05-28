import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Survey } from '../../../shared/interfaces/survey.interface';
import { SurveyCard } from '../../../shared/components/survey-card/survey-card';

@Component({
  selector: 'app-survey-list',
  imports: [SurveyCard, RouterLink],
  templateUrl: './survey-list.html',
  styleUrl: './survey-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SurveyList {
  readonly surveys = input.required<Survey[]>();
  readonly isLoading = input.required<boolean>();
  readonly loadError = input<string | null>(null);
  readonly isPast = input.required<boolean>();
  readonly activeTab = input.required<'active' | 'past'>();
}
