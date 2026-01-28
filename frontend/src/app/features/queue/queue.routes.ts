import { Routes } from '@angular/router';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-queue',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <h2 class="text-2xl font-bold text-gray-900">Queue Management</h2>
      <div class="bg-white rounded-lg shadow-md overflow-hidden p-6">
        <p class="text-gray-600">Queue management and priority features coming soon...</p>
      </div>
    </div>
  `,
})
class QueueComponent {}

export const QUEUE_ROUTES: Routes = [
  {
    path: '',
    component: QueueComponent,
  },
];
