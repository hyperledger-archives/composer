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
import { ReplaceComponent } from './replace-confirm.component';

@Component({
    template: `
        <replace-confirm [mainMessage]="mainMessage" [supplementaryMessage]="supplementaryMessage"
                         [resource]="resource"></replace-confirm>`
})
class TestHostComponent {
    error: string = null;
}

describe('ReplaceComponent', () => {
    let component: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;

    let mockActiveModal = sinon.createStubInstance(NgbActiveModal);

    let replaceElement: DebugElement;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [ReplaceComponent, TestHostComponent],
            providers: [{provide: NgbActiveModal, useValue: mockActiveModal}]
        });
        fixture = TestBed.createComponent(TestHostComponent);
        component = fixture.componentInstance;

        replaceElement = fixture.debugElement.query(By.css('replace-confirm'));
    });

    it('should create', () => {
        component.should.be.ok;
    });

    it('should set the mainMessage, supplementaryMessage and resource', () => {
        let resourceElement = replaceElement.query((By.css('h1')));
        let mainMessageElement = replaceElement.queryAll(By.css('section.information p'))[0];
        let supplementaryElement = replaceElement.queryAll(By.css('section.information p'))[1];

        component['mainMessage'] = 'myMainMessage';
        component['supplementaryMessage'] = 'mySupplement';
        component['resource'] = 'myResource';

        fixture.detectChanges();

        resourceElement.nativeElement.textContent.should.equal('Current myResource will be replaced');
        mainMessageElement.nativeElement.textContent.should.equal('myMainMessage');
        supplementaryElement.nativeElement.textContent.should.equal('mySupplement');
    });

    it('should dismiss the modal via cross', () => {
        let crossButton: DebugElement = replaceElement.query(By.css('.modal-exit'));

        crossButton.triggerEventHandler('click', null);
        mockActiveModal.dismiss.should.have.been.called;
    });

    it('should dismiss the modal via cancel', () => {
        let cancelButton: DebugElement = replaceElement.query(By.css('.secondary'));

        cancelButton.triggerEventHandler('click', null);
        mockActiveModal.dismiss.should.have.been.called;
    });

    it('should close the modal via ok', () => {
        let okButton: DebugElement = replaceElement.query(By.css('.primary'));

        okButton.triggerEventHandler('click', null);
        mockActiveModal.close.should.have.been.calledWith(true);
    });
});
