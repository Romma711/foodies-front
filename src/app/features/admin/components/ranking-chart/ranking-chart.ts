import {
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { ChartConfiguration, Plugin } from 'chart.js';
import { BAR_CHART_FACTORY } from '../../../../shared/charts/bar-chart-factory';
import { PIE_CHART_FACTORY } from '../../../../shared/charts/pie-chart-factory';
import { ItemRanking } from '../../models/metricas-admin';

// Chart.js paints on a canvas and cannot read Tailwind classes; these mirror the @theme tokens.
const COLOR_BRAND = '#f26b3a';
const COLOR_TRACK = '#f4ede3';
const COLOR_INK_500 = '#7a7167';
const COLOR_INK_700 = '#3f3a33';
const COLOR_INK_900 = '#1f1b16';
/** Pie slices, one per ranking position: brand, star, ink-700, brand-700, ink-400. */
const COLORES_TORTA = ['#f26b3a', '#f5a524', '#3f3a33', '#b93f17', '#9a9187'];
const MAX_ETIQUETA = 16;
/** Characters per line for the names under vertical columns. */
const MAX_LINEA_VERTICAL = 11;
/** Room on the right of the bars for the value label, e.g. "12 reservas". */
const ANCHO_VALOR = 84;

export type TipoRanking = 'horizontal' | 'vertical' | 'torta';

/** Minimal surface shared by bar and pie charts so the data can be swapped in place. */
interface GraficoActualizable {
  data: { labels?: unknown[]; datasets: { data: unknown[] }[] };
  update(): void;
  destroy(): void;
}

/** Formats `4.5` as "4.5" and `3` as "3" so ratings and counts read naturally. */
function formatearValor(valor: number): string {
  return Number.isInteger(valor) ? String(valor) : valor.toFixed(1);
}

/** Wraps a name into at most two lines so it fits under a narrow column. */
function partirEtiqueta(texto: string, max = MAX_LINEA_VERTICAL): string[] {
  const lineas: string[] = [];
  let actual = '';
  for (const palabra of texto.split(/\s+/)) {
    const candidata = actual ? `${actual} ${palabra}` : palabra;
    if (candidata.length <= max || !actual) {
      actual = candidata;
      continue;
    }
    lineas.push(actual);
    actual = palabra;
  }
  lineas.push(actual);

  const visibles = lineas
    .slice(0, 2)
    .map((linea) => (linea.length > max ? `${linea.slice(0, max - 1)}…` : linea));
  if (lineas.length > 2 && !visibles[1].endsWith('…')) {
    visibles[1] = `${visibles[1]}…`;
  }
  return visibles;
}

/**
 * Ranking card drawn as horizontal bars, vertical columns or a pie. Bars carry an accessible
 * table with the same data; the pie shows its values in a visible legend instead.
 */
@Component({
  selector: 'app-ranking-chart',
  template: `
    <section
      class="@container flex h-full min-w-0 flex-col rounded-2xl border border-line/60 bg-white p-5 shadow-sm sm:p-6"
    >
      <h2 class="text-base font-bold tracking-tight text-ink-900">{{ titulo() }}</h2>
      @if (descripcion()) {
        <p class="mt-1 text-sm text-ink-500" data-testid="descripcion">{{ descripcion() }}</p>
      }

      @if (items().length > 0) {
        @if (tipo() === 'torta') {
          <div class="mt-4 flex flex-1 flex-col items-center gap-6 @md:flex-row">
            <div class="relative size-44 shrink-0">
              <canvas #canvas aria-hidden="true"></canvas>
            </div>
            <ul class="w-full space-y-2.5 text-sm" data-testid="leyenda">
              @for (item of items(); track $index) {
                <li class="flex items-center gap-3">
                  <span
                    class="size-3 shrink-0 rounded-full"
                    [style.background-color]="colorTorta($index)"
                    aria-hidden="true"
                  ></span>
                  <span class="min-w-0 flex-1 truncate font-semibold text-ink-700">
                    {{ item.etiqueta }}
                  </span>
                  <span class="shrink-0 tabular-nums text-ink-500">
                    {{ formatear(item.valor) }} {{ unidad() }} · {{ porcentajes()[$index] }}%
                  </span>
                </li>
              }
            </ul>
          </div>
        } @else {
          <div class="relative mt-4" [style.height.px]="alto()">
            <canvas #canvas aria-hidden="true"></canvas>
          </div>
          <table class="sr-only">
            <caption>
              {{
                titulo()
              }}
            </caption>
            <thead>
              <tr>
                <th scope="col">Nombre</th>
                <th scope="col">Valor</th>
              </tr>
            </thead>
            <tbody>
              @for (item of items(); track $index) {
                <tr>
                  <th scope="row">{{ item.etiqueta }}</th>
                  <td>{{ formatear(item.valor) }} {{ unidad() }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      } @else {
        <p
          class="mt-4 flex flex-1 items-center justify-center rounded-xl bg-cream-50 px-4 py-10 text-center text-sm text-ink-500"
        >
          Todavía no hay datos para este ranking.
        </p>
      }
    </section>
  `,
})
export class RankingChart {
  readonly titulo = input.required<string>();
  /** One line explaining what the values measure, shown under the title. */
  readonly descripcion = input('');
  readonly items = input.required<readonly ItemRanking[]>();
  /** Word shown after each value next to the bar, in the legend, table and tooltip, e.g. "reseñas". */
  readonly unidad = input('');
  /** Fixed axis end (5 for ratings); null lets the chart scale to the biggest value. Bars only. */
  readonly maximo = input<number | null>(null);
  /** Bar color; the pie uses one color per position instead. */
  readonly color = input(COLOR_BRAND);
  /** Chart shape. Read once when the chart is created. */
  readonly tipo = input<TipoRanking>('horizontal');

  protected readonly alto = computed(() =>
    this.tipo() === 'vertical' ? 240 : 24 + this.items().length * 40,
  );
  /** Share of each item over the ranking total, rounded to whole percents. */
  protected readonly porcentajes = computed(() => {
    const total = this.items().reduce((suma, item) => suma + item.valor, 0);
    return this.items().map((item) => (total > 0 ? Math.round((item.valor / total) * 100) : 0));
  });
  protected readonly formatear = formatearValor;

  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly crearBarras = inject(BAR_CHART_FACTORY);
  private readonly crearTorta = inject(PIE_CHART_FACTORY);
  private grafico: GraficoActualizable | null = null;

  constructor() {
    afterRenderEffect(() => {
      const items = this.items();
      const canvas = this.canvas()?.nativeElement;
      if (!canvas || items.length === 0) {
        // The canvas left the DOM with the empty state, so the old chart is useless.
        this.grafico?.destroy();
        this.grafico = null;
        return;
      }

      const etiquetas = items.map((item) => item.etiqueta);
      const valores = items.map((item) => item.valor);
      if (this.grafico) {
        this.grafico.data.labels = etiquetas;
        this.grafico.data.datasets[0].data = valores;
        this.grafico.update();
        return;
      }
      this.grafico =
        this.tipo() === 'torta'
          ? this.crearTorta(canvas, this.configuracionTorta(etiquetas, valores))
          : this.crearBarras(canvas, this.configuracionBarras(etiquetas, valores));
    });

    inject(DestroyRef).onDestroy(() => this.grafico?.destroy());
  }

  protected colorTorta(indice: number): string {
    return COLORES_TORTA[indice % COLORES_TORTA.length];
  }

  private configuracionTorta(etiquetas: string[], valores: number[]): ChartConfiguration<'pie'> {
    const unidad = this.unidad();
    return {
      type: 'pie',
      data: {
        labels: etiquetas,
        datasets: [
          {
            data: valores,
            backgroundColor: valores.map((_, indice) => this.colorTorta(indice)),
            borderColor: '#ffffff',
            borderWidth: 2,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        layout: { padding: 4 },
        plugins: {
          tooltip: {
            backgroundColor: COLOR_INK_900,
            callbacks: {
              label: (context) =>
                `${context.label}: ${formatearValor(Number(context.raw))} ${unidad}`.trim(),
            },
          },
        },
      },
    };
  }

  private configuracionBarras(etiquetas: string[], valores: number[]): ChartConfiguration<'bar'> {
    const unidad = this.unidad();
    const vertical = this.tipo() === 'vertical';
    const ejeValor = {
      beginAtZero: true,
      max: this.maximo() ?? undefined,
      display: false,
      grid: { display: false },
    };
    const ejeNombres = {
      border: { display: false },
      grid: { display: false },
      ticks: {
        color: COLOR_INK_500,
        font: { size: vertical ? 11 : 12, weight: 600 as const },
        // Names are already wrapped in two lines; rotating them only makes them harder to read.
        maxRotation: 0,
        autoSkip: false,
        callback(this: { getLabelForValue(valor: number): string }, valor: string | number) {
          const etiqueta = this.getLabelForValue(Number(valor));
          if (vertical) {
            return partirEtiqueta(etiqueta);
          }
          return etiqueta.length > MAX_ETIQUETA
            ? `${etiqueta.slice(0, MAX_ETIQUETA - 1)}…`
            : etiqueta;
        },
      },
    };

    return {
      type: 'bar',
      data: {
        labels: etiquetas,
        datasets: [
          {
            data: valores,
            backgroundColor: this.color(),
            borderRadius: 999,
            borderSkipped: false,
            barThickness: vertical ? 22 : 10,
          },
        ],
      },
      options: {
        indexAxis: vertical ? 'x' : 'y',
        maintainAspectRatio: false,
        layout: { padding: vertical ? { top: 24 } : { right: ANCHO_VALOR } },
        scales: vertical ? { x: ejeNombres, y: ejeValor } : { x: ejeValor, y: ejeNombres },
        plugins: {
          tooltip: {
            backgroundColor: COLOR_INK_900,
            displayColors: false,
            callbacks: {
              label: (context) => `${formatearValor(Number(context.raw))} ${unidad}`.trim(),
            },
          },
        },
      },
      plugins: [this.pluginValores(unidad, vertical), this.pluginPista(vertical)],
    };
  }

  /** Writes each value next to (or above) its bar so the chart reads without hovering. */
  private pluginValores(unidad: string, vertical: boolean): Plugin<'bar'> {
    return {
      id: 'valores',
      afterDatasetsDraw: (chart) => {
        const { ctx, chartArea } = chart;
        const datos = chart.data.datasets[0].data;
        ctx.save();
        ctx.fillStyle = COLOR_INK_700;
        ctx.font = vertical ? '600 11px sans-serif' : '600 12px sans-serif';
        ctx.textAlign = vertical ? 'center' : 'left';
        ctx.textBaseline = vertical ? 'bottom' : 'middle';
        chart.getDatasetMeta(0).data.forEach((barra, indice) => {
          const texto = `${formatearValor(Number(datos[indice]))} ${unidad}`.trim();
          if (vertical) {
            ctx.fillText(texto, barra.x, barra.y - 6);
          } else {
            ctx.fillText(texto, chartArea.right + 10, barra.y);
          }
        });
        ctx.restore();
      },
    };
  }

  /** Soft track behind each bar so short values still read as a full row or column. */
  private pluginPista(vertical: boolean): Plugin<'bar'> {
    return {
      id: 'pista',
      beforeDatasetsDraw: (chart) => {
        const { ctx, chartArea } = chart;
        ctx.save();
        ctx.fillStyle = COLOR_TRACK;
        for (const barra of chart.getDatasetMeta(0).data) {
          ctx.beginPath();
          if (vertical) {
            ctx.roundRect(barra.x - 11, chartArea.top, 22, chartArea.height, 11);
          } else {
            ctx.roundRect(chartArea.left, barra.y - 5, chartArea.width, 10, 5);
          }
          ctx.fill();
        }
        ctx.restore();
      },
    };
  }
}
