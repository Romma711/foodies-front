import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FranjaHoraria } from '../../restaurantes/utils/horarios';

/** Horario de atención público de un restaurante. Sin franjas = sin restricción de horario. */
@Service()
export class HorariosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/restaurantes`;

  listar(restauranteId: number): Observable<FranjaHoraria[]> {
    return this.http
      .get<FranjaHoraria[] | null>(`${this.apiUrl}/${restauranteId}/horarios`)
      .pipe(map((franjas) => franjas ?? []));
  }
}
