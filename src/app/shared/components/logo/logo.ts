import { Component, input } from '@angular/core';

/**
 * Poll App Logo — orangenes Quadrat mit Sprechblasen-Symbolik, daneben "Poll App" in Nerko One.
 * 1:1 Übernahme aus dem Figma-Design.
 */
@Component({
  selector: 'app-logo',
  templateUrl: './logo.html',
  styleUrl: './logo.scss',
})
export class Logo {
  /** Optional kleinere Variante (z.B. für Footer). Default 'md'. */
  readonly size = input<'sm' | 'md' | 'lg'>('md');
}
