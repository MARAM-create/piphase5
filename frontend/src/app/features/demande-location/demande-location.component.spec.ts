import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DemandeLocationComponent } from './demande-location.component';

describe('DemandeLocationComponent', () => {
  let component: DemandeLocationComponent;
  let fixture: ComponentFixture<DemandeLocationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DemandeLocationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DemandeLocationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
