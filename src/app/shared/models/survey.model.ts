import type { Survey } from '../interfaces/survey.interface';

/** Modell für eine Umfrage — kapselt Daten und Hilfsmethoden */
export class SurveyModel implements Survey {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  created_at: string;

  constructor(data: Survey) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.deadline = data.deadline;
    this.created_at = data.created_at;
  }

  /** Gibt ein Objekt ohne 'id' zurück — für Supabase INSERT benötigt */
  getCleanAddJson(): Omit<Survey, 'id' | 'created_at'> {
    return {
      title: this.title,
      description: this.description,
      deadline: this.deadline,
    };
  }

  /** Gibt true zurück, wenn die Deadline noch in der Zukunft liegt */
  isActive(): boolean {
    if (!this.deadline) return true;
    return new Date(this.deadline) > new Date();
  }

  /** Gibt true zurück, wenn die Deadline innerhalb der nächsten 48 Stunden endet */
  isUrgent(): boolean {
    if (!this.deadline) return false;
    const hoursLeft = (new Date(this.deadline).getTime() - Date.now()) / 36e5;
    return hoursLeft > 0 && hoursLeft <= 48;
  }
}
