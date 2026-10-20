import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule],
  template: `
    <div class="d-flex flex-column align-items-center justify-content-center py-5 my-4">
      <div class="spinner-border text-success mb-3" style="width: 2.75rem; height: 2.75rem;" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
      <p class="text-muted fw-medium fs-6 m-0">{{ message }}</p>
    </div>
  `
})
export class LoadingComponent {
  @Input() message = 'Cargando datos...';
}
