import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PodDocumentControllerComponent } from './pod-document-controller.component';

describe('PodDocumentControllerComponent', () => {
  let component: PodDocumentControllerComponent;
  let fixture: ComponentFixture<PodDocumentControllerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PodDocumentControllerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PodDocumentControllerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
