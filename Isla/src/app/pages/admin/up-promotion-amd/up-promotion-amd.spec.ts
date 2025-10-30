import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpPromotionAmd } from './up-promotion-amd';

describe('UpPromotionAmd', () => {
  let component: UpPromotionAmd;
  let fixture: ComponentFixture<UpPromotionAmd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpPromotionAmd]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpPromotionAmd);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
