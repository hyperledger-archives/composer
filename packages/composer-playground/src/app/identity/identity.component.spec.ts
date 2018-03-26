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
import { IssueIdentityComponent } from './issue-identity';
import { AlertService } from '../basic-modals/alert.service';
import { ClientService } from '../services/client.service';
import { IdentityCardService } from '../services/identity-card.service';
import { AdminService } from '../services/admin.service';
import { BusinessNetworkConnection, ParticipantRegistry } from 'composer-client';
import { IdCard, Resource } from 'composer-common';
import { LocalStorageService } from 'angular-2-local-storage';

import * as fileSaver from 'file-saver';

import * as chai from 'chai';

import * as sinon from 'sinon';
import { WSAEINVALIDPROVIDER } from 'constants';

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
    let networkAdmin;

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
                    $type: 'bob-type',
                    getType: () => { return 'bob-type'; },
                    getNamespace: () => { return 'bob-namespace'; },
                    getIdentifier: () => { return 'pingu'; }
                },
            }, {
                name: 'fred', participant: {
                    $namespace: 'fred-namespace',
                    $type: 'fred-type',
                    getType: () => { return 'fred-type'; },
                    getNamespace: () => { return 'fred-namespace'; },
                    getIdentifier: () => { return 'pinga'; }
                }
            }, {
                name: 'jim', participant: {
                    $namespace: 'jim-namespace',
                    $type: 'jim-type',
                    getType: () => { return 'NetworkAdmin'; },
                    getNamespace: () => { return 'jim-namespace'; },
                    getIdentifier: () => { return 'pingo'; }
                }
            }, {
                name: 'tony', participant: {
                    $namespace: 'tony-namespace',
                    $type: 'tony-type',
                    getType: () => { return 'tony-type'; },
                    getNamespace: () => { return 'tony-namespace'; },
                    getIdentifier: () => { return 'pinga'; }
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

        networkAdmin = new IdCard({userName: 'jim', businessNetwork: 'penguin-network'}, {
            name: 'mycp',
            type: 'hlfv1'
        });

        identityCardService.addIdentityCard(currentIdCard, null).then((cardRef) => {
            currentCardRef = cardRef;
            return identityCardService.setCurrentIdentityCard(cardRef);
        }).then(() => {
            return identityCardService.addIdentityCard(cardOne, 'cardOne');
        }).then(() => {
            return identityCardService.addIdentityCard(networkAdmin, 'networkAdmin');
        });

        tick();

    })));

    describe('ngOnInit', () => {
        it('should create the component', () => {
            component.should.be.ok;
        });

        it('should load the identities', fakeAsync(() => {

            let myLoadIdentitiesMock = sinon.stub(component, 'loadAllIdentities');
            myLoadIdentitiesMock.returns(Promise.resolve());

            fixture.detectChanges();

            tick();
        }));

        it('should give an alert if there is an error', fakeAsync(inject([AlertService], (alertService: AlertService) => {

            mockBusinessNetworkConnection.getIdentityRegistry.rejects('some error');

            let alertSpy = sinon.spy(alertService.errorStatus$, 'next');

            fixture.detectChanges();

            tick();

            alertSpy.should.have.been.called;
        })));
    });

    describe('loadAllIdentities', () => {
        it('should load all the identities and handle those bound to participants not found', fakeAsync(() => {
            let myLoadParticipantsMock = sinon.stub(component, 'loadParticipants');
            let myGetParticipantMock = sinon.stub(component, 'getParticipant');

            myLoadParticipantsMock.returns(Promise.resolve());
            myGetParticipantMock.onFirstCall().returns(true);
            myGetParticipantMock.onSecondCall().returns(false);
            myGetParticipantMock.onThirdCall().returns(true);

            component.loadAllIdentities();

            tick();
            component['businessNetworkName'].should.equal('penguin-network');
            myLoadParticipantsMock.should.have.been.called;
            component['allIdentities'].length.should.deep.equal(4);
            component['allIdentities'][0]['ref'].should.deep.equal('bob@penguin-network');
            component['allIdentities'][0].should.not.have.property('state');
            component['allIdentities'][1]['ref'].should.deep.equal('cardOne');
            component['allIdentities'][1]['state'].should.deep.equal('BOUND PARTICIPANT NOT FOUND');
            component['allIdentities'][2]['ref'].should.deep.equal('networkAdmin');
            component['allIdentities'][2].should.not.have.property('state');
            component['allIdentities'][3]['name'].should.deep.equal('tony');
            component['allIdentities'][3].should.not.have.property('state');

            component['currentIdentity'].should.deep.equal(currentCardRef);
            component['identityCards'].size.should.deep.equal(3);
            component['identityCards'].get(currentCardRef).should.deep.equal(currentIdCard);
            component['identityCards'].get('cardOne').should.deep.equal(cardOne);
            component['myIDs'].length.should.deep.equal(3);
            component['myIDs'][0]['ref'].should.deep.equal('bob@penguin-network');
            component['myIDs'][0]['usable'].should.deep.equal(true);
            component['myIDs'][1]['ref'].should.deep.equal('cardOne');
            component['myIDs'][1]['usable'].should.deep.equal(false);
            component['myIDs'][2]['ref'].should.deep.equal('networkAdmin');
            component['myIDs'][2]['usable'].should.deep.equal(true);
        }));

        it('should give an alert if there is an error', fakeAsync(inject([AlertService], (alertService: AlertService) => {

            mockBusinessNetworkConnection.getIdentityRegistry.rejects('some error');

            let alertSpy = sinon.spy(alertService.errorStatus$, 'next');

            component.loadAllIdentities();

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
                componentInstance: {},
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
                componentInstance: {},
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
            let myLoadParticipantsMock = sinon.stub(component, 'loadParticipants');
            let myGetParticipantMock = sinon.stub(component, 'getParticipant');

            myLoadParticipantsMock.returns(Promise.resolve());
            myGetParticipantMock.returns(true);

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
                componentInstance: {},
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
            let myLoadParticipantsMock = sinon.stub(component, 'loadParticipants');
            let myGetParticipantMock = sinon.stub(component, 'getParticipant');

            myLoadParticipantsMock.returns(Promise.resolve());
            myGetParticipantMock.returns(true);

            fixture.detectChanges();
            tick();

            mockModal.open.onFirstCall().returns({
                componentInstance: {},
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
            let myLoadParticipantsMock = sinon.stub(component, 'loadParticipants');
            let myGetParticipantMock = sinon.stub(component, 'getParticipant');

            myLoadParticipantsMock.returns(Promise.resolve());
            myGetParticipantMock.returns(true);

            fixture.detectChanges();
            tick();

            mockModal.open.onFirstCall().returns({
                componentInstance: {},
                result: Promise.reject(1)
            });

            let alertSpy = sinon.spy(alertService.errorStatus$, 'next');

            let issuedIdElement = fixture.debugElement.query(By.css('.flex-container button.secondary'));
            issuedIdElement.triggerEventHandler('click', null);

            tick();

            alertSpy.should.not.have.been.called;
        })));

        it('should handle error with reloading', fakeAsync(inject([AlertService], (alertService: AlertService) => {
            let myLoadParticipantsMock = sinon.stub(component, 'loadParticipants');
            let myGetParticipantMock = sinon.stub(component, 'getParticipant');

            myLoadParticipantsMock.returns(Promise.resolve());
            myGetParticipantMock.returns(true);

            fixture.detectChanges();
            tick();

            mockModal.open.onFirstCall().returns({
                componentInstance: {},
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
            let myLoadParticipantsMock = sinon.stub(component, 'loadParticipants');
            let myGetParticipantMock = sinon.stub(component, 'getParticipant');

            myLoadParticipantsMock.returns(Promise.resolve());
            myGetParticipantMock.returns(true);

            fixture.detectChanges();
            tick();

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
            let myLoadParticipantsMock = sinon.stub(component, 'loadParticipants');
            let myGetParticipantMock = sinon.stub(component, 'getParticipant');

            myLoadParticipantsMock.returns(Promise.resolve());
            myGetParticipantMock.returns(true);

            fixture.detectChanges();
            tick();

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

        it('should do nothing if the new identity is not usable', fakeAsync(inject([AlertService], (alertService: AlertService) => {
            let myLoadParticipantsMock = sinon.stub(component, 'loadParticipants');
            let myGetParticipantMock = sinon.stub(component, 'getParticipant');

            myLoadParticipantsMock.returns(Promise.resolve());
            myGetParticipantMock.onFirstCall().returns(true);
            myGetParticipantMock.onSecondCall().returns(false);

            fixture.detectChanges();
            tick();

            fixture.detectChanges();
            tick();

            let identityElements = fixture.debugElement.queryAll(By.css('.identity'));
            let identityToChangeToElement = identityElements[1];

            let alertSpy = sinon.spy(alertService.busyStatus$, 'next');
            let loadAllIdentitiesSpy = sinon.spy(component, 'loadAllIdentities');

            identityToChangeToElement.triggerEventHandler('dblclick', null);

            fixture.detectChanges();
            tick();

            alertSpy.should.not.have.been.called;
            loadAllIdentitiesSpy.should.not.have.been.called;
        })));

        it('should handle errors and revert to previous on error', fakeAsync(inject([AlertService], (alertService: AlertService) => {
            let myLoadParticipantsMock = sinon.stub(component, 'loadParticipants');
            let myGetParticipantMock = sinon.stub(component, 'getParticipant');

            myLoadParticipantsMock.returns(Promise.resolve());
            myGetParticipantMock.returns(true);

            fixture.detectChanges();
            tick();

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
            let myLoadParticipantsMock = sinon.stub(component, 'loadParticipants');
            let myGetParticipantMock = sinon.stub(component, 'getParticipant');

            myLoadParticipantsMock.returns(Promise.resolve());
            myGetParticipantMock.returns(true);

            fixture.detectChanges();
            tick();

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
            let myLoadParticipantsMock = sinon.stub(component, 'loadParticipants');
            let myGetParticipantMock = sinon.stub(component, 'getParticipant');

            myLoadParticipantsMock.returns(Promise.resolve());
            myGetParticipantMock.returns(true);

            fixture.detectChanges();
            tick();

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
            let myLoadParticipantsMock = sinon.stub(component, 'loadParticipants');
            let myGetParticipantMock = sinon.stub(component, 'getParticipant');

            myLoadParticipantsMock.returns(Promise.resolve());
            myGetParticipantMock.returns(true);

            fixture.detectChanges();
            tick();

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
            let myLoadParticipantsMock = sinon.stub(component, 'loadParticipants');
            let myGetParticipantMock = sinon.stub(component, 'getParticipant');

            myLoadParticipantsMock.returns(Promise.resolve());
            myGetParticipantMock.returns(true);

            fixture.detectChanges();
            tick();

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

            let myLoadParticipantsMock = sinon.stub(component, 'loadParticipants');
            let myGetParticipantMock = sinon.stub(component, 'getParticipant');

            myLoadParticipantsMock.returns(Promise.resolve());
            myGetParticipantMock.returns(true);

            fixture.detectChanges();
            tick();

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
                        title: 'Revoke Successful',
                        text: 'fred was successfully revoked.',
                        icon: '#icon-bin_icon'
                    });
                }
            });

            let revokeElement = fixture.debugElement.queryAll(By.css('.identity'))[4];

            let revokeButton = revokeElement.query(By.css('button'));
            revokeButton.triggerEventHandler('click', null);

            tick();

            alertSpy.should.have.been.called;
            should.not.exist(component['identityCards'].get('cardOne'));
        })));

        it('should open the delete-confirm modal and revoke the id and handle not being in wallet', fakeAsync(inject([AlertService, IdentityCardService], (alertService: AlertService, identityCardService: IdentityCardService) => {
            let myLoadParticipantsMock = sinon.stub(component, 'loadParticipants');
            let myGetParticipantMock = sinon.stub(component, 'getParticipant');

            myLoadParticipantsMock.returns(Promise.resolve());
            myGetParticipantMock.returns(true);

            fixture.detectChanges();
            tick();

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

            let revokeElement = fixture.debugElement.queryAll(By.css('.identity'))[6];

            // NEED TO MAKE A NEW PARTICIPANT (AFTER JIM) WHO WILL NOT BE ADDED TO THE WALLET

            let revokeButton = revokeElement.query(By.css('button'));
            revokeButton.triggerEventHandler('click', null);

            tick();

            alertSpy.should.have.been.called;
            deleteSpy.should.not.have.been.called;
        })));

        it('should open the delete-confirm modal and handle error', fakeAsync(inject([AlertService], (alertService: AlertService) => {
            let myLoadParticipantsMock = sinon.stub(component, 'loadParticipants');
            let myGetParticipantMock = sinon.stub(component, 'getParticipant');

            myLoadParticipantsMock.returns(Promise.resolve());
            myGetParticipantMock.returns(true);

            fixture.detectChanges();
            tick();

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

            let revokeElement = fixture.debugElement.queryAll(By.css('.identity'))[4];

            let revokeButton = revokeElement.query(By.css('button'));
            revokeButton.triggerEventHandler('click', null);

            tick();

            alertSpy.should.have.been.called;
            should.exist(component['identityCards'].get('cardOne'));
        })));

        it('should open the delete-confirm modal and handle cancel', fakeAsync(inject([AlertService], (alertService: AlertService) => {
            let myLoadParticipantsMock = sinon.stub(component, 'loadParticipants');
            let myGetParticipantMock = sinon.stub(component, 'getParticipant');

            myLoadParticipantsMock.returns(Promise.resolve());
            myGetParticipantMock.returns(true);

            fixture.detectChanges();
            tick();

            fixture.detectChanges();
            tick();

            fixture.detectChanges();

            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.reject(1)
            });

            let alertSpy = sinon.spy(alertService.errorStatus$, 'next');

            let revokeElement = fixture.debugElement.queryAll(By.css('.identity'))[4];

            let revokeButton = revokeElement.query(By.css('button'));
            revokeButton.triggerEventHandler('click', null);

            tick();

            alertSpy.should.not.have.been.called;
            should.exist(component['identityCards'].get('cardOne'));
        })));

        it('should handle error', fakeAsync(inject([AlertService], (alertService: AlertService) => {
            let myLoadParticipantsMock = sinon.stub(component, 'loadParticipants');
            let myGetParticipantMock = sinon.stub(component, 'getParticipant');

            myLoadParticipantsMock.returns(Promise.resolve());
            myGetParticipantMock.returns(true);

            fixture.detectChanges();
            tick();

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

            let revokeElement = fixture.debugElement.queryAll(By.css('.identity'))[4];

            let revokeButton = revokeElement.query(By.css('button'));
            revokeButton.triggerEventHandler('click', null);

            tick();

            alertSpy.should.have.been.called;
        })));
    });

    describe('#loadParticipants', () => {

        it('should create a map of participants', fakeAsync(() => {

            let mockParticpantRegistry = sinon.createStubInstance(ParticipantRegistry);
            let mockParticipant1 = sinon.createStubInstance(Resource);
            mockParticipant1.getFullyQualifiedIdentifier.returns('org.animals.Penguin#Emperor');
            let mockParticipant2 = sinon.createStubInstance(Resource);
            mockParticipant2.getFullyQualifiedIdentifier.returns('org.animals.Penguin#King');
            mockParticpantRegistry.getAll.returns([mockParticipant2, mockParticipant1]);
            mockBusinessNetworkConnection.getAllParticipantRegistries.returns(Promise.resolve([mockParticpantRegistry]));

            component['loadParticipants']();

            tick();

            let expected = new Map();
            expected.set('org.animals.Penguin#Emperor', new Resource());
            expected.set('org.animals.Penguin#King', new Resource());
            component['participants'].should.deep.equal(expected);
        }));

        it('should alert if there is an error', fakeAsync(inject([AlertService], (alertService: AlertService) => {

            mockBusinessNetworkConnection.getAllParticipantRegistries.returns(Promise.reject('some error'));

            let alertSpy = sinon.spy(alertService.errorStatus$, 'next');
            alertService.errorStatus$.subscribe((message) => {
                if (message) {
                    message.should.deep.equal('some error');
                }
            });

            component['loadParticipants']();

            tick();

            alertSpy.should.have.been.called;
        })));
    });

    describe('#getParticipant', () => {
        it('should get the specified participant', () => {
            let mockParticipant1 = sinon.createStubInstance(Resource);
            mockParticipant1.getFullyQualifiedIdentifier.returns('org.animals.Penguin#Emperor');
            mockParticipant1.getIdentifier.returns('Emperor');
            mockParticipant1.getType.returns('org.animals.Penguin');
            let mockParticipant2 = sinon.createStubInstance(Resource);
            mockParticipant2.getFullyQualifiedIdentifier.returns('org.animals.Penguin#King');
            mockParticipant2.getIdentifier.returns('King');
            mockParticipant2.getType.returns('org.animals.Penguin');
            let mockParticipant3 = sinon.createStubInstance(Resource);
            mockParticipant3.getFullyQualifiedIdentifier.returns('org.animals.Penguin#Macaroni');
            mockParticipant3.getIdentifier.returns('Macaroni');
            mockParticipant3.getType.returns('org.animals.Penguin');

            component['participants'].set('Emperor', mockParticipant1);
            component['participants'].set('King', mockParticipant2);
            component['participants'].set('Macaroni', mockParticipant2);

            let participant = component['getParticipant']('King');

            participant.getIdentifier().should.equal('King');
            participant.getType().should.equal('org.animals.Penguin');
        });
});
});
