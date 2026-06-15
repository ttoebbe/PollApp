import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Survey } from '../../../shared/interfaces/survey.interface';

@Component({
  selector: 'app-survey-detail-header',
  imports: [RouterLink],
  templateUrl: './survey-detail-header.html',
  styleUrl: './survey-detail-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SurveyDetailHeader {
  readonly survey = input.required<Survey>();
  readonly endsOnLabel = input.required<string>();
}
