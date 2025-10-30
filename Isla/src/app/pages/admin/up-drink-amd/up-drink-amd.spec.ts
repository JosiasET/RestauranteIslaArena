import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpDrinkAmd } from './up-drink-amd';

describe('UpDrinkAmd', () => {
  let component: UpDrinkAmd;
  let fixture: ComponentFixture<UpDrinkAmd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpDrinkAmd]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpDrinkAmd);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
