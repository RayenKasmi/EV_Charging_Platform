import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeStatus = 'success' | 'warning' | 'error' | 'info' | 'secondary';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="getBadgeClass()">
      <ng-content></ng-content>
    </span>
  `,
  styles: [],
})
export class BadgeComponent {
  @Input() status: BadgeStatus = 'info';

  getBadgeClass(): string {
    const baseClass =
      'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium';

    const statusClasses: Record<BadgeStatus, string> = {
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      info: 'bg-blue-100 text-blue-800',
      secondary: 'bg-gray-100 text-gray-800',
    };

    return `${baseClass} ${statusClasses[this.status]}`;
  }
}
