import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { violacionesAxe } from '../../shared/testing/axe';
import { MapaRestaurantes } from './components/mapa-restaurantes/mapa-restaurantes';
import { CalificacionService } from './services/calificacion.service';

/** WCAG checks (axe-core) for the restaurant map, with a popup open as users see it. */
describe('Accesibilidad del mapa de restaurantes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: CalificacionService,
          useValue: { promedio: () => of({ promedio: 4.5, total: 2 }) },
        },
      ],
    });
  });

  afterEach(() => (document.body.innerHTML = ''));

  it('no tiene violaciones con un popup abierto y restaurantes sin ubicación', async () => {
    const fixture = TestBed.createComponent(MapaRestaurantes);
    fixture.componentRef.setInput('restaurantes', [
      {
        id: 1,
        nombre: 'La Parrilla de Tito',
        ubicacion: 'Av. Colón 1200',
        especialidad: 'PARRILLA',
        latitud: -38.0,
        longitud: -57.55,
      },
      { id: 2, nombre: 'Pasta Nostra', ubicacion: 'Alem 3000', especialidad: 'PASTAS' },
    ]);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    TestBed.tick();

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLElement>('.leaflet-marker-icon[title="La Parrilla de Tito"]')!
      .click();

    expect(await violacionesAxe(fixture.nativeElement)).toEqual([]);
  });
});
