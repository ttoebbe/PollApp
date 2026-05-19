
export interface Survey {
  id: string;
  
  survey_number: number;
  title: string;
  description: string | null;
  
  category: string | null;
  
  deadline: string | null;
  created_at: string;
}

export const SURVEY_CATEGORIES = [
  'Team activities',
  'Workplace culture',
  'Feedback',
  'Events',
  'Product',
  'Other',
] as const;

export type SurveyCategory = (typeof SURVEY_CATEGORIES)[number];
