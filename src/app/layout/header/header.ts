import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Globale Navigation mit App-Titel und Button zum Erstellen einer neuen Umfrage */
@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {}
