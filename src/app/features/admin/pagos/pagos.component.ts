import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { forkJoin } from 'rxjs';
import { PagoService } from '../../../core/services/pago.service';
import { DeudaService } from '../../../core/services/deuda.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-modal/confirm-modal.component';
import { Deuda, Pago, PagoCreateRequest } from '../../../core/models';

@Component({
  selector: 'app-pagos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule, LoadingComponent, ConfirmModalComponent],
  template: `
    <div class="container-fluid p-0">
      <!-- Header -->
      <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h3 class="fw-bold text-dark m-0">Gestión de Pagos</h3>
          <p class="text-muted small m-0">Registro de cobros, consulta de vouchers y reportes de recaudación</p>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-info d-flex align-items-center gap-1" (click)="openReporteHoyModal()">
            <i class="bi bi-calendar2-check"></i>
            <span>Reporte de Hoy</span>
          </button>
          <button class="btn btn-success d-flex align-items-center gap-2" (click)="openRegistrarPagoModal()">
            <i class="bi bi-credit-card-fill"></i>
            <span>Registrar Pago</span>
          </button>
        </div>
      </div>

      <!-- Tabla de Pagos -->
      @if (loading) {
        <app-loading message="Cargando historial de pagos..."></app-loading>
      } @else {
        <div class="card shadow-sm">
          <div class="card-header bg-white py-3 d-flex align-items-center justify-content-between">
            <h5 class="fw-bold m-0 text-dark">Historial General de Pagos Realizados</h5>
            <span class="badge bg-light text-secondary border">Total: {{ pagos.length }} pagos</span>
          </div>

          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th class="ps-3">ID Pago</th>
                  <th>Fecha y Hora</th>
                  <th>ID Deuda</th>
                  <th>Monto Cobrado</th>
                  <th class="text-end pe-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                @if (pagos.length === 0) {
                  <tr>
                    <td colspan="5" class="text-center py-5 text-muted">
                      <i class="bi bi-receipt text-secondary fs-1 mb-2 d-block"></i>
                      <p class="m-0 fw-medium">No se registran pagos en el sistema</p>
                    </td>
                  </tr>
                } @else {
                  @for (pago of pagos; track pago.id) {
                    <tr>
                      <td class="ps-3 fw-bold text-secondary">#{{ pago.id }}</td>
                      <td>
                        <span class="fw-semibold text-dark">{{ pago.fechaPago | date:'dd/MM/yyyy HH:mm' }}</span>
                      </td>
                      <td>
                        <span class="badge bg-light text-dark border">
                          Deuda #{{ pago.deudaId }}
                        </span>
                      </td>
                      <td class="fw-bold text-success">
                        S/. {{ pago.montoPago | number:'1.2-2' }}
                      </td>
                      <td class="text-end pe-3">
                        <div class="btn-group btn-group-sm">
                          <button class="btn btn-outline-primary" (click)="verVoucher(pago.id)" title="Ver / Imprimir Voucher">
                            <i class="bi bi-file-earmark-text me-1"></i> Voucher
                          </button>
                          <button class="btn btn-outline-danger" (click)="askDelete(pago)" title="Eliminar Pago">
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

      <!-- Modal Registrar Pago -->
      @if (showRegistrarModal) {
        <div class="modal-backdrop-custom" (click)="onBackdropClick($event, 'pago')">
          <div class="modal-content-custom p-4">
            <div class="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
              <h5 class="fw-bold m-0 text-dark">Registrar Cobro de Deuda</h5>
              <button type="button" class="btn-close" (click)="showRegistrarModal = false"></button>
            </div>

            <form (ngSubmit)="submitPago()">
              <div class="mb-3">
                <label class="form-label small fw-semibold">Seleccionar Deuda Pendiente *</label>
                <select
                  class="form-select"
                  name="deudaSelect"
                  [(ngModel)]="selectedDeudaId"
                  (change)="onDeudaSelectChange()"
                  required
                >
                  <option [ngValue]="null" disabled>-- Elige una deuda pendiente --</option>
                  @for (d of deudasPendientes; track d.id) {
                    <option [ngValue]="d.id">
                      #{{ d.id }} · Puesto {{ d.tiendaId }} · {{ d.servicio?.nombre || ('Servicio #' + d.servicioId) }} · S/. {{ d.montoDeuda | number:'1.2-2' }}
                    </option>
                  }
                </select>
                @if (deudasPendientes.length === 0) {
                  <small class="text-muted d-block mt-1">No hay deudas pendientes por cobrar.</small>
                }
              </div>

              <!-- Detalle de la Deuda Seleccionada -->
              @if (deudaSeleccionadaObj) {
                <div class="card bg-light border p-3 mb-3">
                  <div class="d-flex justify-content-between mb-1 small">
                    <span class="text-muted">Puesto Comercial:</span>
                    <strong>Puesto #{{ deudaSeleccionadaObj.tiendaId }}</strong>
                  </div>
                  <div class="d-flex justify-content-between mb-1 small">
                    <span class="text-muted">Concepto / Servicio:</span>
                    <strong>{{ deudaSeleccionadaObj.servicio?.nombre || 'Servicio' }}</strong>
                  </div>
                  <div class="d-flex justify-content-between mb-1 small">
                    <span class="text-muted">Fecha Vencimiento:</span>
                    <span>{{ deudaSeleccionadaObj.fechaLimitePago | date:'dd/MM/yyyy' }}</span>
                  </div>
                  <div class="d-flex justify-content-between pt-2 border-top fw-bold text-success fs-5">
                    <span>Monto a Cobrar:</span>
                    <span>S/. {{ deudaSeleccionadaObj.montoDeuda | number:'1.2-2' }}</span>
                  </div>
                </div>
              }

              <div class="mb-3">
                <label class="form-label small fw-semibold">Monto del Pago (S/.) *</label>
                <div class="input-group">
                  <span class="input-group-text">S/.</span>
                  <input
                    type="number"
                    class="form-control"
                    name="montoPago"
                    [(ngModel)]="montoPagoInput"
                    [readonly]="true"
                    required
                  />
                </div>
                <small class="text-muted" style="font-size: 0.72rem;">
                  Regla de negocio: El pago debe ser exactamente igual al monto de la deuda.
                </small>
              </div>

              <div class="d-flex justify-content-end gap-2 pt-3 border-top">
                <button type="button" class="btn btn-outline-secondary px-4" (click)="showRegistrarModal = false" [disabled]="submitting">
                  Cancelar
                </button>
                <button type="submit" class="btn btn-success px-4" [disabled]="submitting || !selectedDeudaId || montoPagoInput <= 0">
                  @if (submitting) {
                    <span class="spinner-border spinner-border-sm me-2"></span>
                    Registrando...
                  } @else {
                    <i class="bi bi-check2-circle me-1"></i> Confirmar Cobro
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Modal Voucher HTML con Imprimir -->
      @if (showVoucherModal) {
        <div class="modal-backdrop-custom" (click)="onBackdropClick($event, 'voucher')">
          <div class="modal-content-custom modal-lg p-4">
            <div class="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-receipt text-success fs-4"></i>
                <h5 class="fw-bold m-0 text-dark">Voucher de Pago #{{ voucherPagoId }}</h5>
              </div>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" (click)="imprimirVoucher()">
                  <i class="bi bi-printer-fill"></i>
                  <span>Imprimir Voucher</span>
                </button>
                <button type="button" class="btn-close" (click)="showVoucherModal = false"></button>
              </div>
            </div>

            @if (loadingVoucher) {
              <app-loading message="Cargando voucher..."></app-loading>
            } @else {
              <!-- Contenedor del Voucher HTML -->
              <div id="voucher-print-area" class="border rounded p-3 bg-white" style="max-height: 60vh; overflow-y: auto;" [innerHTML]="safeVoucherHtml"></div>
            }

            <div class="d-flex justify-content-end pt-3 border-top mt-3">
              <button type="button" class="btn btn-secondary px-4" (click)="showVoucherModal = false">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Modal Reporte de Hoy -->
      @if (showReporteHoyModal) {
        <div class="modal-backdrop-custom" (click)="onBackdropClick($event, 'reporte')">
          <div class="modal-content-custom modal-lg p-4">
            <div class="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-calendar2-date text-info fs-4"></i>
                <h5 class="fw-bold m-0 text-dark">Reporte de Recaudación de Hoy</h5>
              </div>
              <button type="button" class="btn-close" (click)="showReporteHoyModal = false"></button>
            </div>

            @if (loadingReporte) {
              <app-loading message="Consultando pagos de la fecha..."></app-loading>
            } @else if (pagosHoy.length === 0) {
              <div class="alert alert-info d-flex align-items-center my-3 py-3">
                <i class="bi bi-info-circle-fill fs-4 me-3"></i>
                <div>
                  <h6 class="fw-bold m-0">No se registraron pagos hoy</h6>
                  <p class="m-0 small">Aún no se ha cobrado ningún servicio en la fecha actual.</p>
                </div>
              </div>
            } @else {
              <div class="card bg-success bg-opacity-10 border border-success border-opacity-25 p-3 mb-3">
                <div class="d-flex align-items-center justify-content-between">
                  <div>
                    <span class="text-secondary small">Total Recaudado Hoy:</span>
                    <h3 class="fw-bold text-success m-0">S/. {{ totalRecaudadoHoy | number:'1.2-2' }}</h3>
                  </div>
                  <div class="text-end">
                    <span class="badge bg-success fs-6">{{ pagosHoy.length }} Pagos procesados</span>
                  </div>
                </div>
              </div>

              <div class="table-responsive" style="max-height: 45vh; overflow-y: auto;">
                <table class="table table-sm table-hover align-middle">
                  <thead class="table-light">
                    <tr>
                      <th>ID Pago</th>
                      <th>Hora</th>
                      <th>ID Deuda</th>
                      <th class="text-end">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (p of pagosHoy; track p.id) {
                      <tr>
                        <td class="fw-bold">#{{ p.id }}</td>
                        <td>{{ p.fechaPago | date:'HH:mm:ss' }}</td>
                        <td>Deuda #{{ p.deudaId }}</td>
                        <td class="text-end fw-bold text-success">S/. {{ p.montoPago | number:'1.2-2' }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }

            <div class="d-flex justify-content-end pt-3 border-top mt-3">
              <button type="button" class="btn btn-secondary px-4" (click)="showReporteHoyModal = false">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Modal de Confirmación de Eliminación -->
      <app-confirm-modal
        [isOpen]="showDeleteModal"
        title="Eliminar Pago"
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
export class PagosComponent implements OnInit {
  private pagoService = inject(PagoService);
  private deudaService = inject(DeudaService);
  private toastService = inject(ToastService);
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);

  loading = true;
  submitting = false;

  pagos: Pago[] = [];
  deudasPendientes: Deuda[] = [];

  // Registrar pago
  showRegistrarModal = false;
  selectedDeudaId: number | null = null;
  deudaSeleccionadaObj: Deuda | null = null;
  montoPagoInput = 0;

  // Voucher
  showVoucherModal = false;
  loadingVoucher = false;
  voucherPagoId = 0;
  rawVoucherHtml = '';
  safeVoucherHtml: SafeHtml = '';

  // Reporte de hoy
  showReporteHoyModal = false;
  loadingReporte = false;
  pagosHoy: Pago[] = [];

  // Eliminar
  showDeleteModal = false;
  pagoToDelete: Pago | null = null;
  deleteMessage = '';

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    forkJoin({
      pagos: this.pagoService.getPagos(),
      deudas: this.deudaService.getDeudas()
    }).subscribe({
      next: ({ pagos, deudas }) => {
        this.pagos = pagos.sort((a, b) => b.id - a.id);
        this.deudasPendientes = deudas.filter(d => d.estado === 'Pendiente');
        this.loading = false;

        // Si viene queryParam deudaId, abrir modal
        const queryDeudaId = this.route.snapshot.queryParamMap.get('deudaId');
        if (queryDeudaId) {
          this.openRegistrarPagoConDeuda(Number(queryDeudaId));
        }
      },
      error: () => {
        this.loading = false;
        this.toastService.error('Error al cargar la información de pagos');
      }
    });
  }

  openRegistrarPagoModal(): void {
    this.selectedDeudaId = null;
    this.deudaSeleccionadaObj = null;
    this.montoPagoInput = 0;
    this.showRegistrarModal = true;
  }

  openRegistrarPagoConDeuda(deudaId: number): void {
    this.selectedDeudaId = deudaId;
    this.onDeudaSelectChange();
    this.showRegistrarModal = true;
  }

  onDeudaSelectChange(): void {
    if (!this.selectedDeudaId) {
      this.deudaSeleccionadaObj = null;
      this.montoPagoInput = 0;
      return;
    }

    const d = this.deudasPendientes.find(item => item.id === this.selectedDeudaId);
    if (d) {
      this.deudaSeleccionadaObj = d;
      this.montoPagoInput = d.montoDeuda;
    }
  }

  submitPago(): void {
    if (!this.selectedDeudaId || this.montoPagoInput <= 0) {
      this.toastService.warning('Por favor selecciona una deuda válida');
      return;
    }

    this.submitting = true;
    const payload: PagoCreateRequest = {
      deudaId: this.selectedDeudaId,
      montoPago: this.montoPagoInput
    };

    this.pagoService.registrarPago(payload).subscribe({
      next: (res) => {
        const nuevoPago = res?.pago;
        this.submitting = false;
        this.toastService.success('Pago registrado exitosamente');
        this.showRegistrarModal = false;
        this.loadData();

        // Mostrar directamente el voucher del pago recién realizado
        if (nuevoPago?.id) {
          this.verVoucher(nuevoPago.id);
        }
      },
      error: (err) => {
        this.submitting = false;
        const msg = err.error?.mensaje || 'Error al registrar el pago';
        this.toastService.error(msg);
      }
    });
  }

  verVoucher(pagoId: number): void {
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
        const msg = err.error?.mensaje || 'Error al obtener el voucher HTML';
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

  openReporteHoyModal(): void {
    this.showReporteHoyModal = true;
    this.loadingReporte = true;

    this.pagoService.getReporteHoy().subscribe({
      next: (data) => {
        this.pagosHoy = data;
        this.loadingReporte = false;
      },
      error: () => {
        this.pagosHoy = [];
        this.loadingReporte = false;
      }
    });
  }

  get totalRecaudadoHoy(): number {
    return this.pagosHoy.reduce((sum, p) => sum + (p.montoPago || 0), 0);
  }

  askDelete(pago: Pago): void {
    this.pagoToDelete = pago;
    this.deleteMessage = `¿Estás seguro de eliminar el registro de pago <strong>#${pago.id}</strong> por S/. ${pago.montoPago}?`;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.pagoToDelete) return;

    this.submitting = true;
    this.pagoService.deletePago(this.pagoToDelete.id).subscribe({
      next: () => {
        this.submitting = false;
        this.toastService.success('Pago eliminado correctamente');
        this.showDeleteModal = false;
        this.pagoToDelete = null;
        this.loadData();
      },
      error: (err) => {
        this.submitting = false;
        const msg = err.error?.mensaje || 'Error al eliminar el pago';
        this.toastService.error(msg);
      }
    });
  }

  onBackdropClick(event: MouseEvent, type: string): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop-custom')) {
      if (type === 'pago') this.showRegistrarModal = false;
      if (type === 'voucher') this.showVoucherModal = false;
      if (type === 'reporte') this.showReporteHoyModal = false;
    }
  }
}
