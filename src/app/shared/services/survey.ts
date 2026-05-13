import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase';
import { SurveyModel } from '../models/survey.model';
import { OptionModel } from '../models/option.model';
import type { Survey } from '../interfaces/survey.interface';
import type { Option } from '../interfaces/option.interface';

/**
 * Verwaltet Umfragen + Optionen + Stimmen (Supabase-Backend).
 * Signals-basierte State-Verwaltung: surveys(), options(), isLoading().
 */
@Injectable({ providedIn: 'root' })
export class SurveyService {
  private readonly supabase = inject(SupabaseService);

  private readonly _surveys = signal<SurveyModel[]>([]);
  private readonly _options = signal<OptionModel[]>([]);
  private readonly _isLoading = signal(false);

  readonly surveys = this._surveys.asReadonly();
  readonly options = this._options.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  /** Optionen einer bestimmten Umfrage (computed view) */
  optionsFor(surveyId: string) {
    return computed(() => this._options().filter((option) => option.survey_id === surveyId));
  }

  /** Lädt alle Umfragen aus Supabase */
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

  /** Lädt eine einzelne Umfrage + zugehörige Optionen */
  async loadSurveyWithOptions(id: string): Promise<SurveyModel | null> {
    this._isLoading.set(true);
    try {
      const [surveyRes, optionsRes] = await Promise.all([
        this.supabase.client.from('surveys').select('*').eq('id', id).single(),
        this.supabase.client.from('options').select('*').eq('survey_id', id).order('created_at'),
      ]);
      if (surveyRes.error) throw surveyRes.error;
      if (optionsRes.error) throw optionsRes.error;

      const survey = new SurveyModel(surveyRes.data as Survey);
      const options = (optionsRes.data ?? []).map((option: Option) => new OptionModel(option));

      // State updaten
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

  /** Erstellt neue Umfrage inkl. Optionen */
  async createSurvey(
    survey: Omit<Survey, 'id' | 'created_at'>,
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

  /** Stimmen für eine Option (transactional via RPC — siehe Migration) */
  async vote(optionId: string): Promise<void> {
    const { error } = await this.supabase.client.rpc('increment_vote', {
      option_id: optionId,
    });
    if (error) throw error;
    // lokal updaten
    this._options.update((currentOptions) =>
      currentOptions.map((option) =>
        option.id === optionId
          ? new OptionModel({ ...option, vote_count: option.vote_count + 1 })
          : option,
      ),
    );
  }
}
