import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { EnvironmentProviders, Provider } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { authInterceptor } from '../../../core/auth/auth.interceptor';
import { fakeJwt, futureExp } from '../../../core/auth/testing';
import { toIsoDate } from './panel-errors';
import { MiRestaurante, ReservaPanel } from './panel.models';

export const RESTAURANTE_TOKEN = fakeJwt({ roles: ['ROLE_ENCARGADO'], exp: futureExp() });

/** Signs in a restaurant manager and wires HTTP through the real auth interceptor. */
export function providePanelTesting(): (Provider | EnvironmentProviders)[] {
  localStorage.clear();
  localStorage.setItem('foodies.token.RESTAURANTE', RESTAURANTE_TOKEN);
  return [
    provideRouter([]),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideHttpClientTesting(),
  ];
}

export function daysFromToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export function miRestaurante(overrides: Partial<MiRestaurante> = {}): MiRestaurante {
  return {
    id: 7,
    nombre: 'La Parrilla',
    cupoMaximo: 40,
    ubicacion: 'Calle 1',
    especialidad: 'PARRILLA',
    carta: null,
    ...overrides,
  };
}

export function reserva(overrides: Partial<ReservaPanel> = {}): ReservaPanel {
  return {
    id: 1,
    cantidad: 2,
    fecha: daysFromToday(1),
    horarioLlegada: '20:00:00',
    estado: 'PENDIENTE',
    nombreCliente: 'Ana Pérez',
    telefonoCliente: '2235550000',
    ...overrides,
  };
}

/** Lets pending promises (firstValueFrom, async handlers) settle, then renders. */
export async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve));
  await fixture.whenStable();
}
