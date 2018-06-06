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
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Component, Directive, Input } from '@angular/core';
import { TestComponent } from './test.component';
import { ClientService } from '../services/client.service';
import { AlertService } from '../basic-modals/alert.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BusinessNetworkDefinition, Introspector, Resource, TransactionDeclaration } from 'composer-common';
import { DrawerDismissReasons } from '../common/drawer';

import * as sinon from 'sinon';

import * as chai from 'chai';
import { BusinessNetworkConnection } from 'composer-client';

let should = chai.should();

@Component({
    selector: 'app-footer',
    template: ''
})
class MockFooterComponent {

}

@Directive({
    selector: 'registry'
})
class MockRegistryDirective {

    @Input()
    public registry: string;
    @Input()
    public reload: boolean = false;
}

describe('TestComponent', () => {
    let component: TestComponent;
    let fixture: ComponentFixture<TestComponent>;

    let mockClientService;
    let mockAlertService;
    let mockModal;
    let mockIntrospector;
    let mockBusinessNetwork;
    let mockBusinessNetworkConnection;
    let mockTransaction;

    class MockModelClass {
        isAbstract(): boolean {
            return true;
        }
    }

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();

        mockClientService = sinon.createStubInstance(ClientService);
        mockAlertService = sinon.createStubInstance(AlertService);
        mockModal = sinon.createStubInstance(NgbModal);
        mockBusinessNetworkConnection = sinon.createStubInstance(BusinessNetworkConnection);
        mockBusinessNetwork = sinon.createStubInstance(BusinessNetworkDefinition);
        mockIntrospector = sinon.createStubInstance(Introspector);
        mockTransaction = sinon.createStubInstance(TransactionDeclaration);

        mockClientService.getBusinessNetwork.returns(mockBusinessNetwork);
        mockBusinessNetwork.getIntrospector.returns(mockIntrospector);
        mockBusinessNetworkConnection.listenerCount.returns(0);
        mockBusinessNetworkConnection.on = sinon.stub();
        mockBusinessNetworkConnection.removeAllListeners = sinon.stub();
        mockClientService.getBusinessNetworkConnection.returns(mockBusinessNetworkConnection);

        TestBed.configureTestingModule({
            declarations: [TestComponent, MockRegistryDirective, MockFooterComponent],
            providers: [
                {provide: NgbModal, useValue: mockModal},
                {provide: AlertService, useValue: mockAlertService},
                {provide: ClientService, useValue: mockClientService}
            ],
        });

        fixture = TestBed.createComponent(TestComponent);
        component = fixture.componentInstance;
    });

    afterEach(() => {
        sandbox.reset();
    });

    describe('ngOnInit', () => {
        beforeEach(() => {
            mockIntrospector.getClassDeclarations.returns([mockTransaction]);
            mockAlertService.errorStatus$ = {next: sinon.stub()};
        });

        it('should create', () => {
            component.should.be.ok;
        });

        it('should load all the registries and hasTransactions should be true', fakeAsync(() => {
            mockClientService.ensureConnected.returns(Promise.resolve());

            mockBusinessNetworkConnection.getAllAssetRegistries.returns(Promise.resolve([{id: 'asset.fred'}, {id: 'asset.bob'}]));
            mockBusinessNetworkConnection.getAllParticipantRegistries.returns(Promise.resolve([{id: 'participant.fred'}, {id: 'participant.bob'}]));
            mockBusinessNetworkConnection.getHistorian.returns(Promise.resolve('historianRegistry'));
            mockClientService.getBusinessNetworkConnection.returns(mockBusinessNetworkConnection);

            component.ngOnInit();
            tick();

            mockClientService.getBusinessNetworkConnection.should.have.been.called;
            mockBusinessNetworkConnection.getAllAssetRegistries.should.have.been.called;

            component['registries']['assets'].length.should.equal(2);

            component['registries']['assets'][0].should.deep.equal({id: 'asset.bob', displayName: 'bob'});
            component['registries']['assets'][1].should.deep.equal({id: 'asset.fred', displayName: 'fred'});

            mockBusinessNetworkConnection.getAllParticipantRegistries.should.have.been.called;

            component['registries']['participants'].length.should.equal(2);

            component['registries']['participants'][0].should.deep.equal({id: 'participant.bob', displayName: 'bob'});
            component['registries']['participants'][1].should.deep.equal({id: 'participant.fred', displayName: 'fred'});

            mockBusinessNetworkConnection.getHistorian.should.have.been.called;

            component['registries']['historian'].should.equal('historianRegistry');

            component['chosenRegistry'].should.deep.equal({id: 'participant.bob', displayName: 'bob'});

            mockClientService.getBusinessNetwork.should.have.been.called;
            mockBusinessNetwork.getIntrospector.should.have.been.called;
            mockIntrospector.getClassDeclarations.should.have.been.called;
            component.hasTransactions.should.be.true;
        }));

        it('should load all the registries and hasTransactions should be false when there are no transactions', fakeAsync(() => {
            mockClientService.ensureConnected.returns(Promise.resolve());

            mockBusinessNetworkConnection.getAllAssetRegistries.returns(Promise.resolve([{id: 'asset.fred'}, {id: 'asset.bob'}]));
            mockBusinessNetworkConnection.getAllParticipantRegistries.returns(Promise.resolve([{id: 'participant.fred'}, {id: 'participant.bob'}]));
            mockBusinessNetworkConnection.getHistorian.returns(Promise.resolve('historianRegistry'));
            mockClientService.getBusinessNetworkConnection.returns(mockBusinessNetworkConnection);
            mockIntrospector.getClassDeclarations.returns([new MockModelClass()]);

            component.ngOnInit();

            tick();

            mockClientService.getBusinessNetworkConnection.should.have.been.called;
            mockBusinessNetworkConnection.getAllAssetRegistries.should.have.been.called;

            component['registries']['assets'].length.should.equal(2);
            component['registries']['assets'][0].should.deep.equal({id: 'asset.bob', displayName: 'bob'});
            component['registries']['assets'][1].should.deep.equal({id: 'asset.fred', displayName: 'fred'});

            mockBusinessNetworkConnection.getAllParticipantRegistries.should.have.been.called;

            component['registries']['participants'].length.should.equal(2);

            component['registries']['participants'][0].should.deep.equal({id: 'participant.bob', displayName: 'bob'});
            component['registries']['participants'][1].should.deep.equal({id: 'participant.fred', displayName: 'fred'});

            mockBusinessNetworkConnection.getHistorian.should.have.been.called;

            component['registries']['historian'].should.equal('historianRegistry');

            component['chosenRegistry'].should.deep.equal({id: 'participant.bob', displayName: 'bob'});

            mockClientService.getBusinessNetwork.should.have.been.called;
            mockBusinessNetwork.getIntrospector.should.have.been.called;
            mockIntrospector.getClassDeclarations.should.have.been.called;
            component.hasTransactions.should.be.false;
        }));

        it('should load all the registries and hasTransactions should be false when there are only system transactions', fakeAsync(() => {
            mockClientService.ensureConnected.returns(Promise.resolve());

            mockBusinessNetworkConnection.getAllAssetRegistries.returns(Promise.resolve([{id: 'asset.fred'}, {id: 'asset.bob'}]));
            mockBusinessNetworkConnection.getAllParticipantRegistries.returns(Promise.resolve([{id: 'participant.fred'}, {id: 'participant.bob'}]));
            mockBusinessNetworkConnection.getHistorian.returns(Promise.resolve('historianRegistry'));
            mockClientService.getBusinessNetworkConnection.returns(mockBusinessNetworkConnection);
            mockTransaction.isSystemType.returns(true);

            component.ngOnInit();

            tick();

            mockClientService.getBusinessNetworkConnection.should.have.been.called;
            mockBusinessNetworkConnection.getAllAssetRegistries.should.have.been.called;

            component['registries']['assets'].length.should.equal(2);
            component['registries']['assets'][0].should.deep.equal({id: 'asset.bob', displayName: 'bob'});
            component['registries']['assets'][1].should.deep.equal({id: 'asset.fred', displayName: 'fred'});

            mockBusinessNetworkConnection.getAllParticipantRegistries.should.have.been.called;

            component['registries']['participants'].length.should.equal(2);

            component['registries']['participants'][0].should.deep.equal({id: 'participant.bob', displayName: 'bob'});
            component['registries']['participants'][1].should.deep.equal({id: 'participant.fred', displayName: 'fred'});

            mockBusinessNetworkConnection.getHistorian.should.have.been.called;

            component['registries']['historian'].should.equal('historianRegistry');

            component['chosenRegistry'].should.deep.equal({id: 'participant.bob', displayName: 'bob'});

            mockClientService.getBusinessNetwork.should.have.been.called;
            mockBusinessNetwork.getIntrospector.should.have.been.called;
            mockIntrospector.getClassDeclarations.should.have.been.called;
            component.hasTransactions.should.be.false;
        }));

        it('should set chosen registry to first asset one if no participant registries', fakeAsync(() => {
            mockClientService.ensureConnected.returns(Promise.resolve());

            mockBusinessNetworkConnection.getAllAssetRegistries.returns(Promise.resolve([{id: 'asset.fred'}, {id: 'asset.bob'}]));
            mockBusinessNetworkConnection.getAllParticipantRegistries.returns(Promise.resolve([]));
            mockBusinessNetworkConnection.getHistorian.returns(Promise.resolve('historianRegistry'));
            mockClientService.getBusinessNetworkConnection.returns(mockBusinessNetworkConnection);

            component.ngOnInit();

            tick();

            mockClientService.getBusinessNetworkConnection.should.have.been.called;
            mockBusinessNetworkConnection.getAllAssetRegistries.should.have.been.called;

            component['registries']['assets'].length.should.equal(2);

            component['registries']['assets'][0].should.deep.equal({id: 'asset.bob', displayName: 'bob'});
            component['registries']['assets'][1].should.deep.equal({id: 'asset.fred', displayName: 'fred'});

            mockBusinessNetworkConnection.getAllParticipantRegistries.should.have.been.called;

            component['registries']['participants'].length.should.equal(0);

            mockBusinessNetworkConnection.getHistorian.should.have.been.called;

            component['registries']['historian'].should.equal('historianRegistry');

            component['chosenRegistry'].should.deep.equal({id: 'asset.bob', displayName: 'bob'});
        }));

        it('should set chosen registry to historian registry if no asset or participant registries', fakeAsync(() => {
            mockClientService.ensureConnected.returns(Promise.resolve());

            mockBusinessNetworkConnection.getAllAssetRegistries.returns(Promise.resolve([]));
            mockBusinessNetworkConnection.getAllParticipantRegistries.returns(Promise.resolve([]));
            mockBusinessNetworkConnection.getHistorian.returns(Promise.resolve('historianRegistry'));
            mockClientService.getBusinessNetworkConnection.returns(mockBusinessNetworkConnection);

            component.ngOnInit();

            tick();

            mockClientService.getBusinessNetworkConnection.should.have.been.called;
            mockBusinessNetworkConnection.getAllAssetRegistries.should.have.been.called;

            component['registries']['assets'].length.should.equal(0);

            mockBusinessNetworkConnection.getAllParticipantRegistries.should.have.been.called;

            component['registries']['participants'].length.should.equal(0);

            mockBusinessNetworkConnection.getHistorian.should.have.been.called;

            component['registries']['historian'].should.equal('historianRegistry');

            component['chosenRegistry'].should.deep.equal('historianRegistry');
        }));

        it('should handle error on initialization', fakeAsync(() => {
            mockClientService.ensureConnected.returns(Promise.reject('some error'));
            mockClientService.getBusinessNetworkConnection.returns(mockBusinessNetworkConnection);

            mockAlertService.errorStatus$ = {next: sinon.stub()};

            component.ngOnInit();

            tick();

            mockAlertService.errorStatus$.next.should.have.been.called;
        }));

        it('should handle error on retrieving a registry', fakeAsync(() => {
            mockClientService.ensureConnected.returns(Promise.resolve());

            mockClientService.getBusinessNetworkConnection.returns(mockBusinessNetworkConnection);
            mockBusinessNetworkConnection.getAllAssetRegistries.returns(Promise.reject('some error'));

            mockAlertService.errorStatus$ = {next: sinon.stub()};

            component.ngOnInit();

            tick();

            mockAlertService.errorStatus$.next.should.have.been.called.once;
        }));
    });

    describe('ngOnDestroy', () => {
        it('should remove all event listeners', () => {
            component.ngOnDestroy();
            mockBusinessNetworkConnection.removeAllListeners.should.have.been.called;
        });
    });

    describe('setChosenRegistry', () => {
        it('should set the chosen registry', () => {
            component.setChosenRegistry({id: 'bob'});

            component['chosenRegistry'].should.deep.equal({id: 'bob'});
        });
    });

    describe('submitTransaction', () => {
        beforeEach(() => {
            mockTransaction = sinon.createStubInstance(Resource);
            mockTransaction.getIdentifier.returns(1);
        });

        it('should submit a transaction', fakeAsync(() => {
            component['eventsTriggered'] = ['event', 'event'];
            mockAlertService.successStatus$ = {next: sinon.stub()};
            mockModal.open.returns({result: Promise.resolve(mockTransaction)});

            component.submitTransaction();

            tick();

            component['registryReload'].should.equal(true);

            mockAlertService.successStatus$.next.should.have.been.calledWith({
                title: 'Submit Transaction Successful',
                text: '<p>Transaction ID <b>1</b> was submitted</p>',
                icon: '#icon-transaction',
                link: '2 events triggered',
                linkCallback: sinon.match.func
            });
        }));

        it('should submit a transaction with 1 event', fakeAsync(() => {
            mockBusinessNetworkConnection.listenerCount.returns(1);
            component['eventsTriggered'] = ['event'];
            mockAlertService.successStatus$ = {next: sinon.stub()};
            mockModal.open.returns({result: Promise.resolve(mockTransaction)});

            component.submitTransaction();

            tick();

            component['registryReload'].should.equal(true);

            mockAlertService.successStatus$.next.should.have.been.calledWith({
                title: 'Submit Transaction Successful',
                text: '<p>Transaction ID <b>1</b> was submitted</p>',
                icon: '#icon-transaction',
                link: '1 event triggered',
                linkCallback: sinon.match.func
            });
        }));

        it('should handle a transaction that doesn\'t have any events', fakeAsync(() => {
            component['eventsTriggered'] = [];
            mockAlertService.successStatus$ = {next: sinon.stub()};
            mockModal.open.returns({result: Promise.resolve(mockTransaction)});

            component.submitTransaction();

            tick();

            component['registryReload'].should.equal(true);

            mockAlertService.successStatus$.next.should.have.been.calledWith({
                title: 'Submit Transaction Successful',
                text: '<p>Transaction ID <b>1</b> was submitted</p>',
                icon: '#icon-transaction',
                link: null,
                linkCallback: null
            });
        }));

        it('should handle error', fakeAsync(() => {
            component['eventsTriggered'] = ['event', 'event'];
            mockAlertService.errorStatus$ = {next: sinon.stub()};
            mockModal.open.returns({result: Promise.reject('some error')});

            component.submitTransaction();

            tick();

            component['registryReload'].should.equal(false);

            mockAlertService.errorStatus$.next.should.have.been.calledWith('some error');
        }));

        it('should handle cancel by ESC key without raising an error modal', fakeAsync(() => {
            component['eventsTriggered'] = ['event', 'event'];
            mockAlertService.errorStatus$ = {next: sinon.stub()};
            mockModal.open.returns({result: Promise.reject(DrawerDismissReasons.ESC)});

            component.submitTransaction();

            tick();

            component['registryReload'].should.equal(false);

            mockAlertService.errorStatus$.next.should.not.have.been.called;
        }));
    });

    describe('initializeEventListener', () => {
        it('should initialize', () => {
            mockBusinessNetworkConnection.listenerCount.returns(0);
            mockClientService.getBusinessNetworkConnection.returns(mockBusinessNetworkConnection);

            component.initializeEventListener();

            mockBusinessNetworkConnection.listenerCount.should.have.been.called;
            mockBusinessNetworkConnection.on.should.have.been.called;
        });

        it('should not initialize if already initialized', () => {
            mockBusinessNetworkConnection.listenerCount.returns(1);
            mockClientService.getBusinessNetworkConnection.returns(mockBusinessNetworkConnection);

            component.initializeEventListener();

            mockBusinessNetworkConnection.listenerCount.should.have.been.called;
            mockBusinessNetworkConnection.on.should.not.have.been.called;
        });
    });
});
