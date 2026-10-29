import {
  afterRenderEffect,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  layerGroup,
  LayerGroup,
  Map as MapaLeaflet,
  map as crearMapa,
  marker,
  tileLayer,
} from 'leaflet';
import { Subscription } from 'rxjs';
import { RestauranteListDTO } from '../../../../pages/restaurante/models/restaurante.models';
import { CalificacionService } from '../../services/calificacion.service';
import { iconoEspecialidad } from '../../utils/marcador-especialidad';
import { crearPopupRestaurante } from '../../utils/popup-restaurante';

/** Mar del Plata city center, the map's starting point. */
export const CENTRO_MAR_DEL_PLATA: [number, number] = [-38.0055, -57.5426];
const ZOOM_INICIAL = 13;

type ConUbicacion = RestauranteListDTO & { latitud: number; longitud: number };

function tieneUbicacion(restaurante: RestauranteListDTO): restaurante is ConUbicacion {
  return typeof restaurante.latitud === 'number' && typeof restaurante.longitud === 'number';
}

/**
 * Leaflet + OpenStreetMap map of the restaurants, centered on Mar del Plata. Each pin shows the
 * specialty; its popup loads the average rating when it opens and links to the restaurant page.
 */
@Component({
  selector: 'app-mapa-restaurantes',
  template: `
    <section class="overflow-hidden rounded-2xl border border-line/70 bg-white/90 shadow-card">
      <div
        #mapa
        class="z-0 h-[26rem] w-full sm:h-[32rem]"
        role="region"
        aria-label="Mapa de restaurantes de Mar del Plata"
      ></div>
      @if (sinUbicacion() > 0) {
        <p
          class="border-t border-line/70 px-5 py-3 text-sm text-ink-500"
          data-testid="sin-ubicacion"
        >
          {{ sinUbicacion() }}
          {{
            sinUbicacion() === 1
              ? 'restaurante todavía no tiene ubicación en el mapa.'
              : 'restaurantes todavía no tienen ubicación en el mapa.'
          }}
        </p>
      }
    </section>
  `,
})
export class MapaRestaurantes {
  readonly restaurantes = input.required<readonly RestauranteListDTO[]>();

  protected readonly ubicados = computed(() => this.restaurantes().filter(tieneUbicacion));
  protected readonly sinUbicacion = computed(
    () => this.restaurantes().length - this.ubicados().length,
  );

  private readonly contenedor = viewChild.required<ElementRef<HTMLElement>>('mapa');
  private readonly router = inject(Router);
  private readonly calificaciones = inject(CalificacionService);
  private mapa: MapaLeaflet | null = null;
  private marcadores: LayerGroup | null = null;
  private suscripciones = new Subscription();

  constructor() {
    afterRenderEffect(() => {
      const ubicados = this.ubicados();
      const marcadores = this.inicializar();
      this.suscripciones.unsubscribe();
      this.suscripciones = new Subscription();
      marcadores.clearLayers();
      for (const restaurante of ubicados) {
        this.agregarMarcador(marcadores, restaurante);
      }
    });

    inject(DestroyRef).onDestroy(() => {
      this.suscripciones.unsubscribe();
      this.mapa?.remove();
    });
  }

  /** Current map center; exposed for tests and future "recenter" controls. */
  centro(): { lat: number; lng: number } {
    const { lat, lng } = this.mapa?.getCenter() ?? {
      lat: CENTRO_MAR_DEL_PLATA[0],
      lng: CENTRO_MAR_DEL_PLATA[1],
    };
    return { lat, lng };
  }

  private inicializar(): LayerGroup {
    if (this.mapa && this.marcadores) {
      return this.marcadores;
    }
    this.mapa = crearMapa(this.contenedor().nativeElement, {
      center: CENTRO_MAR_DEL_PLATA,
      zoom: ZOOM_INICIAL,
      scrollWheelZoom: false,
    });
    tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.mapa);
    this.marcadores = layerGroup().addTo(this.mapa);
    return this.marcadores;
  }

  private agregarMarcador(grupo: LayerGroup, restaurante: ConUbicacion): void {
    const popup = crearPopupRestaurante(restaurante, (url) => void this.router.navigateByUrl(url));
    const pin = marker([restaurante.latitud, restaurante.longitud], {
      icon: iconoEspecialidad(restaurante.especialidad),
      title: restaurante.nombre,
      keyboard: true,
    }).bindPopup(popup.elemento, { className: 'popup-restaurante', minWidth: 224, maxWidth: 224 });

    // Loaded once; after a failure the next opening retries.
    let estado: 'pendiente' | 'cargando' | 'cargada' = 'pendiente';
    pin.on('popupopen', () => {
      if (estado !== 'pendiente') {
        return;
      }
      estado = 'cargando';
      popup.mostrarCargando();
      this.suscripciones.add(
        this.calificaciones.promedio(restaurante.id).subscribe({
          next: (calificacion) => {
            estado = 'cargada';
            popup.mostrarCalificacion(calificacion);
          },
          error: () => {
            estado = 'pendiente';
            popup.mostrarError();
          },
        }),
      );
    });
    pin.addTo(grupo);
  }
}
