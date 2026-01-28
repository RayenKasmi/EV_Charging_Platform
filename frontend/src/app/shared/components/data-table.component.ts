import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from './button.component';
import { BadgeComponent } from './badge.component';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  formatter?: (value: any) => string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, ButtonComponent, BadgeComponent],
  template: `
    <div class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead class="bg-gray-100">
          <tr>
            <th
              *ngFor="let column of columns"
              class="px-6 py-3 text-left text-sm font-semibold text-gray-700 border-b border-gray-300"
              [style.width]="column.width"
            >
              <button
                *ngIf="column.sortable"
                (click)="onSort.emit(column.key)"
                class="flex items-center gap-2 hover:text-gray-900"
              >
                {{ column.label }}
                <span *ngIf="sortKey === column.key" class="text-xs">
                  {{ sortDirection === 'asc' ? '↑' : '↓' }}
                </span>
              </button>
              <span *ngIf="!column.sortable">{{ column.label }}</span>
            </th>
            <th class="px-6 py-3 text-sm font-semibold text-gray-700 border-b border-gray-300">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            *ngFor="let row of data"
            class="border-b border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <td
              *ngFor="let column of columns"
              class="px-6 py-4 text-sm text-gray-900"
              [style.width]="column.width"
            >
              {{ column.formatter ? column.formatter(row[column.key]) : row[column.key] }}
            </td>
            <td class="px-6 py-4 text-sm">
              <div class="flex gap-2">
                <button
                  (click)="onEdit.emit(row)"
                  class="text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  Edit
                </button>
                <button
                  (click)="onDelete.emit(row)"
                  class="text-red-600 hover:text-red-800 font-medium text-sm"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div *ngIf="data.length === 0" class="text-center py-8 text-gray-500">
      <p>No data available</p>
    </div>
  `,
  styles: [],
})
export class DataTableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() sortKey?: string;
  @Input() sortDirection: 'asc' | 'desc' = 'asc';
  @Output() onSort = new EventEmitter<string>();
  @Output() onEdit = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();
}
