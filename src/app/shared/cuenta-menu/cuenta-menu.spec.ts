import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { violacionesAxe } from '../testing/axe';
import { CuentaMenu } from './cuenta-menu';

@Component({
  imports: [CuentaMenu],
  template: `
    <p data-testid="afuera">Afuera</p>
    <app-cuenta-menu [nombre]="nombre()" (cerrarSesion)="salidas = salidas + 1" />
  `,
})
class Anfitrion {
  readonly nombre = signal('La Parrilla');
  salidas = 0;
}

describe('CuentaMenu', () => {
  let fixture: ComponentFixture<Anfitrion>;
  let element: HTMLElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Anfitrion);
    element = fixture.nativeElement as HTMLElement;
    await fixture.whenStable();
  });

  const cuentaBoton = () =>
    element.querySelector<HTMLButtonElement>('[aria-controls="cuenta-menu"]')!;
  const menu = () => element.querySelector<HTMLElement>('#cuenta-menu')!;
  const salir = () => menu().querySelector('button')!;

  async function abrir(): Promise<void> {
    cuentaBoton().click();
    await fixture.whenStable();
  }

  it('shows the account name and its initial with the popup closed', () => {
    expect(cuentaBoton().textContent).toContain('La Parrilla');
    expect(cuentaBoton().textContent).toContain('L');
    expect(cuentaBoton().getAttribute('aria-expanded')).toBe('false');
    expect(menu().hidden).toBe(true);
  });

  it('opens the popup with the logout option and focuses it', async () => {
    await abrir();

    expect(cuentaBoton().getAttribute('aria-expanded')).toBe('true');
    expect(menu().hidden).toBe(false);
    expect(salir().textContent).toContain('Cerrar sesión');
    expect(document.activeElement).toBe(salir());
  });

  it('closes the popup with Escape and returns focus to the name', async () => {
    await abrir();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();

    expect(menu().hidden).toBe(true);
    expect(document.activeElement).toBe(cuentaBoton());
  });

  it('closes the popup when clicking outside of it', async () => {
    await abrir();

    element.querySelector<HTMLElement>('[data-testid="afuera"]')!.click();
    await fixture.whenStable();

    expect(menu().hidden).toBe(true);
  });

  it('emits cerrarSesion from the popup', async () => {
    await abrir();

    salir().click();

    expect(fixture.componentInstance.salidas).toBe(1);
  });

  it('passes axe with the popup closed and open', async () => {
    expect(await violacionesAxe(element)).toEqual([]);

    await abrir();
    expect(await violacionesAxe(element)).toEqual([]);
  });
});
