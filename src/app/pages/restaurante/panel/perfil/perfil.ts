import { Component, inject, OnInit, signal } from '@angular/core';
import { form, FormField, min, required, submit } from '@angular/forms/signals';
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
}

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
  });
  protected readonly perfilForm = form(this.model, (path) => {
    required(path.nombre, { message: 'El nombre es obligatorio.' });
    required(path.ubicacion, { message: 'La dirección es obligatoria.' });
    required(path.especialidad, { message: 'Elegí una especialidad.' });
    min(path.cupoMaximo, 1, { message: 'La capacidad debe ser al menos 1.' });
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
      const { nombre, ubicacion, cupoMaximo, especialidad } = this.model();
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
