import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SurveyService } from '../../shared/services/survey';
import { SurveyModel } from '../../shared/models/survey.model';
import { QuestionModel } from '../../shared/models/question.model';
import { OptionModel } from '../../shared/models/option.model';
import { VoteOptions } from '../../shared/components/vote-options/vote-options';
import { ResultsBar } from '../../shared/components/results-bar/results-bar';

interface QuestionRow {
  question: QuestionModel;
  options: OptionModel[];
}

@Component({
  selector: 'app-survey-detail',
  imports: [VoteOptions, ResultsBar, RouterLink],
  templateUrl: './survey-detail.html',
  styleUrl: './survey-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SurveyDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly surveyService = inject(SurveyService);

  readonly survey = signal<SurveyModel | null>(null);
  readonly questions = signal<QuestionModel[]>([]);
  readonly hasCompleted = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly selections = signal<Map<string, string[]>>(new Map());

  readonly questionRows = computed<QuestionRow[]>(() => {
    const allOptions = this.surveyService.options();
    return this.questions().map((q) => ({
      question: q,
      options: allOptions.filter((o) => o.question_id === q.id),
    }));
  });

  readonly allAnswered = computed(() => {
    const rows = this.questionRows();
    return (
      rows.length > 0 && rows.every((r) => (this.selections().get(r.question.id) ?? []).length > 0)
    );
  });

  async ngOnInit(): Promise<void> {
    const raw = this.route.snapshot.paramMap.get('number');
    const surveyNumber = raw ? parseInt(raw, 10) : NaN;
    if (isNaN(surveyNumber)) {
      this.router.navigate(['/']);
      return;
    }
    try {
      const survey = await this.surveyService.loadSurveyWithOptions(surveyNumber);
      if (!survey) {
        this.errorMessage.set('Survey not found.');
        return;
      }
      this.survey.set(survey);
      this.questions.set(this.surveyService.questions().filter((q) => q.survey_id === survey.id));
      this.hasCompleted.set(localStorage.getItem(`pollapp:completed:${survey.id}`) === '1');
    } catch {
      this.errorMessage.set('Survey not found.');
    }
  }

  onSelectionChange(questionId: string, ids: string[]): void {
    this.selections.update((map) => {
      const next = new Map(map);
      next.set(questionId, ids);
      return next;
    });
  }

  previewIds(questionId: string): string[] {
    return this.selections().get(questionId) ?? [];
  }

  async completeSurvey(): Promise<void> {
    const currentSurvey = this.survey();
    if (!currentSurvey || this.hasCompleted() || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    try {
      const votePromises: Promise<void>[] = [];
      for (const optionIds of this.selections().values()) {
        for (const optionId of optionIds) {
          votePromises.push(this.surveyService.vote(optionId));
        }
      }
      await Promise.all(votePromises);
      localStorage.setItem(`pollapp:completed:${currentSurvey.id}`, '1');
      this.hasCompleted.set(true);
      this.selections.set(new Map());
    } catch {
      this.errorMessage.set('Voting failed — please try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
