import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-center" [style.height.px]="size">
      <div
        [style.width.px]="size"
        [style.height.px]="size"
        class="animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"
      ></div>
    </div>
  `,
  styles: [],
})
export class SpinnerComponent {
  @Input() size: number = 40;
}
