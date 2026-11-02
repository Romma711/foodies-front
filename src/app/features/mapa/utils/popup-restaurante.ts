import { especialidadLabel } from '../../../core/catalog/especialidades';
import { RestauranteListDTO } from '../../../pages/restaurante/models/restaurante.models';
import { Calificacion } from '../services/calificacion.service';
import { elementoIconoEspecialidad } from './marcador-especialidad';

export interface PopupRestaurante {
  elemento: HTMLElement;
  mostrarCalificacion(calificacion: Calificacion): void;
  /** Shown while the rating is requested again after a failure. */
  mostrarCargando(): void;
  /** The rating could not be loaded; the popup retries the next time it opens. */
  mostrarError(): void;
}

/**
 * Builds the popup content for a restaurant marker.
 *
 * Built with DOM APIs and `textContent` (never `innerHTML`) because restaurant names come from
 * user input. The link keeps a real `href` for middle-click and screen readers, while a plain click
 * goes through `navegar` so the SPA does not reload.
 */
export function crearPopupRestaurante(
  restaurante: RestauranteListDTO,
  navegar: (url: string) => void,
): PopupRestaurante {
  const url = `/restaurantes/${restaurante.id}`;

  const elemento = crear('article', 'w-56 overflow-hidden');

  const portada = crear(
    'div',
    'grid h-20 place-items-center bg-gradient-to-br from-brand-100 via-cream-100 to-cream-50 text-brand-700',
  );
  portada.setAttribute('aria-hidden', 'true');
  portada.append(elementoIconoEspecialidad(restaurante.especialidad, 32));

  const cuerpo = crear('div', 'p-4');
  const especialidad = crear('p', 'text-xs font-semibold tracking-wide text-brand-700 uppercase');
  especialidad.textContent = especialidadLabel(restaurante.especialidad);
  const titulo = crear('h3', 'mt-1 text-base font-extrabold tracking-tight text-ink-900');
  titulo.textContent = restaurante.nombre;
  const direccion = crear('p', 'mt-0.5 truncate text-xs text-ink-500');
  direccion.textContent = restaurante.ubicacion;

  const calificacion = crear('p', 'mt-2 text-sm text-ink-500');
  calificacion.dataset['testid'] = 'calificacion';
  calificacion.textContent = 'Cargando calificación…';

  const enlace = crear(
    'a',
    'mt-3 inline-flex items-center rounded-full bg-ink-900 px-4 py-2 text-xs font-semibold !text-white transition hover:bg-ink-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-900',
  ) as HTMLAnchorElement;
  enlace.href = url;
  enlace.textContent = 'Ver restaurante';
  enlace.addEventListener('click', (evento) => {
    if (evento.button !== 0 || evento.metaKey || evento.ctrlKey || evento.shiftKey) {
      return;
    }
    evento.preventDefault();
    navegar(url);
  });

  cuerpo.append(especialidad, titulo, direccion, calificacion, enlace);
  elemento.append(portada, cuerpo);

  const mostrarTexto = (texto: string) => {
    calificacion.replaceChildren();
    calificacion.removeAttribute('aria-label');
    calificacion.removeAttribute('role');
    calificacion.textContent = texto;
  };

  return {
    elemento,
    mostrarCargando: () => mostrarTexto('Cargando calificación…'),
    mostrarError: () => mostrarTexto('No pudimos cargar la calificación.'),
    mostrarCalificacion({ promedio, total }) {
      if (total === 0) {
        mostrarTexto('Sin reseñas todavía');
        return;
      }
      calificacion.replaceChildren();
      const valor = Number.isInteger(promedio) ? String(promedio) : promedio.toFixed(1);
      calificacion.setAttribute('role', 'img');
      calificacion.setAttribute(
        'aria-label',
        `Calificación: ${valor} de 5 (${total} ${total === 1 ? 'reseña' : 'reseñas'})`,
      );
      const llenas = Math.round(promedio);
      const estrellas = crear('span', 'tracking-tight text-star');
      estrellas.textContent = '★'.repeat(llenas);
      const vacias = crear('span', 'tracking-tight text-cream-200');
      vacias.textContent = '★'.repeat(5 - llenas);
      const numero = crear('span', 'ml-1.5 font-semibold text-ink-700');
      numero.textContent = valor;
      const cantidad = crear('span', 'ml-1 text-xs');
      cantidad.textContent = `(${total})`;
      calificacion.append(estrellas, vacias, numero, cantidad);
    },
  };
}

function crear(etiqueta: string, clases: string): HTMLElement {
  const elemento = document.createElement(etiqueta);
  elemento.className = clases;
  return elemento;
}
