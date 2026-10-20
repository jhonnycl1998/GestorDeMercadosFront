import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServicioService } from '../../../core/services/servicio.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { Servicio } from '../../../core/models';

@Component({
  selector: 'app-servicios',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule, LoadingComponent, ConfirmModalComponent],
  template: `
    <div class="container-fluid p-0">
      <!-- Header -->
      <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h3 class="fw-bold text-dark m-0">Servicios del Mercado</h3>
          <p class="text-muted small m-0">Tarifas y días de corte de servicios básicos y mantenimiento</p>
        </div>
        <button class="btn btn-success d-flex align-items-center gap-2" (click)="openCreateModal()">
          <i class="bi bi-plus-circle-fill"></i>
          <span>Nuevo Servicio</span>
        </button>
      </div>

      <!-- Info alert sobre generación automática de deudas -->
      <div class="alert alert-light border shadow-sm d-flex align-items-center py-2 px-3 mb-4 text-secondary small">
        <i class="bi bi-info-circle-fill text-success fs-5 me-2"></i>
        <div>
          Las deudas de cada servicio se generan automáticamente cada mes según el <strong>día de corte</strong> establecido para cada puesto activo.
        </div>
      </div>

      @if (loading) {
        <app-loading message="Cargando servicios del mercado..."></app-loading>
      } @else {
        <!-- Grid de Servicios -->
        <div class="row g-3 mb-4">
          @if (servicios.length === 0) {
            <div class="col-12">
              <div class="card p-5 text-center text-muted">
                <i class="bi bi-card-checklist fs-1 mb-2 d-block text-secondary"></i>
                <p class="m-0 fw-medium">No hay servicios registrados en el mercado</p>
                <small>Haz clic en "Nuevo Servicio" para agregar uno</small>
              </div>
            </div>
          } @else {
            @for (servicio of servicios; track servicio.id) {
              <div class="col-12 col-md-6 col-lg-4">
                <div class="card h-100 card-hover p-3 border-top border-4 border-success">
                  <div class="d-flex align-items-start justify-content-between mb-2">
                    <div class="d-flex align-items-center gap-2">
                      <div class="p-2 rounded-circle bg-success bg-opacity-10 text-success">
                        <i class="bi bi-droplet-half fs-4"></i>
                      </div>
                      <div>
                        <h5 class="fw-bold m-0 text-dark">{{ servicio.nombre }}</h5>
                        <small class="text-muted">Servicio ID #{{ servicio.id }}</small>
                      </div>
                    </div>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-secondary" (click)="openEditModal(servicio)" title="Editar servicio">
                        <i class="bi bi-pencil"></i>
                      </button>
                      <button class="btn btn-outline-danger" (click)="askDelete(servicio)" title="Eliminar servicio">
                        <i class="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>

                  <div class="mt-3 pt-3 border-top d-flex justify-content-between align-items-center">
                    <div>
                      <span class="text-muted d-block small">Tarifa Mensual</span>
                      <span class="fs-4 fw-bold text-success">S/. {{ servicio.costo | number:'1.2-2' }}</span>
                    </div>
                    <div class="text-end">
                      <span class="text-muted d-block small">Día de Corte</span>
                      <span class="badge bg-light text-dark border px-2 py-1 fs-6">
                        <i class="bi bi-calendar-event me-1 text-secondary"></i> Día {{ servicio.diaCorte }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            }
          }
        </div>
      }

      <!-- Modal Crear / Editar Servicio -->
      @if (showModal) {
        <div class="modal-backdrop-custom" (click)="onBackdropClick($event)">
          <div class="modal-content-custom p-4">
            <div class="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
              <h5 class="fw-bold m-0 text-dark">
                {{ isEditing ? 'Editar Servicio #' + formData.id : 'Registrar Nuevo Servicio' }}
              </h5>
              <button type="button" class="btn-close" (click)="showModal = false"></button>
            </div>

            <form (ngSubmit)="saveServicio()" #servForm="ngForm">
              <div class="mb-3">
                <label class="form-label small fw-semibold">Nombre del Servicio *</label>
                <input
                  type="text"
                  class="form-control"
                  name="nombre"
                  [(ngModel)]="formData.nombre"
                  placeholder="Ej: Agua y Alcantarillado, Limpieza, Seguridad..."
                  required
                />
              </div>

              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label small fw-semibold">Costo Mensual (S/.) *</label>
                  <div class="input-group">
                    <span class="input-group-text">S/.</span>
                    <input
                      type="number"
                      class="form-control"
                      name="costo"
                      [(ngModel)]="formData.costo"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                <div class="col-md-6">
                  <label class="form-label small fw-semibold">Día de Corte Mensual (1 - 31) *</label>
                  <input
                    type="number"
                    class="form-control"
                    name="diaCorte"
                    [(ngModel)]="formData.diaCorte"
                    min="1"
                    max="31"
                    required
                  />
                  <small class="text-muted" style="font-size: 0.72rem;">Día del mes en que vence el servicio</small>
                </div>
              </div>

              <div class="d-flex justify-content-end gap-2 pt-3 border-top">
                <button type="button" class="btn btn-outline-secondary px-4" (click)="showModal = false" [disabled]="submitting">
                  Cancelar
                </button>
                <button type="submit" class="btn btn-success px-4" [disabled]="submitting || !servForm.valid">
                  @if (submitting) {
                    <span class="spinner-border spinner-border-sm me-2"></span>
                    Guardando...
                  } @else {
                    <i class="bi bi-check2-circle me-1"></i> Guardar
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
        title="Eliminar Servicio"
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
export class ServiciosComponent implements OnInit {
  private servicioService = inject(ServicioService);
  private toastService = inject(ToastService);

  loading = true;
  submitting = false;

  servicios: Servicio[] = [];

  showModal = false;
  isEditing = false;
  formData: { id?: number; nombre: string; costo: number; diaCorte: number } = {
    nombre: '',
    costo: 0,
    diaCorte: 15
  };

  showDeleteModal = false;
  servicioToDelete: Servicio | null = null;
  deleteMessage = '';

  ngOnInit(): void {
    this.loadServicios();
  }

  loadServicios(): void {
    this.loading = true;
    this.servicioService.getServicios().subscribe({
      next: (data) => {
        this.servicios = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastService.error('Error al cargar la lista de servicios');
      }
    });
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.formData = {
      nombre: '',
      costo: 0,
      diaCorte: 15
    };
    this.showModal = true;
  }

  openEditModal(servicio: Servicio): void {
    this.isEditing = true;
    this.formData = {
      id: servicio.id,
      nombre: servicio.nombre,
      costo: servicio.costo,
      diaCorte: servicio.diaCorte
    };
    this.showModal = true;
  }

  saveServicio(): void {
    if (this.formData.diaCorte < 1 || this.formData.diaCorte > 31) {
      this.toastService.warning('El día de corte debe ser un número entre 1 y 31');
      return;
    }

    this.submitting = true;

    if (this.isEditing && this.formData.id) {
      const payload: Servicio = {
        id: this.formData.id,
        nombre: this.formData.nombre,
        costo: Number(this.formData.costo),
        diaCorte: Number(this.formData.diaCorte)
      };

      this.servicioService.updateServicio(payload).subscribe({
        next: () => {
          this.submitting = false;
          this.toastService.success('Servicio actualizado con éxito');
          this.showModal = false;
          this.loadServicios();
        },
        error: (err) => {
          this.submitting = false;
          const msg = err.error?.mensaje || 'Error al actualizar el servicio';
          this.toastService.error(msg);
        }
      });
    } else {
      const payload = {
        nombre: this.formData.nombre,
        costo: Number(this.formData.costo),
        diaCorte: Number(this.formData.diaCorte)
      };

      this.servicioService.saveServicio(payload).subscribe({
        next: () => {
          this.submitting = false;
          this.toastService.success('Servicio creado con éxito');
          this.showModal = false;
          this.loadServicios();
        },
        error: (err) => {
          this.submitting = false;
          const msg = err.error?.mensaje || 'Error al crear el servicio';
          this.toastService.error(msg);
        }
      });
    }
  }

  askDelete(servicio: Servicio): void {
    this.servicioToDelete = servicio;
    this.deleteMessage = `¿Estás seguro de eliminar el servicio <strong>${servicio.nombre}</strong> (S/. ${servicio.costo})?`;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.servicioToDelete) return;

    this.submitting = true;
    this.servicioService.deleteServicio(this.servicioToDelete.id).subscribe({
      next: () => {
        this.submitting = false;
        this.toastService.success('Servicio eliminado correctamente');
        this.showDeleteModal = false;
        this.servicioToDelete = null;
        this.loadServicios();
      },
      error: (err) => {
        this.submitting = false;
        const msg = err.error?.mensaje || 'Error al eliminar el servicio';
        this.toastService.error(msg);
      }
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop-custom')) {
      this.showModal = false;
    }
  }
}
