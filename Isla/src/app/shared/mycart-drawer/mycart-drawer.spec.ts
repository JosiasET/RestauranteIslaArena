import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MycartDrawer } from './mycart-drawer';

describe('MycartDrawer', () => {
  let component: MycartDrawer;
  let fixture: ComponentFixture<MycartDrawer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MycartDrawer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MycartDrawer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
