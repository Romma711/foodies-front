import { effect, inject, Injectable, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { I18n } from './i18n.service';
import { Clave } from './traducir';

/** Route `title`s are translation keys: the tab title follows the route and the language. */
@Injectable({ providedIn: 'root' })
export class TituloTraducido extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly i18n = inject(I18n);
  private readonly clave = signal<Clave | null>(null);

  constructor() {
    super();
    effect(() => {
      const clave = this.clave();
      if (clave !== null) {
        this.title.setTitle(this.i18n.t(clave));
      }
    });
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const clave = this.buildTitle(snapshot) as Clave | undefined;
    if (clave !== undefined) {
      this.clave.set(clave);
      this.title.setTitle(this.i18n.t(clave));
    }
  }
}
