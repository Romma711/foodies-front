import { Component } from '@angular/core';

/** Review moderation page. Sprint 9 adds the recent reviews table and quick delete. */
@Component({
  selector: 'app-moderacion-resenas',
  template: `
    <section aria-labelledby="titulo-moderacion">
      <p class="text-xs font-bold uppercase tracking-[0.22em] text-brand-700">Panel</p>
      <h1
        id="titulo-moderacion"
        class="mt-2 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl"
      >
        Moderación
      </h1>
      <p class="mt-3 max-w-xl text-sm leading-6 text-ink-500">
        Revisá las reseñas recientes y eliminá las que no cumplan las normas de la comunidad.
      </p>
    </section>
  `,
})
export class ModeracionResenas {}
