import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  DIA_SEMANA_LABELS,
  DIAS_SEMANA,
  DiaSemana,
  FranjaHoraria,
  MAX_FRANJAS_POR_DIA,
} from '../../../../restaurantes/utils/horarios';
import { mensajeDeNegocio, panelErrorMessage } from '../panel-errors';
import { RestaurantePanelService } from '../restaurante-panel.service';

interface Franja {
  apertura: string;
  cierre: string;
}

interface DiaEditable {
  dia: DiaSemana;
  abierto: boolean;
  franjas: Franja[];
}

/** Franja que se propone al abrir un día o agregar otra. */
const FRANJA_SUGERIDA: Franja = { apertura: '20:00', cierre: '00:00' };

/** Días y franjas en los que el restaurante recibe reservas. */
@Component({
  selector: 'app-horarios',
  styleUrl: './horarios.css',
  templateUrl: './horarios.html',
})
export class HorariosPanel implements OnInit {
  private readonly panel = inject(RestaurantePanelService);

  protected readonly labels = DIA_SEMANA_LABELS;
  protected readonly maxFranjas = MAX_FRANJAS_POR_DIA;
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly status = signal<string | null>(null);
  protected readonly guardando = signal(false);
  protected readonly dias = signal<DiaEditable[]>(semanaVacia());
  /** Sin franjas guardadas no hay restricción de horario para las reservas. */
  protected readonly sinHorario = signal(true);

  protected readonly algunDiaAbierto = computed(() => this.dias().some((d) => d.abierto));

  ngOnInit(): void {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      this.aplicar(await firstValueFrom(this.panel.getHorarios()));
    } catch (error) {
      this.loadError.set(panelErrorMessage(error, 'No pudimos cargar tu horario.'));
    } finally {
      this.loading.set(false);
    }
  }

  protected cambiarAbierto(dia: DiaSemana, event: Event): void {
    const abierto = (event.target as HTMLInputElement).checked;
    this.actualizar(dia, (d) => ({
      ...d,
      abierto,
      franjas: abierto && d.franjas.length === 0 ? [{ ...FRANJA_SUGERIDA }] : d.franjas,
    }));
  }

  protected cambiarHora(dia: DiaSemana, indice: number, campo: keyof Franja, event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.actualizar(dia, (d) => ({
      ...d,
      franjas: d.franjas.map((f, i) => (i === indice ? { ...f, [campo]: valor } : f)),
    }));
  }

  protected agregarFranja(dia: DiaSemana): void {
    this.actualizar(dia, (d) => ({ ...d, franjas: [...d.franjas, { ...FRANJA_SUGERIDA }] }));
  }

  protected quitarFranja(dia: DiaSemana, indice: number): void {
    this.actualizar(dia, (d) => {
      const franjas = d.franjas.filter((_, i) => i !== indice);
      return { ...d, franjas, abierto: franjas.length > 0 };
    });
  }

  protected async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    this.error.set(null);
    this.status.set(null);
    this.guardando.set(true);
    const franjas: FranjaHoraria[] = this.dias()
      .filter((d) => d.abierto)
      .flatMap((d) =>
        d.franjas.map((f) => ({ dia: d.dia, apertura: f.apertura, cierre: f.cierre })),
      );
    try {
      this.aplicar(await firstValueFrom(this.panel.guardarHorarios(franjas)));
      this.status.set('Horario guardado.');
    } catch (error) {
      this.error.set(
        mensajeDeNegocio(error) ??
          panelErrorMessage(error, 'No pudimos guardar el horario. Intentá de nuevo.'),
      );
    } finally {
      this.guardando.set(false);
    }
  }

  private aplicar(franjas: FranjaHoraria[]): void {
    this.sinHorario.set(franjas.length === 0);
    this.dias.set(
      DIAS_SEMANA.map((dia) => {
        const delDia = franjas
          .filter((f) => f.dia === dia)
          .sort((a, b) => a.apertura.localeCompare(b.apertura))
          .map(({ apertura, cierre }) => ({ apertura, cierre }));
        return { dia, abierto: delDia.length > 0, franjas: delDia };
      }),
    );
  }

  private actualizar(dia: DiaSemana, cambio: (d: DiaEditable) => DiaEditable): void {
    this.dias.update((dias) => dias.map((d) => (d.dia === dia ? cambio(d) : d)));
  }
}

function semanaVacia(): DiaEditable[] {
  return DIAS_SEMANA.map((dia) => ({ dia, abierto: false, franjas: [] }));
}
