import type { Survey } from '../interfaces/survey.interface';

/** Modell für eine Umfrage — kapselt Daten und Hilfsmethoden */
export class SurveyModel implements Survey {
  id: string;
  survey_number: number;
  title: string;
  description: string | null;
  category: string | null;
  deadline: string | null;
  created_at: string;

  constructor(data: Survey) {
    this.id = data.id;
    this.survey_number = data.survey_number;
    this.title = data.title;
    this.description = data.description;
    this.category = data.category ?? null;
    this.deadline = data.deadline;
    this.created_at = data.created_at;
  }

  /** Gibt ein Objekt ohne 'id' / 'survey_number' / 'created_at' zurück — für Supabase INSERT */
  getCleanAddJson(): Omit<Survey, 'id' | 'survey_number' | 'created_at'> {
    return {
      title: this.title,
      description: this.description,
      category: this.category,
      deadline: this.deadline,
    };
  }

  /** True, wenn die Deadline noch in der Zukunft liegt (oder fehlt) */
  isActive(): boolean {
    if (!this.deadline) return true;
    return new Date(this.deadline) > new Date();
  }

  /** True, wenn die Deadline innerhalb der nächsten 48 Stunden endet */
  isUrgent(): boolean {
    if (!this.deadline) return false;
    const hoursLeft = (new Date(this.deadline).getTime() - Date.now()) / 36e5;
    return hoursLeft > 0 && hoursLeft <= 48;
  }

  /**
   * Liefert einen kurzen, menschen­lesbaren Hinweis bis zum Ende.
   * Beispiele: "Ends in 5h", "Ends in 1 Day", "Ends in 12 Days", "Ended"
   */
  endsInLabel(): string {
    if (!this.deadline) return 'No deadline';
    const ms = new Date(this.deadline).getTime() - Date.now();
    if (ms <= 0) return 'Ended';
    const hours = Math.floor(ms / 36e5);
    if (hours < 24) return `Ends in ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Ends in ${days} Day${days === 1 ? '' : 's'}`;
  }
}
