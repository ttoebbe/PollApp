import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-logo',
  templateUrl: './logo.html',
  styleUrl: './logo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Logo {
  readonly size = input<'sm' | 'md' | 'lg'>('md');
}
