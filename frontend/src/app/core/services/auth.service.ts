import { Injectable, signal, computed } from '@angular/core';

export interface User {
  id: string;
  email: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSignal = signal<User | null>(null);

  currentUser = this.currentUserSignal.asReadonly();
  isAuthenticated = computed(() => this.currentUserSignal() !== null);

  login(email: string, password: string): boolean {
    if (email && email.includes('@') && password) {
      const user: User = {
        id: '1',
        email: email,
        name: email.split('@')[0]
      };
      this.currentUserSignal.set(user);
      return true;
    }
    return false;
  }

  logout(): void {
    this.currentUserSignal.set(null);
  }
}
