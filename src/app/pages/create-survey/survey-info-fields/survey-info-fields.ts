import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-survey-info-fields',
  imports: [ReactiveFormsModule],
  templateUrl: './survey-info-fields.html',
  styleUrl: './survey-info-fields.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SurveyInfoFields {
  readonly titleControl = input.required<FormControl>();
  readonly descriptionControl = input.required<FormControl>();
  readonly deadlineControl = input.required<FormControl>();
  readonly categoryControl = input.required<FormControl>();
  readonly categories = input.required<readonly string[]>();
}
