import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RestauranteHome } from './restaurante-home';

describe('RestauranteHome', () => {
  let component: RestauranteHome;
  let fixture: ComponentFixture<RestauranteHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestauranteHome],
    }).compileComponents();

    fixture = TestBed.createComponent(RestauranteHome);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
