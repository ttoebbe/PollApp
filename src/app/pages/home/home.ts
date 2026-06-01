import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
// Lädt alle benötigten Angular-Kern-Bausteine: Decorator, Change-Detection-Strategie, Dependency Injection, Lifecycle-Hook und reaktive Hilfsfunktionen.

import { RouterLink } from '@angular/router';
// Lädt die RouterLink-Direktive, um in Templates klickbare Navigationslinks zu erzeugen.

import { NgOptimizedImage } from '@angular/common';
// Lädt NgOptimizedImage für optimiertes Laden von Bildern mit automatischem Lazy-Loading.

import { SurveyService, isSurveyActive, isSurveyUrgent } from '../../shared/services/survey';
// Lädt den Service für Datenzugriff sowie zwei Hilfsfunktionen, die prüfen ob eine Umfrage aktiv bzw. dringend ist.

import { UrgentSurveys } from '../../shared/components/urgent-surveys/urgent-surveys';
// Lädt die UrgentSurveys-Komponente, die dringend ablaufende Umfragen oben anzeigt.

import { SURVEY_CATEGORIES } from '../../shared/interfaces/survey.interface';
// Lädt die Liste aller verfügbaren Umfrage-Kategorien für den Filter.

import { SurveyFilter } from './survey-filter/survey-filter';
// Lädt die SurveyFilter-Komponente für die Kategorie- und Tab-Auswahl.

import { SurveyList } from './survey-list/survey-list';
// Lädt die SurveyList-Komponente, die die gefilterten Umfragen als Liste darstellt.

@Component({
  selector: 'app-home',
  // HTML-Tag, unter dem diese Komponente eingebunden wird.

  imports: [UrgentSurveys, RouterLink, NgOptimizedImage, SurveyFilter, SurveyList],
  // Registriert alle Abhängigkeiten, die im Template dieser Komponente verwendet werden.

  templateUrl: './home.html',
  // Verweist auf die HTML-Datei mit dem Template dieser Komponente.

  styleUrl: './home.scss',
  // Verweist auf die SCSS-Datei mit den komponentenspezifischen Styles.

  changeDetection: ChangeDetectionStrategy.OnPush,
  // Aktiviert OnPush: Angular prüft diese Komponente nur, wenn sich ein Signal oder Input ändert.
})
export class Home implements OnInit {
  // Exportiert die Home-Klasse und erklärt Angular, dass ngOnInit nach der Initialisierung aufgerufen wird.

  private readonly surveyService = inject(SurveyService);
  private readonly destroyRef = inject(DestroyRef);
  // Injiziert den SurveyService, über den alle Umfragedaten geladen und verwaltet werden.

  readonly surveys = this.surveyService.surveys;
  // Bindet das Signal mit allen Umfragen direkt aus dem Service.

  readonly isLoading = this.surveyService.isLoading;
  // Bindet das Lade-Signal aus dem Service, um im Template einen Ladezustand anzeigen zu können.

  readonly activeTab = signal<'active' | 'past'>('active');
  // Signal für den aktuell ausgewählten Tab — startet mit 'active'.

  readonly selectedCategory = signal<string | null>(null);
  // Signal für die aktuell ausgewählte Kategorie — null bedeutet „alle Kategorien".

  readonly categories = SURVEY_CATEGORIES;
  // Macht die Kategorienliste als Klassenmember verfügbar, damit das Template darauf zugreifen kann.

  readonly loadError = signal<string | null>(null);
  // Signal für eine Fehlermeldung, die gesetzt wird, wenn das Laden der Umfragen fehlschlägt.

  readonly activeSurveys = computed(() =>
    this.surveys()
      .filter((survey) => isSurveyActive(survey) && this.matchesCategory(survey))
      .sort((first, second) => this.byDeadlineAsc(first, second)),
  );
  // Computed-Signal: filtert alle aktiven Umfragen der gewählten Kategorie und sortiert sie aufsteigend nach Deadline.

  readonly pastSurveys = computed(() =>
    this.surveys()
      .filter((survey) => !isSurveyActive(survey) && this.matchesCategory(survey))
      .sort((first, second) => this.byDeadlineAsc(second, first)),
  );
  // Computed-Signal: filtert alle abgelaufenen Umfragen der gewählten Kategorie und sortiert sie absteigend nach Deadline.

  readonly urgentSurveys = computed(() =>
    this.activeSurveys()
      .filter((survey) => isSurveyUrgent(survey))
      .slice(0, 3),
  );
  // Computed-Signal: nimmt die ersten drei dringenden Umfragen aus den aktiven Umfragen.

  readonly displayedSurveys = computed(() =>
    this.activeTab() === 'active' ? this.activeSurveys() : this.pastSurveys(),
  );
  // Computed-Signal: liefert je nach aktivem Tab entweder die aktiven oder die abgelaufenen Umfragen.

  readonly isPastTab = computed(() => this.activeTab() === 'past');
  // Computed-Signal: gibt true zurück, wenn der Tab 'past' aktiv ist — vereinfacht Template-Bindings.

  async ngOnInit(): Promise<void> {
    const channel = this.surveyService.subscribeToSurveyInserts();
    this.destroyRef.onDestroy(() => this.surveyService.unsubscribeChannel(channel));
    try {
      await this.surveyService.loadSurveys();
    } catch {
      this.loadError.set('Surveys could not be loaded. Please try again later.');
    }
  }

  setTab(tab: 'active' | 'past'): void {
    // Methode, die vom Template aufgerufen wird, um den aktiven Tab zu wechseln.

    this.activeTab.set(tab);
    // Aktualisiert das activeTab-Signal mit dem übergebenen Tab-Wert.
  }

  setCategory(category: string | null): void {
    // Methode, die vom Template aufgerufen wird, um die aktive Kategorie zu setzen oder zurückzusetzen.

    this.selectedCategory.set(category);
    // Aktualisiert das selectedCategory-Signal mit der übergebenen Kategorie.
  }

  private matchesCategory(survey: { category: string | null }): boolean {
    // Hilfsmethode: prüft, ob eine Umfrage zur aktuell gewählten Kategorie passt.

    const cat = this.selectedCategory();
    // Liest den aktuellen Wert des Kategorie-Signals aus.

    return cat === null || survey.category === cat;
    // Gibt true zurück, wenn keine Kategorie gewählt ist oder die Umfrage zur gewählten Kategorie gehört.
  }

  private byDeadlineAsc(
    first: { deadline: string | null },
    second: { deadline: string | null },
  ): number {
    // Sortierfunktion: vergleicht zwei Umfragen anhand ihrer Deadline für aufsteigende Sortierung.

    if (!first.deadline && !second.deadline) return 0;
    // Wenn beide keine Deadline haben, sind sie gleichwertig.

    if (!first.deadline) return 1;
    // Umfragen ohne Deadline werden ans Ende sortiert.

    if (!second.deadline) return -1;
    // Umfragen mit Deadline werden vor Umfragen ohne Deadline einsortiert.

    return new Date(first.deadline).getTime() - new Date(second.deadline).getTime();
    // Berechnet die Differenz der Zeitstempel — eine negative Zahl bedeutet, first kommt zuerst.
  }
}
