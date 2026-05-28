import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  signal,
  computed,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { SurveyService, isSurveyActive, isSurveyUrgent } from '../../shared/services/survey';
import { UrgentSurveys } from '../../shared/components/urgent-surveys/urgent-surveys';
import { SurveyCard } from '../../shared/components/survey-card/survey-card';
import { SURVEY_CATEGORIES } from '../../shared/interfaces/survey.interface';

@Component({
  selector: 'app-home',
  imports: [UrgentSurveys, SurveyCard, RouterLink, NgOptimizedImage],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit {
  private readonly surveyService = inject(SurveyService);

  readonly surveys = this.surveyService.surveys;
  readonly isLoading = this.surveyService.isLoading;

  readonly activeTab = signal<'active' | 'past'>('active');
  readonly selectedCategory = signal<string | null>(null);
  readonly isDropdownOpen = signal(false);
  readonly categories = SURVEY_CATEGORIES;
  readonly loadError = signal<string | null>(null);

  readonly activeSurveys = computed(() =>
    this.surveys()
      .filter((survey) => isSurveyActive(survey) && this.matchesCategory(survey))
      .sort((first, second) => this.byDeadlineAsc(first, second)),
  );

  readonly pastSurveys = computed(() =>
    this.surveys()
      .filter((survey) => !isSurveyActive(survey) && this.matchesCategory(survey))
      .sort((first, second) => this.byDeadlineAsc(second, first)),
  );

  readonly urgentSurveys = computed(() =>
    this.activeSurveys()
      .filter((survey) => isSurveyUrgent(survey))
      .slice(0, 3),
  );

  readonly displayedSurveys = computed(() =>
    this.activeTab() === 'active' ? this.activeSurveys() : this.pastSurveys(),
  );

  readonly isPastTab = computed(() => this.activeTab() === 'past');

  async ngOnInit(): Promise<void> {
    try {
      await this.surveyService.loadSurveys();
    } catch {
      this.loadError.set('Surveys could not be loaded. Please try again later.');
    }
  }

  setTab(tab: 'active' | 'past'): void {
    this.activeTab.set(tab);
    this.isDropdownOpen.set(false);
  }

  onTabKeydown(event: KeyboardEvent, current: 'active' | 'past'): void {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const next = current === 'active' ? 'past' : 'active';
    this.setTab(next);
    document.getElementById(next === 'active' ? 'tab-active' : 'tab-past')?.focus();
  }

  setCategory(category: string | null): void {
    this.selectedCategory.set(category);
    this.isDropdownOpen.set(false);
  }

  toggleDropdown(): void {
    this.isDropdownOpen.update((open) => !open);
  }

  private matchesCategory(survey: { category: string | null }): boolean {
    const cat = this.selectedCategory();
    return cat === null || survey.category === cat;
  }

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
