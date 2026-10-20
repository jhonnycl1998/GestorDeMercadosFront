import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-user-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="user-layout d-flex flex-column min-vh-100">
      <!-- Top Navigation Bar -->
      <header class="navbar navbar-expand-lg navbar-dark bg-primary-mercado shadow-sm sticky-top">
        <div class="container">
          <a class="navbar-brand d-flex align-items-center gap-2 fw-bold" routerLink="/user/inicio">
            <div class="bg-white text-primary-mercado rounded-circle p-1 d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
              <i class="bi bi-shop-window fs-6"></i>
            </div>
            <span>Gestor de Mercados</span>
          </a>

          <button
            class="navbar-toggler border-0"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#userNavbarContent"
            aria-controls="userNavbarContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
            (click)="isMenuCollapsed = !isMenuCollapsed"
          >
            <i class="bi bi-list fs-3 text-white"></i>
          </button>

          <div class="collapse navbar-collapse" [class.show]="!isMenuCollapsed" id="userNavbarContent">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-3 gap-1">
              <li class="nav-item">
                <a class="nav-link text-white-50 px-2 py-1" routerLink="/user/inicio" routerLinkActive="active-user-link text-white fw-semibold" (click)="isMenuCollapsed = true">
                  <i class="bi bi-house me-1"></i> Inicio
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link text-white-50 px-2 py-1" routerLink="/user/mis-deudas" routerLinkActive="active-user-link text-white fw-semibold" (click)="isMenuCollapsed = true">
                  <i class="bi bi-cash-coin me-1"></i> Mis Deudas
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link text-white-50 px-2 py-1" routerLink="/user/mis-pagos" routerLinkActive="active-user-link text-white fw-semibold" (click)="isMenuCollapsed = true">
                  <i class="bi bi-receipt-cutoff me-1"></i> Mis Pagos / Voucher
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link text-white-50 px-2 py-1" routerLink="/user/cambiar-contrasena" routerLinkActive="active-user-link text-white fw-semibold" (click)="isMenuCollapsed = true">
                  <i class="bi bi-key me-1"></i> Cambiar Contraseña
                </a>
              </li>
            </ul>

            <div class="d-flex align-items-center gap-3 py-2 py-lg-0 border-top border-lg-0 border-white border-opacity-10">
              <div class="d-flex align-items-center gap-2 text-white">
                <div class="bg-white text-primary-mercado rounded-circle d-flex align-items-center justify-content-center fw-bold" style="width: 32px; height: 32px; font-size: 0.85rem;">
                  {{ (authService.getUser() || 'U').substring(0, 1).toUpperCase() }}
                </div>
                <div>
                  <div class="small fw-semibold lh-1">{{ authService.getUser() }}</div>
                  <span class="badge bg-success bg-opacity-50 text-white" style="font-size: 0.65rem;">Dueño</span>
                </div>
              </div>

              <button class="btn btn-sm btn-outline-light d-flex align-items-center gap-1" (click)="logout()">
                <i class="bi bi-box-arrow-right"></i>
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Body -->
      <main class="flex-grow-1 py-4 container">
        <router-outlet></router-outlet>
      </main>

      <!-- Footer -->
      <footer class="bg-white border-top py-3 text-center text-muted small mt-auto">
        <div class="container">
          Gestor de Mercados &copy; Sistema para Dueños de Puestos
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .user-layout {
      background-color: var(--bg-color);
    }
    .active-user-link {
      background-color: rgba(255, 255, 255, 0.15);
      border-radius: 0.375rem;
    }
  `]
})
export class UserLayoutComponent {
  authService = inject(AuthService);
  isMenuCollapsed = true;

  logout(): void {
    this.authService.logout();
  }
}
