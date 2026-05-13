import { Component, input, output, signal } from '@angular/core';
import { OptionModel } from '../../models/option.model';

/**
 * Antwort-Pills im Detail-View (Property1Default9 aus Figma).
 * Single-Choice: User wählt eine Option, drückt "Submit" → emit vote.
 */
@Component({
  selector: 'app-vote-options',
  templateUrl: './vote-options.html',
  styleUrl: './vote-options.scss',
})
export class VoteOptions {
  readonly options = input.required<OptionModel[]>();
  readonly disabled = input(false);
  readonly vote = output<string>();

  readonly selectedId = signal<string | null>(null);

  letter(index: number): string {
    return OptionModel.letter(index);
  }

  select(id: string): void {
    if (this.disabled()) return;
    this.selectedId.set(id);
  }

  submit(): void {
    const id = this.selectedId();
    if (!id || this.disabled()) return;
    this.vote.emit(id);
    this.selectedId.set(null);
  }
}
