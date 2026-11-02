import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Service, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, of, tap, throwError } from 'rxjs';
import { withRole } from '../../../core/auth/auth-context';
import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

/** `UsuarioDetailDTO` del cliente que inició sesión. */
export interface ClientePerfil {
  id: number;
  email: string;
  telefono: string | null;
  rol: string;
  nombre: string | null;
  apellido: string | null;
}

/** Datos de la cuenta del cliente: el menú del header y la página "Mi perfil" los comparten. */
@Service()
export class ClientePerfilService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/clientes`;

  private readonly _perfil = signal<ClientePerfil | null>(null);
  private readonly _cargando = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly perfil = this._perfil.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();

  /** El nombre de pila si lo cargó; si no, el email de la sesión. */
  readonly nombreVisible = computed(
    () => this._perfil()?.nombre?.trim() || this.auth.subject('CLIENTE') || 'Mi cuenta',
  );

  readonly nombreCompleto = computed(() => {
    const perfil = this._perfil();
    const completo = [perfil?.nombre, perfil?.apellido]
      .map((parte) => parte?.trim())
      .filter(Boolean)
      .join(' ');
    return completo || this.nombreVisible();
  });

  /** Trae el perfil de la sesión actual. Sin sesión de cliente no pide nada. */
  cargar(): Observable<ClientePerfil | null> {
    const usuarioId = this.auth.userId('CLIENTE');
    if (usuarioId === null) {
      this._perfil.set(null);
      return of(null);
    }
    this._cargando.set(true);
    this._error.set(null);
    return this.http
      .get<ClientePerfil>(`${this.apiUrl}/${usuarioId}`, { context: withRole('CLIENTE') })
      .pipe(
        tap((perfil) => this._perfil.set(perfil)),
        catchError((error: unknown) => {
          this._error.set(this.mensajeError(error));
          return throwError(() => error);
        }),
        finalize(() => this._cargando.set(false)),
      );
  }

  /** Al cerrar sesión: que el próximo cliente no vea los datos del anterior. */
  limpiar(): void {
    this._perfil.set(null);
    this._error.set(null);
  }

  private mensajeError(error: unknown): string {
    const status = error instanceof HttpErrorResponse ? error.status : -1;
    const mensajes: Record<number, string> = {
      0: 'No se pudo conectar con el servidor.',
      401: 'Tu sesión venció. Iniciá sesión nuevamente.',
      404: 'No encontramos tu cuenta.',
    };
    return mensajes[status] ?? 'No pudimos cargar tu perfil.';
  }
}
