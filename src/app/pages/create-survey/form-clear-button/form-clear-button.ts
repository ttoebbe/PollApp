import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

type ClearButtonVariant = 'default' | 'textarea';

@Component({
  selector: 'app-form-clear-button',
  imports: [],
  templateUrl: './form-clear-button.html',
  styleUrl: './form-clear-button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormClearButton {
  readonly value = input.required<unknown>();
  readonly label = input.required<string>();
  readonly variant = input<ClearButtonVariant>('default');
  readonly cleared = output<void>();
}
