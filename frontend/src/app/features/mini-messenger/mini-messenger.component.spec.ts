import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiniMessengerComponent } from './mini-messenger.component';

describe('MiniMessengerComponent', () => {
  let component: MiniMessengerComponent;
  let fixture: ComponentFixture<MiniMessengerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MiniMessengerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MiniMessengerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
