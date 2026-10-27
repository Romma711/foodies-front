import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Service, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { LoginRequest, RegistroClienteRequest, User } from '../models/user';
import { UserService } from './user-service';

interface RespuestaLogin {
  Token: string;
}

interface PayloadJwt {
  sub?: string;
  roles?: string[];
  exp?: number;
}

interface ApiError {
  error?: string;
  mensaje?: string;
}

@Service()
export class Auth {
  private readonly http = inject(HttpClient);
  private readonly userService = inject(UserService);
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly claveToken = 'token';
  private readonly claveUsuarioId = 'usuarioId';

  private readonly _token = signal<string | null>(this.leerToken());
  private readonly _usuarioId = signal<number | null>(this.leerUsuarioId());
  private readonly _cargando = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();

  /** Id del cliente de la sesión activa, o `null` si todavía no se pudo resolver. */
  readonly usuarioId = this._usuarioId.asReadonly();

  /** Email (claim `sub` del JWT) de la sesión activa, o `null` si no hay sesión. */
  readonly email = computed(() => this.decodificarPayload(this._token())?.sub ?? null);
  readonly roles = computed(() => this.decodificarPayload(this._token())?.roles ?? []);

  iniciarSesion(login: LoginRequest): Observable<void> {
    return this.ejecutar(
      this.http.post<RespuestaLogin>(`${this.apiUrl}/login`, login).pipe(
        map((respuesta) => this.extraerToken(respuesta.Token)),
        tap((token) => this.guardarToken(token)),
        switchMap(() => this.resolverUsuarioId()),
        map(() => undefined),
      ),
    );
  }

  registrar(registro: RegistroClienteRequest): Observable<User> {
    return this.ejecutar(this.http.post<User>(`${this.apiUrl}/register/cliente`, registro));
  }

  cerrarSesion(): void {
    localStorage.removeItem(this.claveToken);
    localStorage.removeItem(this.claveUsuarioId);
    this._token.set(null);
    this._usuarioId.set(null);
    this._error.set(null);
  }

  /** Valida la sesión localmente: existe token y su expiración (claim `exp`) no venció. */
  estaAutenticado(): boolean {
    const token = this._token();
    if (!token) {
      return false;
    }
    const expiracion = this.decodificarPayload(token)?.exp;
    return expiracion !== undefined && expiracion * 1000 > Date.now();
  }

  /**
   * Devuelve el id del cliente de la sesión activa.
   * Si el token es viejo y no tenemos el id guardado, lo resuelve por email.
   */
  asegurarUsuarioId(): Observable<number> {
    const id = this._usuarioId();
    if (id !== null) {
      return of(id);
    }

    const email = this.email();
    if (!email) {
      return throwError(() => new Error('No hay una sesión activa.'));
    }

    return this.userService.cargarPorEmail(email).pipe(
      map((cliente) => {
        if (!cliente) {
          throw new Error('No pudimos identificar tu cuenta de usuario.');
        }
        this.guardarUsuarioId(cliente.id);
        return cliente.id;
      }),
    );
  }

  /** El backend no incluye el id en el token, así que lo buscamos por email (best-effort). */
  private resolverUsuarioId(): Observable<void> {
    const email = this.email();
    if (!email) {
      return of(undefined);
    }
    return this.userService.cargarPorEmail(email).pipe(
      tap((cliente) => this.guardarUsuarioId(cliente?.id ?? null)),
      map(() => undefined),
      catchError(() => of(undefined)),
    );
  }

  private guardarToken(token: string): void {
    localStorage.setItem(this.claveToken, token);
    this._token.set(token);
  }

  private leerToken(): string | null {
    return localStorage.getItem(this.claveToken);
  }

  private guardarUsuarioId(id: number | null): void {
    if (id === null) {
      localStorage.removeItem(this.claveUsuarioId);
      this._usuarioId.set(null);
      return;
    }
    localStorage.setItem(this.claveUsuarioId, String(id));
    this._usuarioId.set(id);
  }

  private leerUsuarioId(): number | null {
    const id = localStorage.getItem(this.claveUsuarioId);
    return id !== null && Number.isInteger(Number(id)) ? Number(id) : null;
  }

  /** El backend devuelve el token como `"Bearer <jwt>"`; guardamos solo el JWT. */
  private extraerToken(tokenConPrefijo: string | undefined): string {
    const token = tokenConPrefijo?.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      throw new Error('La respuesta del servidor no incluyó un token.');
    }
    return token;
  }

  private decodificarPayload(token: string | null): PayloadJwt | null {
    const parte = token?.split('.')[1];
    if (!parte) {
      return null;
    }
    try {
      const base64 = parte.replace(/-/g, '+').replace(/_/g, '/');
      const bytes = Uint8Array.from(atob(base64), (caracter) => caracter.charCodeAt(0));
      return JSON.parse(new TextDecoder().decode(bytes)) as PayloadJwt;
    } catch {
      return null;
    }
  }

  private ejecutar<T>(request: Observable<T>): Observable<T> {
    this._cargando.set(true);
    this._error.set(null);
    return request.pipe(
      catchError((error: unknown) => {
        this._error.set(this.obtenerMensajeError(error));
        return throwError(() => error);
      }),
      finalize(() => this._cargando.set(false)),
    );
  }

  private obtenerMensajeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const body = error.error as ApiError | string | null;
      if (typeof body === 'string' && body.trim().length > 0) {
        return body;
      }
      if (body !== null && typeof body === 'object') {
        const mensaje = body.mensaje ?? body.error ?? this.mensajeDeValidacion(body);
        if (mensaje) {
          return mensaje;
        }
      }
      return this.mensajePorEstado(error.status);
    }
    return 'Ocurrió un error inesperado.';
  }

  /** El backend devuelve los errores de validación (`@Valid`) como `{ campo: 'mensaje' }`. */
  private mensajeDeValidacion(body: object): string | null {
    const valores = Object.values(body as Record<string, unknown>);
    return (
      valores.find(
        (valor): valor is string => typeof valor === 'string' && valor.trim().length > 0,
      ) ?? null
    );
  }

  private mensajePorEstado(status: number): string {
    const mensajes: Record<number, string> = {
      0: 'No se pudo conectar con el servidor.',
      401: 'Email o contraseña incorrectos.',
      403: 'No tenés permisos para realizar esta acción.',
      404: 'No encontramos el recurso solicitado.',
      409: 'Este email ya está en uso.',
      500: 'Error interno del servidor.',
    };
    return mensajes[status] ?? 'No se pudo completar la operación.';
  }
}
