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
import { CheckScrollDirective } from './check-scroll.directive';

let should = chai.should();

@Component({
    selector: 'test',
    template: `<div checkScroll (hasScroll)=hasScroll($event)></div>`
})

class TestComponent {

    scroll: boolean = false;

    hasScroll(scroll: boolean) {
        this.scroll = scroll;
    }
}

describe('CheckScrollDirective', () => {

    let component: TestComponent;
    let fixture: ComponentFixture<TestComponent>;

    let mockRenderer;

    beforeEach(async(() => {
        mockRenderer = sinon.createStubInstance(Renderer);
        // mockRenderer.listen = sinon.stub();
        // sinon.createStubInstance(Renderer);

        TestBed.configureTestingModule({
            declarations: [TestComponent, CheckScrollDirective],
            providers: [
               // {provide: Renderer, useValue: mockRenderer}
                Renderer
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(TestComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    it('should create the directive', async(fakeAsync(() => {
        component.should.be.ok;
    })));

    describe('checkScroll', () => {
        it('should emit false when scrollTop is 0', async(fakeAsync(inject([Renderer], (renderer: Renderer) => {

            let directiveEl = fixture.debugElement.query(By.directive(CheckScrollDirective));
            let directiveInstance = directiveEl.injector.get(CheckScrollDirective);

            renderer.setElementAttribute(directiveEl.nativeElement, 'scrollTop', '0px');
            fixture.detectChanges();

            directiveInstance.checkScroll();

            tick();

            component.scroll.should.be.false;
        }))));
    });
});
