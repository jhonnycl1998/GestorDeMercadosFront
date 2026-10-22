import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CambiarContrasena, LoginRequest, LoginResponse, UserRole } from '../models';

const TOKEN_KEY = 'gm_token';
const USER_KEY = 'gm_usuario';
const ROLE_KEY = 'gm_rol';
const DUENO_ID_KEY = 'gm_dueno_id';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = `${environment.apiUrl}/Usuario`;

  // Reactive state signals
  public currentUser = signal<string | null>(this.getStoredUser());
  public currentRole = signal<UserRole | null>(this.getStoredRole());
  public currentDuenoId = signal<number | null>(this.getStoredDuenoId());

  private getStoredUser(): string | null {
    return localStorage.getItem(USER_KEY);
  }

  private getStoredRole(): UserRole | null {
    return localStorage.getItem(ROLE_KEY) as UserRole | null;
  }

  private getStoredDuenoId(): number | null {
    const raw = localStorage.getItem(DUENO_ID_KEY);
    return raw !== null && raw !== 'null' && raw !== 'undefined' ? Number(raw) : null;
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        this.saveSession(res);
      })
    );
  }

  saveSession(res: LoginResponse): void {
    if (res.token) {
      localStorage.setItem(TOKEN_KEY, res.token);
    }
    if (res.usuario) {
      localStorage.setItem(USER_KEY, res.usuario);
      this.currentUser.set(res.usuario);
    }
    if (res.rol) {
      localStorage.setItem(ROLE_KEY, res.rol);
      this.currentRole.set(res.rol);
    }
const duenoId = res.duenoId;
if (duenoId !== undefined && duenoId !== null) {
  localStorage.setItem(DUENO_ID_KEY, duenoId.toString());
  this.currentDuenoId.set(duenoId);
    } else {
      localStorage.removeItem(DUENO_ID_KEY);
      this.currentDuenoId.set(null);
    }
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(DUENO_ID_KEY);

    this.currentUser.set(null);
    this.currentRole.set(null);
    this.currentDuenoId.set(null);

    this.router.navigate(['/login']);
  }

  cambiarContrasena(data: CambiarContrasena): Observable<any> {
    return this.http.put(`${this.apiUrl}/cambiarContrasena`, data);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getUser(): string | null {
    return this.currentUser();
  }

  getRole(): UserRole | null {
    return this.currentRole();
  }

  getDuenoId(): number | null {
    return this.currentDuenoId();
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    return this.currentRole() === 'Admin';
  }

  isUser(): boolean {
    return this.currentRole() === 'User';
  }
}
