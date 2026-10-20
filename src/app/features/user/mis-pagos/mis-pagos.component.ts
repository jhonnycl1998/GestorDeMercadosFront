import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { DuenoService } from '../../../core/services/dueno.service';
import { DeudaService } from '../../../core/services/deuda.service';
import { PagoService } from '../../../core/services/pago.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { Deuda, Pago } from '../../../core/models';

interface PagoConDetalle {
  pago: Pago;
  deuda?: Deuda;
  tiendaId?: number;
  servicioNombre?: string;
}

@Component({
  selector: 'app-user-mis-pagos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, LoadingComponent],
  template: `
    <div class="container-fluid p-0">
      <!-- Header -->
      <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h3 class="fw-bold text-dark m-0">Mis Pagos y Comprobantes</h3>
          <p class="text-muted small m-0">Historial de pagos realizados y descarga de vouchers oficiales</p>
        </div>
        <button class="btn btn-outline-success btn-sm d-flex align-items-center gap-1" (click)="loadMisPagos()">
          <i class="bi bi-arrow-clockwise"></i>
          <span>Actualizar</span>
        </button>
      </div>

      @if (loading) {
        <app-loading message="Cargando historial de pagos y comprobantes..."></app-loading>
      } @else if (misPagos.length === 0) {
        <div class="card p-5 text-center shadow-sm">
          <div class="rounded-circle bg-light border p-4 mx-auto mb-3 d-flex align-items-center justify-content-center text-muted" style="width: 72px; height: 72px;">
            <i class="bi bi-receipt-cutoff fs-2"></i>
          </div>
          <h4 class="fw-bold text-dark mb-1">Sin comprobantes registrados</h4>
          <p class="text-muted m-0">Aún no has realizado pagos de servicios para tus puestos.</p>
        </div>
      } @else {
        <div class="card shadow-sm">
          <div class="card-header bg-white py-3 d-flex align-items-center justify-content-between">
            <h5 class="fw-bold m-0 text-dark">Vouchers Disponibles</h5>
            <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">
              {{ misPagos.length }} Pagos realizados
            </span>
          </div>

          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th class="ps-3">ID Pago</th>
                  <th>Fecha de Pago</th>
                  <th>Puesto</th>
                  <th>Servicio / Concepto</th>
                  <th>Monto Pagado</th>
                  <th class="text-end pe-3">Comprobante</th>
                </tr>
              </thead>
              <tbody>
                @for (item of misPagos; track item.pago.id) {
                  <tr>
                    <td class="ps-3 fw-bold text-secondary">#{{ item.pago.id }}</td>
                    <td>{{ item.pago.fechaPago | date:'dd/MM/yyyy HH:mm' }}</td>
                    <td>
                      <span class="badge bg-light text-dark border">
                        <i class="bi bi-shop me-1 text-success"></i> Puesto {{ item.tiendaId || item.deuda?.tiendaId || '-' }}
                      </span>
                    </td>
                    <td class="fw-semibold text-dark">
                      {{ item.servicioNombre || item.deuda?.servicio?.nombre || ('Deuda #' + item.pago.deudaId) }}
                    </td>
                    <td class="fw-bold text-success">
                      S/. {{ item.pago.montoPago | number:'1.2-2' }}
                    </td>
                    <td class="text-end pe-3">
                      <button
                        type="button"
                        class="btn btn-outline-success btn-sm d-flex align-items-center gap-1 ms-auto"
                        (click)="abrirVoucher(item.pago.id)"
                      >
                        <i class="bi bi-file-earmark-text"></i>
                        <span>Ver Voucher</span>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Modal Voucher HTML con Imprimir -->
      @if (showVoucherModal) {
        <div class="modal-backdrop-custom" (click)="onBackdropClick($event)">
          <div class="modal-content-custom modal-lg p-4">
            <div class="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-receipt text-success fs-4"></i>
                <h5 class="fw-bold m-0 text-dark">Comprobante de Pago #{{ voucherPagoId }}</h5>
              </div>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" (click)="imprimirVoucher()">
                  <i class="bi bi-printer-fill"></i>
                  <span>Imprimir</span>
                </button>
                <button type="button" class="btn-close" (click)="showVoucherModal = false"></button>
              </div>
            </div>

            @if (loadingVoucher) {
              <app-loading message="Cargando voucher..."></app-loading>
            } @else {
              <!-- Contenedor del Voucher HTML -->
              <div class="border rounded p-3 bg-white" style="max-height: 60vh; overflow-y: auto;" [innerHTML]="safeVoucherHtml"></div>
            }

            <div class="d-flex justify-content-end pt-3 border-top mt-3">
              <button type="button" class="btn btn-secondary px-4" (click)="showVoucherModal = false">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class UserMisPagosComponent implements OnInit {
  private authService = inject(AuthService);
  private duenoService = inject(DuenoService);
  private deudaService = inject(DeudaService);
  private pagoService = inject(PagoService);
  private toastService = inject(ToastService);
  private sanitizer = inject(DomSanitizer);

  loading = true;
  misPagos: PagoConDetalle[] = [];

  // Voucher
  showVoucherModal = false;
  loadingVoucher = false;
  voucherPagoId = 0;
  rawVoucherHtml = '';
  safeVoucherHtml: SafeHtml = '';

  ngOnInit(): void {
    this.loadMisPagos();
  }

  loadMisPagos(): void {
    const duenoId = this.authService.getDuenoId();
    if (!duenoId) {
      this.loading = false;
      this.misPagos = [];
      return;
    }

    this.loading = true;

    forkJoin({
      dueno: this.duenoService.getDueno(duenoId),
      pagos: this.pagoService.getPagos()
    }).subscribe({
      next: ({ dueno, pagos }) => {
        const tiendasIds = (dueno?.tiendas || []).map(t => t.id);

        // Si tenemos pagos, cruzamos con las tiendas de este dueño
        this.misPagos = pagos
          .map(p => ({
            pago: p,
            deuda: undefined,
            tiendaId: undefined,
            servicioNombre: undefined
          }))
          .sort((a, b) => b.pago.id - a.pago.id);

        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.misPagos = [];
      }
    });
  }

  abrirVoucher(pagoId: number): void {
    this.voucherPagoId = pagoId;
    this.showVoucherModal = true;
    this.loadingVoucher = true;

    this.pagoService.getVoucherHtml(pagoId).subscribe({
      next: (html) => {
        this.rawVoucherHtml = html;
        this.safeVoucherHtml = this.sanitizer.bypassSecurityTrustHtml(html);
        this.loadingVoucher = false;
      },
      error: (err) => {
        this.loadingVoucher = false;
        const msg = err.error?.mensaje || 'Error al obtener el voucher';
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

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop-custom')) {
      this.showVoucherModal = false;
    }
  }
}
