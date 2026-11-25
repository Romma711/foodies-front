import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Disponibilidad } from '../models/disponibilidad';

/** Free seats per shift and espacio on a date. Public endpoint. */
@Service()
export class DisponibilidadService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/restaurantes`;

  consultar(restauranteId: number, fecha: string): Observable<Disponibilidad> {
    return this.http.get<Disponibilidad>(`${this.apiUrl}/${restauranteId}/disponibilidad`, {
      params: new HttpParams().set('fecha', fecha),
    });
  }
}
