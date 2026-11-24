import { DOCUMENT } from '@angular/common';
import {
  Component,
  DestroyRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { ToastOutlet } from '../../../shared/ui/toast/toast-outlet';
import { StarRating } from '../../../resenas/components/star-rating/star-rating';
import {
  AdminModeracionService,
  FILTRO_RESENAS_VACIO,
  FiltroResenas,
  RestauranteFiltro,
} from '../../services/admin-moderacion.service';
import { TPipe } from '@core/i18n/t.pipe';
import { I18n } from '@core/i18n/i18n.service';
import { mensajeDeErrorAdmin } from '../../services/mensaje-error-admin';

/** Recent reviews from every restaurant, with server-side filters, "load more" and a confirmed quick delete per row. */
@Component({
  selector: 'app-moderacion-resenas',
  imports: [TPipe, RouterLink, StarRating, ToastOutlet],
  providers: [ToastService],
  template: `
    <section aria-labelledby="titulo-moderacion">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">
            {{ 'admin.panel' | t }}
          </p>
          <h1
            id="titulo-moderacion"
            class="mt-2 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl"
          >
            {{ 'admin.moderacion.titulo' | t }}
          </h1>
          <p class="mt-3 max-w-xl text-sm leading-6 text-ink-500">
            {{ 'admin.moderacion.subtitulo' | t }}
          </p>
        </div>
        @if (resenas().length > 0) {
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-ink-700 ring-1 ring-line transition hover:bg-cream-100 disabled:opacity-60"
            [disabled]="cargando()"
            (click)="recargar()"
          >
            {{ (cargando() ? 'admin.actualizando' : 'admin.actualizar') | t }}
          </button>
        }
      </div>

      @if (error(); as mensaje) {
        <div
          class="mt-6 flex flex-col gap-3 rounded-2xl border border-red-100 bg-red-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          data-testid="moderacion-error"
        >
          <p class="text-sm font-medium text-red-800">{{ mensaje | t }}</p>
          <button
            type="button"
            class="inline-flex shrink-0 items-center justify-center rounded-full bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-700"
            (click)="recargar()"
          >
            {{ 'comun.reintentar' | t }}
          </button>
        </div>
      }

      <form
        role="search"
        [attr.aria-label]="'admin.moderacion.filtrar' | t"
        class="mt-8 flex flex-wrap items-end gap-3 rounded-2xl border border-line/60 bg-white p-4 shadow-sm"
        (submit)="buscar($event)"
      >
        <div class="min-w-56 flex-1">
          <label for="filtro-resenas-texto" class="text-xs font-bold text-ink-700">{{
            'admin.moderacion.buscar' | t
          }}</label>
          <input
            id="filtro-resenas-texto"
            type="search"
            [placeholder]="'admin.moderacion.placeholder' | t"
            class="mt-1 block w-full rounded-xl border border-line bg-cream-50/60 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:outline-none"
            [value]="textoBuscado()"
            (input)="textoBuscado.set(valor($event))"
          />
        </div>
        <div>
          <label for="filtro-resenas-calificacion" class="text-xs font-bold text-ink-700">{{
            'admin.moderacion.calificacion' | t
          }}</label>
          <select
            id="filtro-resenas-calificacion"
            class="mt-1 block w-full rounded-xl border border-line bg-cream-50/60 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:outline-none"
            [value]="filtro().calificacion ?? ''"
            (change)="aplicar({ calificacion: numero(valor($event)) })"
          >
            <option value="">{{ 'admin.moderacion.todas' | t }}</option>
            @for (estrellas of calificaciones; track estrellas) {
              <option [value]="estrellas">
                {{
                  (estrellas === 1 ? 'resena.estrellaUna' : 'resena.estrellaVarias')
                    | t: { n: estrellas }
                }}
              </option>
            }
          </select>
        </div>
        <div>
          <label for="filtro-resenas-restaurante" class="text-xs font-bold text-ink-700">{{
            'admin.moderacion.restaurante' | t
          }}</label>
          <select
            id="filtro-resenas-restaurante"
            class="mt-1 block w-full rounded-xl border border-line bg-cream-50/60 px-3 py-2 text-sm text-ink-900 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 focus:outline-none"
            [value]="filtro().restauranteId ?? ''"
            (change)="aplicar({ restauranteId: numero(valor($event)) })"
          >
            <option value="">{{ 'admin.moderacion.todos' | t }}</option>
            @for (restaurante of restaurantesFiltro(); track restaurante.id) {
              <option [value]="restaurante.id">{{ restaurante.nombre }}</option>
            }
          </select>
        </div>
        <button
          type="submit"
          class="rounded-full bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-900 disabled:opacity-60"
          [disabled]="cargando()"
        >
          {{ 'admin.moderacion.buscar' | t }}
        </button>
        @if (hayFiltros()) {
          <button
            type="button"
            class="rounded-full px-4 py-2 text-sm font-semibold text-ink-700 ring-1 ring-line transition hover:bg-cream-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 disabled:opacity-60"
            (click)="limpiar()"
          >
            {{ 'admin.moderacion.limpiar' | t }}
          </button>
        }
      </form>

      @if (resenas().length > 0) {
        <div class="mt-4 overflow-x-auto rounded-2xl border border-line/60 bg-white shadow-sm">
          <table class="w-full min-w-[36rem] text-left text-sm">
            <caption class="sr-only">
              {{
                'admin.moderacion.caption' | t
              }}
            </caption>
            <thead
              class="border-b border-line/60 text-xs font-bold uppercase tracking-wide text-ink-500"
            >
              <tr>
                <th scope="col" class="px-4 py-3">{{ 'admin.moderacion.resena' | t }}</th>
                <th scope="col" class="px-4 py-3">{{ 'admin.moderacion.calificacion' | t }}</th>
                <th scope="col" class="px-4 py-3">{{ 'admin.moderacion.autor' | t }}</th>
                <th scope="col" class="px-4 py-3">{{ 'admin.moderacion.restaurante' | t }}</th>
                <th scope="col" class="px-4 py-3 text-right">
                  {{ 'admin.moderacion.acciones' | t }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line/60">
              @for (resena of resenas(); track resena.id) {
                <tr class="align-top transition hover:bg-cream-50/60">
                  <td class="max-w-xs px-4 py-4">
                    <p class="line-clamp-2 break-words leading-6 text-ink-700">
                      {{ resena.comentario }}
                    </p>
                  </td>
                  <td class="px-4 py-4">
                    <app-star-rating
                      [value]="resena.calificacion"
                      size="sm"
                      [mostrarValor]="true"
                    />
                  </td>
                  <td class="px-4 py-4 font-semibold text-ink-900">
                    {{ resena.nombreUsuario || ('resena.anonimo' | t) }}
                  </td>
                  <td class="px-4 py-4">
                    <a
                      class="font-semibold text-brand-700 underline-offset-4 hover:underline"
                      [routerLink]="['/restaurantes', resena.restauranteId]"
                    >
                      {{ resena.nombreRestaurante }}
                    </a>
                  </td>
                  <td class="px-4 py-4">
                    <div class="flex items-center justify-end gap-2">
                      @if (confirmandoId() === resena.id) {
                        <span class="text-sm font-semibold text-ink-900">{{
                          'admin.moderacion.preguntaEliminar' | t
                        }}</span>
                        <button
                          type="button"
                          class="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink-700 transition hover:bg-cream-100 disabled:opacity-60"
                          [id]="'cancelar-' + resena.id"
                          [disabled]="eliminandoId() === resena.id"
                          (click)="cancelar(resena.id)"
                        >
                          {{ 'comun.cancelar' | t }}
                        </button>
                        <button
                          type="button"
                          class="rounded-full bg-red-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-800 disabled:cursor-progress disabled:opacity-60"
                          [disabled]="eliminandoId() === resena.id"
                          (click)="eliminar(resena.id)"
                        >
                          {{
                            (eliminandoId() === resena.id
                              ? 'resena.eliminando'
                              : 'admin.moderacion.confirmar'
                            ) | t
                          }}
                        </button>
                      } @else {
                        <button
                          type="button"
                          class="rounded-full px-3 py-1.5 text-xs font-semibold text-ink-500 ring-1 ring-line transition hover:bg-red-50 hover:text-red-700 hover:ring-red-100"
                          [id]="'eliminar-' + resena.id"
                          [attr.aria-label]="
                            'admin.moderacion.eliminarAria'
                              | t
                                : {
                                    autor: resena.nombreUsuario || ('resena.anonimo' | t),
                                    restaurante: resena.nombreRestaurante,
                                  }
                          "
                          (click)="pedirConfirmacion(resena.id)"
                        >
                          {{ 'resena.eliminar' | t }}
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        @if (hayMas()) {
          <div class="mt-4 flex justify-center">
            <button
              type="button"
              class="rounded-full px-4 py-2 text-sm font-semibold text-ink-700 ring-1 ring-line transition hover:bg-cream-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 disabled:opacity-60"
              [disabled]="cargando()"
              (click)="cargarMas()"
            >
              {{ (cargando() ? 'admin.moderacion.cargando' : 'admin.moderacion.cargarMas') | t }}
            </button>
          </div>
        }
      } @else if (cargando()) {
        <div class="mt-8" role="status" data-testid="moderacion-cargando">
          <span class="sr-only">{{ 'resena.lista.cargando' | t }}</span>
          <div
            class="space-y-4 rounded-2xl border border-line/60 bg-white p-6 shadow-sm"
            aria-hidden="true"
          >
            @for (item of skeletons; track item) {
              <div class="flex items-center gap-4 motion-safe:animate-pulse">
                <span class="block h-3 flex-1 rounded-full bg-cream-100"></span>
                <span class="block h-3 w-24 rounded-full bg-cream-100"></span>
                <span class="block h-3 w-20 rounded-full bg-cream-100"></span>
              </div>
            }
          </div>
        </div>
      } @else if (!error()) {
        <div
          class="mt-8 flex flex-col items-center justify-center rounded-2xl border border-line/60 bg-white px-6 py-16 text-center shadow-sm"
        >
          @if (hayFiltros()) {
            <h2 class="text-lg font-bold text-ink-900">
              {{ 'admin.moderacion.sinCoincidencias' | t }}
            </h2>
            <p class="mt-2 max-w-sm text-sm leading-6 text-ink-500">
              {{ 'admin.moderacion.sinCoincidenciasTexto' | t }}
            </p>
            <button
              type="button"
              class="mt-4 rounded-full px-4 py-2 text-sm font-semibold text-ink-700 ring-1 ring-line transition hover:bg-cream-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 disabled:opacity-60"
              (click)="limpiar()"
            >
              {{ 'admin.moderacion.limpiar' | t }}
            </button>
          } @else {
            <h2 class="text-lg font-bold text-ink-900">{{ 'admin.moderacion.vacioTitulo' | t }}</h2>
            <p class="mt-2 max-w-sm text-sm leading-6 text-ink-500">
              {{ 'admin.moderacion.vacioTexto' | t }}
            </p>
          }
        </div>
      }
    </section>

    <app-toast-outlet />
  `,
})
export class ModeracionResenas {
  private readonly moderacion = inject(AdminModeracionService);
  private readonly toasts = inject(ToastService);
  private readonly i18n = inject(I18n);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);

  protected readonly resenas = this.moderacion.resenas;
  protected readonly cargando = this.moderacion.cargando;
  protected readonly error = this.moderacion.error;
  protected readonly hayMas = this.moderacion.hayMas;

  /** Filtros aplicados; el texto se aplica al buscar, los selects al cambiar. */
  protected readonly filtro = signal<FiltroResenas>(FILTRO_RESENAS_VACIO);
  /** Texto escrito en el buscador, todavía sin aplicar. */
  protected readonly textoBuscado = signal('');
  protected readonly hayFiltros = computed(() => {
    const { texto, calificacion, restauranteId } = this.filtro();
    return texto.trim() !== '' || calificacion !== null || restauranteId !== null;
  });
  protected readonly restaurantesFiltro = signal<RestauranteFiltro[]>([]);
  protected readonly calificaciones = [5, 4, 3, 2, 1];

  protected readonly confirmandoId = signal<number | null>(null);
  protected readonly eliminandoId = signal<number | null>(null);
  protected readonly skeletons = [1, 2, 3, 4, 5];

  constructor() {
    this.recargar();
    // Sin la lista el filtro por restaurante queda en "Todos"; el resto de la página funciona igual.
    this.moderacion
      .listarRestaurantes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (lista) => this.restaurantesFiltro.set(lista), error: () => undefined });
  }

  protected recargar(): void {
    this.moderacion
      .cargar(this.filtro())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
  }

  protected cargarMas(): void {
    this.moderacion
      .cargarMas()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
  }

  protected buscar(event: Event): void {
    event.preventDefault();
    this.aplicar({ texto: this.textoBuscado() });
  }

  protected aplicar(cambios: Partial<FiltroResenas>): void {
    this.filtro.update((filtro) => ({ ...filtro, ...cambios }));
    this.recargar();
  }

  protected limpiar(): void {
    this.textoBuscado.set('');
    this.filtro.set(FILTRO_RESENAS_VACIO);
    this.recargar();
  }

  protected valor(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }

  protected numero(valor: string): number | null {
    return valor === '' ? null : Number(valor);
  }

  protected pedirConfirmacion(id: number): void {
    this.confirmandoId.set(id);
    this.enfocar(`cancelar-${id}`);
  }

  protected cancelar(id: number): void {
    this.confirmandoId.set(null);
    this.enfocar(`eliminar-${id}`);
  }

  protected eliminar(id: number): void {
    this.eliminandoId.set(id);
    this.moderacion
      .eliminar(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.eliminandoId.set(null);
          this.confirmandoId.set(null);
          this.toasts.exito(this.i18n.t('admin.moderacion.eliminada'));
        },
        error: (error: Error) => {
          this.eliminandoId.set(null);
          this.toasts.error(
            this.i18n.mensaje(mensajeDeErrorAdmin(error, 'admin.error.eliminarResena')),
          );
        },
      });
  }

  /** Keeps keyboard users in place when the row swaps its buttons. */
  private enfocar(id: string): void {
    afterNextRender(() => this.document.getElementById(id)?.focus(), {
      injector: this.injector,
    });
  }
}
