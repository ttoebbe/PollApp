import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { SurveyService, getOptionLetter } from '../../shared/services/survey';
import { SURVEY_CATEGORIES } from '../../shared/interfaces/survey.interface';
import {
  futureDateValidator,
  noWhitespaceValidator,
} from '../../shared/validators/survey.validators';
import { SurveyInfoFields } from './survey-info-fields/survey-info-fields';
import { SurveyQuestionBlock } from './survey-question-block/survey-question-block';

interface SurveyFormValue {
  title: string;
  description: string;
  category: string;
  deadline: string;
  questions: { label: string; allow_multiple: boolean; answers: string[] }[];
}

interface FormFeedback {
  title: string;
  items: string[];
}

const TITLE_MAX = 100;
const QUESTION_LABEL_MAX = 200;
const ANSWER_MAX = 60;
const SUCCESS_OVERLAY_MS = 1500;

@Component({
  selector: 'app-create-survey',
  imports: [ReactiveFormsModule, RouterLink, SurveyInfoFields, SurveyQuestionBlock],
  templateUrl: './create-survey.html',
  styleUrl: './create-survey.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateSurvey {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly surveyService = inject(SurveyService);

  readonly getOptionLetter = getOptionLetter;
  readonly categories = SURVEY_CATEGORIES;
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<FormFeedback | null>(null);
  readonly showSuccess = signal(false);

  private pendingSurveyNumber: number | null = null;

  readonly form: FormGroup = this.fb.group({
    title: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100),
        noWhitespaceValidator,
      ],
    ],
    description: ['', noWhitespaceValidator],
    category: ['Team activities', Validators.required],
    deadline: ['', futureDateValidator],
    questions: this.fb.array([this.buildQuestion()]),
  });

  get questions(): FormArray {
    return this.form.get('questions') as FormArray;
  }

  get titleControl(): FormControl {
    return this.form.controls['title'] as FormControl;
  }

  get descriptionControl(): FormControl {
    return this.form.controls['description'] as FormControl;
  }

  get deadlineControl(): FormControl {
    return this.form.controls['deadline'] as FormControl;
  }

  get categoryControl(): FormControl {
    return this.form.controls['category'] as FormControl;
  }

  getQuestion(index: number): FormGroup {
    return this.questions.at(index) as FormGroup;
  }

  getAnswers(questionIndex: number): FormArray {
    return this.questions.at(questionIndex).get('answers') as FormArray;
  }

  addQuestion(): void {
    this.questions.push(this.buildQuestion());
  }

  /** Clears a filled label; otherwise removes the question (first question is kept). */
  removeQuestion(index: number): void {
    const label = this.getQuestion(index).get('label') as FormControl;
    if (this.hasValue(label)) {
      this.clearControl(label);
      return;
    }
    if (index === 0) return;
    this.questions.removeAt(index);
  }

  addAnswer(questionIndex: number): void {
    const answers = this.getAnswers(questionIndex);
    if (answers.length >= 8) return;
    answers.push(
      this.fb.control('', [Validators.required, noWhitespaceValidator, Validators.maxLength(60)]),
    );
  }

  /** Clears a filled answer value; otherwise removes it (keeps the minimum of two answers). */
  removeAnswer(questionIndex: number, answerIndex: number): void {
    const answers = this.getAnswers(questionIndex);
    const answer = answers.at(answerIndex);
    if (this.hasValue(answer)) {
      this.clearControl(answer);
      return;
    }
    if (answers.length <= 2) return;
    answers.removeAt(answerIndex);
  }

  /** Returns true when the control holds a non-whitespace string value. */
  private hasValue(control: AbstractControl): boolean {
    const value = control.value;
    return typeof value === 'string' && value.trim().length > 0;
  }

  /** Resets a control to an empty, pristine and untouched state. */
  private clearControl(control: AbstractControl): void {
    control.setValue('');
    control.markAsPristine();
    control.markAsUntouched();
  }

  async submit(): Promise<void> {
    if (this.isSubmitting()) return;
    if (this.form.invalid) {
      this.handleInvalidSubmit();
      return;
    }
    await this.performSubmit();
  }

  private handleInvalidSubmit(): void {
    this.form.markAllAsTouched();
    this.errorMessage.set({
      title: 'Please fix the following before publishing:',
      items: this.collectValidationErrors(),
    });
  }

  private async performSubmit(): Promise<void> {
    this.resetFeedback();
    this.isSubmitting.set(true);
    try {
      await this.createAndNavigate();
    } catch (err) {
      this.errorMessage.set({
        title: 'Could not publish survey.',
        items: [this.extractServerErrorMessage(err)],
      });
    } finally {
      this.isSubmitting.set(false);
    }
  }

  /** Clears all transient feedback signals before a new submit. */
  private resetFeedback(): void {
    this.errorMessage.set(null);
    this.showSuccess.set(false);
  }

  private async createAndNavigate(): Promise<void> {
    const survey = await this.surveyService.createSurvey(
      this.buildSurveyInput(),
      this.buildQuestionInputs(),
    );
    this.pendingSurveyNumber = survey.survey_number;
    this.showSuccess.set(true);
    await this.delay(SUCCESS_OVERLAY_MS);
    this.navigateToPendingSurvey();
  }

  /** Closes the success overlay and navigates immediately. */
  dismissSuccess(): void {
    this.navigateToPendingSurvey();
  }

  /** Resolves after the given milliseconds. */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** Navigates to the pending survey detail page if still pending. */
  private navigateToPendingSurvey(): void {
    if (this.pendingSurveyNumber === null) return;
    const nr = this.pendingSurveyNumber;
    this.pendingSurveyNumber = null;
    this.showSuccess.set(false);
    this.router.navigate(['/survey', nr]);
  }

  private get formValue(): SurveyFormValue {
    return this.form.value as SurveyFormValue;
  }

  private collectValidationErrors(): string[] {
    const items: string[] = [];
    this.collectInfoFieldErrors(items);
    for (let qi = 0; qi < this.questions.length; qi++) {
      this.collectQuestionErrors(items, qi);
      this.collectAnswerErrors(items, qi);
    }
    return items;
  }

  private collectInfoFieldErrors(items: string[]): void {
    this.appendErrors(items, 'Title', this.titleControl.errors, TITLE_MAX);
    this.appendErrors(items, 'Description', this.descriptionControl.errors);
    this.appendErrors(items, 'Category', this.categoryControl.errors);
    this.appendErrors(items, 'Deadline', this.deadlineControl.errors);
  }

  private collectQuestionErrors(items: string[], qi: number): void {
    const label = this.getQuestion(qi).get('label') as FormControl;
    this.appendErrors(items, `Question ${qi + 1}: label`, label.errors, QUESTION_LABEL_MAX);
  }

  private collectAnswerErrors(items: string[], qi: number): void {
    const answers = this.getAnswers(qi);
    for (let ai = 0; ai < answers.length; ai++) {
      const ctrl = answers.at(ai);
      const letter = String.fromCharCode(65 + ai);
      const prefix = `Question ${qi + 1}, answer ${letter}: text`;
      this.appendErrors(items, prefix, ctrl.errors, ANSWER_MAX);
    }
  }

  private appendErrors(
    items: string[],
    label: string,
    errors: ValidationErrors | null,
    maxLen?: number,
  ): void {
    if (!errors) return;
    if (errors['required']) items.push(`${label} is required.`);
    if (errors['whitespace']) items.push(`${label} cannot be only whitespace.`);
    if (errors['pastDate']) items.push(`${label} must be in the future.`);
    this.appendLengthErrors(items, label, errors, maxLen);
  }

  private appendLengthErrors(
    items: string[],
    label: string,
    errors: ValidationErrors,
    maxLen?: number,
  ): void {
    const min = errors['minlength']?.requiredLength;
    if (min) items.push(`${label} must be at least ${min} characters long.`);
    if (errors['maxlength'] && maxLen)
      items.push(`${label} is too long (max ${maxLen} characters).`);
  }

  private extractServerErrorMessage(err: unknown): string {
    if (err instanceof Error) {
      const msg = err.message;
      if (/fetch|network|offline/i.test(msg)) {
        return 'Network error — please check your connection.';
      }
      return msg || 'An unexpected error occurred.';
    }
    return 'An unexpected error occurred. Please try again.';
  }

  private buildSurveyInput() {
    const v = this.formValue;
    return {
      title: v.title.trim(),
      description: v.description?.trim() || null,
      category: v.category,
      deadline: v.deadline
        ? new Date(v.deadline).toISOString()
        : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: 'published' as const,
    };
  }

  private buildQuestionInputs() {
    return this.formValue.questions.map((q) => ({
      label: q.label.trim(),
      allow_multiple: q.allow_multiple,
      answers: q.answers.map((a) => a.trim()).filter(Boolean),
    }));
  }

  private buildQuestion(): FormGroup {
    return this.fb.group({
      label: ['', [Validators.required, noWhitespaceValidator, Validators.maxLength(200)]],
      allow_multiple: [false],
      answers: this.fb.array([
        this.fb.control('', [Validators.required, noWhitespaceValidator, Validators.maxLength(60)]),
        this.fb.control('', [Validators.required, noWhitespaceValidator, Validators.maxLength(60)]),
      ]),
    });
  }
}
