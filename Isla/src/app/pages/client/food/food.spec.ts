import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Food } from './food';

describe('Food', () => {
  let component: Food;
  let fixture: ComponentFixture<Food>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Food]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Food);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
