import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RestauranteDetail } from './restaurante-detail';

describe('RestauranteDetail', () => {
  let component: RestauranteDetail;
  let fixture: ComponentFixture<RestauranteDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestauranteDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(RestauranteDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
