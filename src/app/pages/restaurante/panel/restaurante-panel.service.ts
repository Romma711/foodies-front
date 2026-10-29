import { HttpClient, HttpEvent } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { withRole } from '../../../core/auth/auth-context';
import { API_URL } from '../../../core/config/api.config';
import {
  Carta,
  CupoEspecial,
  CupoEspecialRequest,
  EstadoReserva,
  MiRestaurante,
  MiRestaurantePatch,
  ReservaPanel,
} from './panel.models';

/** API del gestor del restaurante. Cada llamada usa la sesión RESTAURANTE, nunca el token de otro rol. */
@Service()
export class RestaurantePanelService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);
  private readonly meUrl = `${this.apiUrl}/restaurantes/me`;

  getMiRestaurante(): Observable<MiRestaurante> {
    return this.http.get<MiRestaurante>(this.meUrl, { context: withRole('RESTAURANTE') });
  }

  actualizar(patch: MiRestaurantePatch): Observable<MiRestaurante> {
    return this.http.patch<MiRestaurante>(this.meUrl, patch, { context: withRole('RESTAURANTE') });
  }

  /** Emite eventos de progreso de la subida y, al final, la carta guardada. */
  subirCarta(archivo: File): Observable<HttpEvent<Carta>> {
    const body = new FormData();
    body.append('archivo', archivo, archivo.name);
    return this.http.put<Carta>(`${this.meUrl}/carta`, body, {
      context: withRole('RESTAURANTE'),
      observe: 'events',
      reportProgress: true,
    });
  }

  eliminarCarta(): Observable<void> {
    return this.http.delete<void>(`${this.meUrl}/carta`, { context: withRole('RESTAURANTE') });
  }

  getReservas(): Observable<ReservaPanel[]> {
    return this.http.get<ReservaPanel[]>(`${this.meUrl}/reservas`, {
      context: withRole('RESTAURANTE'),
    });
  }

  getCuposEspeciales(): Observable<CupoEspecial[]> {
    return this.http.get<CupoEspecial[]>(`${this.meUrl}/cupos-especiales`, {
      context: withRole('RESTAURANTE'),
    });
  }

  /** Crea o modifica el cupo especial de `fecha` (`yyyy-MM-dd`). */
  guardarCupoEspecial(fecha: string, request: CupoEspecialRequest): Observable<CupoEspecial> {
    return this.http.put<CupoEspecial>(`${this.meUrl}/cupos-especiales/${fecha}`, request, {
      context: withRole('RESTAURANTE'),
    });
  }

  eliminarCupoEspecial(fecha: string): Observable<void> {
    return this.http.delete<void>(`${this.meUrl}/cupos-especiales/${fecha}`, {
      context: withRole('RESTAURANTE'),
    });
  }

  cambiarEstado(
    reservaId: number,
    estado: Exclude<EstadoReserva, 'PENDIENTE'>,
  ): Observable<ReservaPanel> {
    return this.http.patch<ReservaPanel>(
      `${this.apiUrl}/reservas/${reservaId}/estado`,
      { estado },
      { context: withRole('RESTAURANTE') },
    );
  }
}
