import type { Survey } from '../interfaces/survey.interface';

export class SurveyModel implements Survey {
  id: string;
  survey_number: number;
  title: string;
  description: string | null;
  category: string | null;
  deadline: string | null;
  status: 'draft' | 'published';
  created_at: string;

  constructor(data: Survey) {
    this.id = data.id;
    this.survey_number = data.survey_number;
    this.title = data.title;
    this.description = data.description;
    this.category = data.category ?? null;
    this.deadline = data.deadline;
    this.status = data.status ?? 'published';
    this.created_at = data.created_at;
  }

  getCleanAddJson(): Omit<Survey, 'id' | 'survey_number' | 'created_at'> {
    return {
      title: this.title,
      description: this.description,
      category: this.category,
      deadline: this.deadline,
      status: this.status,
    };
  }

  isActive(): boolean {
    if (!this.deadline) return true;
    return new Date(this.deadline) > new Date();
  }

  isUrgent(): boolean {
    if (!this.deadline) return false;
    const hoursLeft = (new Date(this.deadline).getTime() - Date.now()) / 36e5;
    return hoursLeft > 0 && hoursLeft <= 48;
  }

  endsInLabel(): string {
    if (!this.deadline) return 'No deadline';
    const ms = new Date(this.deadline).getTime() - Date.now();
    if (ms <= 0) return 'Ended';
    const hours = Math.floor(ms / 36e5);
    if (hours < 24) return `Ends in ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Ends in ${days} Day${days === 1 ? '' : 's'}`;
  }

  endsOnLabel(): string {
    if (!this.deadline) return '';
    return new Date(this.deadline).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
}
