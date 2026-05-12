import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SurveyService } from '../../shared/services/survey';
import { UrgentSurveys } from '../../shared/components/urgent-surveys/urgent-surveys';
import { SurveyCard } from '../../shared/components/survey-card/survey-card';

/** Startseite: Hero + "Your surveys" Highlights + Active/Past Liste. */
@Component({
  selector: 'app-home',
  imports: [UrgentSurveys, SurveyCard, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private readonly surveyService = inject(SurveyService);

  readonly surveys = this.surveyService.surveys;
  readonly isLoading = this.surveyService.isLoading;

  /** Tabs: 'active' | 'past' (US2) */
  readonly activeTab = signal<'active' | 'past'>('active');

  readonly activeSurveys = computed(() =>
    this.surveys()
      .filter((s) => s.isActive())
      .sort((a, b) => this.byDeadlineAsc(a, b)),
  );

  readonly pastSurveys = computed(() =>
    this.surveys()
      .filter((s) => !s.isActive())
      .sort((a, b) => this.byDeadlineAsc(b, a)),
  );

  /** Bald endende Umfragen (≤ 48h), chronologisch sortiert (US1) */
  readonly urgentSurveys = computed(() =>
    this.activeSurveys()
      .filter((s) => s.isUrgent())
      .slice(0, 3),
  );

  async ngOnInit(): Promise<void> {
    await this.surveyService.loadSurveys();
  }

  setTab(tab: 'active' | 'past'): void {
    this.activeTab.set(tab);
  }

  /** Sortiert Umfragen aufsteigend nach Deadline (kein Deadline ⇒ ans Ende) */
  private byDeadlineAsc(a: { deadline: string | null }, b: { deadline: string | null }): number {
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  }
}
