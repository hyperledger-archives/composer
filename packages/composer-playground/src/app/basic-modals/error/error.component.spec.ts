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
import { By } from '@angular/platform-browser';
import { Component, DebugElement } from '@angular/core';
import { ErrorComponent } from './error.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import * as sinon from 'sinon';

@Component({
    template: `<error [error]="error"></error>`
})
class TestHostComponent {
    error: string = null;
}

describe('ErrorComponent', () => {
    let component: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;

    let errorElement: DebugElement;

    let mockActiveModal = sinon.createStubInstance(NgbActiveModal);

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [ErrorComponent, TestHostComponent],
            providers: [{provide: NgbActiveModal, useValue: mockActiveModal}]
        });
        fixture = TestBed.createComponent(TestHostComponent);
        component = fixture.componentInstance;

        errorElement = fixture.debugElement.query(By.css('error'));
    });

    it('should create', () => {
        component.should.be.ok;
    });

    it('should set the error test', () => {
        let errorTextElement: DebugElement = errorElement.query(By.css('section.modal-body div'));

        errorTextElement.nativeElement.innerHTML.should.equal('');

        component['error'] = 'myError';

        fixture.detectChanges();

        errorTextElement.nativeElement.innerHTML.should.equal('myError');
    });

    it('should dismiss the error', () => {
        let crossButton: DebugElement = errorElement.query(By.css('.modal-exit'));

        crossButton.triggerEventHandler('click', null);

        mockActiveModal.dismiss.should.have.been.called;
    });

    it('should close the error', () => {
        let okButton: DebugElement = errorElement.query(By.css('#error_close'));

        okButton.triggerEventHandler('click', null);

        mockActiveModal.close.should.have.been.called;
    });
});
