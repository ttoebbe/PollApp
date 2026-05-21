import type { Question } from '../interfaces/question.interface';

export class QuestionModel implements Question {
  id: string;
  survey_id: string;
  label: string;
  allow_multiple: boolean;
  order_index: number;
  created_at: string;

  constructor(data: Question) {
    this.id = data.id;
    this.survey_id = data.survey_id;
    this.label = data.label;
    this.allow_multiple = data.allow_multiple;
    this.order_index = data.order_index;
    this.created_at = data.created_at;
  }

  getCleanAddJson(): Omit<Question, 'id' | 'created_at'> {
    return {
      survey_id: this.survey_id,
      label: this.label,
      allow_multiple: this.allow_multiple,
      order_index: this.order_index,
    };
  }
}
