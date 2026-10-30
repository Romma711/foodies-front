import { HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialog } from '../../../../components/confirm-dialog/confirm-dialog';
import { Foto } from '../../../../core/catalog/fotos';
import { providePanelTesting, settle } from '../panel.testing';
import { FotosPanel } from './fotos';

describe('FotosPanel', () => {
  let fixture: ComponentFixture<FotosPanel>;
  let http: HttpTestingController;
  let element: HTMLElement;

  const foto = (id: number, portada = false): Foto => ({
    id,
    url: `/api/files/fotos/7/f${id}.jpg`,
    portada,
  });
  const completas = () => [foto(1, true), foto(2), foto(3)];

  const render = async (fotos: Foto[]) => {
    fixture = TestBed.createComponent(FotosPanel);
    element = fixture.nativeElement;
    await fixture.whenStable();
    http.expectOne('/api/restaurantes/me/fotos').flush(fotos);
    await settle(fixture);
  };

  const button = (texto: string) =>
    [...element.querySelectorAll<HTMLButtonElement>('button')].find(
      (b) => b.textContent?.trim() === texto || b.getAttribute('aria-label') === texto,
    )!;

  const items = () => [...element.querySelectorAll<HTMLElement>('li.foto')];

  const choose = async (file: File) => {
    const input = element.querySelector<HTMLInputElement>('input[type="file"]')!;
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    input.dispatchEvent(new Event('change'));
    await settle(fixture);
  };

  const imagen = () => new File(['img'], 'nueva.jpg', { type: 'image/jpeg' });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FotosPanel],
      providers: providePanelTesting(),
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => undefined);
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it('muestra todas las fotos con la portada marcada', async () => {
    await render(completas());

    expect(items()).toHaveLength(3);
    expect(items()[0].querySelector('img')?.getAttribute('src')).toBe('/api/files/fotos/7/f1.jpg');
    expect(items()[0].querySelector('.badge-portada')?.textContent).toContain('Portada');
    expect(element.querySelectorAll('.badge-portada')).toHaveLength(1);
    expect(element.querySelector('.faltan')).toBeNull();
  });

  it('avisa a los restaurantes que todavía no cargaron sus fotos', async () => {
    await render([]);

    expect(element.querySelector('.faltan')?.textContent).toContain(
      'Te faltan fotos: subí al menos 3.',
    );
    expect(button('Agregar foto')).toBeTruthy();
  });

  it('sube una foto nueva', async () => {
    await render(completas());

    button('Agregar foto').click();
    await choose(imagen());
    const req = http.expectOne({ method: 'POST', url: '/api/restaurantes/me/fotos' });
    const body = req.request.body as FormData;
    expect(body.get('tipo')).toBeNull();
    expect((body.get('archivo') as File).name).toBe('nueva.jpg');
    req.flush(foto(4));
    await settle(fixture);

    expect(items()).toHaveLength(4);
    expect(element.textContent).toContain('Foto subida.');
  });

  it('elige otra foto como portada', async () => {
    await render(completas());
    expect(button('Usar la foto 1 como portada')).toBeUndefined();

    button('Usar la foto 2 como portada').click();
    await settle(fixture);
    http
      .expectOne({ method: 'PUT', url: '/api/restaurantes/me/fotos/2/portada' })
      .flush([foto(2, true), foto(1), foto(3)]);
    await settle(fixture);

    expect(items()[0].querySelector('img')?.getAttribute('src')).toBe('/api/files/fotos/7/f2.jpg');
    expect(items()[0].querySelector('.badge-portada')).not.toBeNull();
    expect(element.querySelectorAll('.badge-portada')).toHaveLength(1);
    expect(element.textContent).toContain('Portada actualizada.');
  });

  it('reemplaza una foto', async () => {
    await render(completas());

    button('Reemplazar la foto 1').click();
    await choose(imagen());
    http
      .expectOne({ method: 'PUT', url: '/api/restaurantes/me/fotos/1' })
      .flush({ ...foto(1, true), url: '/api/files/fotos/7/f1-b.jpg' });
    await settle(fixture);

    expect(items()[0].querySelector('img')?.getAttribute('src')).toBe(
      '/api/files/fotos/7/f1-b.jpg',
    );
  });

  it('no sube archivos que no son imágenes', async () => {
    await render(completas());

    button('Agregar foto').click();
    await choose(new File(['x'], 'menu.pdf', { type: 'application/pdf' }));

    http.expectNone({ method: 'POST' });
    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      '"menu.pdf" no es una imagen JPG, PNG o WebP.',
    );
  });

  it('no deja borrar la portada, ni bajar de 3 fotos, ni agregar más de 5', async () => {
    await render([foto(1, true), foto(2), foto(3), foto(4)]);
    expect(button('Eliminar la foto 1').disabled).toBe(true);
    expect(button('Eliminar la foto 2').disabled).toBe(false);

    fixture.destroy();
    await render(completas());
    expect(
      [...element.querySelectorAll<HTMLButtonElement>('li.foto .btn-danger')].every((b) => b.disabled),
    ).toBe(true);
    expect(element.textContent).toContain('Necesitás al menos 3 fotos: subí otra antes de borrar.');

    fixture.destroy();
    await render([foto(1, true), foto(2), foto(3), foto(4), foto(5)]);
    expect(button('Agregar foto').disabled).toBe(true);
    expect(element.textContent).toContain('Llegaste al máximo de 5 fotos.');
  });

  it('elimina una foto después de confirmar', async () => {
    vi.spyOn(ConfirmDialog.prototype, 'open').mockResolvedValue(true);
    await render([foto(1, true), foto(2), foto(3), foto(4)]);

    button('Eliminar la foto 2').click();
    await settle(fixture);
    http.expectOne({ method: 'DELETE', url: '/api/restaurantes/me/fotos/2' }).flush(null);
    await settle(fixture);

    expect(items()).toHaveLength(3);
  });

  it('muestra el motivo del backend cuando rechaza la foto', async () => {
    await render(completas());

    button('Agregar foto').click();
    await choose(imagen());
    http
      .expectOne({ method: 'POST' })
      .flush(
        { error: 'error de negocio', mensaje: 'Las fotos tienen que ser JPG, PNG o WebP' },
        { status: 400, statusText: 'Bad Request' },
      );
    await settle(fixture);

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Las fotos tienen que ser JPG, PNG o WebP',
    );
  });
});
