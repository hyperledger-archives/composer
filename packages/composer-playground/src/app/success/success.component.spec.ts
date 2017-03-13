/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { SuccessComponent } from './success.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

describe('SuccessComponent', () => {
  let component: SuccessComponent;
  let fixture: ComponentFixture<SuccessComponent>;

  beforeEach(() => {
      TestBed.configureTestingModule({
          declarations: [ SuccessComponent ],
          providers: [ NgbActiveModal ]
      });
      fixture = TestBed.createComponent(SuccessComponent);
      component = fixture.componentInstance;
  });

  it('should create', () => {
    component.should.be.ok;
  });
});
