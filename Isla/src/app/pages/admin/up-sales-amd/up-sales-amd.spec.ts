import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpSalesAmd } from './up-sales-amd';

describe('UpSalesAmd', () => {
  let component: UpSalesAmd;
  let fixture: ComponentFixture<UpSalesAmd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpSalesAmd]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpSalesAmd);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
