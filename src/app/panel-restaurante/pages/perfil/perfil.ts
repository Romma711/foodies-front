import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { form, FormField, hidden, max, min, required, submit } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { EspecialidadDeComida, ESPECIALIDADES } from '../../../core/auth/auth.models';
import { ESPECIALIDAD_LABELS } from '../../../restaurantes/models/especialidades';
import { panelErrorMessage } from '../../utils/panel-errors';
import { clave, Mensaje } from '@core/i18n/traducir';
import { RestaurantePanelService } from '../../services/restaurante-panel.service';
import { TClavePipe, TPipe } from '@core/i18n/t.pipe';

interface PerfilModel {
  nombre: string;
  ubicacion: string;
  especialidad: EspecialidadDeComida | '';
  autoAceptar: boolean;
  porcentajeAutoAceptacion: number;
}

/** Porcentaje que se sugiere al activar la aceptación automática por primera vez. */
const PORCENTAJE_SUGERIDO = 60;

@Component({
  imports: [TClavePipe, TPipe, FormField, RouterLink],
  selector: 'app-perfil',
  styleUrl: './perfil.css',
  templateUrl: './perfil.html',
})
export class Perfil implements OnInit {
  private readonly panel = inject(RestaurantePanelService);

  protected readonly especialidades = ESPECIALIDADES;
  protected readonly especialidadLabels = ESPECIALIDAD_LABELS;
  protected readonly loading = signal(true);
  protected readonly loadError = signal<Mensaje | null>(null);
  protected readonly saveError = signal<Mensaje | null>(null);
  protected readonly saved = signal(false);
  /** Capacidad total por día (suma de los espacios activos). Se edita desde Espacios. */
  protected readonly capacidadTotal = signal(0);

  private readonly model = signal<PerfilModel>({
    nombre: '',
    ubicacion: '',
    especialidad: '',
    autoAceptar: false,
    porcentajeAutoAceptacion: PORCENTAJE_SUGERIDO,
  });
  protected readonly perfilForm = form(this.model, (path) => {
    required(path.nombre, { message: clave('panel.perfil.validacion.nombre') });
    required(path.ubicacion, { message: clave('auth.validacion.direccionObligatoria') });
    required(path.especialidad, { message: clave('auth.validacion.especialidadObligatoria') });
    // Con la opción apagada el porcentaje se oculta y no se valida.
    hidden(path.porcentajeAutoAceptacion, { when: ({ valueOf }) => !valueOf(path.autoAceptar) });
    min(path.porcentajeAutoAceptacion, 1, { message: clave('panel.perfil.validacion.porcentaje') });
    max(path.porcentajeAutoAceptacion, 100, {
      message: clave('panel.perfil.validacion.porcentaje'),
    });
  });

  /**
   * Personas por día que se aceptan solas con la capacidad total y el porcentaje actuales. Es una
   * referencia: el porcentaje se aplica al cupo de cada espacio por separado.
   */
  protected readonly personasAutoAceptadas = computed(() =>
    Math.floor((this.capacidadTotal() * this.model().porcentajeAutoAceptacion) / 100),
  );

  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      const resto = await firstValueFrom(this.panel.getMiRestaurante());
      this.capacidadTotal.set(resto.cupoMaximo);
      this.model.set({
        nombre: resto.nombre,
        ubicacion: resto.ubicacion,
        especialidad: resto.especialidad,
        autoAceptar: resto.porcentajeAutoAceptacion > 0,
        porcentajeAutoAceptacion:
          resto.porcentajeAutoAceptacion > 0 ? resto.porcentajeAutoAceptacion : PORCENTAJE_SUGERIDO,
      });
    } catch (error) {
      this.loadError.set(panelErrorMessage(error, 'panel.error.cargarRestaurante'));
    } finally {
      this.loading.set(false);
    }
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.saved.set(false);
    this.saveError.set(null);
    await submit(this.perfilForm, async () => {
      const { nombre, ubicacion, especialidad, autoAceptar, porcentajeAutoAceptacion } =
        this.model();
      if (especialidad === '') {
        return undefined;
      }
      try {
        await firstValueFrom(
          this.panel.actualizar({
            nombre: nombre.trim(),
            ubicacion: ubicacion.trim(),
            especialidad,
            porcentajeAutoAceptacion: autoAceptar ? porcentajeAutoAceptacion : 0,
          }),
        );
        this.saved.set(true);
      } catch (error) {
        this.saveError.set(panelErrorMessage(error, 'panel.perfil.error.guardar'));
      }
      return undefined;
    });
  }
}
