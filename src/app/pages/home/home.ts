import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { SurveyService } from '../../shared/services/survey';
import { UrgentSurveys } from '../../shared/components/urgent-surveys/urgent-surveys';
import { SurveyCard } from '../../shared/components/survey-card/survey-card';

/** Startseite: zeigt dringende Umfragen oben, darunter alle Umfragen mit Tabs */
@Component({
  selector: 'app-home',
  imports: [UrgentSurveys, SurveyCard],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private readonly surveyService = inject(SurveyService);

  readonly surveys = this.surveyService.surveys;
  readonly isLoading = this.surveyService.isLoading;

  /** Aktuell aktiver Tab: 'active' oder 'past' */
  readonly activeTab = signal<'active' | 'past'>('active');

  /** Nur laufende Umfragen (Deadline in der Zukunft oder keine Deadline) */
  readonly activeSurveys = computed(() => this.surveys().filter((s) => s.isActive()));

  /** Abgeschlossene Umfragen (Deadline in der Vergangenheit) */
  readonly pastSurveys = computed(() => this.surveys().filter((s) => !s.isActive()));

  /** Dringende Umfragen (enden in den nächsten 48 Stunden) */
  readonly urgentSurveys = computed(() =>
    this.activeSurveys()
      .filter((s) => s.isUrgent())
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime()),
  );

  async ngOnInit(): Promise<void> {
    await this.surveyService.loadSurveys();
  }

  /** Wechselt den aktiven Tab */
  setTab(tab: 'active' | 'past'): void {
    this.activeTab.set(tab);
  }
}
