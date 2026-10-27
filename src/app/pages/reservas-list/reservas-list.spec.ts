import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { ReservasList } from './reservas-list';

describe('ReservasList', () => {
  let component: ReservasList;
  let fixture: ComponentFixture<ReservasList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservasList],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ReservasList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debería mostrar un error si no hay sesión activa', () => {
    expect(component.error()).toContain('identificar');
  });
});
