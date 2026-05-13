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
      .filter((survey) => survey.isActive())
      .sort((first, second) => this.byDeadlineAsc(first, second)),
  );

  readonly pastSurveys = computed(() =>
    this.surveys()
      .filter((survey) => !survey.isActive())
      .sort((first, second) => this.byDeadlineAsc(second, first)),
  );

  /** Bald endende Umfragen (≤ 48h), chronologisch sortiert (US1) */
  readonly urgentSurveys = computed(() =>
    this.activeSurveys()
      .filter((survey) => survey.isUrgent())
      .slice(0, 3),
  );

  async ngOnInit(): Promise<void> {
    await this.surveyService.loadSurveys();
  }

  setTab(tab: 'active' | 'past'): void {
    this.activeTab.set(tab);
  }

  /** Sortiert Umfragen aufsteigend nach Deadline (kein Deadline ⇒ ans Ende) */
  private byDeadlineAsc(
    first: { deadline: string | null },
    second: { deadline: string | null },
  ): number {
    if (!first.deadline && !second.deadline) return 0;
    if (!first.deadline) return 1;
    if (!second.deadline) return -1;
    return new Date(first.deadline).getTime() - new Date(second.deadline).getTime();
  }
}
