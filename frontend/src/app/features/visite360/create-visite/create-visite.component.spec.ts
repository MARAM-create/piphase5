import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateVisiteComponent } from './create-visite.component';

describe('CreateVisiteComponent', () => {
  let component: CreateVisiteComponent;
  let fixture: ComponentFixture<CreateVisiteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateVisiteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateVisiteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
