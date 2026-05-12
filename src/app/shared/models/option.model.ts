import type { Option } from '../interfaces/option.interface';

/** Modell für eine Antwortoption — kapselt Daten und Hilfsmethoden */
export class OptionModel implements Option {
  id: string;
  survey_id: string;
  label: string;
  vote_count: number;
  created_at: string;

  constructor(data: Option) {
    this.id = data.id;
    this.survey_id = data.survey_id;
    this.label = data.label;
    this.vote_count = data.vote_count;
    this.created_at = data.created_at;
  }

  /** Gibt ein Objekt ohne 'id' zurück — für Supabase INSERT benötigt */
  getCleanAddJson(): Omit<Option, 'id' | 'created_at' | 'vote_count'> {
    return {
      survey_id: this.survey_id,
      label: this.label,
    };
  }

  /** Berechnet den prozentualen Anteil dieser Option am Gesamtergebnis */
  getPercentage(totalVotes: number): number {
    if (totalVotes === 0) return 0;
    return Math.round((this.vote_count / totalVotes) * 100);
  }
}
