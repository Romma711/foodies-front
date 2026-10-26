import { Component } from '@angular/core';

/** Admin landing page. Sprint 8 fills it with the metrics charts. */
@Component({
  selector: 'app-dashboard-admin',
  template: `
    <section aria-labelledby="titulo-dashboard">
      <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Panel</p>
      <h1
        id="titulo-dashboard"
        class="mt-2 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl"
      >
        Dashboard
      </h1>
      <p class="mt-3 max-w-xl text-sm leading-6 text-ink-500">
        Métricas de restaurantes, reservas y reseñas de la plataforma.
      </p>
    </section>
  `,
})
export class DashboardAdmin {}
