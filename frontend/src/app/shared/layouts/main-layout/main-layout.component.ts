import { Component, DestroyRef, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SidebarComponent } from './sidebar/sidebar.component';
import { HeaderComponent } from './header/header.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  template: `
    <div class="flex h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
      <app-sidebar></app-sidebar>

      <div class="flex-1 flex flex-col overflow-hidden">
        <app-header></app-header>

        <main class="flex-1 overflow-y-auto p-6">
          @if (noticeMessage()) {
            <div class="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
              {{ noticeMessage() }}
            </div>
          }

          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class MainLayoutComponent {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  noticeMessage = signal<string | null>(null);

  constructor() {
    this.setNoticeFromRoute();

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.setNoticeFromRoute());
  }

  private setNoticeFromRoute(): void {
    const message = this.router.routerState.snapshot.root.queryParams['error'] ?? null;
    this.noticeMessage.set(message);
  }
}
