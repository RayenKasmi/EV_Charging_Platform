import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast.component';
import { ToastService } from './shared/services/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ToastComponent],
  template: `
    <app-toast #toastComponent></app-toast>
    <router-outlet></router-outlet>
  `,
  styles: [],
})
export class App implements OnInit {
  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    // Toast component will be injected
  }
}
