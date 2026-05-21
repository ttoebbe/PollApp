import { Component, input, computed } from '@angular/core';
import { OptionModel } from '../../models/option.model';

@Component({
  selector: 'app-results-bar',
  templateUrl: './results-bar.html',
  styleUrl: './results-bar.scss',
})
export class ResultsBar {
  readonly options = input.required<OptionModel[]>();
  readonly previewOptionId = input<string | null>(null);

  readonly totalVotes = computed(() => {
    const base = this.options().reduce((total, option) => total + option.vote_count, 0);
    return this.previewOptionId() !== null ? base + 1 : base;
  });

  letter(index: number): string {
    return OptionModel.letter(index);
  }

  percentage(option: OptionModel): number {
    const previewId = this.previewOptionId();
    const count = option.id === previewId ? option.vote_count + 1 : option.vote_count;
    const total = this.totalVotes();
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  }
}
