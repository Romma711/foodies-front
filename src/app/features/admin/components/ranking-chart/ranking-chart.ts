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
import { ChartConfiguration } from 'chart.js';
import { BAR_CHART_FACTORY, BarChart } from '../../../../shared/charts/bar-chart-factory';
import { ItemRanking } from '../../models/metricas-admin';

// Chart.js paints on a canvas and cannot read Tailwind classes; these mirror the @theme tokens.
const COLOR_BRAND = '#f26b3a';
const COLOR_TRACK = '#f4ede3';
const COLOR_INK_500 = '#7a7167';
const COLOR_INK_700 = '#3f3a33';
const COLOR_INK_900 = '#1f1b16';
const MAX_ETIQUETA = 16;
/** Room on the right of the bars for the value label, e.g. "12 reservas". */
const ANCHO_VALOR = 84;

/** Formats `4.5` as "4.5" and `3` as "3" so ratings and counts read naturally. */
function formatearValor(valor: number): string {
  return Number.isInteger(valor) ? String(valor) : valor.toFixed(1);
}

/** Horizontal bar ranking inside a card, with an accessible table carrying the same data. */
@Component({
  selector: 'app-ranking-chart',
  template: `
    <section
      class="flex h-full flex-col rounded-2xl border border-line/60 bg-white p-5 shadow-sm sm:p-6"
    >
      <h2 class="text-base font-bold tracking-tight text-ink-900">{{ titulo() }}</h2>
      @if (descripcion()) {
        <p class="mt-1 text-sm text-ink-500" data-testid="descripcion">{{ descripcion() }}</p>
      }

      @if (items().length > 0) {
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
  /** Word shown after each value at the end of the bar, in the table and tooltip, e.g. "reseñas". */
  readonly unidad = input('');
  /** Fixed axis end (5 for ratings); null lets the chart scale to the biggest value. */
  readonly maximo = input<number | null>(null);
  readonly color = input(COLOR_BRAND);

  protected readonly alto = computed(() => 24 + this.items().length * 40);
  protected readonly formatear = formatearValor;

  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly crearGrafico = inject(BAR_CHART_FACTORY);
  private grafico: BarChart | null = null;

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
      this.grafico = this.crearGrafico(canvas, this.configuracion(etiquetas, valores));
    });

    inject(DestroyRef).onDestroy(() => this.grafico?.destroy());
  }

  private configuracion(etiquetas: string[], valores: number[]): ChartConfiguration<'bar'> {
    const unidad = this.unidad();
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
            barThickness: 10,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        maintainAspectRatio: false,
        layout: { padding: { right: ANCHO_VALOR } },
        scales: {
          x: {
            beginAtZero: true,
            max: this.maximo() ?? undefined,
            display: false,
            grid: { display: false },
          },
          y: {
            border: { display: false },
            grid: { display: false },
            ticks: {
              color: COLOR_INK_500,
              font: { size: 12, weight: 600 },
              callback(valor) {
                const etiqueta = this.getLabelForValue(Number(valor));
                return etiqueta.length > MAX_ETIQUETA
                  ? `${etiqueta.slice(0, MAX_ETIQUETA - 1)}…`
                  : etiqueta;
              },
            },
          },
        },
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
      plugins: [
        {
          // Writes each value next to its bar so the chart reads without hovering.
          id: 'valores',
          afterDatasetsDraw: (chart) => {
            const { ctx, chartArea } = chart;
            const datos = chart.data.datasets[0].data;
            ctx.save();
            ctx.fillStyle = COLOR_INK_700;
            ctx.font = '600 12px sans-serif';
            ctx.textBaseline = 'middle';
            chart.getDatasetMeta(0).data.forEach((barra, indice) => {
              const texto = `${formatearValor(Number(datos[indice]))} ${unidad}`.trim();
              ctx.fillText(texto, chartArea.right + 10, barra.y);
            });
            ctx.restore();
          },
        },
        {
          // Soft track behind each bar so short values still read as a full row.
          id: 'pista',
          beforeDatasetsDraw: (chart) => {
            const { ctx, chartArea } = chart;
            ctx.save();
            ctx.fillStyle = COLOR_TRACK;
            for (const barra of chart.getDatasetMeta(0).data) {
              ctx.beginPath();
              ctx.roundRect(chartArea.left, barra.y - 5, chartArea.width, 10, 5);
              ctx.fill();
            }
            ctx.restore();
          },
        },
      ],
    };
  }
}
