import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';
import { OptionModel } from '../../models/option.model';

@Component({
  selector: 'app-vote-options',
  templateUrl: './vote-options.html',
  styleUrl: './vote-options.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VoteOptions {
  readonly options = input.required<OptionModel[]>();
  readonly disabled = input(false);
  readonly allowMultiple = input(false);

  /** Gibt die aktuell ausgewählten Option-IDs zurück */
  readonly selectionChange = output<string[]>();

  readonly selectedIds = signal<Set<string>>(new Set());

  letter(index: number): string {
    return OptionModel.letter(index);
  }

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  select(id: string): void {
    if (this.disabled()) return;

    if (this.allowMultiple()) {
      this.selectedIds.update((current) => {
        const next = new Set(current);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    } else {
      this.selectedIds.set(new Set([id]));
    }

    this.selectionChange.emit([...this.selectedIds()]);
  }
}
