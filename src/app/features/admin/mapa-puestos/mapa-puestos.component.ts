import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { TiendaService } from '../../../core/services/tienda.service';
import { DuenoService } from '../../../core/services/dueno.service';
import { DeudaService } from '../../../core/services/deuda.service';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { Deuda, Dueno, Tienda } from '../../../core/models';

type FilterType = 'todos' | 'asociacion' | 'conDueno' | 'conDeuda';

@Component({
  selector: 'app-mapa-puestos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [CommonModule, FormsModule, LoadingComponent],
  template: `
    <div class="container-fluid p-0">
      <!-- Header -->
      <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h3 class="fw-bold text-dark m-0">Mapa de Puestos del Mercado</h3>
          <p class="text-muted small m-0">Visualización en cuadrícula de los 40 puestos comerciales</p>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-success btn-sm d-flex align-items-center gap-1" (click)="loadData()">
            <i class="bi bi-arrow-clockwise"></i>
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      <!-- Leyenda y Filtros -->
      <div class="card shadow-sm mb-4">
        <div class="card-body p-3">
          <div class="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
            <!-- Leyenda visual -->
            <div class="d-flex flex-wrap align-items-center gap-3 small">
              <span class="fw-bold text-secondary">Leyenda:</span>
              <div class="d-flex align-items-center gap-1">
                <span class="legend-box bg-secondary bg-opacity-25 border border-secondary"></span>
                <span>Asociación (Sin dueño)</span>
              </div>
              <div class="d-flex align-items-center gap-1">
                <span class="legend-box bg-success bg-opacity-25 border border-success"></span>
                <span class="text-success fw-medium">Con Dueño</span>
              </div>
              <div class="d-flex align-items-center gap-1">
                <span class="legend-box border border-danger border-2" style="background: #fff; outline: 2px solid #dc3545;"></span>
                <span class="text-danger fw-bold">Con Deuda Pendiente</span>
              </div>
            </div>

            <!-- Filtros -->
            <div class="btn-group btn-group-sm" role="group">
              <button
                type="button"
                class="btn"
                [ngClass]="activeFilter === 'todos' ? 'btn-success' : 'btn-outline-secondary'"
                (click)="setFilter('todos')"
              >
                Todos ({{ tiendas.length }})
              </button>
              <button
                type="button"
                class="btn"
                [ngClass]="activeFilter === 'conDueno' ? 'btn-success' : 'btn-outline-secondary'"
                (click)="setFilter('conDueno')"
              >
                Con Dueño ({{ countConDueno }})
              </button>
              <button
                type="button"
                class="btn"
                [ngClass]="activeFilter === 'asociacion' ? 'btn-success' : 'btn-outline-secondary'"
                (click)="setFilter('asociacion')"
              >
                Asociación ({{ countAsociacion }})
              </button>
              <button
                type="button"
                class="btn"
                [ngClass]="activeFilter === 'conDeuda' ? 'btn-danger' : 'btn-outline-danger'"
                (click)="setFilter('conDeuda')"
              >
                Con Deudas ({{ countConDeuda }})
              </button>
            </div>
          </div>
        </div>
      </div>

      @if (loading) {
        <app-loading message="Cargando puestos y deudas..."></app-loading>
      } @else {
        <!-- Grid de los 40 Puestos -->
        <div class="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 row-cols-xl-8 g-3">
          @for (tienda of filteredTiendas; track tienda.id) {
            <div class="col">
              <div
                class="puesto-card p-3 h-100 text-center d-flex flex-column justify-content-between"
                [ngClass]="{
                  'asociacion': !tienda.tieneDueno,
                  'con-dueno': tienda.tieneDueno,
                  'con-deuda': tieneDeudaPendiente(tienda.id)
                }"
                (click)="openModal(tienda)"
                role="button"
                tabindex="0"
                [title]="'Puesto ' + tienda.id + (tienda.tieneDueno ? ' - Con dueño' : ' - Asociación')"
              >
                <div>
                  <div class="d-flex align-items-center justify-content-between mb-1">
                    <span class="badge" [ngClass]="tienda.tieneDueno ? 'bg-success' : 'bg-secondary'">
                      #{{ tienda.id }}
                    </span>
                    @if (tieneDeudaPendiente(tienda.id)) {
                      <span class="badge bg-danger text-white" title="Tiene deudas pendientes">
                        <i class="bi bi-exclamation-triangle-fill"></i>
                      </span>
                    }
                  </div>
                  <h6 class="fw-bold my-2">Puesto {{ tienda.id }}</h6>
                </div>

                <div class="mt-2 pt-2 border-top border-dark border-opacity-10 small">
                  @if (tienda.tieneDueno) {
                    <div class="text-truncate fw-semibold" title="{{ getDuenoNombre(tienda.duenoId) }}">
                      <i class="bi bi-person-fill"></i> {{ getDuenoNombre(tienda.duenoId) }}
                    </div>
                  } @else {
                    <div class="text-muted">
                      <i class="bi bi-building"></i> Asociación
                    </div>
                  }

                  @if (tienda.alquiler) {
                    <div class="text-primary-mercado fw-bold mt-1" style="font-size: 0.75rem;">
                      S/. {{ tienda.costoAlquiler | number:'1.2-2' }}
                    </div>
                  } @else {
                    <div class="text-muted" style="font-size: 0.72rem;">Propio</div>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Modal de Edición de Tienda / Puesto -->
      @if (selectedTienda) {
        <div class="modal-backdrop-custom" (click)="onBackdropClick($event)">
          <div class="modal-content-custom p-4">
            <div class="d-flex align-items-center justify-content-between pb-3 border-bottom mb-3">
              <div class="d-flex align-items-center gap-2">
                <div class="bg-success text-white rounded p-2 d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                  <i class="bi bi-shop fs-5"></i>
                </div>
                <div>
                  <h5 class="fw-bold m-0 text-dark">Puesto #{{ selectedTienda.id }}</h5>
                  <small class="text-muted">Administrar asignación y alquiler</small>
                </div>
              </div>
              <button type="button" class="btn-close" (click)="closeModal()" aria-label="Cerrar"></button>
            </div>

            <!-- Estado de deudas de este puesto -->
            @if (tieneDeudaPendiente(selectedTienda.id)) {
              <div class="alert alert-danger py-2 px-3 small d-flex align-items-center mb-3">
                <i class="bi bi-exclamation-octagon-fill fs-5 me-2"></i>
                <div>Este puesto registra deudas de servicios pendientes de pago.</div>
              </div>
            }

            <form (ngSubmit)="saveTienda()">
              <!-- Asignación de Dueño -->
              <div class="mb-3">
                <label class="form-label fw-bold text-secondary small">Asignación de Titularidad</label>
                <div class="d-flex gap-3 mb-2">
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="radio"
                      id="asocRadio"
                      name="tieneDuenoRadio"
                      [value]="false"
                      [(ngModel)]="editForm.tieneDueno"
                      (change)="onTieneDuenoChange(false)"
                    />
                    <label class="form-check-label" for="asocRadio">
                      Asociación del Mercado (Sin dueño)
                    </label>
                  </div>
                  <div class="form-check">
                    <input
                      class="form-check-input"
                      type="radio"
                      id="duenoRadio"
                      name="tieneDuenoRadio"
                      [value]="true"
                      [(ngModel)]="editForm.tieneDueno"
                      (change)="onTieneDuenoChange(true)"
                    />
                    <label class="form-check-label" for="duenoRadio">
                      Asignar a un Dueño
                    </label>
                  </div>
                </div>

                @if (editForm.tieneDueno) {
                  <div class="mt-2">
                    <label for="duenoSelect" class="form-label small fw-semibold">Seleccionar Dueño Titular:</label>
                    <select
                      id="duenoSelect"
                      class="form-select"
                      [(ngModel)]="editForm.duenoId"
                      name="duenoId"
                      required
                    >
                      <option [ngValue]="null" disabled>-- Selecciona un dueño registrado --</option>
                      @for (dueno of duenos; track dueno.id) {
                        <!-- Omitimos la Asociación ya que tieneDueno=true exige un dueño real -->
                        @if (dueno.ruc !== '00000000000') {
                          <option [ngValue]="dueno.id">
                            {{ dueno.nombre }} {{ dueno.apellido }} (RUC: {{ dueno.ruc }})
                          </option>
                        }
                      }
                    </select>
                  </div>
                }
              </div>

              <div class="hr my-3 border-top"></div>

              <!-- Configuración de Alquiler -->
              <div class="mb-3">
                <label class="form-label fw-bold text-secondary small">Modalidad de Ocupación</label>
                <div class="form-check form-switch mb-3">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="alquilerSwitch"
                    name="alquiler"
                    [(ngModel)]="editForm.alquiler"
                    (change)="onAlquilerChange()"
                  />
                  <label class="form-check-label fw-semibold" for="alquilerSwitch">
                    Puesto en modalidad de Alquiler
                  </label>
                </div>

                @if (editForm.alquiler) {
                  <div class="mb-2">
                    <label for="costoAlquiler" class="form-label small fw-semibold">Costo Mensual de Alquiler (S/.):</label>
                    <div class="input-group">
                      <span class="input-group-text">S/.</span>
                      <input
                        type="number"
                        id="costoAlquiler"
                        name="costoAlquiler"
                        class="form-control"
                        [(ngModel)]="editForm.costoAlquiler"
                        min="0"
                        step="0.01"
                        required
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                }
              </div>

              <!-- Botones de Acción -->
              <div class="d-flex justify-content-end gap-2 pt-3 border-top">
                <button type="button" class="btn btn-outline-secondary px-3" (click)="closeModal()" [disabled]="saving">
                  Cancelar
                </button>
                <button type="submit" class="btn btn-success px-4" [disabled]="saving || (editForm.tieneDueno && !editForm.duenoId)">
                  @if (saving) {
                    <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Guardando...
                  } @else {
                    <i class="bi bi-check2-circle me-1"></i> Guardar Cambios
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .legend-box {
      display: inline-block;
      width: 16px;
      height: 16px;
      border-radius: 4px;
    }
  `]
})
export class MapaPuestosComponent implements OnInit {
  private tiendaService = inject(TiendaService);
  private duenoService = inject(DuenoService);
  private deudaService = inject(DeudaService);
  private toastService = inject(ToastService);

  loading = true;
  saving = false;

  tiendas: Tienda[] = [];
  duenos: Dueno[] = [];
  deudas: Deuda[] = [];

  activeFilter: FilterType = 'todos';

  selectedTienda: Tienda | null = null;
  editForm: {
    id: number;
    tieneDueno: boolean;
    duenoId: number | null;
    alquiler: boolean;
    costoAlquiler: number;
  } = {
    id: 0,
    tieneDueno: false,
    duenoId: null,
    alquiler: false,
    costoAlquiler: 0
  };

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    forkJoin({
      tiendas: this.tiendaService.getTiendas(),
      duenos: this.duenoService.getDuenos(),
      deudas: this.deudaService.getDeudas()
    }).subscribe({
      next: ({ tiendas, duenos, deudas }) => {
        // Ordenar tiendas por id numérico
        this.tiendas = tiendas.sort((a, b) => a.id - b.id);
        this.duenos = duenos;
        this.deudas = deudas;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastService.error('Error al cargar la información de puestos');
      }
    });
  }

  get filteredTiendas(): Tienda[] {
    switch (this.activeFilter) {
      case 'asociacion':
        return this.tiendas.filter(t => !t.tieneDueno);
      case 'conDueno':
        return this.tiendas.filter(t => t.tieneDueno);
      case 'conDeuda':
        return this.tiendas.filter(t => this.tieneDeudaPendiente(t.id));
      default:
        return this.tiendas;
    }
  }

  get countConDueno(): number {
    return this.tiendas.filter(t => t.tieneDueno).length;
  }

  get countAsociacion(): number {
    return this.tiendas.filter(t => !t.tieneDueno).length;
  }

  get countConDeuda(): number {
    return this.tiendas.filter(t => this.tieneDeudaPendiente(t.id)).length;
  }

  setFilter(filter: FilterType): void {
    this.activeFilter = filter;
  }

  tieneDeudaPendiente(tiendaId: number): boolean {
    return this.deudas.some(d => d.tiendaId === tiendaId && d.estado === 'Pendiente');
  }

  getDuenoNombre(duenoId: number | null): string {
    if (!duenoId) return 'Asociación';
    const found = this.duenos.find(d => d.id === duenoId);
    return found ? `${found.nombre} ${found.apellido}` : `Dueño #${duenoId}`;
  }

  openModal(tienda: Tienda): void {
    this.selectedTienda = tienda;
    this.editForm = {
      id: tienda.id,
      tieneDueno: tienda.tieneDueno,
      duenoId: tienda.duenoId,
      alquiler: tienda.alquiler,
      costoAlquiler: tienda.costoAlquiler || 0
    };
  }

  closeModal(): void {
    this.selectedTienda = null;
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop-custom')) {
      this.closeModal();
    }
  }

  onTieneDuenoChange(hasDueno: boolean): void {
    this.editForm.tieneDueno = hasDueno;
    if (!hasDueno) {
      this.editForm.duenoId = null;
    }
  }

  onAlquilerChange(): void {
    if (!this.editForm.alquiler) {
      this.editForm.costoAlquiler = 0;
    }
  }

  saveTienda(): void {
    if (!this.selectedTienda) return;

    if (this.editForm.tieneDueno && !this.editForm.duenoId) {
      this.toastService.warning('Debes seleccionar un dueño titular');
      return;
    }

    this.saving = true;

    // Enviar siempre la tienda completa: id, tieneDueno, alquiler, costoAlquiler, duenoId
    const payload: Tienda = {
      id: this.editForm.id,
      tieneDueno: this.editForm.tieneDueno,
      alquiler: this.editForm.alquiler,
      costoAlquiler: this.editForm.costoAlquiler || 0,
      duenoId: this.editForm.tieneDueno ? this.editForm.duenoId : null
    };

    this.tiendaService.updateTienda(payload).subscribe({
      next: () => {
        this.saving = false;
        this.toastService.success(`Puesto #${payload.id} actualizado correctamente`);
        this.closeModal();
        this.loadData();
      },
      error: (err) => {
        this.saving = false;
        const msg = err.error?.mensaje || 'Error al actualizar el puesto';
        this.toastService.error(msg);
      }
    });
  }
}
