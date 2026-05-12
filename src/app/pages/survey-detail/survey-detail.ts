import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SurveyService } from '../../shared/services/survey';
import { SurveyModel } from '../../shared/models/survey.model';
import { VoteOptions } from '../../shared/components/vote-options/vote-options';
import { ResultsBar } from '../../shared/components/results-bar/results-bar';

/**
 * Detail-View einer Umfrage (US4 + US5).
 * Layout: Voting-Karte links, Results-Karte rechts (Desktop) — stackt mobil.
 */
@Component({
  selector: 'app-survey-detail',
  imports: [VoteOptions, ResultsBar, RouterLink],
  templateUrl: './survey-detail.html',
  styleUrl: './survey-detail.scss',
})
export class SurveyDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly surveyService = inject(SurveyService);

  readonly survey = signal<SurveyModel | null>(null);
  readonly hasVoted = signal(false);
  readonly errorMessage = signal<string | null>(null);

  /** Computed-View auf Optionen für die aktuelle Umfrage */
  readonly options = this.surveyService.optionsFor('');

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/']);
      return;
    }
    try {
      const survey = await this.surveyService.loadSurveyWithOptions(id);
      this.survey.set(survey);
      // Optionen anhand der ID neu binden
      Object.defineProperty(this, 'options', {
        value: this.surveyService.optionsFor(id),
        writable: false,
      });
      // localStorage-Check: bereits abgestimmt?
      this.hasVoted.set(localStorage.getItem(`pollapp:voted:${id}`) === '1');
    } catch {
      this.errorMessage.set('Survey not found.');
    }
  }

  async onVote(optionId: string): Promise<void> {
    const s = this.survey();
    if (!s) return;
    try {
      await this.surveyService.vote(optionId);
      localStorage.setItem(`pollapp:voted:${s.id}`, '1');
      this.hasVoted.set(true);
    } catch {
      this.errorMessage.set('Voting failed — please try again.');
    }
  }
}
