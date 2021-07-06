import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayersWindowLayersTabComponent } from './layers-window-layers-tab.component';

describe('LayersWindowLayersTabComponent', () => {
  let component: LayersWindowLayersTabComponent;
  let fixture: ComponentFixture<LayersWindowLayersTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LayersWindowLayersTabComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LayersWindowLayersTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
