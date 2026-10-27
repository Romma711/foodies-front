import { TestBed } from '@angular/core/testing';
import { ConfirmDialog } from './confirm-dialog';

describe('ConfirmDialog', () => {
  const render = async () => {
    const fixture = TestBed.createComponent(ConfirmDialog);
    await fixture.whenStable();
    return fixture;
  };

  const button = (element: HTMLElement, text: string) =>
    [...element.querySelectorAll('button')].find((b) => b.textContent?.trim() === text)!;

  it('resolves true when the action is confirmed and shows the given texts', async () => {
    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;

    const result = fixture.componentInstance.open({
      heading: 'Delete your menu?',
      message: 'Customers will not see it.',
      confirmLabel: 'Delete menu',
      tone: 'danger',
    });
    await fixture.whenStable();

    expect(element.querySelector('h2')?.textContent).toBe('Delete your menu?');
    expect(element.querySelector('dialog')?.hasAttribute('open')).toBe(true);
    expect(button(element, 'Delete menu').classList).toContain('btn-danger');
    button(element, 'Delete menu').click();
    await expect(result).resolves.toBe(true);
    expect(element.querySelector('dialog')?.hasAttribute('open')).toBe(false);
  });

  it('resolves false when going back', async () => {
    const fixture = await render();
    const element = fixture.nativeElement as HTMLElement;

    const result = fixture.componentInstance.open({
      heading: 'Accept?',
      message: '',
      confirmLabel: 'Accept',
    });
    await fixture.whenStable();
    button(element, 'Go back').click();

    await expect(result).resolves.toBe(false);
  });
});
