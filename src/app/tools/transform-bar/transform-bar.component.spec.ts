import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransformBarComponent } from './transform-bar.component';

describe('TransformBarComponent', () => {
  let component: TransformBarComponent;
  let fixture: ComponentFixture<TransformBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TransformBarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TransformBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
