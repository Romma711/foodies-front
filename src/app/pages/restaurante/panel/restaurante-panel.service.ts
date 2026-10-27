import { HttpClient, HttpEvent } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { withRole } from '../../../core/auth/auth-context';
import { API_URL } from '../../../core/config/api.config';
import {
  Carta,
  EstadoReserva,
  MiRestaurante,
  MiRestaurantePatch,
  ReservaPanel,
} from './panel.models';

/** Restaurant manager API. Every call carries the RESTAURANTE session, never another role's token. */
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

  /** Emits upload progress events and finally the stored carta. */
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
