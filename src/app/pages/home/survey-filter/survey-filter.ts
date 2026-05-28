import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-survey-filter',
  imports: [],
  templateUrl: './survey-filter.html',
  styleUrl: './survey-filter.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SurveyFilter {
  readonly activeTab = input.required<'active' | 'past'>();
  readonly selectedCategory = input<string | null>(null);
  readonly categories = input.required<readonly string[]>();

  readonly tabChange = output<'active' | 'past'>();
  readonly categoryChange = output<string | null>();

  readonly isDropdownOpen = signal(false);

  setTab(tab: 'active' | 'past'): void {
    this.isDropdownOpen.set(false);
    this.tabChange.emit(tab);
  }

  onTabKeydown(event: KeyboardEvent, current: 'active' | 'past'): void {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const next = current === 'active' ? 'past' : 'active';
    this.setTab(next);
    document.getElementById(next === 'active' ? 'tab-active' : 'tab-past')?.focus();
  }

  setCategory(category: string | null): void {
    this.isDropdownOpen.set(false);
    this.categoryChange.emit(category);
  }

  toggleDropdown(): void {
    this.isDropdownOpen.update((open) => !open);
  }
}
