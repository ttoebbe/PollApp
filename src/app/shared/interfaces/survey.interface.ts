/** Repräsentiert eine Umfrage aus der Supabase-Tabelle 'surveys' */
export interface Survey {
  id: string;
  title: string;
  description: string | null;
  /** ISO-String oder null, wenn keine Frist gesetzt wurde */
  deadline: string | null;
  created_at: string;
}
