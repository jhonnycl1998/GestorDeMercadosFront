import { Component, ChangeDetectionStrategy, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule],
  template: `
    @if (isOpen) {
      <div class="modal-backdrop-custom" (click)="onBackdropClick($event)">
        <div class="modal-content-custom p-4">
          <div class="d-flex align-items-center mb-3">
            <div class="rounded-circle p-2 me-3" [ngClass]="isDanger ? 'bg-danger bg-opacity-10 text-danger' : 'bg-success bg-opacity-10 text-success'">
              <i class="bi fs-4" [ngClass]="isDanger ? 'bi-exclamation-triangle' : 'bi-question-circle'"></i>
            </div>
            <h5 class="modal-title m-0 fw-bold">{{ title }}</h5>
          </div>

          <div class="modal-body py-2 text-secondary">
            <p class="m-0" [innerHTML]="message"></p>
          </div>

          <div class="d-flex justify-content-end gap-2 mt-4 pt-2 border-top">
            <button type="button" class="btn btn-outline-secondary px-4" [disabled]="loading" (click)="onCancel()">
              {{ cancelText }}
            </button>
            <button type="button" class="btn px-4" [ngClass]="isDanger ? 'btn-danger' : 'btn-success'" [disabled]="loading" (click)="onConfirm()">
              @if (loading) {
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              }
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class ConfirmModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirmar acción';
  @Input() message = '¿Estás seguro de realizar esta acción?';
  @Input() confirmText = 'Confirmar';
  @Input() cancelText = 'Cancelar';
  @Input() isDanger = false;
  @Input() loading = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(): void {
    if (!this.loading) {
      this.confirm.emit();
    }
  }

  onCancel(): void {
    if (!this.loading) {
      this.cancel.emit();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop-custom')) {
      this.onCancel();
    }
  }
}
