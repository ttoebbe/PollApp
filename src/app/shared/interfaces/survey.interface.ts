/** Repräsentiert eine Umfrage aus der Supabase-Tabelle 'surveys' */
export interface Survey {
  id: string;
  title: string;
  description: string | null;
  /** Kategorie (z.B. "Team activities") — Migration: ALTER TABLE surveys ADD COLUMN category text NULL */
  category: string | null;
  /** ISO-String oder null, wenn keine Frist gesetzt wurde */
  deadline: string | null;
  created_at: string;
}

/** Vordefinierte Kategorien für das Create-Survey-Dropdown */
export const SURVEY_CATEGORIES = [
  'Team activities',
  'Workplace culture',
  'Feedback',
  'Events',
  'Product',
  'Other',
] as const;

export type SurveyCategory = (typeof SURVEY_CATEGORIES)[number];
