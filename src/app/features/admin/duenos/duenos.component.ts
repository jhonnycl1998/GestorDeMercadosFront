import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DuenoService } from '../../../core/services/dueno.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { Dueno, DuenoCreateRequest } from '../../../core/models';

@Component({
  selector: 'app-duenos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule, LoadingComponent, ConfirmModalComponent],
  template: `
    <div class="container-fluid p-0">
      <!-- Header -->
      <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h3 class="fw-bold text-dark m-0">Gestión de Dueños</h3>
          <p class="text-muted small m-0">Administra los comerciantes y dueños de puestos del mercado</p>
        </div>
        <button class="btn btn-success d-flex align-items-center gap-2" (click)="openCreateModal()">
          <i class="bi bi-person-plus-fill"></i>
          <span>Nuevo Dueño</span>
        </button>
      </div>

      <!-- Filtro y búsqueda -->
      <div class="card shadow-sm mb-4">
        <div class="card-body p-3">
          <div class="row g-2 align-items-center">
            <div class="col-12 col-md-6 col-lg-4">
              <div class="input-group">
                <span class="input-group-text bg-white text-muted">
                  <i class="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  class="form-control border-start-0 ps-0"
                  placeholder="Buscar por nombre, RUC o dirección..."
                  [(ngModel)]="searchTerm"
                />
              </div>
            </div>
            <div class="col-auto ms-auto text-muted small">
              Total: <strong class="text-dark">{{ filteredDuenos.length }}</strong> dueños registrados
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla de dueños -->
      @if (loading) {
        <app-loading message="Cargando listado de dueños..."></app-loading>
      } @else {
        <div class="card shadow-sm">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th class="ps-3">ID</th>
                  <th>Nombre y Apellido</th>
                  <th>RUC</th>
                  <th>Dirección</th>
                  <th>Fecha Nac.</th>
                  <th>Puestos</th>
                  <th class="text-end pe-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @if (filteredDuenos.length === 0) {
                  <tr>
                    <td colspan="7" class="text-center py-5 text-muted">
                      <i class="bi bi-people text-secondary fs-1 mb-2 d-block"></i>
                      <p class="m-0">No se encontraron dueños con los criterios ingresados</p>
                    </td>
                  </tr>
                } @else {
                  @for (dueno of filteredDuenos; track dueno.id) {
                    <tr>
                      <td class="ps-3 fw-bold text-secondary">#{{ dueno.id }}</td>
                      <td>
                        <div class="d-flex align-items-center gap-2">
                          <div class="rounded-circle d-flex align-items-center justify-content-center fw-bold"
                            [ngClass]="dueno.ruc === '00000000000' ? 'bg-secondary text-white' : 'bg-primary-light text-primary-mercado'"
                            style="width: 34px; height: 34px; font-size: 0.85rem;">
                            {{ dueno.nombre.substring(0, 1).toUpperCase() }}
                          </div>
                          <div>
                            <span class="fw-semibold text-dark">{{ dueno.nombre }} {{ dueno.apellido }}</span>
                            @if (dueno.ruc === '00000000000') {
                              <span class="badge bg-secondary ms-2" style="font-size: 0.65rem;">Asociación Matriz</span>
                            }
                          </div>
                        </div>
                      </td>
                      <td>
                        <code>{{ dueno.ruc }}</code>
                      </td>
                      <td class="text-muted small">{{ dueno.direccion || '-' }}</td>
                      <td class="text-secondary small">{{ dueno.fechaNacimiento | date:'dd/MM/yyyy' }}</td>
                      <td>
                        <button class="btn btn-sm btn-outline-info py-0 px-2" (click)="openDetailModal(dueno)" title="Ver puestos asignados">
                          <i class="bi bi-shop me-1"></i> Ver Puestos
                        </button>
                      </td>
                      <td class="text-end pe-3">
                        <div class="btn-group btn-group-sm">
                          <button class="btn btn-outline-secondary" (click)="openEditModal(dueno)" title="Editar datos">
                            <i class="bi bi-pencil"></i>
                          </button>
                          @if (dueno.ruc !== '00000000000') {
                            <button class="btn btn-outline-danger" (click)="askDelete(dueno)" title="Eliminar dueño">
                              <i class="bi bi-trash"></i>
                            </button>
                          } @else {
                            <button class="btn btn-outline-secondary" disabled title="La Asociación no se puede eliminar">
                              <i class="bi bi-lock-fill"></i>
                            </button>
                          }
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

      <!-- Modal Crear Dueño -->
      @if (showCreateModal) {
        <div class="modal-backdrop-custom" (click)="onBackdropClick($event, 'create')">
          <div class="modal-content-custom modal-lg p-4">
            <div class="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
              <h5 class="fw-bold m-0 text-dark">Registrar Nuevo Dueño</h5>
              <button type="button" class="btn-close" (click)="showCreateModal = false"></button>
            </div>

            <form (ngSubmit)="saveNewDueno()" #createForm="ngForm">
              <h6 class="text-success fw-bold mb-3"><i class="bi bi-person-lines-fill me-1"></i> Datos Personales</h6>
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label small fw-semibold">Nombre *</label>
                  <input type="text" class="form-control" name="nombre" [(ngModel)]="newDueno.nombre" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label small fw-semibold">Apellido *</label>
                  <input type="text" class="form-control" name="apellido" [(ngModel)]="newDueno.apellido" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label small fw-semibold">RUC / DNI * (11 dígitos para RUC)</label>
                  <input type="text" class="form-control" name="ruc" [(ngModel)]="newDueno.ruc" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label small fw-semibold">Fecha de Nacimiento *</label>
                  <input type="date" class="form-control" name="fechaNacimiento" [(ngModel)]="newDueno.fechaNacimiento" required />
                </div>
                <div class="col-12">
                  <label class="form-label small fw-semibold">Dirección *</label>
                  <input type="text" class="form-control" name="direccion" [(ngModel)]="newDueno.direccion" required />
                </div>
              </div>

              <h6 class="text-success fw-bold mb-3 border-top pt-3"><i class="bi bi-shield-lock me-1"></i> Credenciales de Acceso (Usuario Dueño)</h6>
              <div class="row g-3 mb-4">
                <div class="col-md-6">
                  <label class="form-label small fw-semibold">Usuario del Sistema *</label>
                  <input type="text" class="form-control" name="usuario" [(ngModel)]="newDueno.usuario.usuario" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label small fw-semibold">Contraseña Inicial *</label>
                  <input type="password" class="form-control" name="contrasena" [(ngModel)]="newDueno.usuario.contrasenaHash" required />
                </div>
              </div>

              <div class="d-flex justify-content-end gap-2 pt-3 border-top">
                <button type="button" class="btn btn-outline-secondary px-4" (click)="showCreateModal = false" [disabled]="submitting">
                  Cancelar
                </button>
                <button type="submit" class="btn btn-success px-4" [disabled]="submitting || !createForm.valid">
                  @if (submitting) {
                    <span class="spinner-border spinner-border-sm me-2"></span>
                    Guardando...
                  } @else {
                    <i class="bi bi-check2-circle me-1"></i> Crear Dueño
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Modal Editar Dueño (Solo datos personales) -->
      @if (selectedDuenoToEdit) {
        <div class="modal-backdrop-custom" (click)="onBackdropClick($event, 'edit')">
          <div class="modal-content-custom p-4">
            <div class="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
              <h5 class="fw-bold m-0 text-dark">Editar Datos del Dueño #{{ selectedDuenoToEdit.id }}</h5>
              <button type="button" class="btn-close" (click)="selectedDuenoToEdit = null"></button>
            </div>

            <form (ngSubmit)="updateDueno()" #editForm="ngForm">
              <div class="row g-3 mb-3">
                <div class="col-md-6">
                  <label class="form-label small fw-semibold">Nombre *</label>
                  <input type="text" class="form-control" name="nombreEdit" [(ngModel)]="editDuenoData.nombre" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label small fw-semibold">Apellido *</label>
                  <input type="text" class="form-control" name="apellidoEdit" [(ngModel)]="editDuenoData.apellido" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label small fw-semibold">RUC *</label>
                  <input type="text" class="form-control" name="rucEdit" [(ngModel)]="editDuenoData.ruc" [disabled]="selectedDuenoToEdit.ruc === '00000000000'" required />
                </div>
                <div class="col-md-6">
                  <label class="form-label small fw-semibold">Fecha de Nacimiento *</label>
                  <input type="date" class="form-control" name="fechaNacimientoEdit" [(ngModel)]="editDuenoData.fechaNacimiento" required />
                </div>
                <div class="col-12">
                  <label class="form-label small fw-semibold">Dirección *</label>
                  <input type="text" class="form-control" name="direccionEdit" [(ngModel)]="editDuenoData.direccion" required />
                </div>
              </div>

              <div class="d-flex justify-content-end gap-2 pt-3 border-top">
                <button type="button" class="btn btn-outline-secondary px-4" (click)="selectedDuenoToEdit = null" [disabled]="submitting">
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

      <!-- Modal Ver Detalle / Tiendas del Dueño -->
      @if (duenoDetail) {
        <div class="modal-backdrop-custom" (click)="onBackdropClick($event, 'detail')">
          <div class="modal-content-custom p-4">
            <div class="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-shop text-success fs-4"></i>
                <h5 class="fw-bold m-0 text-dark">Puestos de {{ duenoDetail.nombre }} {{ duenoDetail.apellido }}</h5>
              </div>
              <button type="button" class="btn-close" (click)="duenoDetail = null"></button>
            </div>

            <div class="mb-3">
              <p class="small text-muted mb-2">
                <strong>RUC:</strong> {{ duenoDetail.ruc }} | <strong>Dirección:</strong> {{ duenoDetail.direccion }}
              </p>

              @if (loadingDetail) {
                <app-loading message="Cargando puestos del dueño..."></app-loading>
              } @else if (!duenoDetail.tiendas || duenoDetail.tiendas.length === 0) {
                <div class="alert alert-light border text-center py-4 my-2">
                  <i class="bi bi-inbox text-secondary fs-3 d-block mb-1"></i>
                  <span class="text-muted">Este dueño no tiene puestos asignados actualmente</span>
                </div>
              } @else {
                <div class="list-group">
                  @for (t of duenoDetail.tiendas; track t.id) {
                    <div class="list-group-item d-flex align-items-center justify-content-between">
                      <div class="d-flex align-items-center gap-2">
                        <span class="badge bg-success">Puesto #{{ t.id }}</span>
                        <span class="small text-secondary">
                          Modalidad: {{ t.alquiler ? 'Alquiler (S/. ' + (t.costoAlquiler | number:'1.2-2') + ')' : 'Propio' }}
                        </span>
                      </div>
                      <span class="badge bg-light text-dark border">Activo</span>
                    </div>
                  }
                </div>
              }
            </div>

            <div class="d-flex justify-content-end pt-3 border-top">
              <button type="button" class="btn btn-secondary px-4" (click)="duenoDetail = null">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Modal de Confirmación de Eliminación -->
      <app-confirm-modal
        [isOpen]="showDeleteModal"
        title="Eliminar Dueño"
        [message]="deleteWarningMessage"
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
export class DuenosComponent implements OnInit {
  private duenoService = inject(DuenoService);
  private toastService = inject(ToastService);

  loading = true;
  submitting = false;
  loadingDetail = false;

  duenos: Dueno[] = [];
  searchTerm = '';

  // Modales
  showCreateModal = false;
  selectedDuenoToEdit: Dueno | null = null;
  duenoDetail: Dueno | null = null;
  showDeleteModal = false;
  duenoToDelete: Dueno | null = null;
  deleteWarningMessage = '';

  newDueno: DuenoCreateRequest = {
    nombre: '',
    apellido: '',
    ruc: '',
    fechaNacimiento: '',
    direccion: '',
    usuario: {
      usuario: '',
      contrasenaHash: ''
    }
  };

  editDuenoData: Partial<Dueno> = {};

  ngOnInit(): void {
    this.loadDuenos();
  }

  loadDuenos(): void {
    this.loading = true;
    this.duenoService.getDuenos().subscribe({
      next: (data) => {
        this.duenos = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastService.error('Error al cargar la lista de dueños');
      }
    });
  }

  get filteredDuenos(): Dueno[] {
    if (!this.searchTerm.trim()) {
      return this.duenos;
    }
    const term = this.searchTerm.toLowerCase();
    return this.duenos.filter(d =>
      d.nombre.toLowerCase().includes(term) ||
      d.apellido.toLowerCase().includes(term) ||
      d.ruc.toLowerCase().includes(term) ||
      (d.direccion && d.direccion.toLowerCase().includes(term))
    );
  }

  openCreateModal(): void {
    this.newDueno = {
      nombre: '',
      apellido: '',
      ruc: '',
      fechaNacimiento: '',
      direccion: '',
      usuario: {
        usuario: '',
        contrasenaHash: ''
      }
    };
    this.showCreateModal = true;
  }

  saveNewDueno(): void {
    this.submitting = true;
    this.duenoService.saveDueno(this.newDueno).subscribe({
      next: () => {
        this.submitting = false;
        this.toastService.success('Dueño registrado con éxito');
        this.showCreateModal = false;
        this.loadDuenos();
      },
      error: (err) => {
        this.submitting = false;
        const msg = err.error?.mensaje || 'Error al crear dueño';
        this.toastService.error(msg);
      }
    });
  }

  openEditModal(dueno: Dueno): void {
    this.selectedDuenoToEdit = dueno;
    // Formatear fecha a YYYY-MM-DD para input date
    let dateStr = '';
    if (dueno.fechaNacimiento) {
      dateStr = dueno.fechaNacimiento.split('T')[0];
    }

    this.editDuenoData = {
      id: dueno.id,
      nombre: dueno.nombre,
      apellido: dueno.apellido,
      ruc: dueno.ruc,
      fechaNacimiento: dateStr,
      direccion: dueno.direccion,
      usuarioId: dueno.usuarioId
    };
  }

  updateDueno(): void {
    if (!this.selectedDuenoToEdit) return;

    this.submitting = true;
    this.duenoService.updateDueno(this.editDuenoData).subscribe({
      next: () => {
        this.submitting = false;
        this.toastService.success('Datos del dueño actualizados correctamente');
        this.selectedDuenoToEdit = null;
        this.loadDuenos();
      },
      error: (err) => {
        this.submitting = false;
        const msg = err.error?.mensaje || 'Error al actualizar dueño';
        this.toastService.error(msg);
      }
    });
  }

  openDetailModal(dueno: Dueno): void {
    this.loadingDetail = true;
    this.duenoDetail = dueno;
    this.duenoService.getDueno(dueno.id).subscribe({
      next: (full) => {
        this.duenoDetail = full;
        this.loadingDetail = false;
      },
      error: () => {
        this.loadingDetail = false;
      }
    });
  }

  askDelete(dueno: Dueno): void {
    if (dueno.ruc === '00000000000') {
      this.toastService.warning('La Asociación del Mercado es el titular por defecto y no puede ser eliminada.');
      return;
    }

    this.duenoToDelete = dueno;
    this.deleteWarningMessage = `
      ¿Estás seguro de eliminar a <strong>${dueno.nombre} ${dueno.apellido}</strong> (RUC: ${dueno.ruc})?<br><br>
      <span class="text-danger fw-bold"><i class="bi bi-exclamation-triangle-fill me-1"></i> Advertencia:</span>
      Al eliminar este dueño, <strong>todas sus tiendas asignadas volverán automáticamente a la Asociación</strong>.
    `;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.duenoToDelete) return;

    this.submitting = true;
    this.duenoService.deleteDueno(this.duenoToDelete.id).subscribe({
      next: () => {
        this.submitting = false;
        this.toastService.success('Dueño eliminado. Sus tiendas volvieron a la Asociación.');
        this.showDeleteModal = false;
        this.duenoToDelete = null;
        this.loadDuenos();
      },
      error: (err) => {
        this.submitting = false;
        const msg = err.error?.mensaje || 'Error al eliminar el dueño';
        this.toastService.error(msg);
      }
    });
  }

  onBackdropClick(event: MouseEvent, modalType: string): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop-custom')) {
      if (modalType === 'create') this.showCreateModal = false;
      if (modalType === 'edit') this.selectedDuenoToEdit = null;
      if (modalType === 'detail') this.duenoDetail = null;
    }
  }
}
