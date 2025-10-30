import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpCreatewaiterAmd } from './up-createwaiter-amd';

describe('UpCreatewaiterAmd', () => {
  let component: UpCreatewaiterAmd;
  let fixture: ComponentFixture<UpCreatewaiterAmd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpCreatewaiterAmd]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpCreatewaiterAmd);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
