import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpResumeAmd } from './up-resume-amd';

describe('UpResumeAmd', () => {
  let component: UpResumeAmd;
  let fixture: ComponentFixture<UpResumeAmd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpResumeAmd]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpResumeAmd);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
