import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SurveyService } from '../../shared/services/survey';
import { SURVEY_CATEGORIES } from '../../shared/interfaces/survey.interface';

@Component({
  selector: 'app-create-survey',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './create-survey.html',
  styleUrl: './create-survey.scss',
})
export class CreateSurvey {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly surveyService = inject(SurveyService);

  readonly categories = SURVEY_CATEGORIES;
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    category: ['Team activities', Validators.required],
    deadline: [this.defaultDeadlineLocal(), Validators.required],
    options: this.fb.array([
      this.fb.control('', Validators.required),
      this.fb.control('', Validators.required),
    ]),
  });

  get options(): FormArray {
    return this.form.get('options') as FormArray;
  }

  addOption(): void {
    if (this.options.length >= 8) return;
    this.options.push(this.fb.control('', Validators.required));
  }

  removeOption(index: number): void {
    if (this.options.length <= 2) return;
    this.options.removeAt(index);
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    try {
      const formValues = this.form.value as {
        title: string;
        description: string;
        category: string;
        deadline: string;
        options: string[];
      };
      const labels = formValues.options.map((label) => label.trim()).filter(Boolean);
      const survey = await this.surveyService.createSurvey(
        {
          title: formValues.title.trim(),
          description: formValues.description?.trim() || null,
          category: formValues.category,
          deadline: new Date(formValues.deadline).toISOString(),
        },
        labels,
      );
      this.router.navigate(['/survey', survey.survey_number]);
    } catch {
      this.errorMessage.set('Saving failed — please try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private defaultDeadlineLocal(): string {
    const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const padWithZero = (value: number) => String(value).padStart(2, '0');
    return `${deadline.getFullYear()}-${padWithZero(deadline.getMonth() + 1)}-${padWithZero(deadline.getDate())}T${padWithZero(deadline.getHours())}:${padWithZero(deadline.getMinutes())}`;
  }
}
