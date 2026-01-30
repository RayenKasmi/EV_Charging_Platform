import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkMode = signal(this.getInitialTheme());
  isDarkMode = this.darkMode.asReadonly();

  constructor() {
    effect(() => {
      const isDark = this.darkMode();
      const html = document.documentElement;

      if (isDark) {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }

      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
  }

  toggleDarkMode(): void {
    this.darkMode.update(current => !current);
  }

  setDarkMode(isDark: boolean): void {
    this.darkMode.set(isDark);
  }

  private getInitialTheme(): boolean {
    if (typeof window === 'undefined') return false;

    const stored = localStorage.getItem('theme');
    if (stored) {
      return stored === 'dark';
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
