import { Component } from '@angular/core';
// Lädt den @Component-Decorator aus Angular, der eine Klasse als Komponente markiert.

import { RouterOutlet } from '@angular/router';
// Lädt RouterOutlet — das Platzhalter-Element, das Angular beim Routing mit der passenden Seite befüllt.

import { Header } from './layout/header/header';
// Lädt die eigene Header-Komponente aus dem Layout-Ordner.

import { Footer } from './layout/footer/footer';
// Lädt die eigene Footer-Komponente aus dem Layout-Ordner.

@Component({
  // Startet den Decorator und teilt Angular mit: „Diese Klasse ist eine Komponente."

  selector: 'app-root',
  // Definiert den HTML-Tag, mit dem diese Komponente eingebunden wird (steht in index.html als <app-root>).

  imports: [RouterOutlet, Header, Footer],
  // Registriert die drei Abhängigkeiten, die im Template dieser Komponente verwendet werden dürfen.

  templateUrl: './app.html',
  // Verweist auf die HTML-Datei, die das Template dieser Komponente enthält.

  styleUrl: './app.scss',
  // Verweist auf die SCSS-Datei mit den komponentenspezifischen Styles.
})
// Schließt den @Component-Decorator ab.
export class App {}
// Exportiert die leere Klasse — die Wurzel-Komponente der gesamten App, die selbst keine eigene Logik benötigt.
