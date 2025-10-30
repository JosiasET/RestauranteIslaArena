import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Drink } from './drink';

describe('Drink', () => {
  let component: Drink;
  let fixture: ComponentFixture<Drink>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Drink]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Drink);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
