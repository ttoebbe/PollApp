import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import type { Option } from '../../interfaces/option.interface';
import { getOptionLetter } from '../../services/survey';

@Component({
  selector: 'app-results-bar',
  templateUrl: './results-bar.html',
  styleUrl: './results-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsBar {
  readonly options = input.required<Option[]>();
  readonly previewOptionIds = input<string[]>([]);

  readonly totalVotes = computed(() => {
    const base = this.options().reduce((sum, o) => sum + o.vote_count, 0);
    return base + this.previewOptionIds().length;
  });

  readonly votesLabel = computed(() => (this.totalVotes() === 1 ? 'vote' : 'votes'));

  letter(index: number): string {
    return getOptionLetter(index);
  }

  percentage(option: Option): number {
    const isPreview = this.previewOptionIds().includes(option.id);
    const count = isPreview ? option.vote_count + 1 : option.vote_count;
    const total = this.totalVotes();
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  }

  isPreview(option: Option): boolean {
    return this.previewOptionIds().includes(option.id);
  }
}
