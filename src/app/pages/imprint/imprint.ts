import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Impressum-Seite — Hinweis auf Lernprojekt-Charakter */
@Component({
  selector: 'app-imprint',
  imports: [RouterLink],
  templateUrl: './imprint.html',
  styleUrl: './imprint.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Imprint {}
