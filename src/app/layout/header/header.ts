import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Logo } from '../../shared/components/logo/logo';

/** Globale Navigation mit App-Logo (Figma) und Button zum Erstellen einer neuen Umfrage */
@Component({
  selector: 'app-header',
  imports: [RouterLink, Logo],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {}
