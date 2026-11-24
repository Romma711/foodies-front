import { Component, DestroyRef, computed, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RankingChart } from '../../components/ranking-chart/ranking-chart';
import { ItemRanking } from '../../models/metricas-admin';
import { AdminMetricasService } from '../../services/admin-metricas.service';
import { TPipe } from '@core/i18n/t.pipe';
import { I18n } from '@core/i18n/i18n.service';

// Bar colors mirror the @theme tokens: star for ratings, brand for bookings, ink for people.
const COLOR_STAR = '#f5a524';
const COLOR_BRAND = '#f26b3a';
const COLOR_INK_700 = '#3f3a33';

/** Admin landing page: monthly sign-ups plus the three platform rankings. */
@Component({
  selector: 'app-dashboard-admin',
  imports: [TPipe, RankingChart],
  template: `
    <section aria-labelledby="titulo-dashboard">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">
            {{ 'admin.panel' | t }}
          </p>
          <h1
            id="titulo-dashboard"
            class="mt-2 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl"
          >
            {{ 'admin.dashboard.titulo' | t }}
          </h1>
          <p class="mt-3 max-w-xl text-sm leading-6 text-ink-500">
            {{ 'admin.dashboard.subtitulo' | t }}
          </p>
        </div>
        @if (metricas()) {
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
          role="alert"
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

      @if (metricas(); as datos) {
        <div class="mt-8 grid gap-4 lg:grid-cols-2">
          <section
            class="flex flex-col justify-between rounded-2xl border border-line/60 bg-white p-6 shadow-sm"
            data-testid="kpi-usuarios"
          >
            <div>
              <h2 class="text-base font-bold tracking-tight text-ink-900">
                {{ 'admin.dashboard.usuariosNuevos' | t }}
              </h2>
              <p class="mt-1 text-sm text-ink-500">
                {{ 'admin.dashboard.usuariosTexto' | t }}
              </p>
            </div>
            <div class="mt-6">
              <p class="text-6xl font-extrabold leading-none tracking-tight text-ink-900">
                {{ datos.usuariosRegistradosEsteMes }}
              </p>
              <p class="mt-3 text-sm text-ink-500">
                {{ 'admin.dashboard.registradosEn' | t: { mes: mesLegible() } }}
              </p>
            </div>
          </section>

          <app-ranking-chart
            [titulo]="'admin.dashboard.mejorCalificados' | t"
            [descripcion]="'admin.dashboard.mejorCalificadosTexto' | t"
            [unidad]="'admin.dashboard.de5' | t"
            tipo="vertical"
            [items]="mejorCalificados()"
            [maximo]="5"
            [color]="colorEstrella"
          />
          <app-ranking-chart
            [titulo]="'admin.dashboard.masReservas' | t"
            [descripcion]="'admin.dashboard.masReservasTexto' | t"
            [unidad]="'admin.dashboard.unidadReservas' | t"
            tipo="torta"
            [items]="masReservados()"
            [color]="colorBrand"
          />
          <app-ranking-chart
            [titulo]="'admin.dashboard.masResenas' | t"
            [descripcion]="'admin.dashboard.masResenasTexto' | t"
            [unidad]="'admin.dashboard.unidadResenas' | t"
            [items]="usuariosActivos()"
            [color]="colorInk"
          />
        </div>
      } @else if (cargando()) {
        <div class="mt-8" role="status" data-testid="dashboard-cargando">
          <span class="sr-only">{{ 'admin.dashboard.cargando' | t }}</span>
          <div class="grid gap-4 lg:grid-cols-2" aria-hidden="true">
            @for (item of skeletons; track item) {
              <div class="rounded-2xl border border-line/60 bg-white p-6 shadow-sm">
                <div class="space-y-4 motion-safe:animate-pulse">
                  <span class="block h-4 w-1/3 rounded-full bg-cream-100"></span>
                  <span class="block h-3 rounded-full bg-cream-100"></span>
                  <span class="block h-3 w-5/6 rounded-full bg-cream-100"></span>
                  <span class="block h-3 w-2/3 rounded-full bg-cream-100"></span>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </section>
  `,
})
export class DashboardAdmin {
  private readonly metricasService = inject(AdminMetricasService);
  private readonly i18n = inject(I18n);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly metricas = this.metricasService.metricas;
  protected readonly cargando = this.metricasService.cargando;
  protected readonly error = this.metricasService.error;

  protected readonly skeletons = [1, 2, 3, 4];
  protected readonly colorEstrella = COLOR_STAR;
  protected readonly colorBrand = COLOR_BRAND;
  protected readonly colorInk = COLOR_INK_700;

  protected readonly mejorCalificados = computed<ItemRanking[]>(() =>
    (this.metricas()?.topRestaurantesMejorCalificados ?? []).map((item) => ({
      etiqueta: item.nombre,
      valor: Math.round(item.promedio * 10) / 10,
    })),
  );

  protected readonly masReservados = computed<ItemRanking[]>(() =>
    (this.metricas()?.topRestaurantesConMasReservas ?? []).map((item) => ({
      etiqueta: item.nombre,
      valor: item.cantidadReservas,
    })),
  );

  protected readonly usuariosActivos = computed<ItemRanking[]>(() =>
    (this.metricas()?.topUsuariosConMasResenas ?? []).map((item) => ({
      etiqueta:
        [item.nombre, item.apellido].filter(Boolean).join(' ') || this.i18n.t('resena.anonimo'),
      valor: item.cantidadResenas,
    })),
  );

  /** `2026-10` → "octubre de 2026". */
  protected readonly mesLegible = computed(() => {
    const [anio, mes] = (this.metricas()?.periodo ?? '').split('-').map(Number);
    return mes >= 1 && mes <= 12
      ? this.i18n.fecha(new Date(anio, mes - 1, 1), { month: 'long', year: 'numeric' })
      : this.i18n.t('admin.dashboard.esteMes');
  });

  constructor() {
    this.recargar();
  }

  protected recargar(): void {
    this.metricasService
      .cargar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
  }
}
