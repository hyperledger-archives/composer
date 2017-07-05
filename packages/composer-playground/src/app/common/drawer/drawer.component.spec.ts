/* tslint:disable:no-unused-expression */

import { ElementRef } from '@angular/core';
import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { DrawerComponent } from './drawer.component';
import { DrawerDismissReasons } from './drawer-dismiss-reasons';

import * as sinon from 'sinon';
import * as chai from 'chai';

let should = chai.should();

describe('DrawerBackdropComponent', () => {
  let fixture: ComponentFixture<DrawerComponent>;
  let component: DrawerComponent;
  let mockElementRef: ElementRef;

  beforeEach(() => {
    mockElementRef = sinon.createStubInstance(ElementRef);
    mockElementRef.nativeElement = {
      contains: sinon.stub(),
      focus: {
        apply: sinon.spy()
      }
    };

    TestBed.configureTestingModule({
      declarations: [DrawerComponent],
      imports: [NoopAnimationsModule],
      providers: [{provide: ElementRef, useValue: mockElementRef}]
    });

    fixture = TestBed.createComponent(DrawerComponent);
    component = fixture.componentInstance;
  });

  it('should render drawer with required CSS classes', () => {
    fixture.detectChanges();

    fixture.nativeElement.classList.contains('drawer').should.be.true;
  });

  it('should render drawer with a specified class', () => {
    component.drawerClass = 'custom-class';
    fixture.detectChanges();

    fixture.nativeElement.classList.contains('custom-class').should.be.true;
  });

  it('should produce a dismiss event on esc press by default', (done) => {
      fixture.detectChanges();

      component.dismissEvent.subscribe(($event) => {
        try {
          $event.should.equal(DrawerDismissReasons.ESC);
        } catch (e) {
          done.fail(e);
        }
        done();
      });

      fixture.debugElement.triggerEventHandler('keyup.esc', {});
  });

  it('should optionally ignore esc press', (done) => {
    component.keyboard = false;
    fixture.detectChanges();

    component.dismissEvent.subscribe(($event) => {
      done.fail(new Error('Should not trigger dismiss event'));
    });

    fixture.debugElement.triggerEventHandler('keyup.esc', {});

    setTimeout(done, 200);
  });

  it('should produce a closed event when closed', (done) => {
    fixture.detectChanges();

    component.closedEvent.subscribe(($event) => {
      done();
    });

    fixture.debugElement.triggerEventHandler('@slideOpenClosed.done', { toState: 'closed' });
  });

  describe('#ngOnInit', () => {
    it('should render drawer and add required class to document body', () => {
      fixture.detectChanges();

      document.body.classList.contains('drawer-open').should.be.true;
    });
  });
});
