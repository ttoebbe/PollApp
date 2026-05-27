# Project Claude Instructions

# Erweitert: ~/.claude/CLAUDE.md (globale Regeln gelten weiterhin)

## Projekttyp

Angular CLI + TypeScript + SCSS — DA Fullstack-Kurs (Poll App)

## Routing-Übersicht

| Route         | Komponente                  | Beschreibung                        |
| ------------- | --------------------------- | ----------------------------------- |
| `/`           | `HomePageComponent`         | Umfragen-Liste mit Tabs             |
| `/survey/:id` | `SurveyDetailPageComponent` | Detailansicht, Abstimmung, Ergebnis |
| `/create`     | `CreateSurveyPageComponent` | Neue Umfrage erstellen (Form)       |

## Projektstruktur

```
PollApp/
  src/
    app/
      layout/
        header/               → HeaderComponent (Logo, Navigation, "New Survey"-Button)
        footer/               → FooterComponent
      pages/                  → Geroutete Views (eine Komponente pro Route)
        home/                 → HomePageComponent (Liste + Tabs aktiv/abgeschlossen)
        survey-detail/        → SurveyDetailPageComponent (Vote + Live-Ergebnis)
        create-survey/        → CreateSurveyPageComponent (Reactive Form)
      shared/
        components/
          survey-card/        → SurveyCardComponent (Karte in der Umfragen-Liste)
          urgent-surveys/     → UrgentSurveysComponent (bald endende Umfragen oben)
          vote-options/       → VoteOptionsComponent (Abstimmungs-Buttons)
          results-bar/        → ResultsBarComponent (Balkenanzeige Auswertung)
        interfaces/
          survey.interface.ts
          option.interface.ts
        models/
          survey.model.ts     (mit getCleanAddJson() für Supabase INSERT)
          option.model.ts
        services/
          supabase.service.ts → createClient, Basismethoden
          survey.service.ts   → signal<Survey[]>, CRUD, Realtime-Subscription
      app.ts
      app.html
      app.scss
      app.config.ts
      app.routes.ts
    main.ts
    index.html
    environments/
      environment.ts          → Supabase URL + Key (nicht committen → .gitignore)
    styles/
      styles.scss             → Globale Styles, importiert abstracts
      abstracts/
        _variables.scss       → Design-Tokens (Farben, Abstände, Breakpoints)
        _mixins.scss          → respond(), flex-center(), px-to-rem()
        _index.scss           → @forward für alle abstracts
```

## Datenbankschema (Supabase)

### Tabelle `surveys`

| Spalte      | Typ       | Constraint         |
| ----------- | --------- | ------------------ |
| id          | uuid      | PK, default uuid() |
| title       | text      | NOT NULL           |
| description | text      | nullable           |
| deadline    | timestamp | nullable           |
| created_at  | timestamp | default now()      |

### Tabelle `options`

| Spalte     | Typ       | Constraint         |
| ---------- | --------- | ------------------ |
| id         | uuid      | PK, default uuid() |
| survey_id  | uuid      | FK → surveys.id    |
| label      | text      | NOT NULL           |
| vote_count | int       | default 0          |
| created_at | timestamp | default now()      |

Abstimmungslogik: `vote_count` per Supabase-Update inkrementieren.
Keine Auth → mehrfach abstimmen ist by design erlaubt.

## Supabase-Patterns

- Client: `createClient(URL, KEY)` einmalig in `supabase.service.ts`
- URL + KEY ausschließlich aus `environment.ts` — niemals hardcoded
- Realtime-Subscription:
  ```ts
  supabase
    .channel('options-changes')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'options' }, handler)
    .subscribe();
  ```
- INSERT ohne id: Model-Methode `getCleanAddJson()` gibt Objekt ohne `id`-Feld zurück
- Eigene Channels: `'survey-insert-channel'`, `'option-vote-channel'`
- Fehlerbehandlung: immer `{ data, error }` destructuren, `error` prüfen bevor `data` verwenden
- Subscription in `ngOnDestroy` / `DestroyRef` abmelden: `supabase.removeChannel(channel)`

## Reactive Forms (Formular-Strategie)

`CreateSurveyPageComponent` verwendet Reactive Forms:

```typescript
FormGroup {
  title:       FormControl<string>  // Pflicht, minLength(3)
  description: FormControl<string>  // optional
  deadline:    FormControl<string>  // optional (date input)
  options:     FormArray<FormControl<string>>  // mind. 2 Einträge, jede required
}
```

- Optionen per `FormArray` dynamisch hinzufügen/entfernen
- Custom Validator: mind. 2 Optionen müssen ausgefüllt sein
- Fehler-Anzeige: `markAllAsTouched()` beim Submit-Versuch
- Submit-Button: deaktiviert solange `form.invalid`

## Angular CLI Toolchain

- Scripts:
  ```json
  "start":  "ng serve -o",
  "build":  "ng build",
  "watch":  "ng build --watch --configuration development",
  "lint":   "ng lint"
  ```
- Entwicklung: `npm start` (HMR über Angular CLI)
- Neue Komponente: `ng generate component <pfad/name> --skip-tests`
- Neuer Service: `ng generate service <pfad/name> --skip-tests`
- Keine Testdateien — `--skip-tests` immer angeben

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators (default in Angular v20+)
- Use signals for state management
- Use `computed()` for derived state — niemals Logik direkt im Template
- `ChangeDetectionStrategy.OnPush` in **jeder** Komponente — keine Ausnahmen (auch layout/, shared/)
- Do NOT use `@HostBinding` / `@HostListener` — host-Objekt im Decorator verwenden
- Use `NgOptimizedImage` for all static images
- `DestroyRef` für Cleanup von Subscriptions (Supabase Channels, RxJS):
  ```typescript
  private readonly destroyRef = inject(DestroyRef);
  // im ngOnInit / Konstruktor:
  const channel = supabase.channel('...').subscribe();
  this.destroyRef.onDestroy(() => supabase.removeChannel(channel));
  ```
- `effect()` für reaktive Side Effects (z.B. localStorage-Sync):
  ```typescript
  effect(() => localStorage.setItem('key', JSON.stringify(this.data())));
  ```
- Utility-Funktionen aus Services im Template verfügbar machen:
  ```typescript
  readonly getOptionLetter = getOptionLetter; // importierte Funktion als Klassenmember
  ```

## Templates

- **Keine Logik im Template** — kein Array-Literal-Zugriff `[...][i]`, kein Ternär-Operator in `@for`
- Komplexe Ausdrücke als `computed()` oder Methode in TypeScript auslagern
- Duplizierte Template-Logik immer in eine Hilfsfunktion extrahieren
- Nur native Control Flow: `@if`, `@for`, `@switch` (kein `*ngIf`, `*ngFor`)
- Do NOT use `ngClass` → `class` bindings verwenden
- Do NOT use `ngStyle` → `style` bindings verwenden
- Do NOT use `*ngTemplateOutlet` — Template-Inhalt stattdessen in beide Branches duplizieren (bei kleinen Blöcken) oder Sub-Komponente erstellen

## SCSS: Projektstruktur

- Gemeinsame Tokens zentral in `abstracts/` — explizit per `@use` einbinden
- Mixins: `flex-center`, `respond` (Media Queries)
- Funktionen: `px-to-rem`
- Wenn vorhanden: bestehende Mixins/Funktionen nutzen, keine neuen einführen

## SCSS: Responsive

- Breakpoints als Map zentral verwalten — nicht hardcoden in Komponenten
- Media Queries ausschließlich über `respond`-Mixin
- Desktop-Layout bei Survey-Detail: Vote links, Ergebnis rechts (Breakpoint: 768px)

---

## Qualitäts-Check vor Abschluss

### TypeScript / Angular

- [ ] Alle Funktionen ≤ 14 Zeilen? (ohne JSDoc, schließende Klammern)
- [ ] `ChangeDetectionStrategy.OnPush` in **jeder** Komponente gesetzt?
- [ ] Keine Logik in HTML-Templates? (kein Array-Literal-Zugriff, kein Ternär-Operator im `@for`)
- [ ] Kein `*ngTemplateOutlet` verwendet?
- [ ] Keine duplizierte Template-Logik?
- [ ] Jedes HTML-Template ≤ 100 Zeilen?
- [ ] Utility-Funktionen als Klassenmember exponiert (nicht direkt im Template aufgerufen)?
- [ ] `npm run lint` ohne Fehler?
- [ ] `npm run build` ohne Fehler?

### CSS / SCSS

- [ ] `overflow` nicht auf `html` oder `body`?
- [ ] Keine Layout-Shifts beim Öffnen von Seiten oder Eingaben? (Browser-Test)
- [ ] Relative `@use`-Pfade korrekt?
- [ ] Namespace-Konsistenz (Alias = Aufruf)?
- [ ] Keine implizite Variablen-Sichtbarkeit zwischen Modulen?

### Accessibility

- [ ] Alle `<img>`-Tags mit aussagekräftigem `alt`-Text?
- [ ] Bedeutungstragende Bilder in `<figure>` + `<figcaption>`?
- [ ] AXE-Check bestanden (Browser DevTools → Accessibility)?
- [ ] Mindestschriftgröße 16px eingehalten?

### Testing / Daten

- [ ] Testdaten für alle UI-Zustände vorhanden? (leer, Fehler, abgelaufen, laden)
- [ ] Supabase-Channels in `DestroyRef` / `ngOnDestroy` abgemeldet?
- [ ] `environment.ts` in `.gitignore` eingetragen?

### Vor dem Commit

- [ ] `/code-review-self` ausgeführt?
- [ ] `npm run lint` fehlerfrei?
- [ ] `npm run build` fehlerfrei?
