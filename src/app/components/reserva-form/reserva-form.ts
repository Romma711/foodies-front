import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  FieldTree,
  FormField,
  FormRoot,
  TreeValidationResult,
  form,
  hidden,
  min,
  pattern,
  required,
  validate,
} from '@angular/forms/signals';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { ReservaDetail, ReservaRequest } from '../../models/reserva';
import { Auth } from '../../services/auth-service';
import { ReservaService } from '../../services/reserva-service';
import { RestaurantService } from '../../services/restaurant-service';

interface ModeloReserva {
  cantidad: number | null;
  fechaReserva: string;
  horarioLlegada: string;
  idRestaurant: string;
}

function inicioDelDia(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

function sumarMeses(fecha: Date, meses: number): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth() + meses, fecha.getDate());
}

function aIso(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function parsearIso(texto: string): Date | null {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!coincidencia) {
    return null;
  }
  return new Date(Number(coincidencia[1]), Number(coincidencia[2]) - 1, Number(coincidencia[3]));
}

@Component({
  selector: 'app-reserva-form',
  imports: [FormField, FormRoot],
  styleUrl: './reserva-form.css',
  templateUrl: './reserva-form.html',
})
export class ReservaForm {
  private readonly auth = inject(Auth);
  private readonly reservaService = inject(ReservaService);
  private readonly restaurantService = inject(RestaurantService);
  private readonly destroyRef = inject(DestroyRef);

  /** Si se pasa un id, la reserva se hace sobre ese restaurante y no se muestra el selector. */
  readonly restauranteId = input<number | undefined>(undefined);
  readonly creada = output<ReservaDetail>();

  readonly restaurantes = this.restaurantService.restaurantes;
  readonly cargandoRestaurantes = this.restaurantService.cargando;
  readonly errorRestaurantes = this.restaurantService.error;
  readonly enviando = this.reservaService.cargando;

  /** Error propio del formulario (p. ej. no poder identificar la cuenta). */
  private readonly _error = signal<string | null>(null);
  readonly errorVisible = computed(() => this._error() ?? this.reservaService.error());

  /** El backend valida: fecha desde hoy y hasta 3 meses adelante. */
  private readonly hoy = inicioDelDia(new Date());
  private readonly maximo = sumarMeses(this.hoy, 3);
  readonly hoyIso = aIso(this.hoy);
  readonly maximoIso = aIso(this.maximo);

  private readonly modelo = signal<ModeloReserva>({
    cantidad: 2,
    fechaReserva: '',
    horarioLlegada: '',
    idRestaurant: '',
  });

  readonly formulario = form(
    this.modelo,
    (reserva) => {
      required(reserva.cantidad, { message: 'Ingresá la cantidad de personas.' });
      min(reserva.cantidad, 1, { message: 'La cantidad mínima es 1 persona.' });
      required(reserva.fechaReserva, { message: 'Elegí una fecha.' });
      validate(reserva.fechaReserva, ({ value }) => {
        const texto = value();
        if (!texto) {
          return undefined;
        }
        const fecha = parsearIso(texto);
        if (!fecha) {
          return { kind: 'fecha-invalida', message: 'Ingresá una fecha válida.' };
        }
        if (fecha < this.hoy) {
          return { kind: 'fecha-pasada', message: 'La fecha no puede ser anterior a hoy.' };
        }
        if (fecha > this.maximo) {
          return {
            kind: 'fecha-lejana',
            message: 'Solo podés reservar con hasta 3 meses de anticipación.',
          };
        }
        return undefined;
      });
      required(reserva.horarioLlegada, { message: 'Elegí un horario de llegada.' });
      pattern(reserva.horarioLlegada, /^([01]\d|2[0-3]):[0-5]\d$/, {
        message: 'Elegí un horario válido.',
      });
      hidden(reserva.idRestaurant, { when: () => this.restauranteId() !== undefined });
      required(reserva.idRestaurant, { message: 'Elegí un restaurante.' });
    },
    {
      submission: {
        action: () => this.enviar(),
        onInvalid: () => this.enfocarPrimerCampoInvalido(),
      },
    },
  );

  constructor() {
    effect(() => {
      const id = this.restauranteId();
      if (id !== undefined) {
        this.modelo.update((modelo) => ({ ...modelo, idRestaurant: String(id) }));
      }
    });

    this.recargarRestaurantes();
  }

  recargarRestaurantes(): void {
    this.restaurantService
      .listar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
  }

  /** El error de un campo se muestra recién cuando el usuario lo tocó o intentó enviar. */
  mostrarError<T>(campo: FieldTree<T>): boolean {
    return campo().invalid() && campo().touched();
  }

  mensajeDeError<T>(campo: FieldTree<T>): string | null {
    return campo().errors()[0]?.message ?? null;
  }

  private async enviar(): Promise<TreeValidationResult> {
    this._error.set(null);
    try {
      const idUsuario = await firstValueFrom(this.auth.asegurarUsuarioId());
      const modelo = this.modelo();
      const creada = await firstValueFrom(
        this.reservaService.crear({
          cantidad: modelo.cantidad ?? 2,
          estadoReserva: 'PENDIENTE',
          fechaReserva: modelo.fechaReserva,
          horarioLlegada: modelo.horarioLlegada,
          idUsuario,
          idRestaurant: Number(modelo.idRestaurant),
        }),
      );
      this.creada.emit(creada);
      this.reiniciar();
    } catch {
      // Si el servicio no dejó error HTTP, el problema fue la identificación de la cuenta.
      this._error.set(this.reservaService.error() ?? 'No pudimos crear la reserva.');
    }
    return undefined;
  }

  private reiniciar(): void {
    this.modelo.set({
      cantidad: 2,
      fechaReserva: '',
      horarioLlegada: '',
      idRestaurant: this.restauranteId() !== undefined ? String(this.restauranteId()) : '',
    });
    this.formulario().reset();
  }

  private enfocarPrimerCampoInvalido(): void {
    for (const campo of [
      this.formulario.idRestaurant,
      this.formulario.fechaReserva,
      this.formulario.horarioLlegada,
      this.formulario.cantidad,
    ]) {
      if (campo().invalid()) {
        campo().focusBoundControl();
        return;
      }
    }
  }
}
