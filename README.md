# Poll App

A real-time survey application — create polls with multiple questions, vote, and watch results update live.

![Angular](https://img.shields.io/badge/Angular-21-red?logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20Realtime-green?logo=supabase)
![SCSS](https://img.shields.io/badge/SCSS-abstracts--pattern-pink?logo=sass)

---

## About

Poll App lets users create surveys with multiple questions per poll, cast votes on active polls, and see live results — powered by Supabase Realtime. No authentication required; voting is open by design.

Built as part of the **DeveloperAkademie Fullstack Course**.

---

## Tech Stack

| Layer     | Technology                                               |
| --------- | -------------------------------------------------------- |
| Framework | Angular 21 (Standalone Components, Signals, OnPush)      |
| Language  | TypeScript 5.9 (strict mode)                             |
| Styling   | SCSS with abstracts pattern (mixins, variables)          |
| Backend   | Supabase (PostgreSQL + Realtime WebSocket)               |
| Tooling   | ESLint · Prettier · Husky pre-commit hooks · lint-staged |

---

## Getting Started

**Prerequisites:** Node >= 20, npm >= 11

```bash
# 1. Install dependencies
npm install

# 2. Create the environment file (see Environment Setup below)

# 3. Start the dev server
npm start
```

The app is available at `http://localhost:4200/`.

### Environment Setup

Create `src/environments/environment.ts` — this file is in `.gitignore` and must not be committed:

```ts
export const environment = {
  supabaseUrl: 'YOUR_SUPABASE_PROJECT_URL',
  supabaseKey: 'YOUR_SUPABASE_ANON_KEY',
};
```

---

## Available Scripts

| Command         | Description                               |
| --------------- | ----------------------------------------- |
| `npm start`     | Dev server with auto-open (`ng serve -o`) |
| `npm run build` | Production build → `dist/`                |
| `npm run watch` | Dev build with watch mode                 |
| `npm run lint`  | ESLint — 0 warnings allowed               |

---

## Routing

| Route             | Component      | Description                                             |
| ----------------- | -------------- | ------------------------------------------------------- |
| `/`               | `Home`         | Survey list with Active / Past tabs and category filter |
| `/survey/:number` | `SurveyDetail` | Detail view, multi-question voting, live results        |
| `/create`         | `CreateSurvey` | Create a new survey with dynamic multi-question form    |
| `/imprint`        | `Imprint`      | Legal imprint page                                      |
| `/**`             | —              | Redirect → `/`                                          |

---

## Project Structure

```
PollApp/
  src/
    app/
      layout/
        header/               → Header (logo, nav, "New Survey" button)
        footer/               → Footer
      pages/
        home/                 → Home (list + Active/Past tabs + category filter)
        survey-detail/        → SurveyDetail (vote + live results per question)
        create-survey/        → CreateSurvey (multi-question reactive form)
        imprint/              → Imprint (legal page)
      shared/
        components/
          logo/               → Logo (size configurable via input)
          survey-card/        → SurveyCard (card in survey list)
          urgent-surveys/     → UrgentSurveys (expiring soon, top 3)
          vote-options/       → VoteOptions (voting buttons per question)
          results-bar/        → ResultsBar (bar chart for results)
        interfaces/
          survey.interface.ts   Survey, SURVEY_CATEGORIES, SurveyCategory
          option.interface.ts   Option
          question.interface.ts Question
        services/
          supabase.ts           SupabaseService — singleton createClient wrapper
          survey.ts             SurveyService — signals + CRUD + helpers
        validators/
          survey.validators.ts  noWhitespaceValidator, futureDateValidator
      app.ts / app.html / app.scss / app.config.ts / app.routes.ts
    main.ts
    index.html
    environments/
      environment.ts          (not committed — listed in .gitignore)
    styles/
      styles.scss
      abstracts/
        _variables.scss       design tokens (colors, spacing, breakpoints)
        _mixins.scss          respond(), flex-center(), px-to-rem()
        _index.scss           @forward for all abstracts
```

---

## Database Schema

Three tables in Supabase (PostgreSQL):

### `surveys`

| Column          | Type      | Constraint                 |
| --------------- | --------- | -------------------------- |
| `id`            | uuid      | PK, default `uuid()`       |
| `survey_number` | int       | auto-increment             |
| `title`         | text      | NOT NULL                   |
| `description`   | text      | nullable                   |
| `category`      | text      | nullable                   |
| `deadline`      | timestamp | nullable                   |
| `status`        | text      | `'draft'` \| `'published'` |
| `created_at`    | timestamp | default `now()`            |

### `questions`

| Column           | Type      | Constraint           |
| ---------------- | --------- | -------------------- |
| `id`             | uuid      | PK, default `uuid()` |
| `survey_id`      | uuid      | FK → `surveys.id`    |
| `label`          | text      | NOT NULL             |
| `allow_multiple` | boolean   | default `false`      |
| `order_index`    | int       | NOT NULL             |
| `created_at`     | timestamp | default `now()`      |

### `options`

| Column        | Type      | Constraint           |
| ------------- | --------- | -------------------- |
| `id`          | uuid      | PK, default `uuid()` |
| `survey_id`   | uuid      | FK → `surveys.id`    |
| `question_id` | uuid      | FK → `questions.id`  |
| `label`       | text      | NOT NULL             |
| `vote_count`  | int       | default `0`          |
| `created_at`  | timestamp | default `now()`      |

Voting increments `vote_count` via Supabase update. No auth — multiple votes are allowed by design. Completed surveys are tracked in `localStorage`.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Angular App                          │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  Pages (Routed)                       │  │
│  │   Home  │  SurveyDetail  │  CreateSurvey  │  Imprint  │  │
│  └──────────────────────┬────────────────────────────────┘  │
│                         │ uses                              │
│  ┌──────────────────────▼────────────────────────────────┐  │
│  │              Shared Components                        │  │
│  │  Logo │ SurveyCard │ UrgentSurveys │ VoteOptions │ …  │  │
│  └──────────────────────┬────────────────────────────────┘  │
│                         │ inject()                          │
│  ┌──────────────────────▼────────────────────────────────┐  │
│  │         SurveyService  (Signals + CRUD)               │  │
│  │  signal<Survey[]>  signal<Question[]>  signal<Option[]>│  │
│  └──────────────────────┬────────────────────────────────┘  │
│                         │ inject()                          │
│  ┌──────────────────────▼────────────────────────────────┐  │
│  │              SupabaseService (singleton client)       │  │
│  └──────────────────────┬────────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────────┘
                          │ HTTP / WebSocket (Realtime)
                          ▼
                ┌───────────────────┐
                │     Supabase      │
                │  (PostgreSQL      │
                │   + Realtime)     │
                └───────────────────┘
```

---

## Key Files

### Bootstrap & Config

| File            | Description                                              |
| --------------- | -------------------------------------------------------- |
| `main.ts`       | App entry point — `bootstrapApplication(App, appConfig)` |
| `app.config.ts` | Global providers: `provideRouter`, error handlers        |
| `app.routes.ts` | Maps URL paths to page components                        |
| `app.ts`        | Root shell: `Header` + `<router-outlet>` + `Footer`      |

### Services

| File          | Description                                                          |
| ------------- | -------------------------------------------------------------------- |
| `supabase.ts` | Singleton `createClient` wrapper — all other services use this       |
| `survey.ts`   | Central state as signals + CRUD + Realtime subscription + helper fns |

### Interfaces

| File                    | Exports                                         |
| ----------------------- | ----------------------------------------------- |
| `survey.interface.ts`   | `Survey`, `SURVEY_CATEGORIES`, `SurveyCategory` |
| `option.interface.ts`   | `Option`                                        |
| `question.interface.ts` | `Question`                                      |

### Validators

| File                   | Exports                                        |
| ---------------------- | ---------------------------------------------- |
| `survey.validators.ts` | `noWhitespaceValidator`, `futureDateValidator` |

### Shared Components

| File                | Description                                                |
| ------------------- | ---------------------------------------------------------- |
| `logo.ts`           | App logo, size configurable via input (`sm` / `md` / `lg`) |
| `survey-card.ts`    | Survey list card — title, category, deadline               |
| `urgent-surveys.ts` | Highlights surveys expiring within 48 hours                |
| `vote-options.ts`   | Voting UI per question, emits selection via `output()`     |
| `results-bar.ts`    | Bar chart with live percentages per option                 |

### Pages

| File               | Description                                                          |
| ------------------ | -------------------------------------------------------------------- |
| `home.ts`          | Urgent banner + Active / Past tabs + category filter                 |
| `survey-detail.ts` | Vote card + results card, `localStorage` check for completed surveys |
| `create-survey.ts` | Reactive Form with `FormArray` for dynamic questions (2–8 options)   |
| `imprint.ts`       | Legal imprint page                                                   |
