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
import { ComponentFixture, TestBed, async, fakeAsync, tick, inject } from '@angular/core/testing';
import { Component, Renderer, QueryList, ElementRef } from '@angular/core';
import { By } from '@angular/platform-browser';

import * as sinon from 'sinon';
import * as chai from 'chai';
import { ScrollToElementDirective } from './scroll-to-element.directive';

let should = chai.should();

@Component({
    selector: 'editorFileList',
    template: `
    <div scroll-to-element [elementId]="listItem">
      <ul>
        <li #editorFileList id="editorFileList0"><div>Item0</div></li>
        <li #editorFileList id="editorFileList1"><div>Item1</div></li>
        <li #editorFileList id="editorFileList2"><div>Item2</div></li>
      </ul>
    </div>`
})

class TestComponent {
    listItem: string = 'editorFileList1';
}

describe('ScrollToElementDirective', () => {
    let component: TestComponent;
    let fixture: ComponentFixture<TestComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [TestComponent, ScrollToElementDirective],
            providers: [Renderer]
        })
        .compileComponents();
    }));

    it('should create the directive', async(fakeAsync(() => {
        fixture = TestBed.createComponent(TestComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        tick();

        component.should.be.ok;
    })));

    describe('#retreiveSelectedItem', () => {

        it('should return an array of nativeElement.id\'s that match the selected', () => {
            let directiveEl = fixture.debugElement.query(By.directive(ScrollToElementDirective));
            let directiveInstance = directiveEl.injector.get(ScrollToElementDirective);

            let matchItem: ElementRef[] = directiveInstance.retreiveSelectedItem();
            matchItem[0].nativeElement.id.should.equal('editorFileList1');
        });

        it('should return an empty array if no matches for nativeElement.id\'s', () => {
            let directiveEl = fixture.debugElement.query(By.directive(ScrollToElementDirective));
            let directiveInstance = directiveEl.injector.get(ScrollToElementDirective);

            directiveInstance.items = new QueryList<ElementRef>();

            let emptyList = new QueryList<ElementRef>();
            let matchItem: ElementRef[] = directiveInstance.retreiveSelectedItem();
            matchItem.should.be.empty;
        });
    });

    describe('#performScrollAction', () => {

        it('should call stepVerticalScoll', async(fakeAsync(() => {
            fixture = TestBed.createComponent(TestComponent);
            component = fixture.componentInstance;
            let directiveEl = fixture.debugElement.query(By.directive(ScrollToElementDirective));
            let directiveInstance = directiveEl.injector.get(ScrollToElementDirective);
            let stepSpy = sinon.spy(directiveInstance, 'stepVerticalScoll');

            fixture.detectChanges();
            directiveInstance.performScrollAction();

            // Big fake step to ensure all setTimeout actinos completed
            tick(1000);

            // Check initial call based on test information was correct
            stepSpy.getCall(0).args[0].should.equal(0.08, 0);
        })));

        it('should not action if no items matched for selected element', () => {
            fixture = TestBed.createComponent(TestComponent);
            component = fixture.componentInstance;
            let directiveEl = fixture.debugElement.query(By.directive(ScrollToElementDirective));
            let directiveInstance = directiveEl.injector.get(ScrollToElementDirective);
            let stepSpy = sinon.spy(directiveInstance, 'stepVerticalScoll');

            directiveInstance.items = new QueryList<ElementRef>();

            directiveInstance.performScrollAction();

            // Check no call
            stepSpy.should.not.have.been.called;
        });
    });

    describe('#isOvershoot', () => {

        it('should detect positive overshoot', () => {
            let directiveEl = fixture.debugElement.query(By.directive(ScrollToElementDirective));
            let directiveInstance = directiveEl.injector.get(ScrollToElementDirective);

            directiveInstance.isOvershoot(1, 10, 1).should.be.true;
        });

        it('should detect negative overshoot', () => {
            let directiveEl = fixture.debugElement.query(By.directive(ScrollToElementDirective));
            let directiveInstance = directiveEl.injector.get(ScrollToElementDirective);

            directiveInstance.isOvershoot(-1, -10, -1).should.be.true;
        });

    });

    describe('inputs', () => {

        it('should do nothing if data not initialised', async(fakeAsync(() => {
            fixture = TestBed.createComponent(TestComponent);
            component = fixture.componentInstance;
            let directiveEl = fixture.debugElement.query(By.directive(ScrollToElementDirective));
            let directiveInstance = directiveEl.injector.get(ScrollToElementDirective);

            component.listItem = 'editorFileList2';
            let scrollMock = sinon.stub(directiveInstance, 'performScrollAction');

            fixture.detectChanges();
            tick();

            scrollMock.should.not.have.been.called;
        })));

        it('should call performScrollAction and data initialised', async(fakeAsync(() => {
            fixture = TestBed.createComponent(TestComponent);
            component = fixture.componentInstance;
            let directiveEl = fixture.debugElement.query(By.directive(ScrollToElementDirective));
            let directiveInstance = directiveEl.injector.get(ScrollToElementDirective);

            // initialise data
            directiveInstance.ngAfterContentInit();

            // set input
            component.listItem = 'editorFileList2';
            let scrollMock = sinon.stub(directiveInstance, 'performScrollAction');

            fixture.detectChanges();
            tick();

            scrollMock.should.have.been.called;
        })));

        it('should update when selecteditem changes and data initialised', async(fakeAsync(() => {
            fixture = TestBed.createComponent(TestComponent);
            component = fixture.componentInstance;
            let directiveEl = fixture.debugElement.query(By.directive(ScrollToElementDirective));
            let directiveInstance = directiveEl.injector.get(ScrollToElementDirective);

            // initialise data
            directiveInstance.ngAfterContentInit();

            component.listItem = 'editorFileList2';
            let scrollMock = sinon.stub(directiveInstance, 'performScrollAction');

            fixture.detectChanges();
            tick();

            scrollMock.should.have.been.called;
        })));
    });
});
