import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { DuenoService } from '../../../core/services/dueno.service';
import { DeudaService } from '../../../core/services/deuda.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { Deuda, Dueno, Tienda } from '../../../core/models';

@Component({
  selector: 'app-user-inicio',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, RouterLink, LoadingComponent],
  template: `
    <div class="user-inicio">
      <!-- Greeting Banner -->
      <div class="card bg-primary-mercado text-white p-4 mb-4 shadow-sm border-0">
        <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <div>
            <span class="badge bg-white text-primary-mercado mb-2 fw-bold">Panel del Comerciante</span>
            <h2 class="fw-bold mb-1">¡Hola, {{ duenoNombre || authService.getUser() }}!</h2>
            <p class="m-0 text-white-50">Bienvenido al sistema de administración de tus puestos y servicios del mercado</p>
          </div>
          <div class="d-flex gap-2">
            <a routerLink="/user/mis-deudas" class="btn btn-light text-success fw-bold d-flex align-items-center gap-2 px-3 py-2">
              <i class="bi bi-wallet2"></i>
              <span>Ver Mis Deudas</span>
            </a>
          </div>
        </div>
      </div>

      @if (loading) {
        <app-loading message="Cargando tus puestos y estado de cuenta..."></app-loading>
      } @else {
        <!-- KPI Summary Cards -->
        <div class="row g-3 mb-4">
          <!-- Total Tiendas Asignadas -->
          <div class="col-12 col-md-6">
            <div class="card h-100 p-4 border-start border-4 border-success">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <span class="text-muted text-uppercase fw-semibold small">Mis Puestos Asignados</span>
                  <h3 class="fw-bold my-1 text-dark">{{ misTiendas.length }}</h3>
                  <small class="text-secondary">Puestos comerciales bajo tu titularidad</small>
                </div>
                <div class="bg-success bg-opacity-10 text-success p-3 rounded-circle">
                  <i class="bi bi-shop fs-2"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- Total Deuda Pendiente -->
          <div class="col-12 col-md-6">
            <div class="card h-100 p-4 border-start border-4 border-danger">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <span class="text-muted text-uppercase fw-semibold small">Total Deuda Pendiente</span>
                  <h3 class="fw-bold my-1 text-danger">S/. {{ totalDeudaPendiente | number:'1.2-2' }}</h3>
                  <small class="text-danger fw-semibold">{{ misDeudas.length }} recibos pendientes por pagar</small>
                </div>
                <div class="bg-danger bg-opacity-10 text-danger p-3 rounded-circle">
                  <i class="bi bi-exclamation-triangle fs-2"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sección: Mis Puestos en el Mercado -->
        <div class="card shadow-sm mb-4">
          <div class="card-header bg-white py-3 d-flex align-items-center justify-content-between">
            <h5 class="fw-bold m-0 text-dark">
              <i class="bi bi-grid-fill text-success me-2"></i>Mis Puestos Comerciales
            </h5>
            <span class="badge bg-light text-secondary border">{{ misTiendas.length }} Puestos</span>
          </div>
          <div class="card-body">
            @if (misTiendas.length === 0) {
              <div class="text-center py-4 text-muted">
                <i class="bi bi-shop-window text-secondary fs-1 mb-2 d-block"></i>
                <p class="m-0 fw-medium">No tienes puestos asignados actualmente</p>
                <small>Comunícate con la Asociación para asignar puestos a tu cuenta</small>
              </div>
            } @else {
              <div class="row row-cols-1 row-cols-md-3 g-3">
                @for (tienda of misTiendas; track tienda.id) {
                  <div class="col">
                    <div class="card h-100 border p-3 bg-light">
                      <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="badge bg-success fs-6">Puesto #{{ tienda.id }}</span>
                        <span class="badge" [ngClass]="tienda.alquiler ? 'bg-primary' : 'bg-secondary'">
                          {{ tienda.alquiler ? 'Alquiler' : 'Propio' }}
                        </span>
                      </div>
                      <div class="mt-2 text-secondary small">
                        @if (tienda.alquiler) {
                          <div>Costo Alquiler: <strong class="text-dark">S/. {{ tienda.costoAlquiler | number:'1.2-2' }}</strong> /mes</div>
                        } @else {
                          <div>Puesto en régimen propio</div>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Deudas Urgentes / Próximas a Vencer -->
        @if (misDeudas.length > 0) {
          <div class="card shadow-sm mb-4">
            <div class="card-header bg-white py-3 d-flex align-items-center justify-content-between">
              <h5 class="fw-bold m-0 text-danger">
                <i class="bi bi-clock-history me-2"></i>Recibos Pendientes de Pago
              </h5>
              <a routerLink="/user/mis-deudas" class="btn btn-sm btn-outline-danger">
                Ver y Pagar Todos &rarr;
              </a>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                  <thead class="table-light">
                    <tr>
                      <th class="ps-3">Puesto</th>
                      <th>Servicio</th>
                      <th>Vence el</th>
                      <th>Monto</th>
                      <th class="text-end pe-3">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (deuda of misDeudas; track deuda.id) {
                      <tr>
                        <td class="ps-3 fw-bold">Puesto #{{ deuda.tiendaId }}</td>
                        <td>{{ deuda.servicio?.nombre || ('Servicio #' + deuda.servicioId) }}</td>
                        <td class="text-secondary small">{{ deuda.fechaLimitePago | date:'dd/MM/yyyy' }}</td>
                        <td class="fw-bold text-danger">S/. {{ deuda.montoDeuda | number:'1.2-2' }}</td>
                        <td class="text-end pe-3">
                          <a routerLink="/user/mis-deudas" class="btn btn-sm btn-success py-1 px-3">
                            <i class="bi bi-credit-card me-1"></i> Pagar
                          </a>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `
})
export class UserInicioComponent implements OnInit {
  authService = inject(AuthService);
  private duenoService = inject(DuenoService);
  private deudaService = inject(DeudaService);

  loading = true;
  duenoNombre = '';
  misTiendas: Tienda[] = [];
  misDeudas: Deuda[] = [];

  ngOnInit(): void {
    this.loadUserData();
  }

  loadUserData(): void {
    this.loading = true;
    const duenoId = this.authService.getDuenoId();

    if (!duenoId) {
      this.loading = false;
      return;
    }

    forkJoin({
      dueno: this.duenoService.getDueno(duenoId),
      deudas: this.deudaService.getDeudasPorDueno(duenoId)
    }).subscribe({
      next: ({ dueno, deudas }) => {
        if (dueno) {
          this.duenoNombre = `${dueno.nombre} ${dueno.apellido}`;
          this.misTiendas = dueno.tiendas || [];
        }
        this.misDeudas = deudas || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  get totalDeudaPendiente(): number {
    return this.misDeudas.reduce((sum, d) => sum + (d.montoDeuda || 0), 0);
  }
}
