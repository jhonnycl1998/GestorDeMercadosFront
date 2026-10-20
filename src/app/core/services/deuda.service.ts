import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Deuda } from '../models';

@Injectable({
  providedIn: 'root'
})
export class DeudaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Deuda`;

  getDeudas(): Observable<Deuda[]> {
    return this.http.get<Deuda[]>(`${this.apiUrl}/getDeudas`);
  }

  getDeuda(id: number): Observable<Deuda> {
    return this.http.get<Deuda>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtiene deudas pendientes del dueño especificado.
   * La API retorna 404 si no hay deudas pendientes; se captura y retorna arreglo vacío.
   */
  getDeudasPorDueno(duenoId: number): Observable<Deuda[]> {
    return this.http.get<Deuda[]>(`${this.apiUrl}/dueno/${duenoId}`).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          return of([]);
        }
        return throwError(() => error);
      })
    );
  }

  saveDeuda(deuda: Omit<Deuda, 'id'>): Observable<Deuda> {
    return this.http.post<Deuda>(`${this.apiUrl}/saveDeuda`, deuda);
  }

  updateDeuda(deuda: Deuda): Observable<any> {
    return this.http.put(`${this.apiUrl}/updateDeuda`, deuda);
  }

  deleteDeuda(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
