import { InjectionToken } from '@angular/core';
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  ChartConfiguration,
  ChartData,
  LinearScale,
  Tooltip,
} from 'chart.js';

/** The slice of a Chart.js bar chart the components rely on. */
export interface BarChart {
  data: ChartData<'bar'>;
  update(): void;
  destroy(): void;
}

export type BarChartFactory = (
  canvas: HTMLCanvasElement,
  config: ChartConfiguration<'bar'>,
) => BarChart;

/**
 * Creates Chart.js bar charts. Tests replace it with a fake because jsdom has no 2D canvas context.
 * Only the bar pieces are registered so the rest of Chart.js stays out of the bundle.
 */
export const BAR_CHART_FACTORY = new InjectionToken<BarChartFactory>('BAR_CHART_FACTORY', {
  factory: () => (canvas, config) => {
    Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);
    return new Chart(canvas, config);
  },
});
