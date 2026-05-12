import { Component, inject, OnInit, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { SurveyService } from '../../shared/services/survey';
import { VoteOptions } from '../../shared/components/vote-options/vote-options';
import { ResultsBar } from '../../shared/components/results-bar/results-bar';
import { OptionModel } from '../../shared/models/option.model';

/** Detailansicht einer Umfrage: Abstimmung links, Ergebnis rechts (Desktop) */
@Component({
  selector: 'app-survey-detail',
  imports: [RouterLink, DatePipe, VoteOptions, ResultsBar],
  templateUrl: './survey-detail.html',
  styleUrl: './survey-detail.scss',
})
export class SurveyDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly surveyService = inject(SurveyService);

  readonly options = this.surveyService.currentOptions;
  readonly isLoading = this.surveyService.isLoading;

  /** Die aktuelle Umfrage — wird aus dem Signal-Speicher geladen */
  readonly survey = computed(() => {
    const id = this.route.snapshot.paramMap.get('id');
    return this.surveyService.surveys().find((s) => s.id === id) ?? null;
  });

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    if (this.surveyService.surveys().length === 0) {
      await this.surveyService.loadSurveys();
    }
    await this.surveyService.loadOptions(id);
  }

  /** Sendet die Stimme für die gewählte Option */
  async onVote(option: OptionModel): Promise<void> {
    await this.surveyService.vote(option);
  }
}
