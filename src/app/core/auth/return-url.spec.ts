import { safeReturnUrl } from './return-url';

describe('safeReturnUrl', () => {
  it('keeps in-app paths with their query string', () => {
    expect(safeReturnUrl('/mis-reservas')).toBe('/mis-reservas');
    expect(safeReturnUrl('/admin/resenas?page=2')).toBe('/admin/resenas?page=2');
  });

  it('rejects anything that could leave the app', () => {
    expect(safeReturnUrl('https://evil.com')).toBeNull();
    expect(safeReturnUrl('//evil.com')).toBeNull();
    expect(safeReturnUrl('/\\evil.com')).toBeNull();
    expect(safeReturnUrl('javascript:alert(1)')).toBeNull();
    expect(safeReturnUrl('mis-reservas')).toBeNull();
  });

  it('ignores missing values and the app root', () => {
    expect(safeReturnUrl(undefined)).toBeNull();
    expect(safeReturnUrl(null)).toBeNull();
    expect(safeReturnUrl('')).toBeNull();
    expect(safeReturnUrl('/')).toBeNull();
  });
});
