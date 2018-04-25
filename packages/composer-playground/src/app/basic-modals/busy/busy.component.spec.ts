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
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

import * as sinon from 'sinon';

import { BusyComponent } from './busy.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    template: `
        <busy [busy]="busy"></busy>`
})
class TestHostComponent {
    busy = {
        title: 'myTitle',
        text: 'myText'
    };
}

describe('BusyComponent', () => {
    let component: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;

    let mockActiveModal = sinon.createStubInstance(NgbActiveModal);

    let busyElement: DebugElement;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [BusyComponent, TestHostComponent],
            providers: [{provide: NgbActiveModal, useValue: mockActiveModal}]
        });

        fixture = TestBed.createComponent(TestHostComponent);
        component = fixture.componentInstance;

        busyElement = fixture.debugElement.query(By.css('busy'));
    });

    it('should create', () => {
        component.should.be.ok;
    });

    it('should display the error', () => {
        fixture.detectChanges();
        let titleElement = busyElement.queryAll(By.css('span'));
        titleElement[1].nativeElement.innerHTML.should.equal('myTitle');

        let textElement = busyElement.queryAll(By.css('.busy-text'));
        textElement[0].nativeElement.innerHTML.should.equal('myText');

        component['busy'] = {
            title: 'differentTitle',
            text: 'differentText'
        };

        fixture.detectChanges();
        titleElement[1].nativeElement.innerHTML.should.equal('differentTitle');
        textElement[0].nativeElement.innerHTML.should.equal('differentText');
    });
});
