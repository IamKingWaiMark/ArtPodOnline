import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SaveAsDialogComponent } from './save-as-dialog.component';

describe('SaveAsDialogComponent', () => {
  let component: SaveAsDialogComponent;
  let fixture: ComponentFixture<SaveAsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SaveAsDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SaveAsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
