import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule],
  template: `
    <div class="toast-container-custom">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast show toast-custom" [ngClass]="'border-' + toast.type" role="alert" aria-live="assertive" aria-atomic="true">
          <div class="toast-header text-white" [ngClass]="'bg-' + toast.type">
            <i class="bi me-2" [ngClass]="{
              'bi-check-circle-fill': toast.type === 'success',
              'bi-exclamation-triangle-fill': toast.type === 'warning',
              'bi-x-circle-fill': toast.type === 'danger',
              'bi-info-circle-fill': toast.type === 'info'
            }"></i>
            <strong class="me-auto">{{ toast.title || (toast.type === 'success' ? 'Éxito' : 'Notificación') }}</strong>
            <button type="button" class="btn-close btn-close-white" (click)="toastService.remove(toast.id)" aria-label="Cerrar"></button>
          </div>
          <div class="toast-body bg-white text-dark">
            {{ toast.message }}
          </div>
        </div>
      }
    </div>
  `
})
export class ToastComponent {
  toastService = inject(ToastService);
}
