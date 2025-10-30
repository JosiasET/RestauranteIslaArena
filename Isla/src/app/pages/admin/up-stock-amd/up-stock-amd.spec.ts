import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpStockAmd } from './up-stock-amd';

describe('UpStockAmd', () => {
  let component: UpStockAmd;
  let fixture: ComponentFixture<UpStockAmd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpStockAmd]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpStockAmd);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
