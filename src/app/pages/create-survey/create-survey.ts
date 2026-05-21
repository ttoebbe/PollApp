import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SurveyService } from '../../shared/services/survey';
import { SURVEY_CATEGORIES } from '../../shared/interfaces/survey.interface';
import {
  futureDateValidator,
  noWhitespaceValidator,
} from '../../shared/validators/survey.validators';

@Component({
  selector: 'app-create-survey',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './create-survey.html',
  styleUrl: './create-survey.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateSurvey {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly surveyService = inject(SurveyService);

  readonly categories = SURVEY_CATEGORIES;
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

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

  getAnswers(questionIndex: number): FormArray {
    return this.questions.at(questionIndex).get('answers') as FormArray;
  }

  addQuestion(): void {
    this.questions.push(this.buildQuestion());
  }

  removeQuestion(index: number): void {
    if (this.questions.length <= 1) return;
    this.questions.removeAt(index);
  }

  addAnswer(questionIndex: number): void {
    const answers = this.getAnswers(questionIndex);
    if (answers.length >= 8) return;
    answers.push(
      this.fb.control('', [Validators.required, noWhitespaceValidator, Validators.maxLength(60)]),
    );
  }

  removeAnswer(questionIndex: number, answerIndex: number): void {
    const answers = this.getAnswers(questionIndex);
    if (answers.length <= 2) return;
    answers.removeAt(answerIndex);
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    try {
      const v = this.form.value as {
        title: string;
        description: string;
        category: string;
        deadline: string;
        questions: Array<{ label: string; allow_multiple: boolean; answers: string[] }>;
      };

      const survey = await this.surveyService.createSurvey(
        {
          title: v.title.trim(),
          description: v.description?.trim() || null,
          category: v.category,
          deadline: v.deadline ? new Date(v.deadline).toISOString() : null,
          status: 'published',
        },
        v.questions.map((q) => ({
          label: q.label.trim(),
          allow_multiple: q.allow_multiple,
          answers: q.answers.map((a) => a.trim()).filter(Boolean),
        })),
      );
      this.router.navigate(['/survey', survey.survey_number]);
    } catch {
      this.errorMessage.set('Saving failed — please try again.');
    } finally {
      this.isSubmitting.set(false);
    }
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
