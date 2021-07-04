import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PodDocumentComponent } from './pod-document.component';

describe('PodDocumentComponent', () => {
  let component: PodDocumentComponent;
  let fixture: ComponentFixture<PodDocumentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PodDocumentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PodDocumentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
