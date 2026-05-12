/** Repräsentiert eine Antwortoption aus der Supabase-Tabelle 'options' */
export interface Option {
  id: string;
  survey_id: string;
  label: string;
  vote_count: number;
  created_at: string;
}
