import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpFoodAmd } from './up-food-amd';

describe('UpFoodAmd', () => {
  let component: UpFoodAmd;
  let fixture: ComponentFixture<UpFoodAmd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpFoodAmd]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpFoodAmd);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
