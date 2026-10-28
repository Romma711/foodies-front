import { TestBed } from '@angular/core/testing';
import { StrikeModal } from './strike-modal';

describe('StrikeModal', () => {
  function crear(strikes = 0) {
    const fixture = TestBed.createComponent(StrikeModal);
    fixture.componentRef.setInput('nombre', 'Ana Gómez');
    fixture.componentRef.setInput('strikesActuales', strikes);
    const enviados: string[] = [];
    let cancelaciones = 0;
    fixture.componentInstance.enviar.subscribe((motivo) => enviados.push(motivo));
    fixture.componentInstance.cancelar.subscribe(() => cancelaciones++);
    fixture.detectChanges();
    fixture.componentInstance.abrir();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    return { fixture, host, enviados, cancelaciones: () => cancelaciones };
  }

  function escribir(host: HTMLElement, texto: string) {
    const area = host.querySelector<HTMLTextAreaElement>('textarea')!;
    area.value = texto;
    area.dispatchEvent(new Event('input'));
  }

  function boton(host: HTMLElement, texto: string): HTMLButtonElement {
    return Array.from(host.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === texto,
    )!;
  }

  it('se abre como diálogo con el nombre y el strike que se va a aplicar', () => {
    const { host } = crear(1);

    const dialogo = host.querySelector('dialog');
    expect(dialogo?.hasAttribute('open')).toBe(true);
    expect(dialogo?.getAttribute('aria-labelledby')).toBeTruthy();
    expect(host.querySelector('h2')?.textContent).toContain('Aplicar strike a Ana Gómez');
    expect(host.textContent).toContain('Va a ser el strike 2 de 3');
    expect(host.textContent).toContain('Le vamos a enviar un email de aviso con el motivo.');
  });

  it('avisa cuando el strike alcanza el límite', () => {
    const { host } = crear(2);

    expect(host.querySelector('[data-testid="aviso-limite"]')?.textContent).toContain(
      'Con este strike llega al límite',
    );
  });

  it('envía el motivo sin espacios sobrantes', () => {
    const { fixture, host, enviados } = crear();

    escribir(host, '  Lenguaje ofensivo en una reseña  ');
    fixture.detectChanges();
    boton(host, 'Aplicar strike').click();
    fixture.detectChanges();

    expect(enviados).toEqual(['Lenguaje ofensivo en una reseña']);
  });

  it('no envía un motivo de menos de 5 caracteres y explica por qué', () => {
    const { fixture, host, enviados } = crear();

    escribir(host, 'mal');
    fixture.detectChanges();
    boton(host, 'Aplicar strike').click();
    fixture.detectChanges();

    expect(enviados).toEqual([]);
    const area = host.querySelector('textarea')!;
    expect(area.getAttribute('aria-invalid')).toBe('true');
    const error = host.querySelector(`#${area.getAttribute('aria-describedby')?.split(' ')[0]}`);
    expect(error?.textContent?.trim()).toBe('El motivo debe tener al menos 5 caracteres.');
  });

  it('limita el motivo a 255 caracteres y muestra el contador', () => {
    const { fixture, host } = crear();

    escribir(host, 'Spam');
    fixture.detectChanges();

    expect(host.querySelector('textarea')?.getAttribute('maxlength')).toBe('255');
    expect(host.querySelector('[data-testid="contador"]')?.textContent?.trim()).toBe('4/255');
  });

  it('cancelar cierra el diálogo y avisa al padre', () => {
    const { fixture, host, cancelaciones } = crear();

    boton(host, 'Cancelar').click();
    fixture.detectChanges();

    expect(host.querySelector('dialog')?.hasAttribute('open')).toBe(false);
    expect(cancelaciones()).toBe(1);
  });

  it('mientras se envía deshabilita los botones y muestra el progreso', () => {
    const { fixture, host } = crear();

    fixture.componentRef.setInput('enviando', true);
    fixture.detectChanges();

    expect(boton(host, 'Aplicando…').disabled).toBe(true);
    expect(boton(host, 'Cancelar').disabled).toBe(true);
  });

  it('muestra el error que le pasa el padre', () => {
    const { fixture, host } = crear();

    fixture.componentRef.setInput('error', 'No se puede sancionar a un administrador');
    fixture.detectChanges();

    expect(host.querySelector('[role="alert"]')?.textContent?.trim()).toBe(
      'No se puede sancionar a un administrador',
    );
  });

  it('al volver a abrirse empieza con el motivo vacío', () => {
    const { fixture, host } = crear();
    escribir(host, 'Motivo anterior');
    fixture.detectChanges();

    fixture.componentInstance.cerrar();
    fixture.componentInstance.abrir();
    fixture.detectChanges();

    expect(host.querySelector('textarea')?.value).toBe('');
  });
});
