import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Observable, of, Subject } from 'rxjs';
import { RestauranteListDTO } from '../../../../pages/restaurante/models/restaurante.models';
import { Calificacion, CalificacionService } from '../../services/calificacion.service';
import { CENTRO_MAR_DEL_PLATA, MapaRestaurantes } from './mapa-restaurantes';

const PARRILLA: RestauranteListDTO = {
  id: 1,
  nombre: 'La Parrilla de Tito',
  ubicacion: 'Av. Colón 1200',
  especialidad: 'PARRILLA',
  latitud: -38.0,
  longitud: -57.55,
};
const CAFE: RestauranteListDTO = {
  id: 2,
  nombre: 'Café Tostado',
  ubicacion: 'Güemes 2800',
  especialidad: 'CAFE',
  latitud: -38.01,
  longitud: -57.54,
};
const SIN_UBICACION: RestauranteListDTO = {
  id: 3,
  nombre: 'Pasta Nostra',
  ubicacion: 'Alem 3000',
  especialidad: 'PASTAS',
  latitud: null,
  longitud: null,
};

describe('MapaRestaurantes', () => {
  let calificaciones: Record<number, Observable<Calificacion>>;

  beforeEach(() => {
    calificaciones = {
      1: of({ promedio: 4.5, total: 2 }),
      2: of({ promedio: 0, total: 0 }),
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: CalificacionService,
          useValue: { promedio: vi.fn((id: number) => calificaciones[id]) },
        },
      ],
    });
  });

  function crear(restaurantes: RestauranteListDTO[]) {
    const fixture = TestBed.createComponent(MapaRestaurantes);
    fixture.componentRef.setInput('restaurantes', restaurantes);
    fixture.detectChanges();
    TestBed.tick();
    return { fixture, host: fixture.nativeElement as HTMLElement };
  }

  function abrirPopup(host: HTMLElement, nombre: string): HTMLElement {
    const marcador = host.querySelector<HTMLElement>(`.leaflet-marker-icon[title="${nombre}"]`);
    expect(marcador).not.toBeNull();
    marcador!.click();
    const popup = host.querySelector<HTMLElement>('.leaflet-popup-content');
    expect(popup).not.toBeNull();
    return popup!;
  }

  it('centra el mapa en Mar del Plata', () => {
    expect(CENTRO_MAR_DEL_PLATA).toEqual([-38.0055, -57.5426]);
    const { fixture } = crear([PARRILLA]);

    const centro = fixture.componentInstance.centro();
    expect(centro.lat).toBeCloseTo(-38.0055, 3);
    expect(centro.lng).toBeCloseTo(-57.5426, 3);
  });

  it('dibuja un marcador por restaurante con ubicación, distinto según la especialidad', () => {
    const { host } = crear([PARRILLA, CAFE, SIN_UBICACION]);

    const marcadores = Array.from(host.querySelectorAll<HTMLElement>('.leaflet-marker-icon'));
    expect(marcadores.map((m) => m.getAttribute('title'))).toEqual([
      'La Parrilla de Tito',
      'Café Tostado',
    ]);
    expect(marcadores[0].classList).toContain('marcador-parrilla');
    expect(marcadores[1].classList).toContain('marcador-cafe');
  });

  it('avisa cuántos restaurantes todavía no tienen ubicación', () => {
    const { host } = crear([PARRILLA, SIN_UBICACION]);

    expect(host.querySelector('[data-testid="sin-ubicacion"]')?.textContent?.trim()).toBe(
      '1 restaurante todavía no tiene ubicación en el mapa.',
    );
  });

  it('no muestra el aviso cuando todos tienen ubicación', () => {
    const { host } = crear([PARRILLA, CAFE]);

    expect(host.querySelector('[data-testid="sin-ubicacion"]')).toBeNull();
  });

  it('abre un popup con nombre, especialidad, estrellas y enlace a la ficha', () => {
    const { host } = crear([PARRILLA]);

    const popup = abrirPopup(host, 'La Parrilla de Tito');

    expect(popup.querySelector('h3')?.textContent).toBe('La Parrilla de Tito');
    expect(popup.textContent).toContain('Parrilla');
    const estrellas = popup.querySelector('[data-testid="calificacion"]');
    expect(estrellas?.getAttribute('aria-label')).toBe('Calificación: 4.5 de 5 (2 reseñas)');
    expect(estrellas?.textContent).toContain('4.5');
    const enlace = popup.querySelector<HTMLAnchorElement>('a');
    expect(enlace?.getAttribute('href')).toBe('/restaurantes/1');
    expect(enlace?.textContent?.trim()).toBe('Ver restaurante');
  });

  it('muestra "Sin reseñas todavía" cuando el restaurante no tiene calificaciones', () => {
    const { host } = crear([CAFE]);

    const popup = abrirPopup(host, 'Café Tostado');

    expect(popup.querySelector('[data-testid="calificacion"]')?.textContent?.trim()).toBe(
      'Sin reseñas todavía',
    );
  });

  it('muestra "Cargando calificación…" mientras llega el promedio', () => {
    const pendiente = new Subject<Calificacion>();
    calificaciones[1] = pendiente;
    const { host } = crear([PARRILLA]);

    const popup = abrirPopup(host, 'La Parrilla de Tito');
    expect(popup.querySelector('[data-testid="calificacion"]')?.textContent?.trim()).toBe(
      'Cargando calificación…',
    );

    pendiente.next({ promedio: 3, total: 1 });
    expect(popup.querySelector('[data-testid="calificacion"]')?.getAttribute('aria-label')).toBe(
      'Calificación: 3 de 5 (1 reseña)',
    );
  });

  it('el enlace del popup navega con el router sin recargar la página', () => {
    const { host } = crear([PARRILLA]);
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

    abrirPopup(host, 'La Parrilla de Tito').querySelector<HTMLAnchorElement>('a')!.click();

    expect(navegar).toHaveBeenCalledWith('/restaurantes/1');
  });

  it('agrega los marcadores nuevos cuando cambia la lista', () => {
    const { fixture, host } = crear([PARRILLA]);

    fixture.componentRef.setInput('restaurantes', [PARRILLA, CAFE]);
    fixture.detectChanges();
    TestBed.tick();

    expect(host.querySelectorAll('.leaflet-marker-icon')).toHaveLength(2);
  });
});
