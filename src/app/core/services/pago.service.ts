import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pago, PagoCreateRequest } from '../models';

@Injectable({
  providedIn: 'root'
})
export class PagoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Pago`;

  getPagos(): Observable<Pago[]> {
    return this.http.get<Pago[]>(this.apiUrl);
  }

  getPago(id: number): Observable<Pago> {
    return this.http.get<Pago>(`${this.apiUrl}/${id}`);
  }

  getPagoPorDeuda(deudaId: number): Observable<Pago> {
    return this.http.get<Pago>(`${this.apiUrl}/deuda/${deudaId}`);
  }

  registrarPago(data: PagoCreateRequest): Observable<{ mensaje: string; pago: Pago }> {
    return this.http.post<{ mensaje: string; pago: Pago }>(this.apiUrl, data);
  }

  deletePago(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtiene el voucher HTML en formato string.
   */
  getVoucherHtml(id: number): Observable<string> {
    return this.http.get(`${this.apiUrl}/voucher-html/${id}`, {
      responseType: 'text'
    });
  }

  /**
   * Obtiene los pagos de hoy. 404 si no hay pagos hoy.
   */
  getReporteHoy(): Observable<Pago[]> {
    return this.http.get<Pago[]>(`${this.apiUrl}/reporte-hoy`).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          return of([]);
        }
        return throwError(() => error);
      })
    );
  }
}
