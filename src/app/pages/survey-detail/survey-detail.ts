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
    const raw = this.route.snapshot.paramMap.get('number');
    const surveyNumber = raw ? parseInt(raw, 10) : NaN;
    if (isNaN(surveyNumber)) {
      this.router.navigate(['/']);
      return;
    }
    try {
      const survey = await this.surveyService.loadSurveyWithOptions(surveyNumber);
      this.survey.set(survey);
      // Optionen anhand der UUID neu binden (FK bleibt UUID)
      Object.defineProperty(this, 'options', {
        value: this.surveyService.optionsFor(survey!.id),
        writable: false,
      });
      // localStorage-Check: UUID als stabiler Schlüssel
      this.hasVoted.set(localStorage.getItem(`pollapp:voted:${survey!.id}`) === '1');
    } catch {
      this.errorMessage.set('Survey not found.');
    }
  }

  async onVote(optionId: string): Promise<void> {
    const currentSurvey = this.survey();
    if (!currentSurvey) return;
    try {
      await this.surveyService.vote(optionId);
      localStorage.setItem(`pollapp:voted:${currentSurvey.id}`, '1');
      this.hasVoted.set(true);
    } catch {
      this.errorMessage.set('Voting failed — please try again.');
    }
  }
}
