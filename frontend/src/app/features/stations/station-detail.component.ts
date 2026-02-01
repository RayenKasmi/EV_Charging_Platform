import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-station-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold mb-4">Station Details</h2>
      <p>Station ID details will appear here.</p>
    </div>
  `
})
export class StationDetailComponent {}
