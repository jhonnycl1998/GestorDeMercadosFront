import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  changeDetection:ChangeDetectionStrategy.Eager,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="admin-wrapper d-flex">
      <!-- Sidebar -->
      <aside class="admin-sidebar d-flex flex-column" [class.mobile-open]="sidebarOpen">
        <div class="sidebar-brand d-flex align-items-center justify-content-between p-3 border-bottom border-light border-opacity-10">
          <div class="d-flex align-items-center gap-2 text-white text-decoration-none">
            <div class="brand-logo-circle bg-white text-primary-mercado rounded-circle d-flex align-items-center justify-content-center">
              <i class="bi bi-shop-window fs-5"></i>
            </div>
            <div>
              <div class="fw-bold fs-6 lh-1">Gestor de Mercados</div>
              <small class="text-white-50" style="font-size: 0.72rem;">Panel Asociación</small>
            </div>
          </div>
          <button class="btn btn-sm btn-link text-white d-md-none" (click)="toggleSidebar()">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <nav class="sidebar-nav flex-grow-1 p-3">
          <ul class="nav flex-column gap-1">
            <li class="nav-item">
              <a class="nav-link" routerLink="/admin/dashboard" routerLinkActive="active" (click)="closeSidebarOnMobile()">
                <i class="bi bi-speedometer2 me-2"></i> Dashboard
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/admin/mapa-puestos" routerLinkActive="active" (click)="closeSidebarOnMobile()">
                <i class="bi bi-grid-3x3-gap-fill me-2"></i> Mapa de Puestos
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/admin/duenos" routerLinkActive="active" (click)="closeSidebarOnMobile()">
                <i class="bi bi-people-fill me-2"></i> Dueños
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/admin/servicios" routerLinkActive="active" (click)="closeSidebarOnMobile()">
                <i class="bi bi-card-checklist me-2"></i> Servicios
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/admin/deudas" routerLinkActive="active" (click)="closeSidebarOnMobile()">
                <i class="bi bi-cash-coin me-2"></i> Deudas
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/admin/pagos" routerLinkActive="active" (click)="closeSidebarOnMobile()">
                <i class="bi bi-receipt me-2"></i> Pagos
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" routerLink="/admin/usuarios" routerLinkActive="active" (click)="closeSidebarOnMobile()">
                <i class="bi bi-person-badge-fill me-2"></i> Usuarios
              </a>
            </li>
          </ul>
        </nav>

        <div class="sidebar-footer p-3 border-top border-light border-opacity-10 text-white-50 small">
          <div class="d-flex align-items-center justify-content-between">
            <span class="badge bg-success bg-opacity-25 text-white border border-success border-opacity-25 px-2 py-1">
              v1.0.0
            </span>
            <span>Mercado Central</span>
          </div>
        </div>
      </aside>

      <!-- Main Content Area -->
      <div class="admin-main flex-grow-1 d-flex flex-column min-vh-100">
        <!-- Top Navigation Bar -->
        <header class="admin-topbar navbar navbar-expand bg-white px-3 px-md-4 py-2 border-bottom shadow-sm sticky-top">
          <div class="container-fluid p-0">
            <button class="btn btn-outline-secondary btn-sm d-md-none me-2" (click)="toggleSidebar()">
              <i class="bi bi-list fs-5"></i>
            </button>

            <div class="d-flex align-items-center">
              <span class="fs-6 fw-semibold text-secondary d-none d-sm-inline">
                Administración General del Mercado
              </span>
            </div>

            <div class="d-flex align-items-center gap-3 ms-auto">
              <div class="user-info d-flex align-items-center gap-2">
                <div class="user-avatar rounded-circle bg-primary-light text-primary-mercado d-flex align-items-center justify-content-center fw-bold">
                  {{ (authService.getUser() || 'A').substring(0, 1).toUpperCase() }}
                </div>
                <div class="d-none d-sm-block text-end">
                  <div class="fw-semibold text-dark small lh-1">{{ authService.getUser() }}</div>
                  <span class="badge bg-success-subtle text-success border border-success-subtle py-0" style="font-size: 0.68rem;">
                    {{ authService.getRole() }}
                  </span>
                </div>
              </div>

              <div class="vr my-1"></div>

              <button class="btn btn-outline-danger btn-sm d-flex align-items-center gap-1" (click)="logout()" title="Cerrar sesión">
                <i class="bi bi-box-arrow-right"></i>
                <span class="d-none d-sm-inline">Cerrar sesión</span>
              </button>
            </div>
          </div>
        </header>

        <!-- Page Dynamic Body -->
        <main class="admin-content flex-grow-1 p-3 p-md-4">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Backdrop for mobile sidebar -->
      @if (sidebarOpen) {
        <div class="mobile-backdrop d-md-none" (click)="toggleSidebar()"></div>
      }
    </div>
  `,
  styles: [`
    .admin-wrapper {
      min-height: 100vh;
      overflow-x: hidden;
    }
    .admin-sidebar {
      width: 250px;
      min-width: 250px;
      background: #1e3a1f;
      color: #fff;
      transition: all 0.25s ease-in-out;
      z-index: 1040;
    }
    .brand-logo-circle {
      width: 36px;
      height: 36px;
    }
    .sidebar-nav .nav-link {
      color: rgba(255, 255, 255, 0.78);
      border-radius: 0.5rem;
      padding: 0.65rem 0.9rem;
      font-weight: 500;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
    }
    .sidebar-nav .nav-link:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.08);
    }
    .sidebar-nav .nav-link.active {
      color: #fff;
      background: #2e7d32;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }
    .admin-topbar {
      height: 60px;
    }
    .user-avatar {
      width: 34px;
      height: 34px;
      font-size: 0.85rem;
    }
    .admin-content {
      background-color: var(--bg-color);
    }
    @media (max-width: 767.98px) {
      .admin-sidebar {
        position: fixed;
        top: 0;
        bottom: 0;
        left: -250px;
      }
      .admin-sidebar.mobile-open {
        left: 0;
      }
      .mobile-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 1030;
      }
    }
  `]
})
export class AdminLayoutComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  sidebarOpen = false;

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebarOnMobile(): void {
    if (window.innerWidth < 768) {
      this.sidebarOpen = false;
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
