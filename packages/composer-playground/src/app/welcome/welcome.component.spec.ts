/* tslint:disable:no-unused-variable */
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {DebugElement} from '@angular/core';

import {WelcomeComponent} from './welcome.component';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap'

describe('WelcomeComponent', () => {
  let component: WelcomeComponent;
  let fixture: ComponentFixture<WelcomeComponent>;
  let debug: DebugElement;
  let element: HTMLElement;

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
    debug = fixture.debugElement.query(By.css('h1'));
    element = debug.nativeElement;
    fixture.detectChanges();
  });

  it('should create component', () => {
    component.should.be.ok;
  });

  it('should have correct title', () => {
    element.textContent.should.contain('Welcome to Fabric Composer Playground!');
  });

});
