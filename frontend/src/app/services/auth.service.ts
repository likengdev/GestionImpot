import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { unwrapList } from '../utils/api.util';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  // Subject pour notifier les autres composants d'un changement de données
  private refreshDashboard$ = new BehaviorSubject<boolean>(false);
  dashboardRefresh$ = this.refreshDashboard$.asObservable();

  constructor(private http: HttpClient) {}

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/login/`, credentials).pipe(
      tap(response => {
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);
        const payload = JSON.parse(atob(response.access.split('.')[1]));
        localStorage.setItem('role', payload.role || 'gestionnaire');
        localStorage.setItem('username', payload.username || '');
        this.isLoggedInSubject.next(true);
      })
    );
  }

  logout(): void {
    const refresh = localStorage.getItem('refresh_token');
    if (refresh) {
      this.http.post(`${this.apiUrl}/auth/logout/`, { refresh }).subscribe({
        error: () => {}
      });
    }
    localStorage.clear();
    this.isLoggedInSubject.next(false);
  }

  // Appelé après création/paiement pour rafraîchir le dashboard
  notifierChangement(): void {
    this.refreshDashboard$.next(true);
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  hasToken(): boolean {
    return !!localStorage.getItem('access_token');
  }

  isAuthenticated(): boolean {
    return this.hasToken();
  }

  getRole(): string {
    return localStorage.getItem('role') || 'gestionnaire';
  }

  getUsername(): string {
    return localStorage.getItem('username') || 'Utilisateur';
  }

  estSuperAdmin(): boolean {
    return this.getRole() === 'superadmin';
  }

  estAdmin(): boolean {
    return ['superadmin', 'admin'].includes(this.getRole());
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register/`, data);
  }

  getUsers(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/users/`).pipe(
      map(data => unwrapList(data))
    );
  }

  toggleUserActive(id: number, activer: boolean): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/${id}/toggle-active/`, { activer });
  }
}