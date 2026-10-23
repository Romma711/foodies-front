import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RestauranteList } from './restaurante-list';

describe('RestauranteList', () => {
  let component: RestauranteList;
  let fixture: ComponentFixture<RestauranteList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestauranteList],
    }).compileComponents();

    fixture = TestBed.createComponent(RestauranteList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
