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
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import * as sinon from 'sinon';
import { ConnectConfirmComponent } from './connect-confirm.component';

@Component({
    template: `
        <connect-confirm [network]="network"></connect-confirm>`
})
class TestHostComponent {
}

describe('ConnectConfirmComponent', () => {
    let component: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;

    let mockActiveModal = sinon.createStubInstance(NgbActiveModal);

    let connectElement: DebugElement;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [ConnectConfirmComponent, TestHostComponent],
            providers: [{provide: NgbActiveModal, useValue: mockActiveModal}]
        });
        fixture = TestBed.createComponent(TestHostComponent);
        component = fixture.componentInstance;

        connectElement = fixture.debugElement.query(By.css('connect-confirm'));
    });

    it('should create', () => {
        component.should.be.ok;
    });

    it('should set the business network name', () => {
        let networkElement = connectElement.query((By.css('h1')));

        component['network'] = 'myNetwork';

        fixture.detectChanges();

        networkElement.nativeElement.textContent.should.equal('Business network myNetwork cannot be updated');
    });

    it('should dismiss the modal via cross', () => {
        let crossButton: DebugElement = connectElement.query(By.css('.modal-exit'));

        crossButton.triggerEventHandler('click', null);
        mockActiveModal.dismiss.should.have.been.called;
    });

    it('should dismiss the modal via cancel', () => {
        let cancelButton: DebugElement = connectElement.query(By.css('.secondary'));

        cancelButton.triggerEventHandler('click', null);
        mockActiveModal.dismiss.should.have.been.called;
    });

    it('should close the modal via connect', () => {
        let okButton: DebugElement = connectElement.query(By.css('.primary'));

        okButton.triggerEventHandler('click', null);
        mockActiveModal.close.should.have.been.calledWith(true);
    });
});
