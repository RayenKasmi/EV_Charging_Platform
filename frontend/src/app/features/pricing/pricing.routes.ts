import { Routes } from '@angular/router';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <h2 class="text-2xl font-bold text-gray-900">Pricing Management</h2>
      <div class="bg-white rounded-lg shadow-md overflow-hidden p-6">
        <p class="text-gray-600">Pricing rules and management features coming soon...</p>
      </div>
    </div>
  `,
})
class PricingComponent {}

export const PRICING_ROUTES: Routes = [
  {
    path: '',
    component: PricingComponent,
  },
];
