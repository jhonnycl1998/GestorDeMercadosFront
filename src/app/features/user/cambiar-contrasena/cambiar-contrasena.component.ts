import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { CambiarContrasena } from '../../../core/models';

@Component({
  selector: 'app-user-cambiar-contrasena',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container-fluid p-0">
      <div class="row justify-content-center">
        <div class="col-12 col-md-8 col-lg-6">
          <div class="card shadow-sm p-4 p-md-5">
            <div class="text-center mb-4">
              <div class="rounded-circle bg-success bg-opacity-10 text-success p-3 mx-auto mb-3 d-flex align-items-center justify-content-center" style="width: 64px; height: 64px;">
                <i class="bi bi-shield-lock-fill fs-2"></i>
              </div>
              <h4 class="fw-bold text-dark m-0">Cambiar Contraseña</h4>
              <p class="text-muted small m-0">Actualiza tu clave de acceso para mayor seguridad</p>
            </div>

            <form (ngSubmit)="onSubmit()" #passForm="ngForm">
              <div class="mb-3">
                <label class="form-label small fw-semibold text-secondary">Contraseña Actual *</label>
                <div class="input-group">
                  <span class="input-group-text bg-light text-muted border-end-0">
                    <i class="bi bi-lock"></i>
                  </span>
                  <input
                    [type]="showActual ? 'text' : 'password'"
                    class="form-control border-start-0 border-end-0 ps-0"
                    name="contrasenaActual"
                    [(ngModel)]="formData.contrasenaActual"
                    placeholder="Ingresa tu contraseña actual"
                    required
                    [disabled]="submitting"
                  />
                  <button
                    type="button"
                    class="input-group-text bg-light text-muted border-start-0"
                    (click)="showActual = !showActual"
                  >
                    <i class="bi" [ngClass]="showActual ? 'bi-eye-slash' : 'bi-eye'"></i>
                  </button>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label small fw-semibold text-secondary">Nueva Contraseña *</label>
                <div class="input-group">
                  <span class="input-group-text bg-light text-muted border-end-0">
                    <i class="bi bi-key"></i>
                  </span>
                  <input
                    [type]="showNueva ? 'text' : 'password'"
                    class="form-control border-start-0 border-end-0 ps-0"
                    name="contrasenaNueva"
                    [(ngModel)]="formData.contrasenaNueva"
                    placeholder="Mínimo 6 caracteres"
                    required
                    minlength="6"
                    [disabled]="submitting"
                  />
                  <button
                    type="button"
                    class="input-group-text bg-light text-muted border-start-0"
                    (click)="showNueva = !showNueva"
                  >
                    <i class="bi" [ngClass]="showNueva ? 'bi-eye-slash' : 'bi-eye'"></i>
                  </button>
                </div>
              </div>

              <div class="mb-4">
                <label class="form-label small fw-semibold text-secondary">Confirmar Nueva Contraseña *</label>
                <div class="input-group">
                  <span class="input-group-text bg-light text-muted border-end-0">
                    <i class="bi bi-check2-circle"></i>
                  </span>
                  <input
                    [type]="showConfirm ? 'text' : 'password'"
                    class="form-control border-start-0 border-end-0 ps-0"
                    name="confirmarNueva"
                    [(ngModel)]="confirmarNueva"
                    placeholder="Repite la nueva contraseña"
                    required
                    [disabled]="submitting"
                  />
                  <button
                    type="button"
                    class="input-group-text bg-light text-muted border-start-0"
                    (click)="showConfirm = !showConfirm"
                  >
                    <i class="bi" [ngClass]="showConfirm ? 'bi-eye-slash' : 'bi-eye'"></i>
                  </button>
                </div>
                @if (formData.contrasenaNueva && confirmarNueva && formData.contrasenaNueva !== confirmarNueva) {
                  <small class="text-danger d-block mt-1">Las contraseñas no coinciden</small>
                }
              </div>

              <button
                type="submit"
                class="btn btn-success w-100 py-2 fw-semibold d-flex align-items-center justify-content-center"
                [disabled]="submitting || !passForm.valid || formData.contrasenaNueva !== confirmarNueva"
              >
                @if (submitting) {
                  <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Actualizando contraseña...
                } @else {
                  <i class="bi bi-shield-check me-2"></i>
                  Guardar Nueva Contraseña
                }
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `
})
export class UserCambiarContrasenaComponent {
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  submitting = false;

  formData: CambiarContrasena = {
    contrasenaActual: '',
    contrasenaNueva: ''
  };

  confirmarNueva = '';

  showActual = false;
  showNueva = false;
  showConfirm = false;

  onSubmit(): void {
    if (this.formData.contrasenaNueva !== this.confirmarNueva) {
      this.toastService.warning('La nueva contraseña y su confirmación no coinciden.');
      return;
    }

    this.submitting = true;

    this.authService.cambiarContrasena(this.formData).subscribe({
      next: (res) => {
        this.submitting = false;
        const msg = res?.mensaje || 'Contraseña actualizada exitosamente.';
        this.toastService.success(msg);
        this.formData = {
          contrasenaActual: '',
          contrasenaNueva: ''
        };
        this.confirmarNueva = '';
      },
      error: (err) => {
        this.submitting = false;
        const msg = err.error?.mensaje || 'No se pudo cambiar la contraseña. Verifica tu clave actual.';
        this.toastService.error(msg);
      }
    });
  }
}
