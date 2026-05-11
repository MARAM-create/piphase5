import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VisiteEnLigneComponent } from './visite-en-ligne.component';

describe('VisiteEnLigneComponent', () => {
  let component: VisiteEnLigneComponent;
  let fixture: ComponentFixture<VisiteEnLigneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VisiteEnLigneComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VisiteEnLigneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
