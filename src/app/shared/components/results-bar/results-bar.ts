import { Component, input, computed } from '@angular/core';
import { OptionModel } from '../../models/option.model';

/**
 * Ergebnis-Anzeige mit horizontalen Balken (Frame398 aus Figma).
 * Zeigt jede Option mit Label + Prozent-Balken + Live-Stimmenzahl.
 */
@Component({
  selector: 'app-results-bar',
  templateUrl: './results-bar.html',
  styleUrl: './results-bar.scss',
})
export class ResultsBar {
  readonly options = input.required<OptionModel[]>();

  readonly totalVotes = computed(() => this.options().reduce((sum, o) => sum + o.vote_count, 0));

  letter(i: number): string {
    return OptionModel.letter(i);
  }

  percentage(o: OptionModel): number {
    return o.getPercentage(this.totalVotes());
  }
}
