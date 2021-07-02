import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PodFeatureContextMenuComponent } from './pod-feature-context-menu.component';

describe('PodFeatureContextMenuComponent', () => {
  let component: PodFeatureContextMenuComponent;
  let fixture: ComponentFixture<PodFeatureContextMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PodFeatureContextMenuComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PodFeatureContextMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
