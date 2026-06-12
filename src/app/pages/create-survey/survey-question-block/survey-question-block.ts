import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { AbstractControl, FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { getOptionLetter } from '../../../shared/services/survey';

type ErrorRule = readonly [errorKey: string, message: string];

const QUESTION_LABEL_ERRORS: readonly ErrorRule[] = [
  ['required', 'Please enter a question.'],
  ['whitespace', 'Question cannot be whitespace only.'],
];

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

  getLabelError(): string | null {
    const ctrl = this.questionGroup().get('label');
    if (!ctrl) return null;
    return this.firstErrorMessage(ctrl, QUESTION_LABEL_ERRORS);
  }

  private firstErrorMessage(ctrl: AbstractControl, rules: readonly ErrorRule[]): string | null {
    if (!ctrl.touched) return null;
    for (const [key, message] of rules) {
      if (ctrl.hasError(key)) return message;
    }
    return null;
  }
}
