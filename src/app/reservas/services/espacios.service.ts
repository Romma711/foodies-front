import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EspacioPublico } from '../../restaurantes/models/espacios';

/** Espacios (salones, patios, barras) donde el cliente puede reservar. Endpoint público. */
@Service()
export class EspaciosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/restaurantes`;

  /**
   * Espacios activos del restaurante. Con fecha (`yyyy-MM-dd`) y cantidad, cada uno indica si hay
   * lugar; sin ellos `hayLugar` es null.
   */
  listar(restauranteId: number, fecha?: string, cantidad?: number): Observable<EspacioPublico[]> {
    let params = new HttpParams();
    if (fecha && cantidad && cantidad > 0) {
      params = params.set('fecha', fecha).set('cantidad', cantidad);
    }
    return this.http
      .get<EspacioPublico[] | null>(`${this.apiUrl}/${restauranteId}/espacios`, { params })
      .pipe(map((espacios) => espacios ?? []));
  }
}
