import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Dueno, DuenoCreateRequest } from '../models';

@Injectable({
  providedIn: 'root'
})
export class DuenoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Dueno`;

  getDuenos(): Observable<Dueno[]> {
    return this.http.get<Dueno[]>(`${this.apiUrl}/getDuenos`);
  }

  getDueno(id: number): Observable<Dueno> {
    return this.http.get<Dueno>(`${this.apiUrl}/${id}`);
  }

  saveDueno(dueno: DuenoCreateRequest): Observable<Dueno> {
    return this.http.post<Dueno>(`${this.apiUrl}/saveDueno`, dueno);
  }

  updateDueno(dueno: Partial<Dueno>): Observable<any> {
    return this.http.put(`${this.apiUrl}/updateDueno`, dueno);
  }

  deleteDueno(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
