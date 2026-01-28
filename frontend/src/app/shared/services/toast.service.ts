import { Injectable, ViewContainerRef, signal } from '@angular/core';
import { ToastComponent, ToastConfig } from '../components/toast.component';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private toastComponent: ToastComponent | null = null;

  setToastComponent(component: ToastComponent): void {
    this.toastComponent = component;
  }

  showSuccess(message: string, duration: number = 3000): void {
    this.show({ message, type: 'success', duration });
  }

  showError(message: string, duration: number = 3000): void {
    this.show({ message, type: 'error', duration });
  }

  showInfo(message: string, duration: number = 3000): void {
    this.show({ message, type: 'info', duration });
  }

  showWarning(message: string, duration: number = 3000): void {
    this.show({ message, type: 'warning', duration });
  }

  show(config: ToastConfig): void {
    if (this.toastComponent) {
      this.toastComponent.addToast(config);
    }
  }
}
