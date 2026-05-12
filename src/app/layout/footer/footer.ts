import { Component } from '@angular/core';

/** Globale Fußzeile mit Copyright-Jahr */
@Component({
  selector: 'app-footer',
  imports: [],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  /** Aktuelles Jahr für die Copyright-Zeile */
  readonly year = new Date().getFullYear();
}
