/* tslint:disable:no-unused-variable */
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {DebugElement} from '@angular/core';

import {WelcomeComponent} from './welcome.component';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap'

describe('WelcomeComponent', () => {
  let component: WelcomeComponent;
  let fixture: ComponentFixture<WelcomeComponent>;

  let ngbActiveModalMock = {
    close: () => {
    },
    dismiss: () => {
    }
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [WelcomeComponent],
      providers: [{provide: NgbActiveModal, useValue: ngbActiveModalMock}]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WelcomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
