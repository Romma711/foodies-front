import { HttpErrorResponse } from '@angular/common/http';
import { textoDeMensaje } from '../i18n/traducir';
import { mensajeConCodigo, mensajeDelBackend } from './api-error';

const response = (status: number, error: unknown) => new HttpErrorResponse({ status, error });

/** Text the user sees for an HTTP error in each language. */
function textos(error: HttpErrorResponse): { es: string; en: string; pt: string } {
  const mensaje = mensajeDelBackend(error)!;
  return {
    es: textoDeMensaje('es', mensaje),
    en: textoDeMensaje('en', mensaje),
    pt: textoDeMensaje('pt', mensaje),
  };
}

describe('errores del back con código (S1)', () => {
  it('traduce un código sin parámetros', () => {
    const error = response(409, {
      error: 'conflicto',
      mensaje:
        'Ya tenés una reserva activa en este restaurante ese día. Modificala si necesitás cambiarla.',
      codigo: 'RESERVA_DUPLICADA',
      params: {},
    });

    expect(textos(error)).toEqual({
      es: 'Ya tenés una reserva activa en este restaurante ese día. Modificala si necesitás cambiarla.',
      en: 'You already have an active reservation at this restaurant that day. Change it if you need to.',
      pt: 'Você já tem uma reserva ativa neste restaurante nesse dia. Altere-a se precisar.',
    });
  });

  it('completa los parámetros numéricos y de texto', () => {
    const error = response(400, {
      error: 'error de negocio',
      mensaje:
        'La última llegada es 60 minutos antes del cierre: ese día podés llegar hasta las 23:00.',
      codigo: 'ULTIMA_LLEGADA',
      params: { minutos: 60, hora: '23:00' },
    });

    expect(textos(error).en).toBe(
      'The last arrival is 60 minutes before closing: that day you can arrive until 23:00.',
    );
  });

  it('une las listas como en cada idioma', () => {
    const error = response(400, {
      mensaje: 'Ese día el restaurante recibe reservas por turnos: 20:00, 21:30, 23:00. Elegí uno.',
      codigo: 'TURNO_INVALIDO',
      params: { turnos: ['20:00', '21:30', '23:00'] },
    });

    expect(textos(error)).toEqual({
      es: 'Ese día el restaurante recibe reservas por turnos: 20:00, 21:30 y 23:00. Elegí uno.',
      en: 'That day the restaurant takes reservations by time slot: 20:00, 21:30, and 23:00. Choose one.',
      pt: 'Nesse dia o restaurante recebe reservas por turnos: 20:00, 21:30 e 23:00. Escolha um.',
    });
  });

  it('arma las franjas horarias con el texto de cada idioma', () => {
    const error = response(400, {
      mensaje:
        'Ese día el restaurante recibe reservas de 12:00 a 16:00 y 20:00 a 00:00. Elegí otro horario.',
      codigo: 'FUERA_DE_HORARIO',
      params: {
        franjas: [
          { apertura: '12:00', cierre: '16:00' },
          { apertura: '20:00', cierre: '00:00' },
        ],
      },
    });

    expect(textos(error).es).toBe(
      'Ese día el restaurante recibe reservas de 12:00 a 16:00 y 20:00 a 00:00. Elegí otro horario.',
    );
    expect(textos(error).en).toBe(
      'That day the restaurant takes reservations from 12:00 to 16:00 and 20:00 to 00:00. Choose another time.',
    );
  });

  it('muestra el estado con su etiqueta traducida', () => {
    const error = response(400, {
      mensaje: 'La reserva ya está marcada como asistida y no se puede cambiar',
      codigo: 'ESTADO_FINAL',
      params: { estado: 'ASISTIO' },
    });

    expect(textos(error).en).toBe(
      'The reservation is already closed (Attended) and cannot be changed.',
    );
    expect(textos(error).pt).toBe(
      'A reserva já está encerrada (Compareceu) e não pode ser alterada.',
    );
  });

  it('con un código desconocido muestra el mensaje del back tal cual', () => {
    const error = response(400, {
      mensaje: 'Algo nuevo del back',
      codigo: 'CODIGO_NUEVO',
      params: {},
    });

    expect(mensajeConCodigo(error)).toBeNull();
    expect(textos(error).en).toBe('Algo nuevo del back');
  });

  it('sin código muestra el mensaje del back tal cual', () => {
    const error = response(400, { error: 'error de negocio', mensaje: 'Cupo invalido' });

    expect(mensajeConCodigo(error)).toBeNull();
    expect(mensajeDelBackend(error)).toEqual({ texto: 'Cupo invalido' });
  });

  it('guarda el mensaje en español para quien solo lee textos', () => {
    const error = response(403, {
      mensaje: 'Solo podés reseñar un restaurante después de asistir a una reserva en él',
      codigo: 'RESENA_SIN_ASISTENCIA',
      params: {},
    });

    expect(mensajeConCodigo(error)).toEqual({
      codigo: 'errores.RESENA_SIN_ASISTENCIA',
      params: {},
      texto: 'Solo podés reseñar un restaurante después de asistir a una reserva en él',
    });
  });
});
