import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthService } from '../../../core/auth/auth.service';
import { AdminLayout } from './admin-layout';

@Component({ template: '<p data-testid="contenido">Contenido</p>' })
class PaginaFalsa {}

describe('AdminLayout', () => {
  let logout: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    logout = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: 'admin',
            component: AdminLayout,
            children: [
              { path: '', component: PaginaFalsa },
              { path: 'aceptar', component: PaginaFalsa },
              { path: 'moderacion', component: PaginaFalsa },
            ],
          },
          { path: 'admin/login', component: PaginaFalsa },
        ]),
        { provide: AuthService, useValue: { logout, subject: () => 'admin@foodies.com' } },
      ],
    });
  });

  async function abrir(url = '/admin') {
    const harness = await RouterTestingHarness.create(url);
    return { harness, elemento: harness.routeNativeElement as HTMLElement };
  }

  function enlaces(elemento: HTMLElement) {
    return Array.from(
      elemento.querySelectorAll('nav[aria-label="Panel de administración"] a'),
    ) as HTMLAnchorElement[];
  }

  it('debería mostrar la navegación del panel y el contenido de la ruta hija', async () => {
    const { elemento } = await abrir();

    expect(enlaces(elemento).map((enlace) => enlace.textContent?.trim())).toEqual([
      'Dashboard',
      'Aceptar',
      'Moderación',
      'Entidades',
    ]);
    expect(enlaces(elemento).map((enlace) => enlace.getAttribute('href'))).toEqual([
      '/admin',
      '/admin/aceptar',
      '/admin/moderacion',
      '/admin/entidades',
    ]);
    expect(elemento.querySelector('[data-testid="contenido"]')).not.toBeNull();
  });

  it('debería marcar como actual solo la sección activa', async () => {
    const { elemento } = await abrir('/admin/moderacion');
    const [dashboard, , moderacion] = enlaces(elemento);

    expect(dashboard.getAttribute('aria-current')).toBeNull();
    expect(moderacion.getAttribute('aria-current')).toBe('page');
  });

  it('debería abrir y cerrar el menú en mobile', async () => {
    const { harness, elemento } = await abrir();
    const boton = elemento.querySelector(
      'button[aria-controls="admin-sidebar"]',
    ) as HTMLButtonElement;

    expect(boton.getAttribute('aria-expanded')).toBe('false');
    boton.click();
    harness.detectChanges();
    expect(boton.getAttribute('aria-expanded')).toBe('true');
  });

  it('debería mostrar el email del admin al pie de la barra', async () => {
    const { elemento } = await abrir();

    expect(elemento.querySelector('aside [aria-controls="cuenta-menu"]')?.textContent).toContain(
      'admin@foodies.com',
    );
  });

  it('debería cerrar la sesión de admin desde el popup y volver al login', async () => {
    const { harness, elemento } = await abrir();

    (elemento.querySelector('[aria-controls="cuenta-menu"]') as HTMLButtonElement).click();
    await harness.fixture.whenStable();
    const salir = elemento.querySelector('#cuenta-menu button') as HTMLButtonElement;
    expect(salir.textContent?.trim()).toBe('Cerrar sesión');
    salir.click();
    await harness.fixture.whenStable();

    expect(logout).toHaveBeenCalledWith('ADMIN');
    expect(TestBed.inject(Router).url).toBe('/admin/login');
  });
});
