import { Component, input, output } from '@angular/core';
import { OptionModel } from '../../models/option.model';

/** Zeigt die Abstimmungsoptionen einer Umfrage als klickbare Buttons */
@Component({
  selector: 'app-vote-options',
  imports: [],
  templateUrl: './vote-options.html',
  styleUrl: './vote-options.scss',
})
export class VoteOptions {
  /** Optionen der aktuellen Umfrage */
  readonly options = input.required<OptionModel[]>();

  /** Gibt die gewählte Option nach außen weiter */
  readonly voted = output<OptionModel>();

  /** Sendet die gewählte Option an den Parent */
  selectOption(option: OptionModel): void {
    this.voted.emit(option);
  }
}
