import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { Component, DestroyRef, Injector, afterNextRender, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { especialidadLabel } from '../../../../core/catalog/especialidades';
import { ToastService } from '../../../../shared/toast/toast.service';
import { ToastOutlet } from '../../../../shared/toast/toast-outlet';
import {
  EntidadCliente,
  EntidadRestaurante,
  EstadoRestaurante,
} from '../../models/entidades-admin';
import { AdminEntidadesService } from '../../services/admin-entidades.service';

type Pestana = 'clientes' | 'restaurantes';

const ESTADOS: Record<EstadoRestaurante, { texto: string; clases: string }> = {
  PENDIENTE: { texto: 'Pendiente', clases: 'bg-amber-50 text-amber-800 ring-amber-200' },
  APROBADO: { texto: 'Aprobado', clases: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  RECHAZADO: { texto: 'Rechazado', clases: 'bg-red-50 text-red-800 ring-red-200' },
};

/**
 * Clients and restaurants with their strikes and a logical delete switch. A deactivated client
 * cannot sign in; a deactivated restaurant leaves the public catalog. Both can be reactivated.
 */
@Component({
  selector: 'app-gestion-entidades',
  imports: [NgTemplateOutlet, ToastOutlet],
  providers: [ToastService],
  template: `
    <section aria-labelledby="titulo-entidades">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Panel</p>
          <h1
            id="titulo-entidades"
            class="mt-2 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl"
          >
            Gestión de entidades
          </h1>
          <p class="mt-3 max-w-xl text-sm leading-6 text-ink-500">
            Dar de baja no borra nada: la cuenta o el restaurante quedan ocultos y se pueden
            reactivar.
          </p>
        </div>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-ink-700 ring-1 ring-line transition hover:bg-cream-100 disabled:opacity-60"
          [disabled]="cargando()"
          (click)="recargar()"
        >
          {{ cargando() ? 'Actualizando…' : 'Actualizar' }}
        </button>
      </div>

      @if (error(); as mensaje) {
        <div
          class="mt-6 flex flex-col gap-3 rounded-2xl border border-red-100 bg-red-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p class="text-sm font-medium text-red-800">{{ mensaje }}</p>
          <button
            type="button"
            class="inline-flex shrink-0 items-center justify-center rounded-full bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-ink-700"
            (click)="recargar()"
          >
            Reintentar
          </button>
        </div>
      }

      <div
        class="mt-8 inline-flex rounded-full bg-white p-1 ring-1 ring-line"
        role="tablist"
        aria-label="Tipo de entidad"
      >
        @for (tab of pestanas; track tab.id) {
          <button
            type="button"
            role="tab"
            class="rounded-full px-4 py-1.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
            [class]="
              pestana() === tab.id ? 'bg-ink-900 text-white' : 'text-ink-700 hover:bg-cream-100'
            "
            [id]="'tab-' + tab.id"
            [attr.aria-selected]="pestana() === tab.id"
            [attr.aria-controls]="'panel-' + tab.id"
            [attr.tabindex]="pestana() === tab.id ? 0 : -1"
            (click)="pestana.set(tab.id)"
            (keydown)="moverPestana($event)"
          >
            {{ tab.texto }}
            <span class="ml-1 tabular-nums opacity-70">{{ tab.cantidad() }}</span>
          </button>
        }
      </div>

      <div
        class="mt-4 overflow-x-auto rounded-2xl border border-line/60 bg-white shadow-sm"
        role="tabpanel"
        [id]="'panel-' + pestana()"
        [attr.aria-labelledby]="'tab-' + pestana()"
      >
        @if (pestana() === 'clientes') {
          <table class="w-full min-w-[40rem] text-left text-sm">
            <caption class="sr-only">
              Clientes registrados
            </caption>
            <thead
              class="border-b border-line/60 text-xs font-bold uppercase tracking-wide text-ink-500"
            >
              <tr>
                <th scope="col" class="px-4 py-3">Cliente</th>
                <th scope="col" class="px-4 py-3">Teléfono</th>
                <th scope="col" class="px-4 py-3 text-center">Strikes</th>
                <th scope="col" class="px-4 py-3 text-right">Activo</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line/60">
              @for (cliente of clientes(); track cliente.id) {
                <tr [class.opacity-60]="!cliente.activo">
                  <td class="px-4 py-3">
                    <p class="font-semibold text-ink-900">{{ nombreCliente(cliente) }}</p>
                    <p class="text-xs text-ink-500">{{ cliente.email }}</p>
                  </td>
                  <td class="px-4 py-3 text-ink-700">{{ cliente.telefono }}</td>
                  <td
                    class="px-4 py-3 text-center font-semibold tabular-nums text-ink-900"
                    data-testid="strikes"
                  >
                    {{ cliente.strikes }}
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex justify-end">
                      <ng-container
                        *ngTemplateOutlet="
                          interruptor;
                          context: {
                            activo: cliente.activo,
                            nombre: nombreCliente(cliente),
                            clave: 'c' + cliente.id,
                            cambiar: cambiarCliente(cliente),
                          }
                        "
                      />
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="px-4 py-10 text-center text-ink-500">
                    Todavía no hay clientes.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <table class="w-full min-w-[44rem] text-left text-sm">
            <caption class="sr-only">
              Restaurantes registrados
            </caption>
            <thead
              class="border-b border-line/60 text-xs font-bold uppercase tracking-wide text-ink-500"
            >
              <tr>
                <th scope="col" class="px-4 py-3">Restaurante</th>
                <th scope="col" class="px-4 py-3">Estado</th>
                <th scope="col" class="px-4 py-3">Encargado</th>
                <th scope="col" class="px-4 py-3 text-center">Strikes</th>
                <th scope="col" class="px-4 py-3 text-right">Activo</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line/60">
              @for (restaurante of restaurantes(); track restaurante.id) {
                <tr [class.opacity-60]="!restaurante.activo">
                  <td class="px-4 py-3">
                    <p class="font-semibold text-ink-900">{{ restaurante.nombre }}</p>
                    <p class="text-xs text-ink-500">
                      {{ especialidad(restaurante) }} · {{ restaurante.ubicacion }}
                    </p>
                  </td>
                  <td class="px-4 py-3">
                    <span
                      class="rounded-full px-2.5 py-1 text-xs font-semibold ring-1"
                      [class]="estados[restaurante.estado].clases"
                    >
                      {{ estados[restaurante.estado].texto }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-ink-700">{{ restaurante.email }}</td>
                  <td
                    class="px-4 py-3 text-center font-semibold tabular-nums text-ink-900"
                    data-testid="strikes"
                  >
                    {{ restaurante.strikes }}
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex justify-end">
                      <ng-container
                        *ngTemplateOutlet="
                          interruptor;
                          context: {
                            activo: restaurante.activo,
                            nombre: restaurante.nombre,
                            clave: 'r' + restaurante.id,
                            cambiar: cambiarRestaurante(restaurante),
                          }
                        "
                      />
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="px-4 py-10 text-center text-ink-500">
                    Todavía no hay restaurantes.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </section>

    <ng-template
      #interruptor
      let-activo="activo"
      let-nombre="nombre"
      let-clave="clave"
      let-cambiar="cambiar"
    >
      <button
        type="button"
        role="switch"
        class="group inline-flex items-center gap-2 rounded-full py-1 pr-1 pl-3 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 disabled:cursor-progress disabled:opacity-60"
        [class]="activo ? 'text-emerald-800' : 'text-ink-500'"
        [attr.aria-checked]="activo"
        [attr.aria-label]="
          (pestana() === 'clientes' ? 'Cuenta activa de ' : 'Restaurante activo: ') + nombre
        "
        [disabled]="procesando().has(clave)"
        (click)="cambiar()"
      >
        <span aria-hidden="true">{{ activo ? 'Activo' : 'De baja' }}</span>
        <span
          class="relative h-6 w-10 rounded-full transition"
          [class]="activo ? 'bg-emerald-600' : 'bg-ink-400'"
          aria-hidden="true"
        >
          <span
            class="absolute top-1 size-4 rounded-full bg-white shadow transition-all"
            [class]="activo ? 'left-5' : 'left-1'"
          ></span>
        </span>
      </button>
    </ng-template>

    <app-toast-outlet />
  `,
})
export class GestionEntidades {
  private readonly servicio = inject(AdminEntidadesService);
  private readonly toasts = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);

  protected readonly clientes = this.servicio.clientes;
  protected readonly restaurantes = this.servicio.restaurantes;
  protected readonly cargando = this.servicio.cargando;
  protected readonly error = this.servicio.error;

  protected readonly pestana = signal<Pestana>('clientes');
  /** Keys of the switches whose request is in flight ("c4", "r2"), each disabled until its own ends. */
  protected readonly procesando = signal<ReadonlySet<string>>(new Set());
  protected readonly estados = ESTADOS;
  protected readonly pestanas = [
    { id: 'clientes' as const, texto: 'Clientes', cantidad: () => this.clientes().length },
    {
      id: 'restaurantes' as const,
      texto: 'Restaurantes',
      cantidad: () => this.restaurantes().length,
    },
  ];

  constructor() {
    this.recargar();
  }

  protected recargar(): void {
    this.servicio
      .cargar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
  }

  protected nombreCliente(cliente: EntidadCliente): string {
    return [cliente.nombre, cliente.apellido].filter(Boolean).join(' ') || cliente.email;
  }

  protected especialidad(restaurante: EntidadRestaurante): string {
    return especialidadLabel(restaurante.especialidad);
  }

  protected cambiarCliente(cliente: EntidadCliente): () => void {
    return () =>
      this.cambiar(
        `c${cliente.id}`,
        this.nombreCliente(cliente),
        !cliente.activo,
        this.servicio.cambiarActivoCliente(cliente.id, !cliente.activo),
      );
  }

  protected cambiarRestaurante(restaurante: EntidadRestaurante): () => void {
    return () =>
      this.cambiar(
        `r${restaurante.id}`,
        restaurante.nombre,
        !restaurante.activo,
        this.servicio.cambiarActivoRestaurante(restaurante.id, !restaurante.activo),
      );
  }

  /** Arrow keys move between tabs, as in the WAI-ARIA tabs pattern. */
  protected moverPestana(evento: KeyboardEvent): void {
    if (evento.key !== 'ArrowRight' && evento.key !== 'ArrowLeft') {
      return;
    }
    evento.preventDefault();
    const siguiente: Pestana = this.pestana() === 'clientes' ? 'restaurantes' : 'clientes';
    this.pestana.set(siguiente);
    afterNextRender(() => this.document.getElementById(`tab-${siguiente}`)?.focus(), {
      injector: this.injector,
    });
  }

  private cambiar(
    clave: string,
    nombre: string,
    activo: boolean,
    peticion: Observable<unknown>,
  ): void {
    if (this.procesando().has(clave)) {
      return;
    }
    this.procesando.update((claves) => new Set(claves).add(clave));
    const liberar = () =>
      this.procesando.update((claves) => {
        const restantes = new Set(claves);
        restantes.delete(clave);
        return restantes;
      });
    peticion.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        liberar();
        this.toasts.exito(activo ? `${nombre} fue reactivado.` : `${nombre} fue dado de baja.`);
      },
      error: (error: Error) => {
        liberar();
        this.toasts.error(error.message);
      },
    });
  }
}
