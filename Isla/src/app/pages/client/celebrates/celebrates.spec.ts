import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Celebrates } from './celebrates';

describe('Celebrates', () => {
  let component: Celebrates;
  let fixture: ComponentFixture<Celebrates>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Celebrates]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Celebrates);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
