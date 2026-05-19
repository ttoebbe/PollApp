import { Component, input, computed } from '@angular/core';
import { OptionModel } from '../../models/option.model';

@Component({
  selector: 'app-results-bar',
  templateUrl: './results-bar.html',
  styleUrl: './results-bar.scss',
})
export class ResultsBar {
  readonly options = input.required<OptionModel[]>();

  readonly totalVotes = computed(() =>
    this.options().reduce((total, option) => total + option.vote_count, 0),
  );

  letter(index: number): string {
    return OptionModel.letter(index);
  }

  percentage(option: OptionModel): number {
    return option.getPercentage(this.totalVotes());
  }
}
