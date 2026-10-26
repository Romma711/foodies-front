import {
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { DistribucionCalificacion } from '../../models';
import { BAR_CHART_FACTORY, BarChart } from './bar-chart-factory';

// Chart.js draws on a canvas, so it cannot read Tailwind classes; these mirror the @theme tokens.
const COLOR_STAR = '#f5a524';
const COLOR_TRACK = '#f4ede3';
const COLOR_INK_500 = '#7a7167';

@Component({
  selector: 'app-rating-distribution',
  template: `
    <figure>
      <figcaption class="sr-only">Distribución de calificaciones</figcaption>
      <div class="relative h-36">
        <canvas #canvas aria-hidden="true"></canvas>
      </div>
      <table class="sr-only">
        <thead>
          <tr>
            <th scope="col">Calificación</th>
            <th scope="col">Reseñas</th>
          </tr>
        </thead>
        <tbody>
          @for (item of distribucion(); track item.estrellas) {
            <tr>
              <th scope="row">{{ item.estrellas }} estrellas</th>
              <td>{{ item.cantidad }} {{ item.cantidad === 1 ? 'reseña' : 'reseñas' }}</td>
            </tr>
          }
        </tbody>
      </table>
    </figure>
  `,
})
export class RatingDistribution {
  readonly distribucion = input.required<readonly DistribucionCalificacion[]>();

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly crearGrafico = inject(BAR_CHART_FACTORY);
  private grafico: BarChart | null = null;

  constructor() {
    afterRenderEffect(() => {
      const items = this.distribucion();
      const labels = items.map((item) => `${item.estrellas} ★`);
      const cantidades = items.map((item) => item.cantidad);

      if (this.grafico) {
        this.grafico.data.labels = labels;
        this.grafico.data.datasets[0].data = cantidades;
        this.grafico.update();
        return;
      }
      this.grafico = this.crearGrafico(
        this.canvas().nativeElement,
        this.configuracion(labels, cantidades),
      );
    });

    inject(DestroyRef).onDestroy(() => this.grafico?.destroy());
  }

  private configuracion(labels: string[], cantidades: number[]): ChartConfiguration<'bar'> {
    return {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            data: cantidades,
            backgroundColor: COLOR_STAR,
            borderRadius: 999,
            borderSkipped: false,
            barThickness: 8,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        maintainAspectRatio: false,
        scales: {
          x: {
            beginAtZero: true,
            display: false,
            grid: { display: false },
            ticks: { precision: 0 },
          },
          y: {
            border: { display: false },
            grid: { display: false },
            ticks: { color: COLOR_INK_500, font: { size: 12, weight: 600 } },
          },
        },
        plugins: {
          tooltip: {
            backgroundColor: '#1f1b16',
            displayColors: false,
            callbacks: {
              label: (context) => {
                const cantidad = Number(context.raw);
                return `${cantidad} ${cantidad === 1 ? 'reseña' : 'reseñas'}`;
              },
            },
          },
        },
      },
      plugins: [
        {
          // Paints a soft track behind each bar so empty ratings still read as a row.
          id: 'pista',
          beforeDatasetsDraw: (chart) => {
            const { ctx, chartArea } = chart;
            const barras = chart.getDatasetMeta(0).data;
            ctx.save();
            ctx.fillStyle = COLOR_TRACK;
            for (const barra of barras) {
              ctx.beginPath();
              ctx.roundRect(chartArea.left, barra.y - 4, chartArea.width, 8, 4);
              ctx.fill();
            }
            ctx.restore();
          },
        },
      ],
    };
  }
}
