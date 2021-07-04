import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PodAppToolsComponent } from './pod-app-tools.component';

describe('PodAppToolsComponent', () => {
  let component: PodAppToolsComponent;
  let fixture: ComponentFixture<PodAppToolsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PodAppToolsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PodAppToolsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
