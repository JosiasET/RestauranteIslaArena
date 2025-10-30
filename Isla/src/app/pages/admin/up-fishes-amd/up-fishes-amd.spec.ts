import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpFishesAmd } from './up-fishes-amd';

describe('UpFishesAmd', () => {
  let component: UpFishesAmd;
  let fixture: ComponentFixture<UpFishesAmd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpFishesAmd]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpFishesAmd);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
