import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewPodWindowComponent } from './new-pod-window.component';

describe('NewPodWindowComponent', () => {
  let component: NewPodWindowComponent;
  let fixture: ComponentFixture<NewPodWindowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewPodWindowComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewPodWindowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
