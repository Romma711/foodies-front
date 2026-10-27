import { InjectionToken } from '@angular/core';
import { ArcElement, Chart, ChartConfiguration, ChartData, PieController, Tooltip } from 'chart.js';

/** The slice of a Chart.js pie chart the components rely on. */
export interface PieChart {
  data: ChartData<'pie'>;
  update(): void;
  destroy(): void;
}

export type PieChartFactory = (
  canvas: HTMLCanvasElement,
  config: ChartConfiguration<'pie'>,
) => PieChart;

/**
 * Creates Chart.js pie charts. Tests replace it with a fake because jsdom has no 2D canvas context.
 * Only the pie pieces are registered; the legend is rendered in HTML by each component.
 */
export const PIE_CHART_FACTORY = new InjectionToken<PieChartFactory>('PIE_CHART_FACTORY', {
  factory: () => (canvas, config) => {
    Chart.register(PieController, ArcElement, Tooltip);
    return new Chart(canvas, config);
  },
});
