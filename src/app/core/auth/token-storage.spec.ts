import { TestBed } from '@angular/core/testing';
import { TokenStorage } from './token-storage';

describe('TokenStorage', () => {
  let storage: TokenStorage;

  beforeEach(() => {
    localStorage.clear();
    storage = TestBed.inject(TokenStorage);
  });

  it('stores each role under its own key', () => {
    storage.set('CLIENTE', 'client-token');
    storage.set('ADMIN', 'admin-token');

    expect(localStorage.getItem('foodies.token.CLIENTE')).toBe('client-token');
    expect(localStorage.getItem('foodies.token.ADMIN')).toBe('admin-token');
    expect(storage.readAll()).toEqual({ CLIENTE: 'client-token', ADMIN: 'admin-token' });
  });

  it('clearing one role keeps the others', () => {
    storage.set('CLIENTE', 'client-token');
    storage.set('RESTAURANTE', 'restaurant-token');

    storage.clear('CLIENTE');

    expect(storage.get('CLIENTE')).toBeNull();
    expect(storage.get('RESTAURANTE')).toBe('restaurant-token');
  });
});
