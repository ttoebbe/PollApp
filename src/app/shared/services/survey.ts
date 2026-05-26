import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase';
import type { Survey } from '../interfaces/survey.interface';
import type { Option } from '../interfaces/option.interface';
import type { Question } from '../interfaces/question.interface';

export interface QuestionInput {
  label: string;
  allow_multiple: boolean;
  answers: string[];
}

export function isSurveyActive(survey: Survey): boolean {
  if (!survey.deadline) return true;
  return new Date(survey.deadline) > new Date();
}

export function isSurveyUrgent(survey: Survey): boolean {
  if (!survey.deadline) return false;
  const hoursLeft = (new Date(survey.deadline).getTime() - Date.now()) / 36e5;
  return hoursLeft > 0 && hoursLeft <= 48;
}

export function getSurveyEndsInLabel(survey: Survey): string {
  if (!survey.deadline) return 'No deadline';
  const ms = new Date(survey.deadline).getTime() - Date.now();
  if (ms <= 0) return 'Ended';
  const hours = Math.floor(ms / 36e5);
  if (hours < 24) return `Ends in ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Ends in ${days} Day${days === 1 ? '' : 's'}`;
}

export function getSurveyEndsOnLabel(survey: Survey): string {
  if (!survey.deadline) return '';
  return new Date(survey.deadline).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function getOptionLetter(index: number): string {
  return String.fromCharCode(65 + index) + '.';
}

@Injectable({ providedIn: 'root' })
export class SurveyService {
  private readonly supabase = inject(SupabaseService);

  private readonly _surveys = signal<Survey[]>([]);
  private readonly _questions = signal<Question[]>([]);
  private readonly _options = signal<Option[]>([]);
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
      this._surveys.set((data ?? []) as Survey[]);
    } finally {
      this._isLoading.set(false);
    }
  }

  async loadSurveyWithOptions(surveyNumber: number): Promise<Survey | null> {
    this._isLoading.set(true);
    try {
      const survey = await this.fetchSurveyByNumber(surveyNumber);
      await this.fetchSurveyRelations(survey.id);
      this.addSurveyToCache(survey);
      return survey;
    } finally {
      this._isLoading.set(false);
    }
  }

  async createSurvey(
    surveyData: Omit<Survey, 'id' | 'survey_number' | 'created_at'>,
    questionInputs: QuestionInput[],
  ): Promise<Survey> {
    const survey = await this.insertSurvey(surveyData);
    const questionResults = await this.insertQuestions(survey.id, questionInputs);
    await this.insertOptions(survey.id, questionInputs, questionResults);
    this._surveys.update((curr) => [survey, ...curr]);
    return survey;
  }

  async vote(optionId: string): Promise<void> {
    const { error } = await this.supabase.client.rpc('increment_vote', {
      option_id: optionId,
    });
    if (error) throw error;
    this._options.update((curr) =>
      curr.map((o) => (o.id === optionId ? { ...o, vote_count: o.vote_count + 1 } : o)),
    );
  }

  private async fetchSurveyByNumber(surveyNumber: number): Promise<Survey> {
    const { data, error } = await this.supabase.client
      .from('surveys')
      .select('*')
      .eq('survey_number', surveyNumber)
      .single();
    if (error) throw error;
    return data as Survey;
  }

  private async fetchSurveyRelations(surveyId: string): Promise<void> {
    const [questions, options] = await Promise.all([
      this.fetchQuestions(surveyId),
      this.fetchOptions(surveyId),
    ]);
    this._questions.set(questions);
    this._options.set(options);
  }

  private async fetchQuestions(surveyId: string): Promise<Question[]> {
    const { data, error } = await this.supabase.client
      .from('questions')
      .select('*')
      .eq('survey_id', surveyId)
      .order('order_index');
    if (error) throw error;
    return (data ?? []) as Question[];
  }

  private async fetchOptions(surveyId: string): Promise<Option[]> {
    const { data, error } = await this.supabase.client
      .from('options')
      .select('*')
      .eq('survey_id', surveyId)
      .order('created_at');
    if (error) throw error;
    return (data ?? []) as Option[];
  }

  private addSurveyToCache(survey: Survey): void {
    const existing = this._surveys();
    if (!existing.find((s) => s.id === survey.id)) {
      this._surveys.set([survey, ...existing]);
    }
  }

  private async insertSurvey(
    surveyData: Omit<Survey, 'id' | 'survey_number' | 'created_at'>,
  ): Promise<Survey> {
    const { data, error } = await this.supabase.client
      .from('surveys')
      .insert(surveyData)
      .select()
      .single();
    if (error) throw error;
    return data as Survey;
  }

  private buildQuestionRow(surveyId: string, qi: QuestionInput, index: number) {
    return {
      survey_id: surveyId,
      label: qi.label,
      allow_multiple: qi.allow_multiple,
      order_index: index,
    };
  }

  private insertOneQuestion(surveyId: string, qi: QuestionInput, index: number) {
    return this.supabase.client
      .from('questions')
      .insert(this.buildQuestionRow(surveyId, qi, index))
      .select()
      .single();
  }

  private async insertQuestions(surveyId: string, inputs: QuestionInput[]) {
    const results = await Promise.all(
      inputs.map((qi, i) => this.insertOneQuestion(surveyId, qi, i)),
    );
    const failed = results.find(({ error }) => error);
    if (failed?.error) throw failed.error;
    return results;
  }

  private buildOptionRows(surveyId: string, qi: QuestionInput, questionId: string) {
    return qi.answers.map((label) => ({ survey_id: surveyId, question_id: questionId, label }));
  }

  private mapOptionInserts(
    surveyId: string,
    inputs: QuestionInput[],
    questionResults: { data: unknown }[],
  ) {
    return inputs.map((qi, i) => {
      const questionId = (questionResults[i].data as Question).id;
      return this.supabase.client
        .from('options')
        .insert(this.buildOptionRows(surveyId, qi, questionId));
    });
  }

  private async insertOptions(
    surveyId: string,
    inputs: QuestionInput[],
    questionResults: { data: unknown }[],
  ): Promise<void> {
    const results = await Promise.all(this.mapOptionInserts(surveyId, inputs, questionResults));
    const failed = results.find(({ error }) => error);
    if (failed?.error) throw failed.error;
  }
}
