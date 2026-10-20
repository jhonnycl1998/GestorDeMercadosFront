import { Component, OnInit, inject, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { DeudaService } from '../../../core/services/deuda.service';
import { TiendaService } from '../../../core/services/tienda.service';
import { ServicioService } from '../../../core/services/servicio.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { Deuda, DeudaEstado, Servicio, Tienda } from '../../../core/models';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-deudas',
  standalone: true,
  changeDetection:ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule, RouterLink, LoadingComponent, ConfirmModalComponent],
  template: `
    <div class="container-fluid p-0">
      <!-- Header -->
      <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h3 class="fw-bold text-dark m-0">Gestión de Deudas</h3>
          <p class="text-muted small m-0">Control de facturación, vencimientos y estado de deudas de los puestos</p>
        </div>
        <button class="btn btn-success d-flex align-items-center gap-2" (click)="openCreateModal()">
          <i class="bi bi-plus-circle-fill"></i>
          <span>Registrar Deuda</span>
        </button>
      </div>

      <!-- Filtros y Estado -->
      <div class="card shadow-sm mb-4">
        <div class="card-body p-3">
          <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
            <!-- Selector de filtro de estado -->
            <div class="btn-group btn-group-sm" role="group">
              <button
                type="button"
                class="btn"
                [ngClass]="filtroEstado === 'todos' ? 'btn-success' : 'btn-outline-secondary'"
                (click)="filtroEstado = 'todos'"
              >
                Todas ({{ deudas.length }})
              </button>
              <button
                type="button"
                class="btn"
                [ngClass]="filtroEstado === 'Pendiente' ? 'btn-warning text-dark' : 'btn-outline-warning text-dark'"
                (click)="filtroEstado = 'Pendiente'"
              >
                <i class="bi bi-clock-history me-1"></i> Pendientes ({{ countPendientes }})
              </button>
              <button
                type="button"
                class="btn"
                [ngClass]="filtroEstado === 'Pagado' ? 'btn-success' : 'btn-outline-success'"
                (click)="filtroEstado = 'Pagado'"
              >
                <i class="bi bi-check-circle me-1"></i> Pagadas ({{ countPagadas }})
              </button>
            </div>

            <!-- Total pendiente calculado -->
            <div class="text-secondary small">
              Total por cobrar: <strong class="text-danger fs-6">S/. {{ totalMontoPendiente | number:'1.2-2' }}</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla de Deudas -->
      @if (loading) {
        <app-loading message="Cargando listado de deudas..."></app-loading>
      } @else {
        <div class="card shadow-sm">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th class="ps-3">ID</th>
                  <th>Puesto</th>
                  <th>Servicio</th>
                  <th>Monto</th>
                  <th>Fecha Emisión</th>
                  <th>Fecha Límite</th>
                  <th>Estado</th>
                  <th class="text-end pe-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @if (filteredDeudas.length === 0) {
                  <tr>
                    <td colspan="8" class="text-center py-5 text-muted">
                      <i class="bi bi-cash-stack fs-1 text-secondary mb-2 d-block"></i>
                      <p class="m-0">No se encontraron deudas con el filtro seleccionado</p>
                    </td>
                  </tr>
                } @else {
                  @for (deuda of filteredDeudas; track deuda.id) {
                    <tr>
                      <td class="ps-3 fw-bold text-secondary">#{{ deuda.id }}</td>
                      <td>
                        <span class="badge bg-light text-dark border fw-bold">
                          <i class="bi bi-shop me-1 text-success"></i> Puesto {{ deuda.tiendaId }}
                        </span>
                      </td>
                      <td>
                        <span class="fw-semibold text-dark">
                          {{ deuda.servicio?.nombre || ('Servicio #' + deuda.servicioId) }}
                        </span>
                      </td>
                      <td class="fw-bold" [ngClass]="deuda.estado === 'Pendiente' ? 'text-danger' : 'text-success'">
                        S/. {{ deuda.montoDeuda | number:'1.2-2' }}
                      </td>
                      <td class="small text-secondary">{{ deuda.fechaFacturacion | date:'dd/MM/yyyy' }}</td>
                      <td class="small text-secondary fw-semibold">{{ deuda.fechaLimitePago | date:'dd/MM/yyyy' }}</td>
                      <td>
                        <span [ngClass]="deuda.estado === 'Pendiente' ? 'badge-pendiente' : 'badge-pagado'">
                          <i class="bi me-1" [ngClass]="deuda.estado === 'Pendiente' ? 'bi-hourglass-split' : 'bi-check-all'"></i>
                          {{ deuda.estado }}
                        </span>
                      </td>
                      <td class="text-end pe-3">
                        <div class="btn-group btn-group-sm">
                          @if (deuda.estado === 'Pendiente') {
                            <a [routerLink]="['/admin/pagos']" [queryParams]="{ deudaId: deuda.id }" class="btn btn-outline-success" title="Registrar Pago">
                              <i class="bi bi-credit-card"></i> Cobrar
                            </a>
                          }
                          <button class="btn btn-outline-secondary" (click)="openEditModal(deuda)" title="Editar">
                            <i class="bi bi-pencil"></i>
                          </button>
                          <button class="btn btn-outline-danger" (click)="askDelete(deuda)" title="Eliminar">
                            <i class="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Modal Crear Deuda -->
      @if (showCreateModal) {
        <div class="modal-backdrop-custom" (click)="onBackdropClick($event, 'create')">
          <div class="modal-content-custom p-4">
            <div class="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
              <h5 class="fw-bold m-0 text-dark">Registrar Nueva Deuda</h5>
              <button type="button" class="btn-close" (click)="showCreateModal = false"></button>
            </div>

            <form (ngSubmit)="saveDeuda()" #createForm="ngForm">
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label small fw-semibold">Puesto / Tienda *</label>
                  <select class="form-select" name="tiendaId" [(ngModel)]="newDeuda.tiendaId" required>
                    <option [ngValue]="0" disabled>-- Selecciona Puesto --</option>
                    @for (t of tiendas; track t.id) {
                      <option [ngValue]="t.id">
                        Puesto #{{ t.id }} ({{ t.tieneDueno ? 'Con dueño' : 'Asociación' }})
                      </option>
                    }
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label small fw-semibold">Servicio *</label>
                  <select class="form-select" name="servicioId" [(ngModel)]="newDeuda.servicioId" (change)="onServicioSelect(newDeuda.servicioId)" required>
                    <option [ngValue]="0" disabled>-- Selecciona Servicio --</option>
                    @for (s of servicios; track s.id) {
                      <option [ngValue]="s.id">
                        {{ s.nombre }} (S/. {{ s.costo | number:'1.2-2' }})
                      </option>
                    }
                  </select>
                </div>

                <div class="col-12">
                  <label class="form-label small fw-semibold">Monto de la Deuda (S/.) *</label>
                  <div class="input-group">
                    <span class="input-group-text">S/.</span>
                    <input type="number" class="form-control" name="montoDeuda" [(ngModel)]="newDeuda.montoDeuda" min="0.01" step="0.01" required />
                  </div>
                </div>

                <div class="col-md-6">
                  <label class="form-label small fw-semibold">Fecha de Emisión *</label>
                  <input type="date" class="form-control" name="fechaFacturacion" [(ngModel)]="newDeuda.fechaFacturacion" required />
                </div>

                <div class="col-md-6">
                  <label class="form-label small fw-semibold">Fecha Límite de Pago *</label>
                  <input type="date" class="form-control" name="fechaLimitePago" [(ngModel)]="newDeuda.fechaLimitePago" required />
                </div>
              </div>

              <div class="alert alert-light border small text-muted">
                <i class="bi bi-info-circle me-1"></i> La deuda se registrará inicialmente con estado <strong>Pendiente</strong>.
              </div>

              <div class="d-flex justify-content-end gap-2 pt-3 border-top">
                <button type="button" class="btn btn-outline-secondary px-4" (click)="showCreateModal = false" [disabled]="submitting">
                  Cancelar
                </button>
                <button type="submit" class="btn btn-success px-4" [disabled]="submitting || !newDeuda.tiendaId || !newDeuda.servicioId || !newDeuda.montoDeuda">
                  @if (submitting) {
                    <span class="spinner-border spinner-border-sm me-2"></span>
                    Guardando...
                  } @else {
                    <i class="bi bi-check2-circle me-1"></i> Registrar Deuda
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Modal Editar Deuda -->
      @if (selectedDeudaToEdit) {
        <div class="modal-backdrop-custom" (click)="onBackdropClick($event, 'edit')">
          <div class="modal-content-custom p-4">
            <div class="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
              <h5 class="fw-bold m-0 text-dark">Editar Deuda #{{ selectedDeudaToEdit.id }}</h5>
              <button type="button" class="btn-close" (click)="selectedDeudaToEdit = null"></button>
            </div>

            <form (ngSubmit)="updateDeuda()" #editForm="ngForm">
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label small fw-semibold">Puesto *</label>
                  <select class="form-select" name="tiendaIdEdit" [(ngModel)]="editDeudaData.tiendaId" required>
                    @for (t of tiendas; track t.id) {
                      <option [ngValue]="t.id">Puesto #{{ t.id }}</option>
                    }
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label small fw-semibold">Servicio *</label>
                  <select class="form-select" name="servicioIdEdit" [(ngModel)]="editDeudaData.servicioId" required>
                    @for (s of servicios; track s.id) {
                      <option [ngValue]="s.id">{{ s.nombre }}</option>
                    }
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label small fw-semibold">Monto (S/.) *</label>
                  <div class="input-group">
                    <span class="input-group-text">S/.</span>
                    <input type="number" class="form-control" name="montoDeudaEdit" [(ngModel)]="editDeudaData.montoDeuda" min="0.01" step="0.01" required />
                  </div>
                </div>

                <div class="col-md-6">
                  <label class="form-label small fw-semibold">Estado *</label>
                  <select class="form-select" name="estadoEdit" [(ngModel)]="editDeudaData.estado" required>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Pagado">Pagado</option>
                  </select>
                </div>

                <div class="col-md-6">
                  <label class="form-label small fw-semibold">Fecha de Facturación *</label>
                  <input type="date" class="form-control" name="fechaFacturacionEdit" [(ngModel)]="editDeudaData.fechaFacturacion" required />
                </div>

                <div class="col-md-6">
                  <label class="form-label small fw-semibold">Fecha Límite de Pago *</label>
                  <input type="date" class="form-control" name="fechaLimitePagoEdit" [(ngModel)]="editDeudaData.fechaLimitePago" required />
                </div>
              </div>

              <div class="d-flex justify-content-end gap-2 pt-3 border-top">
                <button type="button" class="btn btn-outline-secondary px-4" (click)="selectedDeudaToEdit = null" [disabled]="submitting">
                  Cancelar
                </button>
                <button type="submit" class="btn btn-success px-4" [disabled]="submitting || !editForm.valid">
                  @if (submitting) {
                    <span class="spinner-border spinner-border-sm me-2"></span>
                    Actualizando...
                  } @else {
                    <i class="bi bi-check2-circle me-1"></i> Guardar Cambios
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Modal de Confirmación de Eliminación -->
      <app-confirm-modal
        [isOpen]="showDeleteModal"
        title="Eliminar Deuda"
        [message]="deleteMessage"
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        [isDanger]="true"
        [loading]="submitting"
        (confirm)="confirmDelete()"
        (cancel)="showDeleteModal = false"
      ></app-confirm-modal>
    </div>
  `
})
export class DeudasComponent implements OnInit {
  private deudaService = inject(DeudaService);
  private tiendaService = inject(TiendaService);
  private servicioService = inject(ServicioService);
  private toastService = inject(ToastService);

  loading = true;
  submitting = false;

  deudas: Deuda[] = [];
  tiendas: Tienda[] = [];
  servicios: Servicio[] = [];

  filtroEstado: 'todos' | 'Pendiente' | 'Pagado' = 'todos';

  showCreateModal = false;
  selectedDeudaToEdit: Deuda | null = null;

  newDeuda: {
    tiendaId: number;
    servicioId: number;
    montoDeuda: number;
    fechaFacturacion: string;
    fechaLimitePago: string;
    estado: DeudaEstado;
  } = {
    tiendaId: 0,
    servicioId: 0,
    montoDeuda: 0,
    fechaFacturacion: new Date().toISOString().split('T')[0],
    fechaLimitePago: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    estado: 'Pendiente'
  };

  editDeudaData: {
    id: number;
    tiendaId: number;
    servicioId: number;
    montoDeuda: number;
    fechaFacturacion: string;
    fechaLimitePago: string;
    estado: DeudaEstado;
  } = {
    id: 0,
    tiendaId: 0,
    servicioId: 0,
    montoDeuda: 0,
    fechaFacturacion: '',
    fechaLimitePago: '',
    estado: 'Pendiente'
  };

  showDeleteModal = false;
  deudaToDelete: Deuda | null = null;
  deleteMessage = '';

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    forkJoin({
      deudas: this.deudaService.getDeudas(),
      tiendas: this.tiendaService.getTiendas(),
      servicios: this.servicioService.getServicios()
    }).subscribe({
      next: ({ deudas, tiendas, servicios }) => {
        this.deudas = deudas.sort((a, b) => b.id - a.id);
        this.tiendas = tiendas.sort((a, b) => a.id - b.id);
        this.servicios = servicios;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastService.error('Error al cargar la información de deudas');
      }
    });
  }

  get filteredDeudas(): Deuda[] {
    if (this.filtroEstado === 'todos') {
      return this.deudas;
    }
    return this.deudas.filter(d => d.estado === this.filtroEstado);
  }

  get countPendientes(): number {
    return this.deudas.filter(d => d.estado === 'Pendiente').length;
  }

  get countPagadas(): number {
    return this.deudas.filter(d => d.estado === 'Pagado').length;
  }

  get totalMontoPendiente(): number {
    return this.deudas
      .filter(d => d.estado === 'Pendiente')
      .reduce((sum, d) => sum + (d.montoDeuda || 0), 0);
  }

  openCreateModal(): void {
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    this.newDeuda = {
      tiendaId: 0,
      servicioId: 0,
      montoDeuda: 0,
      fechaFacturacion: today,
      fechaLimitePago: dueDate,
      estado: 'Pendiente'
    };
    this.showCreateModal = true;
  }

  onServicioSelect(servicioId: number): void {
    const s = this.servicios.find(item => item.id === servicioId);
    if (s) {
      this.newDeuda.montoDeuda = s.costo;
    }
  }

  saveDeuda(): void {
    if (!this.newDeuda.tiendaId || !this.newDeuda.servicioId || this.newDeuda.montoDeuda <= 0) {
      this.toastService.warning('Por favor completa todos los campos requeridos correctamente');
      return;
    }

    this.submitting = true;
    const payload = {
      tiendaId: this.newDeuda.tiendaId,
      servicioId: this.newDeuda.servicioId,
      montoDeuda: Number(this.newDeuda.montoDeuda),
      fechaFacturacion: new Date(this.newDeuda.fechaFacturacion).toISOString(),
      fechaLimitePago: new Date(this.newDeuda.fechaLimitePago).toISOString(),
      estado: 'Pendiente' as DeudaEstado
    };

    this.deudaService.saveDeuda(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.toastService.success('Deuda registrada correctamente');
        this.showCreateModal = false;
        this.loadData();
      },
      error: (err) => {
        this.submitting = false;
        const msg = err.error?.mensaje || 'Error al registrar la deuda';
        this.toastService.error(msg);
      }
    });
  }

  openEditModal(deuda: Deuda): void {
    this.selectedDeudaToEdit = deuda;
    this.editDeudaData = {
      id: deuda.id,
      tiendaId: deuda.tiendaId,
      servicioId: deuda.servicioId,
      montoDeuda: deuda.montoDeuda,
      fechaFacturacion: deuda.fechaFacturacion ? deuda.fechaFacturacion.split('T')[0] : '',
      fechaLimitePago: deuda.fechaLimitePago ? deuda.fechaLimitePago.split('T')[0] : '',
      estado: deuda.estado
    };
  }

  updateDeuda(): void {
    if (!this.selectedDeudaToEdit) return;

    this.submitting = true;
    const payload: Deuda = {
      id: this.editDeudaData.id,
      tiendaId: this.editDeudaData.tiendaId,
      servicioId: this.editDeudaData.servicioId,
      montoDeuda: Number(this.editDeudaData.montoDeuda),
      fechaFacturacion: new Date(this.editDeudaData.fechaFacturacion).toISOString(),
      fechaLimitePago: new Date(this.editDeudaData.fechaLimitePago).toISOString(),
      estado: this.editDeudaData.estado
    };

    this.deudaService.updateDeuda(payload).subscribe({
      next: () => {
        this.submitting = false;
        this.toastService.success('Deuda actualizada con éxito');
        this.selectedDeudaToEdit = null;
        this.loadData();
      },
      error: (err) => {
        this.submitting = false;
        const msg = err.error?.mensaje || 'Error al actualizar la deuda';
        this.toastService.error(msg);
      }
    });
  }

  askDelete(deuda: Deuda): void {
    this.deudaToDelete = deuda;
    this.deleteMessage = `¿Estás seguro de eliminar la deuda <strong>#${deuda.id}</strong> del Puesto #${deuda.tiendaId} por S/. ${deuda.montoDeuda}?`;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.deudaToDelete) return;

    this.submitting = true;
    this.deudaService.deleteDeuda(this.deudaToDelete.id).subscribe({
      next: () => {
        this.submitting = false;
        this.toastService.success('Deuda eliminada correctamente');
        this.showDeleteModal = false;
        this.deudaToDelete = null;
        this.loadData();
      },
      error: (err) => {
        this.submitting = false;
        const msg = err.error?.mensaje || 'Error al eliminar la deuda';
        this.toastService.error(msg);
      }
    });
  }

  onBackdropClick(event: MouseEvent, type: string): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop-custom')) {
      if (type === 'create') this.showCreateModal = false;
      if (type === 'edit') this.selectedDeudaToEdit = null;
    }
  }
}
