import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from './button.component';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 class="text-lg font-semibold text-gray-900">{{ title }}</h2>
          <button
            (click)="onClose.emit()"
            class="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <div class="px-6 py-4">
          <ng-content></ng-content>
        </div>

        <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <app-button variant="secondary" (onClick)="onClose.emit()">
            {{ cancelButtonText }}
          </app-button>
          <app-button
            variant="primary"
            (onClick)="onConfirm.emit()"
            [disabled]="confirmDisabled"
          >
            {{ confirmButtonText }}
          </app-button>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title: string = '';
  @Input() confirmButtonText: string = 'Confirm';
  @Input() cancelButtonText: string = 'Cancel';
  @Input() confirmDisabled = false;
  @Output() onConfirm = new EventEmitter<void>();
  @Output() onClose = new EventEmitter<void>();
}
