import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TiendaService } from '../../../core/services/tienda.service';
import { DuenoService } from '../../../core/services/dueno.service';
import { DeudaService } from '../../../core/services/deuda.service';
import { PagoService } from '../../../core/services/pago.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { Deuda, Dueno, Pago, Tienda } from '../../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, RouterLink, LoadingComponent],
  template: `
    <div class="container-fluid p-0">
      <div class="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h3 class="fw-bold text-dark m-0">Dashboard General</h3>
          <p class="text-muted small m-0">Resumen y estado operativo del Mercado</p>
        </div>
        <button class="btn btn-outline-success btn-sm d-flex align-items-center gap-1" (click)="loadDashboardData()">
          <i class="bi bi-arrow-clockwise"></i>
          <span>Actualizar</span>
        </button>
      </div>

      @if (loading) {
        <app-loading message="Cargando estadísticas del mercado..."></app-loading>
      } @else {
        <!-- KPI Cards Grid -->
        <div class="row g-3 mb-4">
          <!-- Card Tiendas -->
          <div class="col-12 col-sm-6 col-xl-3">
            <div class="card h-100 card-hover border-start border-4 border-success p-3">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <span class="text-muted text-uppercase fw-semibold" style="font-size: 0.75rem;">Total Puestos</span>
                  <h3 class="fw-bold my-1 text-dark">{{ totalTiendas }}</h3>
                  <small class="text-secondary">
                    <span class="text-success fw-bold">{{ tiendasConDueno }}</span> con dueño ·
                    <span class="text-muted">{{ tiendasAsociacion }}</span> Asociación
                  </small>
                </div>
                <div class="bg-success bg-opacity-10 text-success p-3 rounded-circle">
                  <i class="bi bi-shop fs-3"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- Card Dueños -->
          <div class="col-12 col-sm-6 col-xl-3">
            <div class="card h-100 card-hover border-start border-4 border-primary p-3">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <span class="text-muted text-uppercase fw-semibold" style="font-size: 0.75rem;">Dueños Registrados</span>
                  <h3 class="fw-bold my-1 text-dark">{{ totalDuenos }}</h3>
                  <small class="text-secondary">Comerciantes y socios</small>
                </div>
                <div class="bg-primary bg-opacity-10 text-primary p-3 rounded-circle">
                  <i class="bi bi-people fs-3"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- Card Deudas Pendientes -->
          <div class="col-12 col-sm-6 col-xl-3">
            <div class="card h-100 card-hover border-start border-4 border-danger p-3">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <span class="text-muted text-uppercase fw-semibold" style="font-size: 0.75rem;">Deudas Pendientes</span>
                  <h3 class="fw-bold my-1 text-danger">{{ deudasPendientesCount }}</h3>
                  <small class="text-danger fw-semibold">
                    Total: S/. {{ montoTotalDeudaPendiente | number:'1.2-2' }}
                  </small>
                </div>
                <div class="bg-danger bg-opacity-10 text-danger p-3 rounded-circle">
                  <i class="bi bi-exclamation-circle fs-3"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- Card Pagos de Hoy -->
          <div class="col-12 col-sm-6 col-xl-3">
            <div class="card h-100 card-hover border-start border-4 border-info p-3">
              <div class="d-flex align-items-center justify-content-between">
                <div>
                  <span class="text-muted text-uppercase fw-semibold" style="font-size: 0.75rem;">Pagos de Hoy</span>
                  <h3 class="fw-bold my-1 text-info">{{ pagosHoyCount }}</h3>
                  <small class="text-success fw-semibold">
                    Recaudado: S/. {{ montoPagosHoy | number:'1.2-2' }}
                  </small>
                </div>
                <div class="bg-info bg-opacity-10 text-info p-3 rounded-circle">
                  <i class="bi bi-cash-stack fs-3"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Access Shortcuts -->
        <div class="row g-3 mb-4">
          <div class="col-12">
            <div class="card p-3">
              <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
                <span class="fw-semibold text-secondary small">Accesos rápidos:</span>
                <div class="d-flex flex-wrap gap-2">
                  <a routerLink="/admin/mapa-puestos" class="btn btn-sm btn-outline-success d-flex align-items-center gap-1">
                    <i class="bi bi-grid-3x3-gap"></i> Mapa de Puestos
                  </a>
                  <a routerLink="/admin/duenos" class="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1">
                    <i class="bi bi-person-plus"></i> Gestionar Dueños
                  </a>
                  <a routerLink="/admin/pagos" class="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1">
                    <i class="bi bi-receipt"></i> Registrar Pago
                  </a>
                  <a routerLink="/admin/deudas" class="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1">
                    <i class="bi bi-cash-coin"></i> Generar Deuda
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Pending Debts Table -->
        <div class="card shadow-sm mb-4">
          <div class="card-header bg-white py-3 d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-clock-history text-warning fs-5"></i>
              <h5 class="fw-bold m-0 text-dark">Últimas Deudas Pendientes de Cobro</h5>
            </div>
            <a routerLink="/admin/deudas" class="btn btn-sm btn-link text-decoration-none text-success fw-semibold p-0">
              Ver todas las deudas &rarr;
            </a>
          </div>
          <div class="card-body p-0">
            @if (ultimasDeudasPendientes.length === 0) {
              <div class="text-center py-5 text-muted">
                <i class="bi bi-check-circle text-success fs-1 mb-2 d-block"></i>
                <p class="m-0 fw-medium">No hay deudas pendientes registradas actualmente</p>
                <small>Todos los puestos están al día con sus pagos</small>
              </div>
            } @else {
              <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                  <thead class="table-light">
                    <tr>
                      <th class="ps-3">Puesto</th>
                      <th>Servicio</th>
                      <th>Monto</th>
                      <th>Fecha Límite</th>
                      <th>Estado</th>
                      <th class="text-end pe-3">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (deuda of ultimasDeudasPendientes; track deuda.id) {
                      <tr>
                        <td class="ps-3 fw-bold text-success">
                          Puesto {{ deuda.tiendaId }}
                        </td>
                        <td>
                          <span class="badge bg-light text-dark border">
                            {{ deuda.servicio?.nombre || ('Servicio #' + deuda.servicioId) }}
                          </span>
                        </td>
                        <td class="fw-semibold text-danger">
                          S/. {{ deuda.montoDeuda | number:'1.2-2' }}
                        </td>
                        <td>
                          <span class="small text-secondary">
                            {{ deuda.fechaLimitePago | date:'dd/MM/yyyy' }}
                          </span>
                        </td>
                        <td>
                          <span class="badge badge-pendiente">
                            {{ deuda.estado }}
                          </span>
                        </td>
                        <td class="text-end pe-3">
                          <a [routerLink]="['/admin/pagos']" [queryParams]="{ deudaId: deuda.id }" class="btn btn-sm btn-outline-success py-1 px-2">
                            <i class="bi bi-credit-card me-1"></i> Cobrar
                          </a>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private tiendaService = inject(TiendaService);
  private duenoService = inject(DuenoService);
  private deudaService = inject(DeudaService);
  private pagoService = inject(PagoService);

  loading = true;

  totalTiendas = 0;
  tiendasConDueno = 0;
  tiendasAsociacion = 0;
  totalDuenos = 0;
  deudasPendientesCount = 0;
  montoTotalDeudaPendiente = 0;
  pagosHoyCount = 0;
  montoPagosHoy = 0;

  ultimasDeudasPendientes: Deuda[] = [];

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;

    forkJoin({
      tiendas: this.tiendaService.getTiendas(),
      duenos: this.duenoService.getDuenos(),
      deudas: this.deudaService.getDeudas(),
      pagosHoy: this.pagoService.getReporteHoy()
    }).subscribe({
      next: ({ tiendas, duenos, deudas, pagosHoy }) => {
        // Tiendas
        this.totalTiendas = tiendas.length;
        this.tiendasConDueno = tiendas.filter(t => t.tieneDueno).length;
        this.tiendasAsociacion = tiendas.filter(t => !t.tieneDueno).length;

        // Dueños
        this.totalDuenos = duenos.length;

        // Deudas
        const pendientes = deudas.filter(d => d.estado === 'Pendiente');
        this.deudasPendientesCount = pendientes.length;
        this.montoTotalDeudaPendiente = pendientes.reduce((acc, curr) => acc + (curr.montoDeuda || 0), 0);
        this.ultimasDeudasPendientes = pendientes.slice(0, 7);

        // Pagos hoy
        this.pagosHoyCount = pagosHoy.length;
        this.montoPagosHoy = pagosHoy.reduce((acc, curr) => acc + (curr.montoPago || 0), 0);

        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
