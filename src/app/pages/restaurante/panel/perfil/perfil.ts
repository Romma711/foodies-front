import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { form, FormField, hidden, max, min, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { EspecialidadDeComida, ESPECIALIDADES } from '../../../../core/auth/auth.models';
import { ESPECIALIDAD_LABELS } from '../../../../core/catalog/especialidades';
import { panelErrorMessage } from '../panel-errors';
import { RestaurantePanelService } from '../restaurante-panel.service';

interface PerfilModel {
  nombre: string;
  ubicacion: string;
  cupoMaximo: number;
  especialidad: EspecialidadDeComida | '';
  autoAceptar: boolean;
  porcentajeAutoAceptacion: number;
}

/** Porcentaje que se sugiere al activar la aceptación automática por primera vez. */
const PORCENTAJE_SUGERIDO = 60;

@Component({
  imports: [FormField],
  selector: 'app-perfil',
  styleUrl: './perfil.css',
  templateUrl: './perfil.html',
})
export class Perfil implements OnInit {
  private readonly panel = inject(RestaurantePanelService);

  protected readonly especialidades = ESPECIALIDADES;
  protected readonly especialidadLabels = ESPECIALIDAD_LABELS;
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly saveError = signal<string | null>(null);
  protected readonly saved = signal(false);

  private readonly model = signal<PerfilModel>({
    nombre: '',
    ubicacion: '',
    cupoMaximo: 1,
    especialidad: '',
    autoAceptar: false,
    porcentajeAutoAceptacion: PORCENTAJE_SUGERIDO,
  });
  protected readonly perfilForm = form(this.model, (path) => {
    required(path.nombre, { message: 'El nombre es obligatorio.' });
    required(path.ubicacion, { message: 'La dirección es obligatoria.' });
    required(path.especialidad, { message: 'Elegí una especialidad.' });
    min(path.cupoMaximo, 1, { message: 'La capacidad debe ser al menos 1.' });
    // Con la opción apagada el porcentaje se oculta y no se valida.
    hidden(path.porcentajeAutoAceptacion, { when: ({ valueOf }) => !valueOf(path.autoAceptar) });
    min(path.porcentajeAutoAceptacion, 1, { message: 'El porcentaje debe estar entre 1 y 100.' });
    max(path.porcentajeAutoAceptacion, 100, { message: 'El porcentaje debe estar entre 1 y 100.' });
  });

  /** Personas por día que se aceptan solas con el cupo y el porcentaje actuales. */
  protected readonly personasAutoAceptadas = computed(() => {
    const { cupoMaximo, porcentajeAutoAceptacion } = this.model();
    return Math.floor((cupoMaximo * porcentajeAutoAceptacion) / 100);
  });

  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      const resto = await firstValueFrom(this.panel.getMiRestaurante());
      this.model.set({
        nombre: resto.nombre,
        ubicacion: resto.ubicacion,
        cupoMaximo: resto.cupoMaximo,
        especialidad: resto.especialidad,
        autoAceptar: resto.porcentajeAutoAceptacion > 0,
        porcentajeAutoAceptacion:
          resto.porcentajeAutoAceptacion > 0 ? resto.porcentajeAutoAceptacion : PORCENTAJE_SUGERIDO,
      });
    } catch (error) {
      this.loadError.set(panelErrorMessage(error, 'No pudimos cargar tu restaurante.'));
    } finally {
      this.loading.set(false);
    }
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.saved.set(false);
    this.saveError.set(null);
    await submit(this.perfilForm, async () => {
      const { nombre, ubicacion, cupoMaximo, especialidad, autoAceptar, porcentajeAutoAceptacion } =
        this.model();
      if (especialidad === '') {
        return undefined;
      }
      try {
        await firstValueFrom(
          this.panel.actualizar({
            nombre: nombre.trim(),
            ubicacion: ubicacion.trim(),
            cupoMaximo,
            especialidad,
            porcentajeAutoAceptacion: autoAceptar ? porcentajeAutoAceptacion : 0,
          }),
        );
        this.saved.set(true);
      } catch (error) {
        this.saveError.set(
          panelErrorMessage(error, 'No pudimos guardar los cambios. Intentá de nuevo.'),
        );
      }
      return undefined;
    });
  }
}
