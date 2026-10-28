import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { map, Observable, shareReplay } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ResenaListDTO } from '../../resenas/models';

export interface Calificacion {
  /** Average rating rounded to one decimal; 0 when there are no reviews. */
  promedio: number;
  total: number;
}

/**
 * Average rating per restaurant for the map popups.
 *
 * It does not reuse `ResenaService.listarPorRestaurante` on purpose: that method stores the list in
 * the review page state, and opening a popup must not replace the reviews another page shows.
 * Results are cached for the session so reopening a popup does not refetch.
 */
@Service()
export class CalificacionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/resenas`;
  private readonly cache = new Map<number, Observable<Calificacion>>();

  promedio(restauranteId: number): Observable<Calificacion> {
    let calificacion = this.cache.get(restauranteId);
    if (!calificacion) {
      calificacion = this.http
        .get<ResenaListDTO[] | null>(this.apiUrl, {
          params: new HttpParams().set('id', restauranteId),
        })
        .pipe(
          map((resenas) => calcular(resenas ?? [])),
          shareReplay({ bufferSize: 1, refCount: false }),
        );
      this.cache.set(restauranteId, calificacion);
    }
    return calificacion;
  }
}

function calcular(resenas: ResenaListDTO[]): Calificacion {
  if (resenas.length === 0) {
    return { promedio: 0, total: 0 };
  }
  const suma = resenas.reduce((total, resena) => total + resena.calificacion, 0);
  return { promedio: Math.round((suma / resenas.length) * 10) / 10, total: resenas.length };
}
