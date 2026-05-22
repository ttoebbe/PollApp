import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase';
import { SurveyModel } from '../models/survey.model';
import { OptionModel } from '../models/option.model';
import { QuestionModel } from '../models/question.model';
import type { Survey } from '../interfaces/survey.interface';
import type { Option } from '../interfaces/option.interface';
import type { Question } from '../interfaces/question.interface';

/** Daten für eine neue Frage beim Erstellen einer Umfrage */
export interface QuestionInput {
  label: string;
  allow_multiple: boolean;
  answers: string[];
}

@Injectable({ providedIn: 'root' })
export class SurveyService {
  private readonly supabase = inject(SupabaseService);

  private readonly _surveys = signal<SurveyModel[]>([]);
  private readonly _questions = signal<QuestionModel[]>([]);
  private readonly _options = signal<OptionModel[]>([]);
  private readonly _isLoading = signal(false);

  readonly surveys = this._surveys.asReadonly();
  readonly questions = this._questions.asReadonly();
  readonly options = this._options.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  questionsFor(surveyId: string) {
    return computed(() =>
      this._questions()
        .filter((q) => q.survey_id === surveyId)
        .sort((a, b) => a.order_index - b.order_index),
    );
  }

  optionsFor(questionId: string) {
    return computed(() => this._options().filter((o) => o.question_id === questionId));
  }

  async loadSurveys(): Promise<void> {
    this._isLoading.set(true);
    try {
      const { data, error } = await this.supabase.client
        .from('surveys')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      if (error) throw error;
      this._surveys.set((data ?? []).map((raw: Survey) => new SurveyModel(raw)));
    } finally {
      this._isLoading.set(false);
    }
  }

  async loadSurveyWithOptions(surveyNumber: number): Promise<SurveyModel | null> {
    this._isLoading.set(true);
    try {
      const surveyRes = await this.supabase.client
        .from('surveys')
        .select('*')
        .eq('survey_number', surveyNumber)
        .single();
      if (surveyRes.error) throw surveyRes.error;

      const survey = new SurveyModel(surveyRes.data as Survey);

      const questionsRes = await this.supabase.client
        .from('questions')
        .select('*')
        .eq('survey_id', survey.id)
        .order('order_index');
      if (questionsRes.error) throw questionsRes.error;

      const questions = (questionsRes.data ?? []).map((q: Question) => new QuestionModel(q));

      const optionsRes = await this.supabase.client
        .from('options')
        .select('*')
        .eq('survey_id', survey.id)
        .order('created_at');
      if (optionsRes.error) throw optionsRes.error;

      const options = (optionsRes.data ?? []).map((o: Option) => new OptionModel(o));

      this._questions.set(questions);
      this._options.set(options);

      const existing = this._surveys();
      if (!existing.find((s) => s.id === survey.id)) {
        this._surveys.set([survey, ...existing]);
      }
      return survey;
    } finally {
      this._isLoading.set(false);
    }
  }

  async createSurvey(
    surveyData: Omit<Survey, 'id' | 'survey_number' | 'created_at'>,
    questionInputs: QuestionInput[],
  ): Promise<SurveyModel> {
    const { data: created, error } = await this.supabase.client
      .from('surveys')
      .insert(surveyData)
      .select()
      .single();
    if (error) throw error;
    const survey = new SurveyModel(created as Survey);

    // Runde 1: alle Fragen parallel einfügen
    const questionResults = await Promise.all(
      questionInputs.map((qi, i) =>
        this.supabase.client
          .from('questions')
          .insert({
            survey_id: survey.id,
            label: qi.label,
            allow_multiple: qi.allow_multiple,
            order_index: i,
          })
          .select()
          .single(),
      ),
    );
    for (const { error: qError } of questionResults) {
      if (qError) throw qError;
    }

    // Runde 2: alle Options-Batches parallel einfügen (question_id aus Runde 1)
    const optionResults = await Promise.all(
      questionInputs.map((qi, i) => {
        const rows = qi.answers.map((label) => ({
          survey_id: survey.id,
          question_id: (questionResults[i].data as Question).id,
          label,
        }));
        return this.supabase.client.from('options').insert(rows);
      }),
    );
    for (const { error: oError } of optionResults) {
      if (oError) throw oError;
    }

    this._surveys.update((curr) => [survey, ...curr]);
    return survey;
  }

  async vote(optionId: string): Promise<void> {
    const { error } = await this.supabase.client.rpc('increment_vote', {
      option_id: optionId,
    });
    if (error) throw error;

    this._options.update((curr) =>
      curr.map((o) =>
        o.id === optionId ? new OptionModel({ ...o, vote_count: o.vote_count + 1 }) : o,
      ),
    );
  }
}
