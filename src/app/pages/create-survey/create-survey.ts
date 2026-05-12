import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormArray,
  FormControl,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SurveyService } from '../../shared/services/survey';

/** Mindestanzahl ausgefüllter Optionen im FormArray (Custom Validator) */
function minOptionsValidator(min: number) {
  return (control: AbstractControl): ValidationErrors | null => {
    const arr = control as FormArray;
    const filled = arr.controls.filter((c) => c.value?.trim().length > 0);
    return filled.length >= min ? null : { minOptions: { required: min, actual: filled.length } };
  };
}

/** Formular zum Erstellen einer neuen Umfrage */
@Component({
  selector: 'app-create-survey',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './create-survey.html',
  styleUrl: './create-survey.scss',
})
export class CreateSurvey {
  private readonly fb = inject(FormBuilder);
  private readonly surveyService = inject(SurveyService);
  private readonly router = inject(Router);

  /** Zeigt an ob das Formular gerade gespeichert wird */
  readonly isSaving = signal(false);

  readonly form = this.fb.group({
    title: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    description: new FormControl('', { nonNullable: true }),
    deadline: new FormControl('', { nonNullable: true }),
    options: this.fb.array([this.createOptionControl(), this.createOptionControl()], {
      validators: minOptionsValidator(2),
    }),
  });

  /** Getter für einfachen Template-Zugriff auf das FormArray */
  get options(): FormArray {
    return this.form.controls.options;
  }

  /** Fügt ein neues leeres Optionsfeld hinzu */
  addOption(): void {
    this.options.push(this.createOptionControl());
  }

  /** Entfernt ein Optionsfeld (mind. 2 bleiben immer erhalten) */
  removeOption(index: number): void {
    if (this.options.length > 2) {
      this.options.removeAt(index);
    }
  }

  /** Speichert die Umfrage und navigiert zur Detailansicht */
  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const { title, description, deadline } = this.form.getRawValue();
    const labels = this.options.controls
      .map((c) => c.value?.trim())
      .filter((v): v is string => v.length > 0);

    const id = await this.surveyService.createSurvey(
      { title, description: description || null, deadline: deadline || null },
      labels,
    );

    this.isSaving.set(false);
    if (id) {
      await this.router.navigate(['/survey', id]);
    }
  }

  /** Erstellt einen neuen FormControl für eine Antwortoption */
  private createOptionControl(): FormControl<string> {
    return new FormControl('', { nonNullable: true, validators: Validators.required });
  }
}
