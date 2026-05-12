import { Component, input, computed } from '@angular/core';
import { OptionModel } from '../../models/option.model';

/** Zeigt die aktuelle Auswertung als Balkengrafik */
@Component({
  selector: 'app-results-bar',
  imports: [],
  templateUrl: './results-bar.html',
  styleUrl: './results-bar.scss',
})
export class ResultsBar {
  /** Optionen mit ihren aktuellen Stimmzahlen */
  readonly options = input.required<OptionModel[]>();

  /** Gesamtzahl aller abgegebenen Stimmen */
  readonly totalVotes = computed(() => this.options().reduce((sum, o) => sum + o.vote_count, 0));
}
