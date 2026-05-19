import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase';
import { SurveyModel } from '../models/survey.model';
import { OptionModel } from '../models/option.model';
import type { Survey } from '../interfaces/survey.interface';
import type { Option } from '../interfaces/option.interface';

@Injectable({ providedIn: 'root' })
export class SurveyService {
  private readonly supabase = inject(SupabaseService);

  private readonly _surveys = signal<SurveyModel[]>([]);
  private readonly _options = signal<OptionModel[]>([]);
  private readonly _isLoading = signal(false);

  readonly surveys = this._surveys.asReadonly();
  readonly options = this._options.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  optionsFor(surveyId: string) {
    return computed(() => this._options().filter((option) => option.survey_id === surveyId));
  }

  async loadSurveys(): Promise<void> {
    this._isLoading.set(true);
    try {
      const { data, error } = await this.supabase.client
        .from('surveys')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      this._surveys.set((data ?? []).map((rawSurvey: Survey) => new SurveyModel(rawSurvey)));
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

      const optionsRes = await this.supabase.client
        .from('options')
        .select('*')
        .eq('survey_id', survey.id)
        .order('created_at');
      if (optionsRes.error) throw optionsRes.error;

      const options = (optionsRes.data ?? []).map((option: Option) => new OptionModel(option));

      this._options.set(options);
      const existing = this._surveys();
      if (!existing.find((knownSurvey) => knownSurvey.id === survey.id)) {
        this._surveys.set([survey, ...existing]);
      }
      return survey;
    } finally {
      this._isLoading.set(false);
    }
  }

  async createSurvey(
    survey: Omit<Survey, 'id' | 'survey_number' | 'created_at'>,
    labels: string[],
  ): Promise<SurveyModel> {
    const { data: created, error } = await this.supabase.client
      .from('surveys')
      .insert(survey)
      .select()
      .single();
    if (error) throw error;
    const surveyModel = new SurveyModel(created as Survey);

    const rows = labels.map((label) => ({ survey_id: surveyModel.id, label }));
    const { error: optionsError } = await this.supabase.client.from('options').insert(rows);
    if (optionsError) throw optionsError;

    this._surveys.update((curr) => [surveyModel, ...curr]);
    return surveyModel;
  }

  async vote(optionId: string): Promise<void> {
    const { error } = await this.supabase.client.rpc('increment_vote', {
      option_id: optionId,
    });
    if (error) throw error;
    
    this._options.update((currentOptions) =>
      currentOptions.map((option) =>
        option.id === optionId
          ? new OptionModel({ ...option, vote_count: option.vote_count + 1 })
          : option,
      ),
    );
  }
}
