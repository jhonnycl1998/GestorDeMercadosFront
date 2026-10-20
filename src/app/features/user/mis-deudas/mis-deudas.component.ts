import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../../core/services/auth.service';
import { DeudaService } from '../../../core/services/deuda.service';
import { PagoService } from '../../../core/services/pago.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { Deuda, PagoCreateRequest } from '../../../core/models';

@Component({
  selector: 'app-mis-deudas',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, LoadingComponent, ConfirmModalComponent],
  template: `
    <div class="container-fluid p-0">
      <!-- Header -->
      <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h3 class="fw-bold text-dark m-0">Mis Deudas Pendientes</h3>
          <p class="text-muted small m-0">Revisa tus recibos por servicios y realiza tus pagos en línea</p>
        </div>
        <button class="btn btn-outline-success btn-sm d-flex align-items-center gap-1" (click)="loadDeudas()">
          <i class="bi bi-arrow-clockwise"></i>
          <span>Actualizar</span>
        </button>
      </div>

      @if (loading) {
        <app-loading message="Consultando tus deudas pendientes..."></app-loading>
      } @else if (deudas.length === 0) {
        <!-- Estado vacío (404 o sin deudas) -->
        <div class="card p-5 text-center shadow-sm">
          <div class="rounded-circle bg-success bg-opacity-10 text-success p-4 mx-auto mb-3 d-flex align-items-center justify-content-center" style="width: 80px; height: 80px;">
            <i class="bi bi-check-circle-fill fs-1"></i>
          </div>
          <h4 class="fw-bold text-dark mb-1">¡Estás al día!</h4>
          <p class="text-muted mb-0">No tienes deudas pendientes</p>
          <small class="text-secondary mt-1">Todos los servicios de tus puestos se encuentran pagados.</small>
        </div>
      } @else {
        <!-- Total Banner -->
        <div class="alert alert-warning border border-warning shadow-sm d-flex flex-column flex-sm-row justify-content-between align-items-sm-center p-3 mb-4">
          <div class="d-flex align-items-center mb-2 mb-sm-0">
            <i class="bi bi-exclamation-triangle-fill text-warning fs-4 me-3"></i>
            <div>
              <strong class="d-block text-dark">Tienes {{ deudas.length }} recibos pendientes de pago</strong>
              <small class="text-secondary">Paga a tiempo para evitar suspensiones de servicios en tus puestos</small>
            </div>
          </div>
          <div class="text-sm-end">
            <span class="text-muted small d-block">Monto Total:</span>
            <span class="fs-4 fw-bold text-danger">S/. {{ totalMonto | number:'1.2-2' }}</span>
          </div>
        </div>

        <!-- Tarjetas de Deudas -->
        <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3 mb-4">
          @for (deuda of deudas; track deuda.id) {
            <div class="col">
              <div class="card h-100 card-hover border-top border-4 border-danger shadow-sm p-3 d-flex flex-column justify-content-between">
                <div>
                  <div class="d-flex justify-content-between align-items-start mb-2">
                    <span class="badge bg-light text-dark border fw-bold fs-6">
                      <i class="bi bi-shop me-1 text-success"></i> Puesto {{ deuda.tiendaId }}
                    </span>
                    <span class="badge badge-pendiente">
                      {{ deuda.estado }}
                    </span>
                  </div>

                  <h5 class="fw-bold text-dark mb-1">
                    {{ deuda.servicio?.nombre || ('Servicio #' + deuda.servicioId) }}
                  </h5>
                  <p class="text-muted small mb-3">
                    Emisión: {{ deuda.fechaFacturacion | date:'dd/MM/yyyy' }}
                  </p>

                  <div class="bg-light p-3 rounded mb-3">
                    <div class="d-flex justify-content-between small text-secondary mb-1">
                      <span>Vence el:</span>
                      <strong class="text-dark">{{ deuda.fechaLimitePago | date:'dd/MM/yyyy' }}</strong>
                    </div>
                    <div class="d-flex justify-content-between align-items-center pt-2 border-top">
                      <span class="text-muted fw-semibold">Monto a Pagar:</span>
                      <span class="fs-4 fw-bold text-danger">S/. {{ deuda.montoDeuda | number:'1.2-2' }}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  class="btn btn-success w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold py-2"
                  (click)="iniciarPago(deuda)"
                >
                  <i class="bi bi-credit-card-fill"></i>
                  <span>Pagar Ahora (S/. {{ deuda.montoDeuda | number:'1.2-2' }})</span>
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Modal de Confirmación de Pago -->
      <app-confirm-modal
        [isOpen]="showConfirmModal"
        title="Confirmar Pago de Deuda"
        [message]="confirmMessage"
        confirmText="Confirmar y Pagar"
        cancelText="Volver"
        [isDanger]="false"
        [loading]="paying"
        (confirm)="confirmarPago()"
        (cancel)="showConfirmModal = false"
      ></app-confirm-modal>

      <!-- Modal Voucher tras Pagar -->
      @if (showVoucherModal) {
        <div class="modal-backdrop-custom" (click)="closeVoucherModal($event)">
          <div class="modal-content-custom modal-lg p-4">
            <div class="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-check-circle-fill text-success fs-4"></i>
                <h5 class="fw-bold m-0 text-dark">¡Pago Realizado con Éxito!</h5>
              </div>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" (click)="imprimirVoucher()">
                  <i class="bi bi-printer-fill"></i>
                  <span>Imprimir Voucher</span>
                </button>
                <button type="button" class="btn-close" (click)="showVoucherModal = false"></button>
              </div>
            </div>

            <div class="border rounded p-3 bg-white mb-3" style="max-height: 60vh; overflow-y: auto;" [innerHTML]="safeVoucherHtml"></div>

            <div class="d-flex justify-content-end pt-3 border-top">
              <button type="button" class="btn btn-success px-4" (click)="showVoucherModal = false">
                Aceptar
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class UserMisDeudasComponent implements OnInit {
  private authService = inject(AuthService);
  private deudaService = inject(DeudaService);
  private pagoService = inject(PagoService);
  private toastService = inject(ToastService);
  private sanitizer = inject(DomSanitizer);

  loading = true;
  paying = false;

  deudas: Deuda[] = [];

  // Confirmación
  showConfirmModal = false;
  deudaAPagar: Deuda | null = null;
  confirmMessage = '';

  // Voucher
  showVoucherModal = false;
  rawVoucherHtml = '';
  safeVoucherHtml: SafeHtml = '';

  ngOnInit(): void {
    this.loadDeudas();
  }

  loadDeudas(): void {
    const duenoId = this.authService.getDuenoId();
    if (!duenoId) {
      this.loading = false;
      this.deudas = [];
      return;
    }

    this.loading = true;
    this.deudaService.getDeudasPorDueno(duenoId).subscribe({
      next: (data) => {
        this.deudas = data || [];
        this.loading = false;
      },
      error: () => {
        // En caso de otro error no capturado como 404
        this.deudas = [];
        this.loading = false;
      }
    });
  }

  get totalMonto(): number {
    return this.deudas.reduce((acc, curr) => acc + (curr.montoDeuda || 0), 0);
  }

  iniciarPago(deuda: Deuda): void {
    this.deudaAPagar = deuda;
    const servicioNombre = deuda.servicio?.nombre || ('Servicio #' + deuda.servicioId);
    this.confirmMessage = `
      ¿Deseas procesar el pago del recibo de <strong>${servicioNombre}</strong> para el <strong>Puesto #${deuda.tiendaId}</strong>?<br><br>
      <div class="alert alert-light border p-2 text-center fs-5 text-success fw-bold">
        Monto a debitar: S/. ${deuda.montoDeuda.toFixed(2)}
      </div>
    `;
    this.showConfirmModal = true;
  }

  confirmarPago(): void {
    if (!this.deudaAPagar) return;

    this.paying = true;
    const payload: PagoCreateRequest = {
      deudaId: this.deudaAPagar.id,
      montoPago: this.deudaAPagar.montoDeuda
    };

    this.pagoService.registrarPago(payload).subscribe({
      next: (res) => {
        const nuevoPago = res?.pago;
        this.paying = false;
        this.showConfirmModal = false;
        this.toastService.success('¡Pago realizado con éxito!');
        this.loadDeudas();

        // Obtener y mostrar el voucher automáticamente
        if (nuevoPago?.id) {
          this.pagoService.getVoucherHtml(nuevoPago.id).subscribe({
            next: (html) => {
              this.rawVoucherHtml = html;
              this.safeVoucherHtml = this.sanitizer.bypassSecurityTrustHtml(html);
              this.showVoucherModal = true;
            }
          });
        }
      },
      error: (err) => {
        this.paying = false;
        this.showConfirmModal = false;
        const msg = err.error?.mensaje || 'Error al procesar el pago';
        this.toastService.error(msg);
      }
    });
  }

  imprimirVoucher(): void {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(this.rawVoucherHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } else {
      window.print();
    }
  }

  closeVoucherModal(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop-custom')) {
      this.showVoucherModal = false;
    }
  }
}
