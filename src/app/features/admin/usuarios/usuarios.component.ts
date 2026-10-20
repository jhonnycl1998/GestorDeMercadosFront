import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { UsuarioService } from '../../../core/services/usuario.service';
import { RolService } from '../../../core/services/rol.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { Rol, Usuario } from '../../../core/models';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule, LoadingComponent, ConfirmModalComponent],
  template: `
    <div class="container-fluid p-0">
      <!-- Header -->
      <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h3 class="fw-bold text-dark m-0">Gestión de Usuarios</h3>
          <p class="text-muted small m-0">Cuentas de acceso, credenciales y asignación de roles</p>
        </div>
        <button class="btn btn-success d-flex align-items-center gap-2" (click)="openCreateModal()">
          <i class="bi bi-person-plus-fill"></i>
          <span>Nuevo Usuario</span>
        </button>
      </div>

      <!-- Tabla de Usuarios -->
      @if (loading) {
        <app-loading message="Cargando usuarios del sistema..."></app-loading>
      } @else {
        <div class="card shadow-sm">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th class="ps-3">ID</th>
                  <th>Nombre de Usuario</th>
                  <th>Rol Asignado</th>
                  <th class="text-end pe-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (u of usuarios; track u.id) {
                  <tr>
                    <td class="ps-3 fw-bold text-secondary">#{{ u.id }}</td>
                    <td>
                      <div class="d-flex align-items-center gap-2">
                        <div class="rounded-circle bg-light border d-flex align-items-center justify-content-center text-primary-mercado fw-bold" style="width: 34px; height: 34px;">
                          <i class="bi bi-person-fill"></i>
                        </div>
                        <span class="fw-semibold text-dark">{{ u.usuario }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="badge" [ngClass]="getRolName(u) === 'Admin' ? 'bg-success' : 'bg-primary'">
                        <i class="bi me-1" [ngClass]="getRolName(u) === 'Admin' ? 'bi-shield-check' : 'bi-person'"></i>
                        {{ getRolName(u) }}
                      </span>
                    </td>
                    <td class="text-end pe-3">
                      <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-secondary" (click)="openEditModal(u)" title="Editar Usuario">
                          <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger" (click)="askDelete(u)" title="Eliminar Usuario">
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Modal Crear / Editar Usuario -->
      @if (showModal) {
        <div class="modal-backdrop-custom" (click)="onBackdropClick($event)">
          <div class="modal-content-custom p-4">
            <div class="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
              <h5 class="fw-bold m-0 text-dark">
                {{ isEditing ? 'Editar Usuario #' + formData.id : 'Crear Nuevo Usuario' }}
              </h5>
              <button type="button" class="btn-close" (click)="showModal = false"></button>
            </div>

            <form (ngSubmit)="saveUsuario()" #userForm="ngForm">
              <div class="mb-3">
                <label class="form-label small fw-semibold">Nombre de Usuario *</label>
                <div class="input-group">
                  <span class="input-group-text bg-light text-muted"><i class="bi bi-person"></i></span>
                  <input
                    type="text"
                    class="form-control"
                    name="usuario"
                    [(ngModel)]="formData.usuario"
                    placeholder="Ej: jperales"
                    required
                  />
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label small fw-semibold">
                  {{ isEditing ? 'Nueva Contraseña (dejar en blanco para mantener actual)' : 'Contraseña Inicial *' }}
                </label>
                <div class="input-group">
                  <span class="input-group-text bg-light text-muted"><i class="bi bi-lock"></i></span>
                  <input
                    type="password"
                    class="form-control"
                    name="contrasena"
                    [(ngModel)]="formData.contrasenaHash"
                    placeholder="Contraseña segura"
                    [required]="!isEditing"
                  />
                </div>
              </div>

              <div class="mb-4">
                <label class="form-label small fw-semibold">Rol del Sistema *</label>
                <select class="form-select" name="rolId" [(ngModel)]="formData.rolId" required>
                  <option [ngValue]="0" disabled>-- Selecciona un rol --</option>
                  @for (r of roles; track r.id) {
                    <option [ngValue]="r.id">{{ r.nombre }}</option>
                  }
                </select>
              </div>

              <div class="d-flex justify-content-end gap-2 pt-3 border-top">
                <button type="button" class="btn btn-outline-secondary px-4" (click)="showModal = false" [disabled]="submitting">
                  Cancelar
                </button>
                <button type="submit" class="btn btn-success px-4" [disabled]="submitting || !formData.usuario || !formData.rolId">
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
        title="Eliminar Usuario"
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
export class UsuariosComponent implements OnInit {
  private usuarioService = inject(UsuarioService);
  private rolService = inject(RolService);
  private toastService = inject(ToastService);

  loading = true;
  submitting = false;

  usuarios: Usuario[] = [];
  roles: Rol[] = [];

  showModal = false;
  isEditing = false;
  formData: { id?: number; usuario: string; contrasenaHash: string; rolId: number } = {
    usuario: '',
    contrasenaHash: '',
    rolId: 0
  };

  showDeleteModal = false;
  usuarioToDelete: Usuario | null = null;
  deleteMessage = '';

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    forkJoin({
      usuarios: this.usuarioService.getUsuarios(),
      roles: this.rolService.getRoles()
    }).subscribe({
      next: ({ usuarios, roles }) => {
        this.usuarios = usuarios;
        this.roles = roles;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastService.error('Error al cargar la lista de usuarios');
      }
    });
  }

  getRolName(u: Usuario): string {
    if (u.rol?.nombre) return u.rol.nombre;
    const r = this.roles.find(item => item.id === u.rolId);
    return r ? r.nombre : 'Usuario';
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.formData = {
      usuario: '',
      contrasenaHash: '',
      rolId: this.roles.length > 0 ? this.roles[0].id : 0
    };
    this.showModal = true;
  }

  openEditModal(u: Usuario): void {
    this.isEditing = true;
    this.formData = {
      id: u.id,
      usuario: u.usuario,
      contrasenaHash: '',
      rolId: u.rolId
    };
    this.showModal = true;
  }

  saveUsuario(): void {
    this.submitting = true;

    if (this.isEditing && this.formData.id) {
      const payload: Usuario = {
        id: this.formData.id,
        usuario: this.formData.usuario,
        contrasenaHash: this.formData.contrasenaHash || '',
        rolId: this.formData.rolId
      };

      this.usuarioService.updateUsuario(payload).subscribe({
        next: () => {
          this.submitting = false;
          this.toastService.success('Usuario actualizado con éxito');
          this.showModal = false;
          this.loadData();
        },
        error: (err) => {
          this.submitting = false;
          const msg = err.error?.mensaje || 'Error al actualizar el usuario';
          this.toastService.error(msg);
        }
      });
    } else {
      const payload = {
        usuario: this.formData.usuario,
        contrasenaHash: this.formData.contrasenaHash,
        rolId: this.formData.rolId
      };

      this.usuarioService.saveUsuario(payload).subscribe({
        next: () => {
          this.submitting = false;
          this.toastService.success('Usuario creado con éxito');
          this.showModal = false;
          this.loadData();
        },
        error: (err) => {
          this.submitting = false;
          const msg = err.error?.mensaje || 'Error al crear el usuario';
          this.toastService.error(msg);
        }
      });
    }
  }

  askDelete(u: Usuario): void {
    this.usuarioToDelete = u;
    this.deleteMessage = `¿Estás seguro de eliminar al usuario <strong>${u.usuario}</strong>?`;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.usuarioToDelete) return;

    this.submitting = true;
    this.usuarioService.deleteUsuario(this.usuarioToDelete.id).subscribe({
      next: () => {
        this.submitting = false;
        this.toastService.success('Usuario eliminado correctamente');
        this.showDeleteModal = false;
        this.usuarioToDelete = null;
        this.loadData();
      },
      error: (err) => {
        this.submitting = false;
        const msg = err.error?.mensaje || 'Error al eliminar el usuario';
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
