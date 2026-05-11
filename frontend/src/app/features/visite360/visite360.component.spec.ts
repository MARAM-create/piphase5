import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Visite360Component } from './visite360.component';

describe('Visite360Component', () => {
  let component: Visite360Component;
  let fixture: ComponentFixture<Visite360Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Visite360Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Visite360Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
