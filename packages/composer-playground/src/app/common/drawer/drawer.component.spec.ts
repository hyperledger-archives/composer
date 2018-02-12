/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
