import { Component, Input, Output, EventEmitter, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from './button.component';

export interface ToastConfig {
  id?: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number | boolean;
}

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  template: `
    <div class="fixed top-4 right-4 z-50 space-y-2">
      <div
        *ngFor="let toast of toasts()"
        [class]="getToastClass(toast.type)"
        class="px-4 py-3 rounded-lg shadow-lg text-white max-w-sm animate-in slide-in-from-top fade-in"
      >
        <div class="flex items-center justify-between gap-3">
          <span>{{ toast.message }}</span>
          <button
            (click)="removeToast(toast.id!)"
            class="text-white hover:text-gray-200 text-lg leading-none"
          >
            &times;
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class ToastComponent implements OnInit {
  toasts = signal<ToastConfig[]>([]);

  ngOnInit(): void {
    // Toast service will update this signal
  }

  addToast(config: ToastConfig): void {
    const id = config.id || `toast_${Date.now()}`;
    const toast = { ...config, id };
    this.toasts.update((toasts) => [...toasts, toast]);

    if (config.duration !== false && typeof config.duration === 'number') {
      setTimeout(() => {
        this.removeToast(id);
      }, config.duration);
    } else if (config.duration !== false) {
      setTimeout(() => {
        this.removeToast(id);
      }, 3000);
    }
  }

  removeToast(id: string): void {
    this.toasts.update((toasts) => toasts.filter((t) => t.id !== id));
  }

  getToastClass(type: string): string {
    const typeClasses: Record<string, string> = {
      success: 'bg-green-600',
      error: 'bg-red-600',
      info: 'bg-blue-600',
      warning: 'bg-yellow-600',
    };
    return typeClasses[type] || 'bg-gray-600';
  }
}
