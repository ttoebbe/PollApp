export interface Question {
  id: string;
  survey_id: string;
  label: string;
  allow_multiple: boolean;
  order_index: number;
  created_at: string;
}
