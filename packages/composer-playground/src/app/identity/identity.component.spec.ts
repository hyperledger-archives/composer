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
import { Component, Input, Directive } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick, inject, async } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { IdentityComponent } from './identity.component';
import { AlertService } from '../basic-modals/alert.service';
import { ClientService } from '../services/client.service';
import { IdentityCardService } from '../services/identity-card.service';
import { AdminService } from '../services/admin.service';
import { BusinessNetworkConnection } from 'composer-client';
import { IdCard } from 'composer-common';
import { LocalStorageService } from 'angular-2-local-storage';

import * as fileSaver from 'file-saver';

import * as chai from 'chai';

import * as sinon from 'sinon';

let should = chai.should();

@Component({
    selector: 'app-footer',
    template: ''
})
class MockFooterComponent {

}

@Directive({
    selector: '[ngbTooltip]'
})
class MockToolTipDirective {
    @Input() public ngbTooltip: string;
    @Input() public placement: string;
    @Input() public container: string;
}

describe(`IdentityComponent`, () => {

    let component: IdentityComponent;
    let fixture: ComponentFixture<IdentityComponent>;

    let mockModal;

    let mockClientService;
    let mockBusinessNetworkConnection;
    let mockAdminService;
    let mockLocalStorage;

    let currentCardRef;
    let currentIdCard;
    let cardOne;

    beforeEach(() => {
        mockModal = sinon.createStubInstance(NgbModal);
        mockAdminService = sinon.createStubInstance(AdminService);
        mockLocalStorage = sinon.createStubInstance(LocalStorageService);
        mockClientService = sinon.createStubInstance(ClientService);
        mockBusinessNetworkConnection = sinon.createStubInstance(BusinessNetworkConnection);

        mockAdminService.importCard.resolves();
        mockAdminService.deleteCard.resolves();

        mockClientService.ensureConnected.resolves(true);
        mockClientService.revokeIdentity.resolves();
        mockBusinessNetworkConnection.getIdentityRegistry.resolves({
            getAll: sinon.stub().returns([{
                name: 'bob', participant: {
                    $namespace: 'bob-namespace',
                    $type: 'bob-type'
                }
            }, {
                name: 'fred', participant: {
                    $namespace: 'fred-namespace',
                    $type: 'fred-type'
                }
            }, {
                name: 'jim', participant: {
                    $namespace: 'jim-namespace',
                    $type: 'jim-type'
                }
            }])
        });

        mockClientService.getBusinessNetworkConnection.returns(mockBusinessNetworkConnection);
        mockClientService.getBusinessNetwork.returns({getName: sinon.stub().returns('penguin-network')});

        TestBed.configureTestingModule({
            imports: [FormsModule],
            declarations: [
                IdentityComponent,
                MockFooterComponent,
                MockToolTipDirective
            ],
            providers: [
                AlertService, IdentityCardService,
                {provide: NgbModal, useValue: mockModal},
                {provide: AdminService, useValue: mockAdminService},
                {provide: LocalStorageService, useValue: mockLocalStorage},
                {provide: ClientService, useValue: mockClientService},
            ]
        });

        fixture = TestBed.createComponent(IdentityComponent);

        component = fixture.componentInstance;
    });

    beforeEach(fakeAsync(inject([IdentityCardService], (identityCardService: IdentityCardService) => {
        currentIdCard = new IdCard({userName: 'bob', businessNetwork: 'penguin-network'}, {
            name: 'mycp',
            type: 'hlfv1'
        });

        cardOne = new IdCard({userName: 'fred', businessNetwork: 'penguin-network'}, {
            name: 'mycp',
            type: 'hlfv1'
        });

        identityCardService.addIdentityCard(currentIdCard, null).then((cardRef) => {
            currentCardRef = cardRef;
            return identityCardService.setCurrentIdentityCard(cardRef);
        }).then(() => {
            return identityCardService.addIdentityCard(cardOne, 'cardOne');
        });

        tick();

    })));

    describe('ngOnInit', () => {
        it('should create the component', () => {
            component.should.be.ok;
        });

        it('should load the identities', fakeAsync(() => {
            fixture.detectChanges();

            tick();

            component['currentIdentity'].should.equal(currentCardRef);
            component['identityCards'].size.should.equal(2);
            component['identityCards'].get(currentCardRef).should.equal(currentIdCard);
            component['identityCards'].get('cardOne').should.equal(cardOne);
            component['cardRefs'].length.should.equal(2);
            component['cardRefs'][0].should.equal(currentCardRef);
            component['cardRefs'][1].should.equal('cardOne');

            component['businessNetworkName'].should.equal('penguin-network');

            component['allIdentities'].length.should.equal(3);

            component['allIdentities'][0].should.deep.equal({
                name: 'bob',
                participant: {
                    $namespace: 'bob-namespace',
                    $type: 'bob-type'
                },
                ref: currentCardRef
            });

            component['allIdentities'][1].should.deep.equal({
                name: 'fred',
                participant: {
                    $namespace: 'fred-namespace',
                    $type: 'fred-type'
                },
                ref: 'cardOne'
            });
        }));

        it('should give an alert if there is an error', fakeAsync(inject([AlertService], (alertService: AlertService) => {

            mockBusinessNetworkConnection.getIdentityRegistry.rejects('some error');

            let alertSpy = sinon.spy(alertService.errorStatus$, 'next');

            fixture.detectChanges();

            tick();

            alertSpy.should.have.been.called;
        })));
    });

    describe('issueNewId', () => {
        let sandbox = sinon.sandbox.create();
        let saveAsStub;

        beforeEach(fakeAsync(() => {
            mockModal.open.reset();

            saveAsStub = sandbox.stub(fileSaver, 'saveAs');
        }));

        afterEach(() => {
            sandbox.restore();
        });

        it('should show the new id', fakeAsync(inject([AlertService], (alertService: AlertService) => {
            mockModal.open.onFirstCall().returns({
                result: Promise.resolve({userID: 'fred', userSecret: 'mySecret'})
            });

            mockModal.open.onSecondCall().returns({
                componentInstance: {},
                result: Promise.resolve({cardRef: 'cardOne', choice: 'add'})
            });

            let loadAllSpy = sinon.spy(component, 'loadAllIdentities');

            let alertSpy = sinon.spy(alertService.successStatus$, 'next');
            alertService.successStatus$.subscribe((message) => {
                if (message) {
                    message.should.deep.equal({
                        title: 'ID Card added to wallet',
                        text: 'The ID card fred was successfully added to your wallet',
                        icon: '#icon-role_24'
                    });
                }
            });

            fixture.detectChanges();
            tick();

            let issuedIdElement = fixture.debugElement.query(By.css('.flex-container button.secondary'));
            issuedIdElement.triggerEventHandler('click', null);

            tick();

            alertSpy.should.have.been.called;
            loadAllSpy.should.have.been.called;
        })));

        it('should export the new id', fakeAsync(() => {
            // TODO: make this work with the real toArchive - can't get the promise to resolve properly
            let expectedFile = new Blob(['card data'], {type: 'application/octet-stream'});
            sinon.stub(cardOne, 'toArchive').resolves(expectedFile);
            mockModal.open.onFirstCall().returns({
                result: Promise.resolve({userID: 'fred', userSecret: 'mySecret'})
            });

            mockModal.open.onSecondCall().returns({
                componentInstance: {},
                result: Promise.resolve({card: cardOne, choice: 'export'})
            });

            let loadAllSpy = sinon.spy(component, 'loadAllIdentities');

            fixture.detectChanges();
            tick();

            let issuedIdElement = fixture.debugElement.query(By.css('.flex-container button.secondary'));
            issuedIdElement.triggerEventHandler('click', null);

            tick();

            saveAsStub.should.have.been.calledWith(expectedFile, 'fred.card');
            loadAllSpy.should.have.been.called;
        }));

        it('should add id to wallet when using the web profile', fakeAsync(inject([IdentityCardService, AlertService], (identityCardService: IdentityCardService, alertService: AlertService) => {
            let newCurrentIdCard = new IdCard({userName: 'penguinWeb', businessNetwork: 'igloo-network'}, {
                'name': 'mycp',
                'x-type': 'web'
            });

            identityCardService.addIdentityCard(newCurrentIdCard, 'webCard').then((cardRef) => {
                currentCardRef = cardRef;
                return identityCardService.setCurrentIdentityCard(cardRef);
            });

            tick();

            mockModal.open.onFirstCall().returns({
                result: Promise.resolve({userID: 'snowMan', userSecret: 'mySecret'})
            });

            let alertSpy = sinon.spy(alertService.successStatus$, 'next');
            alertService.successStatus$.subscribe((message) => {
                if (message) {
                    message.should.deep.equal({
                        title: 'ID Card added to wallet',
                        text: 'The ID card snowMan was successfully added to your wallet',
                        icon: '#icon-role_24'
                    });
                }
            });

            fixture.detectChanges();
            tick();

            let issuedIdElement = fixture.debugElement.query(By.css('.flex-container button.secondary'));
            issuedIdElement.triggerEventHandler('click', null);

            tick();

            alertSpy.should.have.been.called;

            component['identityCards'].size.should.equal(2);
            component['identityCards'].get('snowMan@igloo-network').getUserName().should.equal('snowMan');
        })));

        it('should handle error with issuing id', fakeAsync(inject([AlertService], (alertService: AlertService) => {
            fixture.detectChanges();
            tick();

            mockModal.open.onFirstCall().returns({
                result: Promise.reject('some error')
            });

            let alertSpy = sinon.spy(alertService.errorStatus$, 'next');
            alertService.errorStatus$.subscribe((message) => {
                if (message) {
                    message.should.deep.equal('some error');
                }
            });

            let issuedIdElement = fixture.debugElement.query(By.css('.flex-container button.secondary'));
            issuedIdElement.triggerEventHandler('click', null);

            tick();

            alertSpy.should.have.been.called;
        })));

        it('should handle esc being pressed', fakeAsync(inject([AlertService], (alertService: AlertService) => {
            fixture.detectChanges();
            tick();

            mockModal.open.onFirstCall().returns({
                result: Promise.reject(1)
            });

            let alertSpy = sinon.spy(alertService.errorStatus$, 'next');

            let issuedIdElement = fixture.debugElement.query(By.css('.flex-container button.secondary'));
            issuedIdElement.triggerEventHandler('click', null);

            tick();

            alertSpy.should.not.have.been.called;
        })));

        it('should handle error with reloading', fakeAsync(inject([AlertService], (alertService: AlertService) => {
            fixture.detectChanges();
            tick();

            mockModal.open.onFirstCall().returns({
                result: Promise.resolve({userID: 'fred', userSecret: 'mySecret'})
            });

            mockModal.open.onSecondCall().returns({
                componentInstance: {},
                result: Promise.resolve({cardRef: 'cardOne', choice: 'add'})
            });

            let loadAllSpy = sinon.stub(component, 'loadAllIdentities').returns(Promise.reject('some error'));

            let alertSpy = sinon.spy(alertService.errorStatus$, 'next');
            alertService.errorStatus$.subscribe((message) => {
                if (message) {
                    message.should.deep.equal('some error');
                }
            });

            let issuedIdElement = fixture.debugElement.query(By.css('.flex-container button.secondary'));
            issuedIdElement.triggerEventHandler('click', null);

            tick();

            alertSpy.should.have.been.called;
            loadAllSpy.should.have.been.called;
        })));
    });

    describe('setCurrentIdentity', () => {
        it('should set the current identity', fakeAsync(inject([AlertService], (alertService: AlertService) => {
            fixture.detectChanges();
            tick();

            let identityElements = fixture.debugElement.queryAll(By.css('.identity'));
            let identityToChangeToElement = identityElements[1];

            let alertSpy = sinon.spy(alertService.busyStatus$, 'next');
            let loadAllIdentitiesSpy = sinon.spy(component, 'loadAllIdentities');

            alertService.busyStatus$.subscribe((message) => {
                if (message) {
                    message.should.deep.equal({
                        title: 'Reconnecting...',
                        text: 'Using identity cardOne'
                    });
                }
            });

            identityToChangeToElement.triggerEventHandler('dblclick', null);

            fixture.detectChanges();
            tick();

            alertSpy.should.have.been.called;
            loadAllIdentitiesSpy.should.have.been.called;
        })));

        it('should do nothing if the new identity matches the current identity', fakeAsync(inject([AlertService], (alertService: AlertService) => {
            fixture.detectChanges();
            tick();

            let identityElements = fixture.debugElement.queryAll(By.css('.identity'));
            let identityToChangeToElement = identityElements[0];

            let alertSpy = sinon.spy(alertService.busyStatus$, 'next');
            let loadAllIdentitiesSpy = sinon.spy(component, 'loadAllIdentities');

            identityToChangeToElement.triggerEventHandler('dblclick', null);

            fixture.detectChanges();
            tick();

            alertSpy.should.not.have.been.called;
            loadAllIdentitiesSpy.should.not.have.been.called;
        })));

        it('should handle errors and revert to previous on error', fakeAsync(inject([AlertService], (alertService: AlertService) => {
            fixture.detectChanges();
            tick();

            let identityElements = fixture.debugElement.queryAll(By.css('.identity'));
            let identityToChangeToElement = identityElements[1];

            let alertSpy = sinon.spy(alertService.errorStatus$, 'next');

            alertService.errorStatus$.subscribe((message) => {
                if (message) {
                    message.should.deep.equal('some error');
                }
            });

            mockClientService.ensureConnected.returns(Promise.reject('some error'));

            identityToChangeToElement.triggerEventHandler('dblclick', null);

            fixture.detectChanges();
            tick();

            alertSpy.should.have.been.called;
        })));
    });

    describe('openRemoveModal', () => {
        it('should open the delete-confirm modal and handle error', fakeAsync(inject([AlertService], (alertService: AlertService) => {
            fixture.detectChanges();
            tick();

            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.reject('some error')
            });

            let alertSpy = sinon.spy(alertService.errorStatus$, 'next');
            alertService.errorStatus$.subscribe((message) => {
                if (message) {
                    message.should.equal('some error');
                }
            });

            let identityElement = fixture.debugElement.queryAll(By.css('.identity'))[1];
            let removeButton = identityElement.queryAll(By.css('button'))[1];

            removeButton.triggerEventHandler('click', {stopPropagation : sinon.stub()});

            tick();

            alertSpy.should.have.been.called;
        })));

        it('should open the delete-confirm modal and handle cancel', fakeAsync(inject([AlertService], (alertService: AlertService) => {
            fixture.detectChanges();
            tick();

            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.reject(1)
            });

            let alertSpy = sinon.spy(alertService.errorStatus$, 'next');

            let identityElement = fixture.debugElement.queryAll(By.css('.identity'))[1];
            let removeButton = identityElement.queryAll(By.css('button'))[1];

            removeButton.triggerEventHandler('click', {stopPropagation : sinon.stub()});

            tick();

            alertSpy.should.not.have.been.called;
        })));

        it('should open the delete-confirm modal and handle remove press', fakeAsync(inject([AlertService], (alertService: AlertService) => {
            fixture.detectChanges();
            tick();

            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.resolve()
            });

            let alertSpy = sinon.spy(alertService.successStatus$, 'next');
            alertService.successStatus$.subscribe((message) => {
                if (message) {
                    message.should.deep.equal({
                        title: 'Removal Successful',
                        text: 'fred was successfully removed.',
                        icon: '#icon-bin_icon'
                    });
                }
            });

            let identityElement = fixture.debugElement.queryAll(By.css('.identity'))[1];
            let removeButton = identityElement.queryAll(By.css('button'))[1];

            removeButton.triggerEventHandler('click', {stopPropagation: sinon.stub()});

            tick();

            alertSpy.should.have.been.called;
            should.not.exist(component['identityCards'].get('cardOne'));
        })));

        it('should handle error on trying to remove', fakeAsync(inject([AlertService, IdentityCardService], (alertService: AlertService, identityCardService: IdentityCardService) => {
            fixture.detectChanges();
            tick();

            sinon.stub(identityCardService, 'deleteIdentityCard').returns(Promise.reject('some error'));

            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.resolve()
            });

            let alertSpy = sinon.spy(alertService.errorStatus$, 'next');
            alertService.errorStatus$.subscribe((message) => {
                if (message) {
                    message.should.deep.equal('some error');
                }
            });

            let identityElement = fixture.debugElement.queryAll(By.css('.identity'))[1];
            let removeButton = identityElement.queryAll(By.css('button'))[1];

            removeButton.triggerEventHandler('click', {stopPropagation: sinon.stub()});

            tick();

            alertSpy.should.have.been.called;
            should.exist(component['identityCards'].get('cardOne'));
        })));
    });

    describe('revokeIdentity', () => {
        it('should open the delete-confirm modal and revoke the id', fakeAsync(inject([AlertService], (alertService: AlertService) => {
            fixture.detectChanges();
            tick();

            fixture.detectChanges();

            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.resolve()
            });

            let alertSpy = sinon.spy(alertService.successStatus$, 'next');
            alertService.successStatus$.subscribe((message) => {
                if (message) {
                    message.should.deep.equal({
                        title: 'Revoke Successful',
                        text: 'fred was successfully revoked.',
                        icon: '#icon-bin_icon'
                    });
                }
            });

            let revokeElement = fixture.debugElement.queryAll(By.css('.identity'))[3];

            let revokeButton = revokeElement.query(By.css('button'));
            revokeButton.triggerEventHandler('click', null);

            tick();

            alertSpy.should.have.been.called;
            should.not.exist(component['identityCards'].get('cardOne'));
        })));

        it('should open the delete-confirm modal and revoke the id and handle not being in wallet', fakeAsync(inject([AlertService, IdentityCardService], (alertService: AlertService, identityCardService: IdentityCardService) => {
            fixture.detectChanges();
            tick();

            fixture.detectChanges();

            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.resolve()
            });

            let deleteSpy = sinon.spy(identityCardService, 'deleteIdentityCard');

            let alertSpy = sinon.spy(alertService.successStatus$, 'next');
            alertService.successStatus$.subscribe((message) => {
                if (message) {
                    message.should.deep.equal({
                        title: 'Revoke Successful',
                        text: 'jim was successfully revoked.',
                        icon: '#icon-bin_icon'
                    });
                }
            });

            let revokeElement = fixture.debugElement.queryAll(By.css('.identity'))[4];

            let revokeButton = revokeElement.query(By.css('button'));
            revokeButton.triggerEventHandler('click', null);

            tick();

            alertSpy.should.have.been.called;
            deleteSpy.should.not.have.been.called;
        })));

        it('should open the delete-confirm modal and handle error', fakeAsync(inject([AlertService], (alertService: AlertService) => {
            fixture.detectChanges();
            tick();

            fixture.detectChanges();

            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.reject('some error')
            });

            let alertSpy = sinon.spy(alertService.errorStatus$, 'next');
            alertService.errorStatus$.subscribe((message) => {
                if (message) {
                    message.should.deep.equal('some error');
                }
            });

            let revokeElement = fixture.debugElement.queryAll(By.css('.identity'))[3];

            let revokeButton = revokeElement.query(By.css('button'));
            revokeButton.triggerEventHandler('click', null);

            tick();

            alertSpy.should.have.been.called;
            should.exist(component['identityCards'].get('cardOne'));
        })));

        it('should open the delete-confirm modal and handle cancel', fakeAsync(inject([AlertService], (alertService: AlertService) => {
            fixture.detectChanges();
            tick();

            fixture.detectChanges();

            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.reject(1)
            });

            let alertSpy = sinon.spy(alertService.errorStatus$, 'next');

            let revokeElement = fixture.debugElement.queryAll(By.css('.identity'))[3];

            let revokeButton = revokeElement.query(By.css('button'));
            revokeButton.triggerEventHandler('click', null);

            tick();

            alertSpy.should.not.have.been.called;
            should.exist(component['identityCards'].get('cardOne'));
        })));

        it('should handle error', fakeAsync(inject([AlertService], (alertService: AlertService) => {
            fixture.detectChanges();
            tick();

            fixture.detectChanges();

            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.resolve()
            });

            let alertSpy = sinon.spy(alertService.errorStatus$, 'next');
            alertService.errorStatus$.subscribe((message) => {
                if (message) {
                    message.should.deep.equal('some error');
                }
            });

            mockClientService.revokeIdentity.returns(Promise.reject('some error'));

            let revokeElement = fixture.debugElement.queryAll(By.css('.identity'))[3];

            let revokeButton = revokeElement.query(By.css('button'));
            revokeButton.triggerEventHandler('click', null);

            tick();

            alertSpy.should.have.been.called;
        })));
    });
});
