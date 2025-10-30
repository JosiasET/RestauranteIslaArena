import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpCelebratesAmd } from './up-celebrates-amd';

describe('UpCelebratesAmd', () => {
  let component: UpCelebratesAmd;
  let fixture: ComponentFixture<UpCelebratesAmd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpCelebratesAmd]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpCelebratesAmd);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
