import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CashierCheckout } from './cashier-checkout';

describe('CashierCheckout', () => {
  let component: CashierCheckout;
  let fixture: ComponentFixture<CashierCheckout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CashierCheckout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CashierCheckout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
