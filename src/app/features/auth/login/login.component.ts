import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoginRequest } from '../../../core/models';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page d-flex align-items-center justify-content-center min-vh-100 p-3">
      <div class="card shadow-lg p-4 p-md-5 login-card">
        <div class="text-center mb-4">
          <div class="brand-icon mx-auto mb-3 d-flex align-items-center justify-content-center bg-primary-light text-primary-mercado rounded-circle">
            <i class="bi bi-shop-window fs-1"></i>
          </div>
          <h2 class="fw-bold text-primary-mercado mb-1">Gestor de Mercados</h2>
          <p class="text-muted small">Sistema de Administración de Puestos, Servicios y Pagos</p>
        </div>

        @if (errorMessage) {
          <div class="alert alert-danger d-flex align-items-center py-2 px-3 small" role="alert">
            <i class="bi bi-exclamation-octagon-fill me-2 fs-5"></i>
            <div>{{ errorMessage }}</div>
          </div>
        }

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
          <div class="mb-3">
            <label for="usuario" class="form-label fw-semibold text-secondary small">Usuario</label>
            <div class="input-group">
              <span class="input-group-text bg-light text-muted border-end-0">
                <i class="bi bi-person"></i>
              </span>
              <input
                type="text"
                id="usuario"
                name="usuario"
                class="form-control border-start-0 ps-0"
                placeholder="Ingresa tu usuario"
                [(ngModel)]="credentials.usuario"
                required
                [disabled]="isLoading"
              />
            </div>
          </div>

          <div class="mb-4">
            <label for="contrasena" class="form-label fw-semibold text-secondary small">Contraseña</label>
            <div class="input-group">
              <span class="input-group-text bg-light text-muted border-end-0">
                <i class="bi bi-lock"></i>
              </span>
              <input
                [type]="showPassword ? 'text' : 'password'"
                id="contrasena"
                name="contrasena"
                class="form-control border-start-0 border-end-0 ps-0"
                placeholder="Ingresa tu contraseña"
                [(ngModel)]="credentials.contrasena"
                required
                [disabled]="isLoading"
              />
              <button
                type="button"
                class="input-group-text bg-light text-muted border-start-0"
                (click)="showPassword = !showPassword"
              >
                <i class="bi" [ngClass]="showPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
              </button>
            </div>
          </div>

          <button
            type="submit"
            class="btn btn-success w-100 py-2 fw-semibold d-flex align-items-center justify-content-center"
            [disabled]="isLoading || !credentials.usuario || !credentials.contrasena"
          >
            @if (isLoading) {
              <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Iniciando sesión...
            } @else {
              <i class="bi bi-box-arrow-in-right me-2"></i>
              Iniciar Sesión
            }
          </button>
        </form>

        <div class="mt-4 pt-3 border-top text-center text-muted small">
          <div class="fw-semibold text-secondary mb-1">Acceso de prueba rápido:</div>
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary py-1 px-3 mt-1"
            (click)="fillCredentials('asociacion', 'Admin123!')"
            [disabled]="isLoading"
          >
            <i class="bi bi-shield-lock me-1"></i> Cargar Admin (Asociación)
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      background: linear-gradient(135deg, #f4f6f8 0%, #e8f5e9 100%);
    }
    .login-card {
      max-width: 440px;
      width: 100%;
      border-radius: 1rem;
    }
    .brand-icon {
      width: 72px;
      height: 72px;
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(ToastService);

  credentials: LoginRequest = {
    usuario: '',
    contrasena: ''
  };

  showPassword = false;
  isLoading = false;
  errorMessage = '';

  fillCredentials(user: string, pass: string): void {
    this.credentials.usuario = user;
    this.credentials.contrasena = pass;
    this.errorMessage = '';
  }

  onSubmit(): void {
    if (!this.credentials.usuario || !this.credentials.contrasena) {
      this.errorMessage = 'Por favor ingresa usuario y contraseña';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.credentials).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.toastService.success(res.mensaje || 'Bienvenido al sistema');
        
        if (res.rol === 'Admin') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/user/inicio']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err.error?.mensaje || err.error?.message || 'Credenciales incorrectas o servidor no disponible';
        this.errorMessage = msg;
        this.toastService.error(msg, 'Error al iniciar sesión');
      }
    });
  }
}
