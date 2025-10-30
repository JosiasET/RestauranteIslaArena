import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeguimientoPedidos } from './seguimiento-pedidos';

describe('SeguimientoPedidos', () => {
  let component: SeguimientoPedidos;
  let fixture: ComponentFixture<SeguimientoPedidos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeguimientoPedidos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeguimientoPedidos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
