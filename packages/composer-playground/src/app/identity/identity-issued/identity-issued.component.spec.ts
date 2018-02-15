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
import { ComponentFixture, TestBed, fakeAsync, tick, inject } from '@angular/core/testing';
import { Component, Input, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgbModule, NgbActiveModal, NgbAccordionConfig } from '@ng-bootstrap/ng-bootstrap';

import { IdentityIssuedComponent } from './identity-issued.component';
import { IdentityCardService } from '../../services/identity-card.service';
import { LocalStorageService } from 'angular-2-local-storage';
import { AdminService } from '../../services/admin.service';

import { IdCard } from 'composer-common';

import * as sinon from 'sinon';

@Component({
    selector: 'identity-card',
    template: ''
})
class MockIdentityCardComponent {
    @Input() identity: any;
    @Input() preview: boolean;
}

@Component({
    template: `
        <identity-issued-modal [userID]="userID" [userSecret]="userSecret"></identity-issued-modal>`
})
class TestHostComponent {
    userID;
    userSecret;
}

describe('IdentityIssuedComponent', () => {
    let component: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;

    let identityIssuedElement: DebugElement;

    let mockActiveModal;
    let mockAdminService;
    let mockLocalStorage;

    let currentCardRef;

    beforeEach(() => {
        mockActiveModal = sinon.createStubInstance(NgbActiveModal);
        mockAdminService = sinon.createStubInstance(AdminService);
        mockLocalStorage = sinon.createStubInstance(LocalStorageService);

        mockAdminService.importCard.resolves();

        TestBed.configureTestingModule({
            imports: [FormsModule, NgbModule],
            declarations: [
                IdentityIssuedComponent,
                MockIdentityCardComponent,
                TestHostComponent
            ],
            providers: [IdentityCardService,
                NgbAccordionConfig,
                {provide: NgbActiveModal, useValue: mockActiveModal},
                {provide: AdminService, useValue: mockAdminService},
                {provide: LocalStorageService, useValue: mockLocalStorage}
            ]
        });

        fixture = TestBed.createComponent(TestHostComponent);
        component = fixture.componentInstance;

        identityIssuedElement = fixture.debugElement.query(By.css('identity-issued-modal'));
    });

    beforeEach(fakeAsync(inject([IdentityCardService], (identityCardService: IdentityCardService) => {
        let currentIdCard = new IdCard({userName: 'bob', businessNetwork: 'penguin-network'}, {
            name: 'mycp',
            type: 'hlfv1'
        });
        identityCardService.addIdentityCard(currentIdCard, null).then((cardRef) => {
            currentCardRef = cardRef;
            return identityCardService.setCurrentIdentityCard(cardRef);
        });

        tick();

    })));

    it('should be created', () => {
        component.should.be.ok;
    });

    describe('ngOnInit', () => {
        it('should setup the component', fakeAsync(() => {
            component.userID = 'dan';
            component.userSecret = 'wotnodolphin';

            fixture.detectChanges();

            tick();

            identityIssuedElement.componentInstance['newCard'].getUserName().should.equal('dan');
            identityIssuedElement.componentInstance['newCard'].getEnrollmentCredentials().should.deep.equal({secret: 'wotnodolphin'});
            identityIssuedElement.componentInstance['newCard'].getBusinessNetworkName().should.equal('penguin-network');
            identityIssuedElement.componentInstance['newCard'].getConnectionProfile().should.deep.equal({
                name: 'mycp',
                type: 'hlfv1'
            });

            identityIssuedElement.componentInstance['newCardRef'].should.equal(currentCardRef);
            identityIssuedElement.componentInstance['newIdentity'].should.equal('dan\nwotnodolphin');
        }));
    });

    describe('addToWallet', () => {
        it('should not set card name if not changed', fakeAsync(() => {
            component.userID = 'dan';
            component.userSecret = 'wotnodolphin';

            fixture.detectChanges();

            tick();

            identityIssuedElement.componentInstance['cardNameValid'] = false;
            identityIssuedElement.componentInstance['cardName'] = 'myCardName';

            let cardNameElement = identityIssuedElement.query(By.css('#option-1 input'));

            cardNameElement.nativeElement.value = 'myCardName';
            cardNameElement.nativeElement.dispatchEvent(new Event('input'));

            tick();
            fixture.detectChanges();

            identityIssuedElement.componentInstance['cardNameValid'].should.equal(false);
        }));

        it('should close the modal with the add to wallet option', fakeAsync(() => {
            component.userID = 'dan';
            component.userSecret = 'wotnodolphin';

            fixture.detectChanges();

            tick();

            let cardNameElement = identityIssuedElement.query(By.css('#option-1 input'));

            cardNameElement.nativeElement.value = 'myCardName';
            cardNameElement.nativeElement.dispatchEvent(new Event('input'));

            tick();
            fixture.detectChanges();

            let addToWalletButton = identityIssuedElement.query(By.css('#option-1 button'));
            addToWalletButton.triggerEventHandler('click', null);

            tick();

            mockActiveModal.close.should.have.been.calledWith({cardRef: 'myCardName', choice: 'add'});
        }));

        it('should handle error with card name', fakeAsync(() => {
            mockAdminService.importCard.rejects(new Error('Card already exists: myCardName'));

            component.userID = 'dan';
            component.userSecret = 'wotnodolphin';

            fixture.detectChanges();

            tick();

            let cardNameElement = identityIssuedElement.query(By.css('#option-1 input'));

            cardNameElement.nativeElement.value = 'myCardName';
            cardNameElement.nativeElement.dispatchEvent(new Event('input'));

            tick();
            fixture.detectChanges();

            let addToWalletButton = identityIssuedElement.query(By.css('#option-1 button'));
            addToWalletButton.triggerEventHandler('click', null);

            tick();

            identityIssuedElement.componentInstance['cardNameValid'].should.equal(false);
            mockActiveModal.close.should.not.have.been.called;
            mockActiveModal.dismiss.should.not.have.been.called;
        }));

        it('should handle error', fakeAsync(() => {
            mockAdminService.importCard.rejects('Some error');

            component.userID = 'dan';
            component.userSecret = 'wotnodolphin';

            fixture.detectChanges();

            tick();

            let cardNameElement = identityIssuedElement.query(By.css('#option-1 input'));

            cardNameElement.nativeElement.value = 'myCardName';
            cardNameElement.nativeElement.dispatchEvent(new Event('input'));

            tick();
            fixture.detectChanges();

            let addToWalletButton = identityIssuedElement.query(By.css('#option-1 button'));
            addToWalletButton.triggerEventHandler('click', null);

            tick();

            mockActiveModal.dismiss.should.have.been.called;
        }));
    });

    describe('export', () => {
        it('should close the modal with the export option', fakeAsync(() => {
            component.userID = 'dan';
            component.userSecret = 'wotnodolphin';

            fixture.detectChanges();

            tick();

            let exportPanel = identityIssuedElement.query(By.css('#option-2-header a'));

            exportPanel.triggerEventHandler('click', null);

            fixture.detectChanges();

            let addToWalletButton = identityIssuedElement.query(By.css('#option-2 button'));
            addToWalletButton.triggerEventHandler('click', null);

            mockActiveModal.close.should.have.been.calledWith({
                card: identityIssuedElement.componentInstance['newCard'],
                choice: 'export'
            });
        }));
    });
});
