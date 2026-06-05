import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { getOptionLetter } from '../../../shared/services/survey';

@Component({
  selector: 'app-survey-question-block',
  imports: [ReactiveFormsModule],
  templateUrl: './survey-question-block.html',
  styleUrl: './survey-question-block.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SurveyQuestionBlock {
  readonly questionGroup = input.required<FormGroup>();
  readonly questionIndex = input.required<number>();
  readonly canRemove = input.required<boolean>();

  readonly remove = output<void>();
  readonly addAnswer = output<void>();
  readonly removeAnswer = output<number>();

  readonly getOptionLetter = getOptionLetter;

  get answers(): FormArray {
    return this.questionGroup().get('answers') as FormArray;
  }
}
