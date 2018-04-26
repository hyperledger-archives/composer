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
import { Component, Renderer, } from '@angular/core';
import { By } from '@angular/platform-browser';

import * as sinon from 'sinon';
import * as chai from 'chai';
import { CheckOverFlowDirective } from './check-overflow.directive';

let should = chai.should();

@Component({
    selector: 'test',
    template: `
        <div checkOverFlow [changed]="changed"
             [expanded]="expanded" (hasOverFlow)=hasOverFlow($event)>
            <pre #resourcedata>bob</pre>
        </div>`
})

class TestComponent {

    changed: boolean = false;
    expanded: boolean = false;

    overflow: boolean = false;

    hasOverFlow(overflow: boolean) {
        this.overflow = overflow;
    }

}

describe('CheckOverFlowDirective', () => {

    let component: TestComponent;
    let fixture: ComponentFixture<TestComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [TestComponent, CheckOverFlowDirective],
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

    describe('checkOverFlow', () => {
        it('should set max height to be 100px when not expanded', async(fakeAsync(() => {
            fixture = TestBed.createComponent(TestComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();

            tick();

            let de = fixture.debugElement.query(By.css('pre'));
            let el = de.nativeElement;

            el.style.maxHeight.should.equal('100px');

            component.overflow.should.equal(false);
        })));

        it('should set max height to be scroll height when expanded', async(fakeAsync(() => {
            fixture = TestBed.createComponent(TestComponent);
            component = fixture.componentInstance;
            component.expanded = true;
            fixture.detectChanges();

            tick();

            let de = fixture.debugElement.query(By.css('pre'));
            let el = de.nativeElement;

            el.style.maxHeight.should.equal(el.scrollHeight + 'px');

            component.overflow.should.equal(true);
        })));
    });

    describe('inputs', () => {
        it('should update when content changes', async(() => {
            fixture = TestBed.createComponent(TestComponent);
            component = fixture.componentInstance;
            let directiveEl = fixture.debugElement.query(By.directive(CheckOverFlowDirective));
            let directiveInstance = directiveEl.injector.get(CheckOverFlowDirective);

            let checkOverFlowMock = sinon.stub(directiveInstance, 'checkOverFlow');

            component.changed = true;

            fixture.detectChanges();

            checkOverFlowMock.should.have.been.called;
        }));

        it('should update when expanded changes', async(() => {
            fixture = TestBed.createComponent(TestComponent);
            component = fixture.componentInstance;
            let directiveEl = fixture.debugElement.query(By.directive(CheckOverFlowDirective));
            let directiveInstance = directiveEl.injector.get(CheckOverFlowDirective);

            let checkOverFlowMock = sinon.stub(directiveInstance, 'checkOverFlow');

            component.expanded = true;

            fixture.detectChanges();

            checkOverFlowMock.should.have.been.called;
        }));
    });
});
