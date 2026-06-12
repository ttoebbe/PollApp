import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SurveyService, getSurveyEndsOnLabel } from '../../shared/services/survey';
import type { Survey } from '../../shared/interfaces/survey.interface';
import type { Question } from '../../shared/interfaces/question.interface';
import type { Option } from '../../shared/interfaces/option.interface';
import { VoteOptions } from '../../shared/components/vote-options/vote-options';
import { ResultsBar } from '../../shared/components/results-bar/results-bar';

interface QuestionRow {
  question: Question;
  options: Option[];
  heading: string;
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
  private readonly destroyRef = inject(DestroyRef);

  readonly survey = signal<Survey | null>(null);
  readonly questions = signal<Question[]>([]);
  readonly hasCompleted = signal(false);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly selections = signal<Map<string, string[]>>(new Map());

  readonly endsOnLabel = computed(() => {
    const s = this.survey();
    return s ? getSurveyEndsOnLabel(s) : '';
  });

  readonly questionRows = computed<QuestionRow[]>(() => {
    const allOptions = this.surveyService.options();
    return this.questions().map((q, index) => ({
      question: q,
      options: allOptions.filter((o) => o.question_id === q.id),
      heading: `${index + 1}. ${q.label}`,
    }));
  });

  readonly allAnswered = computed(() => {
    const rows = this.questionRows();
    return (
      rows.length > 0 && rows.every((r) => (this.selections().get(r.question.id) ?? []).length > 0)
    );
  });

  readonly hasAnyVotes = computed(() => {
    const surveyId = this.survey()?.id;
    if (!surveyId) return false;
    return this.surveyService.options().some((o) => o.survey_id === surveyId && o.vote_count > 0);
  });

  readonly hasPreviewSelection = computed(() =>
    [...this.selections().values()].some((ids) => ids.length > 0),
  );

  readonly showResults = computed(() => this.hasAnyVotes() || this.hasPreviewSelection());

  async ngOnInit(): Promise<void> {
    const raw = this.route.snapshot.paramMap.get('number');
    const surveyNumber = raw ? parseInt(raw, 10) : NaN;
    if (isNaN(surveyNumber)) {
      this.router.navigate(['/']);
      return;
    }
    await this.loadSurvey(surveyNumber);
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
      await this.submitVotes();
      this.markCompleted(currentSurvey.id);
    } catch {
      this.errorMessage.set('Voting failed — please try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private markCompleted(surveyId: string): void {
    localStorage.setItem(`pollapp:completed:${surveyId}`, '1');
    this.hasCompleted.set(true);
    this.selections.set(new Map());
  }

  private async loadSurvey(surveyNumber: number): Promise<void> {
    try {
      const survey = await this.surveyService.loadSurveyWithOptions(surveyNumber);
      if (!survey) {
        this.errorMessage.set('Survey not found.');
        return;
      }
      this.initSurvey(survey);
    } catch {
      this.errorMessage.set('Survey not found.');
    }
  }

  private initSurvey(survey: Survey): void {
    this.survey.set(survey);
    this.questions.set(this.surveyService.questions().filter((q) => q.survey_id === survey.id));
    this.hasCompleted.set(localStorage.getItem(`pollapp:completed:${survey.id}`) === '1');
    const channel = this.surveyService.subscribeToOptionUpdates(survey.id);
    this.destroyRef.onDestroy(() => this.surveyService.unsubscribeChannel(channel));
  }

  private async submitVotes(): Promise<void> {
    const votePromises: Promise<void>[] = [];
    for (const optionIds of this.selections().values()) {
      for (const optionId of optionIds) {
        votePromises.push(this.surveyService.vote(optionId));
      }
    }
    await Promise.all(votePromises);
  }
}
