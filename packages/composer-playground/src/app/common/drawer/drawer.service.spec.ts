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
/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { Component, Injectable, ViewChild, OnDestroy, NgModule, getDebugNode, DebugElement } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';

import { DrawerModule, DrawerService, ActiveDrawer, DrawerRef } from './drawer.module';

import * as sinon from 'sinon';
import * as chai from 'chai';

let should = chai.should();

// tslint:disable-next-line:no-empty
const NOOP = () => {};

@Injectable()
class SpyService {
  called = false;
}

// Should this be some sort of chai matcher thing?
function isDrawerOpen(content?, selector?): boolean {
  const allDrawersContent = document.querySelector(selector || 'body').querySelectorAll('.drawer-content');
  let result;

  if (!content) {
    result = (allDrawersContent.length > 0);
  } else {
    result = allDrawersContent.length === 1 && allDrawersContent[0].textContent.trim() === content;
  }

  return result;
}

// Should this be some sort of chai matcher thing?
function isBackdropOpen(): boolean {
  return document.querySelectorAll('drawer-backdrop').length === 1;
}

describe('DrawerService', () => {

  let fixture: ComponentFixture<TestComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({imports: [DrawerTestModule]});
    fixture = TestBed.createComponent(TestComponent);
  });

  afterEach(() => {
    // detect left-over drawers and close them or report errors when can't

    const remainingDrawerWindows = document.querySelectorAll('drawer');
    if (remainingDrawerWindows.length) {
      fail(`${remainingDrawerWindows.length} drawers were left in the DOM.`);
    }

    const remainingDrawerBackdrops = document.querySelectorAll('drawer-backdrop');
    if (remainingDrawerBackdrops.length) {
      fail(`${remainingDrawerBackdrops.length} drawer backdrops were left in the DOM.`);
    }
  });

  describe('basic functionality', () => {

    it('should open and close drawer with default options', fakeAsync(() => {
      const drawerRef = fixture.componentInstance.open('foo');
      fixture.detectChanges();

      isDrawerOpen('foo').should.be.true;

      drawerRef.close('some result');
      fixture.detectChanges();
      tick();

      isDrawerOpen().should.be.false;
    }));

    it('should open and close drawer from a TemplateRef content', fakeAsync(() => {
      const drawerRef = fixture.componentInstance.openTpl();
      fixture.detectChanges();

      isDrawerOpen('Hello, World!').should.be.true;

      drawerRef.close('some result');
      fixture.detectChanges();
      tick();

      isDrawerOpen().should.be.false;
    }));

    it('should properly destroy TemplateRef content', fakeAsync(() => {
      const spyService = fixture.debugElement.injector.get(SpyService);
      const drawerRef = fixture.componentInstance.openDestroyableTpl();
      fixture.detectChanges();
      tick();

      isDrawerOpen('Some content').should.be.true;
      spyService.called.should.be.false;

      drawerRef.close('some result');
      fixture.detectChanges();
      tick();

      isDrawerOpen().should.be.false;
      spyService.called.should.be.true;
    }));

    it('should open and close drawer from a component type', fakeAsync(() => {
      const spyService = fixture.debugElement.injector.get(SpyService);
      const drawerRef = fixture.componentInstance.openCmpt(DestroyableComponent);
      fixture.detectChanges();

      isDrawerOpen('Some content').should.be.true;
      spyService.called.should.be.false;

      drawerRef.close('some result');
      fixture.detectChanges();
      tick();

      isDrawerOpen().should.be.false;
      spyService.called.should.be.true;
    }));

    it('should inject active drawer ref when component is used as content', fakeAsync(() => {
      fixture.componentInstance.openCmpt(WithActiveDrawerComponent);
      fixture.detectChanges();

      isDrawerOpen('Close').should.be.true;

      (<HTMLElement> document.querySelector('button.closeFromInside')).click();
      fixture.detectChanges();
      tick();

      isDrawerOpen().should.be.false;
    }));

    it('should expose component used as drawer content', fakeAsync(() => {
      const drawerRef = fixture.componentInstance.openCmpt(WithActiveDrawerComponent);
      fixture.detectChanges();

      isDrawerOpen('Close').should.be.true;
      (drawerRef.componentInstance instanceof WithActiveDrawerComponent).should.be.true;

      drawerRef.close();
      fixture.detectChanges();
      tick();

      isDrawerOpen().should.be.false;
    }));

    it('should open and close drawer from inside', fakeAsync(() => {
      fixture.componentInstance.openTplClose();
      fixture.detectChanges();

      isDrawerOpen().should.be.true;

      (<HTMLElement> document.querySelector('button#close')).click();
      fixture.detectChanges();
      tick();

      isDrawerOpen().should.be.false;
    }));

    it('should open and dismiss drawer from inside', fakeAsync(() => {
      fixture.componentInstance.openTplDismiss().result.catch(NOOP);
      fixture.detectChanges();

      isDrawerOpen().should.be.true;

      (<HTMLElement> document.querySelector('button#dismiss')).click();
      fixture.detectChanges();
      tick();

      isDrawerOpen().should.be.false;
    }));

    it('should resolve result promise on close', fakeAsync(() => {
      let resolvedResult;
      fixture.componentInstance.openTplClose().result.then((result) => resolvedResult = result);
      fixture.detectChanges();

      isDrawerOpen().should.be.true;

      (<HTMLElement> document.querySelector('button#close')).click();
      fixture.detectChanges();
      tick();

      isDrawerOpen().should.be.false;

      fixture.whenStable().then(() => { resolvedResult.should.equal('myResult'); });
    }));

    it('should reject result promise on dismiss', fakeAsync(() => {
      let rejectReason;
      fixture.componentInstance.openTplDismiss().result.catch((reason) => rejectReason = reason);
      fixture.detectChanges();

      isDrawerOpen().should.be.true;

      (<HTMLElement> document.querySelector('button#dismiss')).click();
      fixture.detectChanges();
      tick();

      isDrawerOpen().should.be.false;

      fixture.whenStable().then(() => { rejectReason.should.equal('myReason'); });
    }));

    it('should add / remove "drawer-open" class to body when drawer is open', fakeAsync(() => {
      const modalRef = fixture.componentInstance.open('bar');
      fixture.detectChanges();

      isDrawerOpen().should.be.true;
      document.body.classList.contains('drawer-open').should.be.true;

      modalRef.close('bar result');
      fixture.detectChanges();
      tick();

      isDrawerOpen().should.be.false;
      document.body.classList.contains('drawer-open').should.be.false;
    }));

    it('should not throw when close called multiple times', fakeAsync(() => {
      const drawerRef = fixture.componentInstance.open('foo');
      fixture.detectChanges();

      isDrawerOpen('foo').should.be.true;

      drawerRef.close('some result');
      fixture.detectChanges();
      tick();

      isDrawerOpen().should.be.false;

      drawerRef.close('some result');
      fixture.detectChanges();
      tick();

      isDrawerOpen().should.be.false;
    }));

    it('should not throw when dismiss called multiple times', fakeAsync(() => {
      const modalRef = fixture.componentInstance.open('foo');
      modalRef.result.catch(NOOP);
      fixture.detectChanges();

      isDrawerOpen('foo').should.be.true;

      modalRef.dismiss('some reason');
      fixture.detectChanges();
      tick();

      isDrawerOpen().should.be.false;

      modalRef.dismiss('some reason');
      fixture.detectChanges();
      tick();

      isDrawerOpen().should.be.false;
    }));
  });

  describe('backdrop options', () => {

    it('should have backdrop by default', fakeAsync(() => {
      const drawerRef = fixture.componentInstance.open('foo');
      fixture.detectChanges();

      isDrawerOpen('foo').should.be.true;
      isBackdropOpen().should.be.true;

      drawerRef.close('some reason');
      fixture.detectChanges();
      tick();

      isDrawerOpen().should.be.false;
      isBackdropOpen().should.be.false;
    }));

    it('should open and close drawer without backdrop', fakeAsync(() => {
      const drawerRef = fixture.componentInstance.open('foo', {backdrop: false});
      fixture.detectChanges();

      isDrawerOpen('foo').should.be.true;
      isBackdropOpen().should.be.false;

      drawerRef.close('some reason');
      fixture.detectChanges();
      tick();

      isDrawerOpen().should.be.false;
      isBackdropOpen().should.be.false;
    }));

    it('should open and close drawer without backdrop from template content', fakeAsync(() => {
      const drawerRef = fixture.componentInstance.openTpl({backdrop: false});
      fixture.detectChanges();

      isDrawerOpen('Hello, World!').should.be.true;
      isBackdropOpen().should.be.false;

      drawerRef.close('some reason');
      fixture.detectChanges();
      tick();

      isDrawerOpen().should.be.false;
      isBackdropOpen().should.be.false;
    }));

    it('should dismiss on backdrop click', fakeAsync(() => {
      fixture.componentInstance.open('foo').result.catch(NOOP);
      fixture.detectChanges();

      isDrawerOpen('foo').should.be.true;
      isBackdropOpen().should.be.true;

      (<HTMLElement> document.querySelector('drawer-backdrop')).click();
      fixture.detectChanges();
      tick();

      isDrawerOpen().should.be.false;
      isBackdropOpen().should.be.false;
    }));

    it('should not dismiss on clicks that result in detached elements', fakeAsync(() => {
      const drawerRef = fixture.componentInstance.openTplIf({});
      fixture.detectChanges();

      isDrawerOpen('Click me').should.be.true;

      (<HTMLElement> document.querySelector('button#if')).click();
      fixture.detectChanges();
      tick();

      isDrawerOpen().should.be.true;

      drawerRef.close();
      fixture.detectChanges();
      tick();

      isDrawerOpen().should.be.false;
    }));
  });

  describe('container options', () => {

    it('should attach window and backdrop elements to the specified container', fakeAsync(() => {
      const drawerRef = fixture.componentInstance.open('foo', {container: '#testContainer'});
      fixture.detectChanges();

      isDrawerOpen('foo', '#testContainer').should.be.true;

      drawerRef.close();
      fixture.detectChanges();
      tick();

      isDrawerOpen().should.be.false;
    }));

    it('should throw when the specified container element doesnt exist', () => {
      const brokenSelector = '#notInTheDOM';

      (() => {
        fixture.componentInstance.open('foo', {container: brokenSelector});
      }).should.throw(`The specified drawer container "${brokenSelector}" was not found in the DOM.`);
    });
  });

  describe('keyboard options', () => {

    it('should dismiss modals on ESC by default', fakeAsync(() => {
      fixture.componentInstance.open('foo').result.catch(NOOP);
      fixture.detectChanges();

      isDrawerOpen('foo').should.be.true;

      (<DebugElement> getDebugNode(document.querySelector('drawer'))).triggerEventHandler('keyup.esc', {});
      fixture.detectChanges();
      tick();

      isDrawerOpen().should.be.false;
    }));

    it('should not dismiss modals on ESC when keyboard option is false', fakeAsync(() => {
      const drawerRef = fixture.componentInstance.open('foo', {keyboard: false});
      fixture.detectChanges();

      isDrawerOpen('foo').should.be.true;

      (<DebugElement> getDebugNode(document.querySelector('drawer'))).triggerEventHandler('keyup.esc', {});
      fixture.detectChanges();
      tick();

      isDrawerOpen('foo').should.be.true;

      drawerRef.close();
      fixture.detectChanges();
      tick();

      isDrawerOpen().should.be.false;
    }));

    it('should not dismiss modals on ESC when default is prevented', fakeAsync(() => {
      const drawerRef = fixture.componentInstance.open('foo', {keyboard: true});
      fixture.detectChanges();

      isDrawerOpen('foo').should.be.true;

      (<DebugElement> getDebugNode(document.querySelector('drawer'))).triggerEventHandler('keyup.esc', {
        defaultPrevented: true
      });
      fixture.detectChanges();
      tick();

      isDrawerOpen('foo').should.be.true;

      drawerRef.close();
      fixture.detectChanges();
      tick();

      isDrawerOpen().should.be.false;
    }));
  });

  describe('custom class options', () => {

    it('should render modals with the correct custom classes', fakeAsync(() => {
      const drawerRef = fixture.componentInstance.open('foo', {drawerClass: 'bar'});
      fixture.detectChanges();

      isDrawerOpen('foo').should.be.true;
      document.querySelector('drawer').classList.contains('bar').should.be.true;

      drawerRef.close();
      fixture.detectChanges();
      tick();
    }));

  });

  describe('focus management', () => {

    it('should focus drawer and return focus to previously focused element', fakeAsync(() => {
      fixture.detectChanges();
      const openButtonEl = fixture.nativeElement.querySelector('button#open');

      openButtonEl.focus();
      openButtonEl.click();
      fixture.detectChanges();

      isDrawerOpen('from button').should.be.true;
      document.activeElement.should.equal(document.querySelector('drawer'));

      fixture.componentInstance.close();
      tick();

      isDrawerOpen().should.be.false;
      document.activeElement.should.equal(openButtonEl);
    }));

    it('should return focus to body if no element focused prior to drawer opening', fakeAsync(() => {
      const drawerRef = fixture.componentInstance.open('foo');
      fixture.detectChanges();

      isDrawerOpen('foo').should.be.true;
      document.activeElement.should.equal(document.querySelector('drawer'));

      drawerRef.close('ok!');
      fixture.detectChanges();
      tick();

      isDrawerOpen().should.be.false;
      document.activeElement.should.equal(document.body);
    }));
  });

  describe('window element ordering', () => {
    it('should place newer windows on top of older ones', fakeAsync(() => {
      const drawerRef1 = fixture.componentInstance.open('foo', {drawerClass: 'drawer-1'});
      fixture.detectChanges();

      const drawerRef2 = fixture.componentInstance.open('bar', {drawerClass: 'drawer-2'});
      fixture.detectChanges();

      let drawers = document.querySelectorAll('drawer');
      drawers.length.should.equal(2);
      drawers[0].classList.contains('drawer-1').should.be.true;
      drawers[1].classList.contains('drawer-2').should.be.true;

      drawerRef1.close();
      drawerRef2.close();
      fixture.detectChanges();
      tick();
    }));
  });
});

@Component({selector: 'destroyable-cmpt', template: 'Some content'})
export class DestroyableComponent implements OnDestroy {
  constructor(private _spyService: SpyService) {}

  ngOnDestroy(): void { this._spyService.called = true; }
}

@Component(
    {selector: 'drawer-content-cmpt', template: '<button class="closeFromInside" (click)="close()">Close</button>'})
export class WithActiveDrawerComponent {
  constructor(public activeModal: ActiveDrawer) {}

  close() { this.activeModal.close('from inside'); }
}

@Component({
  selector: 'test-cmpt',
  template: `
    <div id="testContainer"></div>
    <ng-template #content>Hello, {{name}}!</ng-template>
    <ng-template #destroyableContent><destroyable-cmpt></destroyable-cmpt></ng-template>
    <ng-template #contentWithClose let-close="close">
      <button id="close" (click)="close('myResult')">Close me</button>
    </ng-template>
    <ng-template #contentWithDismiss let-dismiss="dismiss">
      <button id="dismiss" (click)="dismiss('myReason')">Dismiss me</button>
    </ng-template>
    <ng-template #contentWithIf>
      <ng-template [ngIf]="show">
        <button id="if" (click)="show = false">Click me</button>
      </ng-template>
    </ng-template>
    <button id="open" (click)="open('from button')">Open</button>
  `
})
class TestComponent {
  name = 'World';
  openedModal: DrawerRef;
  show = true;
  @ViewChild('content') tplContent;
  @ViewChild('destroyableContent') tplDestroyableContent;
  @ViewChild('contentWithClose') tplContentWithClose;
  @ViewChild('contentWithDismiss') tplContentWithDismiss;
  @ViewChild('contentWithIf') tplContentWithIf;

  constructor(private drawerService: DrawerService) {}

  open(content: string, options?: Object) {
    this.openedModal = this.drawerService.open(content, options);
    return this.openedModal;
  }
  close() {
    if (this.openedModal) {
      this.openedModal.close('ok');
    }
  }
  openTpl(options?: Object) { return this.drawerService.open(this.tplContent, options); }
  openCmpt(cmptType: any, options?: Object) { return this.drawerService.open(cmptType, options); }
  openDestroyableTpl(options?: Object) { return this.drawerService.open(this.tplDestroyableContent, options); }
  openTplClose(options?: Object) { return this.drawerService.open(this.tplContentWithClose, options); }
  openTplDismiss(options?: Object) { return this.drawerService.open(this.tplContentWithDismiss, options); }
  openTplIf(options?: Object) { return this.drawerService.open(this.tplContentWithIf, options); }
}

@NgModule({
  declarations: [TestComponent, DestroyableComponent, WithActiveDrawerComponent],
  exports: [TestComponent, DestroyableComponent],
  imports: [CommonModule, DrawerModule.forRoot(), NoopAnimationsModule],
  entryComponents: [DestroyableComponent, WithActiveDrawerComponent],
  providers: [SpyService]
})
class DrawerTestModule {
}
