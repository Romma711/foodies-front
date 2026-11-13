import { Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
import { form, FormField, maxLength, min, submit, validate } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog/confirm-dialog';
import {
  TIPO_ESPACIO_LABELS,
  TIPO_ESPACIO_PLURAL,
  TIPOS_ESPACIO,
  TipoEspacio,
} from '../../../restaurantes/models/espacios';
import { mensajeDeNegocio, panelErrorMessage } from '../../utils/panel-errors';
import { Espacio, MAX_NOMBRE_ESPACIO } from '../../models/panel.models';
import { RestaurantePanelService } from '../../services/restaurante-panel.service';

interface EspacioModel {
  tipo: TipoEspacio;
  nombre: string;
  capacidad: number;
}

const MODELO_VACIO: EspacioModel = { tipo: 'SALON', nombre: '', capacidad: 10 };

/** Salones, patios y barras del restaurante, cada uno con su capacidad por día. */
@Component({
  imports: [ConfirmDialog, FormField],
  selector: 'app-espacios',
  styleUrl: './espacios.css',
  templateUrl: './espacios.html',
})
export class EspaciosPanel implements OnInit {
  private readonly panel = inject(RestaurantePanelService);
  private readonly confirm = viewChild.required(ConfirmDialog);

  protected readonly tipos = TIPOS_ESPACIO;
  protected readonly tipoLabels = TIPO_ESPACIO_LABELS;
  protected readonly maxNombre = MAX_NOMBRE_ESPACIO;
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly status = signal<string | null>(null);
  protected readonly espacios = signal<Espacio[]>([]);
  /** Espacio que se está editando; null cuando el formulario agrega uno nuevo. */
  protected readonly editando = signal<Espacio | null>(null);
  /** Id del espacio que se está activando o desactivando, para deshabilitar solo su botón. */
  protected readonly cambiando = signal<number | null>(null);

  protected readonly grupos = computed(() =>
    TIPOS_ESPACIO.map((tipo) => ({
      tipo,
      titulo: TIPO_ESPACIO_PLURAL[tipo],
      espacios: this.espacios().filter((e) => e.tipo === tipo),
    })).filter((grupo) => grupo.espacios.length > 0),
  );

  protected readonly capacidadTotal = computed(() =>
    this.espacios()
      .filter((e) => e.activo)
      .reduce((total, e) => total + e.capacidad, 0),
  );

  private readonly model = signal<EspacioModel>({ ...MODELO_VACIO });
  protected readonly espacioForm = form(this.model, (path) => {
    validate(path.nombre, ({ value }) =>
      value().trim() ? null : { kind: 'required', message: 'Indicá el nombre del espacio.' },
    );
    maxLength(path.nombre, MAX_NOMBRE_ESPACIO, {
      message: `El nombre puede tener hasta ${MAX_NOMBRE_ESPACIO} caracteres.`,
    });
    min(path.capacidad, 1, { message: 'La capacidad debe ser al menos 1.' });
  });

  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      this.espacios.set(await firstValueFrom(this.panel.getEspacios()));
    } catch (error) {
      this.loadError.set(panelErrorMessage(error, 'No pudimos cargar tus espacios.'));
    } finally {
      this.loading.set(false);
    }
  }

  protected editar(espacio: Espacio): void {
    this.limpiarMensajes();
    this.editando.set(espacio);
    this.model.set({ tipo: espacio.tipo, nombre: espacio.nombre, capacidad: espacio.capacidad });
    this.espacioForm().reset();
    document.getElementById('espacio-nombre')?.focus();
  }

  protected cancelarEdicion(): void {
    this.editando.set(null);
    this.model.set({ ...MODELO_VACIO });
    this.espacioForm().reset();
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.limpiarMensajes();
    await submit(this.espacioForm, async () => {
      const { tipo, nombre, capacidad } = this.model();
      const request = { tipo, nombre: nombre.trim(), capacidad };
      const editando = this.editando();
      try {
        const guardado = await firstValueFrom(
          editando
            ? this.panel.actualizarEspacio(editando.id, request)
            : this.panel.crearEspacio(request),
        );
        this.reemplazar(guardado);
        this.status.set(editando ? 'Espacio guardado.' : 'Espacio agregado.');
        this.cancelarEdicion();
      } catch (error) {
        this.error.set(
          mensajeDeNegocio(error) ??
            panelErrorMessage(error, 'No pudimos guardar el espacio. Intentá de nuevo.'),
        );
      }
      return undefined;
    });
  }

  protected async cambiarActivo(espacio: Espacio): Promise<void> {
    this.limpiarMensajes();
    const activo = !espacio.activo;
    if (!activo) {
      const confirmado = await this.confirm().open({
        heading: `¿Desactivar ${espacio.nombre}?`,
        message:
          'Los clientes no van a poder reservar en este espacio hasta que lo vuelvas a activar. ' +
          'No se borra nada.',
        confirmLabel: 'Desactivar',
        tone: 'danger',
      });
      if (!confirmado) {
        return;
      }
    }
    this.cambiando.set(espacio.id);
    try {
      this.reemplazar(await firstValueFrom(this.panel.cambiarActivoEspacio(espacio.id, activo)));
      this.status.set(activo ? 'Espacio activado.' : 'Espacio desactivado.');
    } catch (error) {
      this.error.set(
        mensajeDeNegocio(error) ??
          panelErrorMessage(error, 'No pudimos cambiar el espacio. Intentá de nuevo.'),
      );
    } finally {
      this.cambiando.set(null);
    }
  }

  private reemplazar(guardado: Espacio): void {
    this.espacios.update((espacios) =>
      espacios.some((e) => e.id === guardado.id)
        ? espacios.map((e) => (e.id === guardado.id ? guardado : e))
        : [...espacios, guardado],
    );
  }

  private limpiarMensajes(): void {
    this.error.set(null);
    this.status.set(null);
  }
}
