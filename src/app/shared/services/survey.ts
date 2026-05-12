import { Injectable, signal, inject, DestroyRef } from '@angular/core';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { SupabaseService } from './supabase';
import type { Survey } from '../interfaces/survey.interface';
import type { Option } from '../interfaces/option.interface';
import { SurveyModel } from '../models/survey.model';
import { OptionModel } from '../models/option.model';

/**
 * Domain-Service für Umfragen.
 * Verwaltet den reaktiven Zustand via Angular Signals und
 * synchronisiert Änderungen über Supabase Realtime-Channels.
 */
@Injectable({ providedIn: 'root' })
export class SurveyService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly destroyRef = inject(DestroyRef);

  /** Reaktive Liste aller Umfragen */
  readonly surveys = signal<SurveyModel[]>([]);

  /** Reaktive Liste der Optionen der aktuell geöffneten Umfrage */
  readonly currentOptions = signal<OptionModel[]>([]);

  /** Wird auf true gesetzt während ein Ladevorgang läuft */
  readonly isLoading = signal<boolean>(false);

  private surveyChannel: RealtimeChannel | null = null;
  private optionChannel: RealtimeChannel | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this.cleanupChannels());
  }

  /** Lädt alle Umfragen aus Supabase und aktiviert Realtime-Subscription */
  async loadSurveys(): Promise<void> {
    this.isLoading.set(true);
    const { data, error } = await this.supabase
      .from('surveys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fehler beim Laden der Umfragen:', error.message);
      this.isLoading.set(false);
      return;
    }

    this.surveys.set((data as Survey[]).map((s) => new SurveyModel(s)));
    this.isLoading.set(false);
    this.subscribeToSurveys();
  }

  /** Lädt die Optionen einer einzelnen Umfrage und aktiviert Realtime für Stimmen */
  async loadOptions(surveyId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('options')
      .select('*')
      .eq('survey_id', surveyId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Fehler beim Laden der Optionen:', error.message);
      return;
    }

    this.currentOptions.set((data as Option[]).map((o) => new OptionModel(o)));
    this.subscribeToOptions(surveyId);
  }

  /** Erstellt eine neue Umfrage inkl. aller Optionen in Supabase */
  async createSurvey(
    survey: Omit<Survey, 'id' | 'created_at'>,
    optionLabels: string[],
  ): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('surveys')
      .insert(survey)
      .select('id')
      .single();

    if (error || !data) {
      console.error('Fehler beim Erstellen der Umfrage:', error?.message);
      return null;
    }

    const surveyId: string = (data as { id: string }).id;
    await this.insertOptions(surveyId, optionLabels);
    return surveyId;
  }

  /** Erhöht den Stimmenzähler einer Option um 1 */
  async vote(option: OptionModel): Promise<void> {
    const { error } = await this.supabase
      .from('options')
      .update({ vote_count: option.vote_count + 1 })
      .eq('id', option.id);

    if (error) {
      console.error('Fehler beim Abstimmen:', error.message);
    }
  }

  /** Fügt Antwortoptionen für eine neu erstellte Umfrage ein */
  private async insertOptions(surveyId: string, labels: string[]): Promise<void> {
    const rows = labels.map((label) => ({ survey_id: surveyId, label }));
    const { error } = await this.supabase.from('options').insert(rows);

    if (error) {
      console.error('Fehler beim Erstellen der Optionen:', error.message);
    }
  }

  /** Abonniert neue Umfragen via Realtime und fügt sie dem Signal hinzu */
  private subscribeToSurveys(): void {
    this.surveyChannel = this.supabase
      .channel('survey-insert-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'surveys' },
        (payload) => {
          const newSurvey = new SurveyModel(payload.new as Survey);
          this.surveys.update((list) => [newSurvey, ...list]);
        },
      )
      .subscribe();
  }

  /** Abonniert Stimmen-Updates für die aktuelle Umfrage via Realtime */
  private subscribeToOptions(surveyId: string): void {
    if (this.optionChannel) {
      this.supabase.removeChannel(this.optionChannel);
    }

    this.optionChannel = this.supabase
      .channel(`option-vote-channel-${surveyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'options',
          filter: `survey_id=eq.${surveyId}`,
        },
        (payload) => {
          const updated = new OptionModel(payload.new as Option);
          this.currentOptions.update((list) =>
            list.map((o) => (o.id === updated.id ? updated : o)),
          );
        },
      )
      .subscribe();
  }

  /** Bereinigt alle offenen Realtime-Channels beim Zerstören des Services */
  private cleanupChannels(): void {
    if (this.surveyChannel) this.supabase.removeChannel(this.surveyChannel);
    if (this.optionChannel) this.supabase.removeChannel(this.optionChannel);
  }
}
