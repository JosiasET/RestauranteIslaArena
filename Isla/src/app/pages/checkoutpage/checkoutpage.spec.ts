import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Checkoutpage } from './checkoutpage';

describe('Checkoutpage', () => {
  let component: Checkoutpage;
  let fixture: ComponentFixture<Checkoutpage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Checkoutpage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Checkoutpage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
