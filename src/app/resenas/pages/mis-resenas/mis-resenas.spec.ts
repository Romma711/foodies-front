import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CLIENTE_TOKEN } from '../../../perfil/services/cliente-perfil.service.spec';
import { violacionesAxe } from '../../../shared/testing/axe';
import { ResenaUsuarioDTO } from '../../models';
import { MisResenas } from './mis-resenas';

describe('MisResenas', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('foodies.token.CLIENTE', CLIENTE_TOKEN);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function render(resenas: ResenaUsuarioDTO[] | null, status = 200) {
    const fixture = TestBed.createComponent(MisResenas);
    http.expectOne('/api/resenas/usuario/3').flush(resenas, { status, statusText: 'x' });
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('lists each review with a link to its restaurant', async () => {
    const element = await render([
      {
        id: 9,
        comentario: 'Muy rico',
        calificacion: 4,
        restauranteId: 5,
        nombreRestaurante: 'Ochiwan',
      },
      {
        id: 8,
        comentario: 'Lento',
        calificacion: 2,
        restauranteId: 6,
        nombreRestaurante: 'La Casona',
      },
    ]);

    const links = [...element.querySelectorAll('li h2 a')];
    expect(links.map((a) => [a.textContent?.trim(), a.getAttribute('href')])).toEqual([
      ['Ochiwan', '/restaurantes/5'],
      ['La Casona', '/restaurantes/6'],
    ]);
    expect(element.textContent).toContain('Muy rico');
    expect(await violacionesAxe(element)).toEqual([]);
  });

  it('shows the empty state when the backend answers 204', async () => {
    const element = await render(null, 204);

    expect(element.textContent).toContain('Todavía no escribiste reseñas');
    expect(element.querySelector('a')?.getAttribute('href')).toBe('/restaurantes');
  });
});
