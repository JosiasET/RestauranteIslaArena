import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GestorUsuario } from './gestor-usuario';

describe('GestorUsuario', () => {
  let component: GestorUsuario;
  let fixture: ComponentFixture<GestorUsuario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestorUsuario]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GestorUsuario);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
