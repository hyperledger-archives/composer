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
import { FormsModule } from '@angular/forms';
import { Component, Renderer, } from '@angular/core';
import { By } from '@angular/platform-browser';

import * as sinon from 'sinon';
import * as chai from 'chai';
import { DebounceDirective } from './debounce.directive';

let should = chai.should();

@Component({
    selector: 'test',
    template: `
        <input debounce [delay]="500" (debounceFunc)="onChange()" [(ngModel)]="value">
    `
})

class TestComponent {
    value: string = '';
    clicked: boolean = false;
    onChange = sinon.stub();
}

describe('DebounceDirective', () => {
    let component: TestComponent;
    let fixture: ComponentFixture<TestComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [TestComponent, DebounceDirective],
            imports: [FormsModule]
        })
        .compileComponents();

        fixture = TestBed.createComponent(TestComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }));

    it('should create the directive', async(() => {
        component.should.be.ok;
    }));

    it('should call onChange after 500ms', async(fakeAsync(() => {
        component = fixture.componentInstance;
        let divEl = fixture.debugElement.query(By.css('input'));
        let event = {};

        divEl.nativeElement.dispatchEvent(new Event('keyup'));
        fixture.detectChanges();
        tick(500);
        component.onChange.should.have.been.called;
    })));
});
