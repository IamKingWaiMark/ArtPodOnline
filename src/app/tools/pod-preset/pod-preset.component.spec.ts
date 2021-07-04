import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PodPresetComponent } from './pod-preset.component';

describe('PodPresetComponent', () => {
  let component: PodPresetComponent;
  let fixture: ComponentFixture<PodPresetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PodPresetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PodPresetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
