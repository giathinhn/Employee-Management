import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;

  private currentUserSubject = new BehaviorSubject<AuthResponse | null>(this.getStoredUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {}

  private getStoredUser(): AuthResponse | null {
    const raw = localStorage.getItem('auth_user');
    if (!raw) return null;
    try {
      const user = JSON.parse(raw) as AuthResponse;
      if (new Date(user.expiresAt) <= new Date()) {
        localStorage.removeItem('auth_user');
        return null;
      }
      return user;
    } catch {
      localStorage.removeItem('auth_user');
      return null;
    }
  }

  get currentUser(): AuthResponse | null {
    return this.currentUserSubject.value;
  }

  get token(): string | null {
    return this.currentUser?.token || null;
  }

  get isAuthenticated(): boolean {
    return !!this.currentUser && new Date(this.currentUser.expiresAt) > new Date();
  }

  get role(): string {
    return this.currentUser?.role || 'Guest';
  }

  get isAdmin(): boolean {
    return this.role === 'Admin';
  }

  get isManager(): boolean {
    return this.role === 'Admin' || this.role === 'Manager';
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        localStorage.setItem('auth_user', JSON.stringify(res));
        this.currentUserSubject.next(res);
      })
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap(res => {
        localStorage.setItem('auth_user', JSON.stringify(res));
        this.currentUserSubject.next(res);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('auth_user');
    this.currentUserSubject.next(null);
  }
}
