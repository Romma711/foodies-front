import { HttpTestingController } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialog } from '../../../../components/confirm-dialog/confirm-dialog';
import { miRestaurante, providePanelTesting, settle } from '../panel.testing';
import { CartaPanel } from './carta';

describe('CartaPanel', () => {
  let fixture: ComponentFixture<CartaPanel>;
  let http: HttpTestingController;
  let element: HTMLElement;

  const carta = {
    id: 3,
    nombreArchivo: 'menu.pdf',
    url: '/api/files/cartas/7/a.pdf',
    tamanioBytes: 2048,
    actualizadaEn: '2026-10-20T12:00:00Z',
  };

  const render = async (current: typeof carta | null) => {
    fixture = TestBed.createComponent(CartaPanel);
    element = fixture.nativeElement;
    await fixture.whenStable();
    http.expectOne('/api/restaurantes/me').flush(miRestaurante({ carta: current }));
    await settle(fixture);
  };

  const choose = async (file: File) => {
    const input = element.querySelector<HTMLInputElement>('input[type="file"]')!;
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    input.dispatchEvent(new Event('change'));
    await settle(fixture);
  };

  const pdf = () => new File(['%PDF-1.4'], 'nueva.pdf', { type: 'application/pdf' });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartaPanel],
      providers: providePanelTesting(),
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it('shows the current menu with a link to open it', async () => {
    await render(carta);

    expect(element.textContent).toContain('menu.pdf');
    expect(element.textContent).toContain('2 KB');
    expect(
      element.querySelector<HTMLAnchorElement>('a[target="_blank"]')?.getAttribute('href'),
    ).toBe(carta.url);
    expect(element.querySelector('iframe')).not.toBeNull();
  });

  it('rejects files that are not PDF without calling the backend', async () => {
    await render(null);

    await choose(new File(['hello'], 'menu.txt', { type: 'text/plain' }));

    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Elegí un archivo PDF.');
  });

  it('rejects files over 10 MB without calling the backend', async () => {
    await render(null);
    const big = pdf();
    Object.defineProperty(big, 'size', { value: 10 * 1024 * 1024 + 1 });

    await choose(big);

    expect(element.querySelector('[role="alert"]')?.textContent).toContain('pesa más de 10 MB');
  });

  it('uploads a first menu without asking for confirmation', async () => {
    const open = vi.spyOn(ConfirmDialog.prototype, 'open');
    await render(null);

    await choose(pdf());
    http
      .expectOne({ method: 'PUT', url: '/api/restaurantes/me/carta' })
      .flush({ ...carta, nombreArchivo: 'nueva.pdf' });
    await settle(fixture);

    expect(open).not.toHaveBeenCalled();
    expect(element.textContent).toContain('nueva.pdf');
    expect(element.querySelector('[role="status"]')?.textContent).toContain('Carta subida');
  });

  it('asks before replacing the current menu and does nothing when declined', async () => {
    vi.spyOn(ConfirmDialog.prototype, 'open').mockResolvedValue(false);
    await render(carta);

    await choose(pdf());

    http.expectNone({ method: 'PUT', url: '/api/restaurantes/me/carta' });
    expect(element.textContent).toContain('menu.pdf');
  });

  it('deletes the menu after confirmation', async () => {
    vi.spyOn(ConfirmDialog.prototype, 'open').mockResolvedValue(true);
    await render(carta);

    [...element.querySelectorAll('button')]
      .find((b) => b.textContent?.trim() === 'Eliminar')!
      .click();
    await settle(fixture);
    http.expectOne({ method: 'DELETE', url: '/api/restaurantes/me/carta' }).flush(null);
    await settle(fixture);

    expect(element.textContent).not.toContain('menu.pdf');
    expect(element.textContent).toContain('Subí tu carta');
  });

  it('shows a clear message when the backend rejects the file', async () => {
    await render(null);

    await choose(pdf());
    http
      .expectOne({ method: 'PUT', url: '/api/restaurantes/me/carta' })
      .flush(
        { mensaje: 'El archivo no es un PDF válido' },
        { status: 400, statusText: 'Bad Request' },
      );
    await settle(fixture);

    expect(element.querySelector('[role="alert"]')?.textContent).toContain('PDF válido');
  });
});
