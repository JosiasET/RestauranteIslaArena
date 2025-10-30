import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Fishes } from './fishes';

describe('Fishes', () => {
  let component: Fishes;
  let fixture: ComponentFixture<Fishes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Fishes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Fishes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
