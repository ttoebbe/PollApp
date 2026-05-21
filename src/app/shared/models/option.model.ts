import type { Option } from '../interfaces/option.interface';

export class OptionModel implements Option {
  id: string;
  survey_id: string;
  question_id: string;
  label: string;
  vote_count: number;
  created_at: string;

  constructor(data: Option) {
    this.id = data.id;
    this.survey_id = data.survey_id;
    this.question_id = data.question_id;
    this.label = data.label;
    this.vote_count = data.vote_count;
    this.created_at = data.created_at;
  }

  getCleanAddJson(): Omit<Option, 'id' | 'created_at' | 'vote_count'> {
    return {
      survey_id: this.survey_id,
      question_id: this.question_id,
      label: this.label,
    };
  }

  getPercentage(totalVotes: number): number {
    if (totalVotes === 0) return 0;
    return Math.round((this.vote_count / totalVotes) * 100);
  }

  static letter(index: number): string {
    return String.fromCharCode(65 + index) + '.';
  }
}
