import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormClearButton } from '../form-clear-button/form-clear-button';

type ErrorRule = readonly [errorKey: string, message: string];

const TITLE_ERRORS: readonly ErrorRule[] = [
  ['required', 'Please enter a title.'],
  ['minlength', 'At least 3 characters required.'],
  ['maxlength', 'Title must not exceed 100 characters.'],
  ['whitespace', 'Title cannot be whitespace only.'],
];

const DESCRIPTION_ERRORS: readonly ErrorRule[] = [
  ['whitespace', 'Description cannot be whitespace only.'],
];

const DEADLINE_ERRORS: readonly ErrorRule[] = [['pastDate', 'Deadline must be in the future.']];

@Component({
  selector: 'app-survey-info-fields',
  imports: [ReactiveFormsModule, FormClearButton],
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

  readonly todayIso = this.getTodayIso();

  private getTodayIso(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  getTitleError(ctrl: FormControl): string | null {
    return this.firstErrorMessage(ctrl, TITLE_ERRORS);
  }

  getDescriptionError(ctrl: FormControl): string | null {
    return this.firstErrorMessage(ctrl, DESCRIPTION_ERRORS);
  }

  getDeadlineError(ctrl: FormControl): string | null {
    return this.firstErrorMessage(ctrl, DEADLINE_ERRORS);
  }

  private firstErrorMessage(ctrl: FormControl, rules: readonly ErrorRule[]): string | null {
    if (!ctrl.touched) return null;
    for (const [key, message] of rules) {
      if (ctrl.hasError(key)) return message;
    }
    return null;
  }
}
