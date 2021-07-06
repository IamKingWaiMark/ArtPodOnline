import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayersWindowComponent } from './layers-window.component';

describe('LayersWindowComponent', () => {
  let component: LayersWindowComponent;
  let fixture: ComponentFixture<LayersWindowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LayersWindowComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LayersWindowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
