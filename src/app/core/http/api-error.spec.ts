import { HttpErrorResponse } from '@angular/common/http';
import { backendMessage, isConnectionError } from './api-error';

const response = (status: number, error: unknown) => new HttpErrorResponse({ status, error });

describe('backendMessage', () => {
  it('reads the human message of a handled exception', () => {
    const error = response(400, { error: 'error de negocio', mensaje: 'No hay cupo ese día.' });

    expect(backendMessage(error)).toBe('No hay cupo ese día.');
  });

  it('reads the first field message of a validation error', () => {
    const error = response(400, { password: 'La contraseña debe tener al menos 8 caracteres' });

    expect(backendMessage(error)).toBe('La contraseña debe tener al menos 8 caracteres');
  });

  it('never shows the short error code on its own', () => {
    expect(backendMessage(response(400, { error: 'error de negocio' }))).toBeNull();
  });

  it('returns null when there is nothing readable', () => {
    expect(backendMessage(response(400, null))).toBeNull();
    expect(backendMessage(response(400, {}))).toBeNull();
    expect(backendMessage(response(400, 'Bad Request'))).toBeNull();
    expect(backendMessage(response(400, { password: '   ' }))).toBeNull();
    expect(backendMessage(new Error('boom'))).toBeNull();
  });
});

describe('isConnectionError', () => {
  it('detects a request that never reached the server', () => {
    expect(isConnectionError(response(0, new ProgressEvent('error')))).toBe(true);
    expect(isConnectionError(response(500, null))).toBe(false);
    expect(isConnectionError(new Error('boom'))).toBe(false);
  });
});
