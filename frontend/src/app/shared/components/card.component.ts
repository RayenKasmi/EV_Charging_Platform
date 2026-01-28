import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-lg shadow-md overflow-hidden">
      <div *ngIf="title || headerTemplate" class="px-6 py-4 border-b border-gray-200">
        <ng-container *ngIf="headerTemplate; else defaultHeader">
          <ng-container *ngTemplateOutlet="headerTemplate"></ng-container>
        </ng-container>
        <ng-template #defaultHeader>
          <h2 class="text-lg font-semibold text-gray-900">{{ title }}</h2>
        </ng-template>
      </div>

      <div class="px-6 py-4">
        <ng-content></ng-content>
      </div>

      <div *ngIf="footerTemplate" class="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <ng-container *ngTemplateOutlet="footerTemplate"></ng-container>
      </div>
    </div>
  `,
  styles: [],
})
export class CardComponent {
  @Input() title?: string;
  @Input() headerTemplate?: any;
  @Input() footerTemplate?: any;
}
