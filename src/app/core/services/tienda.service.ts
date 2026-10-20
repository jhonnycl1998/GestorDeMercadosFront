import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Tienda } from '../models';

@Injectable({
  providedIn: 'root'
})
export class TiendaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Tienda`;

  getTiendas(): Observable<Tienda[]> {
    return this.http.get<Tienda[]>(`${this.apiUrl}/getTiendas`);
  }

  getTienda(id: number): Observable<Tienda> {
    return this.http.get<Tienda>(`${this.apiUrl}/${id}`);
  }

  saveTienda(tienda: Omit<Tienda, 'id'>): Observable<Tienda> {
    return this.http.post<Tienda>(`${this.apiUrl}/saveTienda`, tienda);
  }

  /**
   * Reemplaza la tienda completa: envía siempre todos los campos:
   * id, tieneDueno, alquiler, costoAlquiler, duenoId
   */
  updateTienda(tienda: Tienda): Observable<any> {
    return this.http.put(`${this.apiUrl}/updateTienda`, tienda);
  }

  deleteTienda(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
