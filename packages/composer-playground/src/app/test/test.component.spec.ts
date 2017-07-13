/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Directive, Input, Component } from '@angular/core';
import { TestComponent } from './test.component';
import { FooterComponent } from '../footer/footer.component';
import { ClientService } from '../services/client.service';
import { InitializationService } from '../services/initialization.service';
import { TransactionService } from '../services/transaction.service';
import { AlertService } from '../basic-modals/alert.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Resource } from 'composer-common';

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
    let mockInitializationService;
    let mockAlertService;
    let mockTransactionService;
    let mockModal;

    let mockBusinessNetworkConnection;

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();

        mockClientService = sinon.createStubInstance(ClientService);
        mockInitializationService = sinon.createStubInstance(InitializationService);
        mockAlertService = sinon.createStubInstance(AlertService);
        mockModal = sinon.createStubInstance(NgbModal);
        mockBusinessNetworkConnection = sinon.createStubInstance(BusinessNetworkConnection);
        mockTransactionService = sinon.createStubInstance(TransactionService);
        mockBusinessNetworkConnection.listenerCount.returns(0);
        mockBusinessNetworkConnection.on = sinon.stub();
        mockBusinessNetworkConnection.removeAllListeners = sinon.stub();
        mockClientService.getBusinessNetworkConnection.returns(mockBusinessNetworkConnection);

        TestBed.configureTestingModule({
            declarations: [TestComponent, MockRegistryDirective, MockFooterComponent],
            providers: [
                {provide: NgbModal, useValue: mockModal},
                {provide: InitializationService, useValue: mockInitializationService},
                {provide: AlertService, useValue: mockAlertService},
                {provide: ClientService, useValue: mockClientService},
                {provide: TransactionService, useValue: mockTransactionService}
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
            mockAlertService.errorStatus$ = {next: sinon.stub()};
        });

        it('should create', () => {
            component.should.be.ok;
        });

        it('should load all the registries', fakeAsync(() => {
            mockInitializationService.initialize.returns(Promise.resolve());

            mockBusinessNetworkConnection.getAllAssetRegistries.returns(Promise.resolve([{id: 'asset.fred'}, {id: 'asset.bob'}]));
            mockBusinessNetworkConnection.getAllParticipantRegistries.returns(Promise.resolve([{id: 'participant.fred'}, {id: 'participant.bob'}]));
            mockBusinessNetworkConnection.getTransactionRegistry.returns(Promise.resolve('transactionRegistry'));
            mockClientService.getBusinessNetworkConnection.returns(mockBusinessNetworkConnection);

            component.ngOnInit();

            tick();

            mockClientService.getBusinessNetworkConnection.should.have.been.called;
            mockBusinessNetworkConnection.getAllAssetRegistries.should.have.been.called;

            component['assetRegistries'].length.should.equal(2);

            component['assetRegistries'][0].should.deep.equal({id: 'asset.bob', displayName: 'bob'});
            component['assetRegistries'][1].should.deep.equal({id: 'asset.fred', displayName: 'fred'});

            mockBusinessNetworkConnection.getAllParticipantRegistries.should.have.been.called;

            component['participantRegistries'].length.should.equal(2);

            component['participantRegistries'][0].should.deep.equal({id: 'participant.bob', displayName: 'bob'});
            component['participantRegistries'][1].should.deep.equal({id: 'participant.fred', displayName: 'fred'});

            mockBusinessNetworkConnection.getTransactionRegistry.should.have.been.called;

            component['transactionRegistry'].should.equal('transactionRegistry');

            component['chosenRegistry'].should.deep.equal({id: 'participant.bob', displayName: 'bob'});
        }));

        it('should set chosen registry to first asset one if no participant registries', fakeAsync(() => {
            mockInitializationService.initialize.returns(Promise.resolve());

            mockBusinessNetworkConnection.getAllAssetRegistries.returns(Promise.resolve([{id: 'asset.fred'}, {id: 'asset.bob'}]));
            mockBusinessNetworkConnection.getAllParticipantRegistries.returns(Promise.resolve([]));
            mockBusinessNetworkConnection.getTransactionRegistry.returns(Promise.resolve('transactionRegistry'));
            mockClientService.getBusinessNetworkConnection.returns(mockBusinessNetworkConnection);

            component.ngOnInit();

            tick();

            mockClientService.getBusinessNetworkConnection.should.have.been.called;
            mockBusinessNetworkConnection.getAllAssetRegistries.should.have.been.called;

            component['assetRegistries'].length.should.equal(2);

            component['assetRegistries'][0].should.deep.equal({id: 'asset.bob', displayName: 'bob'});
            component['assetRegistries'][1].should.deep.equal({id: 'asset.fred', displayName: 'fred'});

            mockBusinessNetworkConnection.getAllParticipantRegistries.should.have.been.called;

            component['participantRegistries'].length.should.equal(0);

            mockBusinessNetworkConnection.getTransactionRegistry.should.have.been.called;

            component['transactionRegistry'].should.equal('transactionRegistry');

            component['chosenRegistry'].should.deep.equal({id: 'asset.bob', displayName: 'bob'});
        }));

        it('should set chosen registry to transaction registry if no asset or participant registries', fakeAsync(() => {
            mockInitializationService.initialize.returns(Promise.resolve());

            mockBusinessNetworkConnection.getAllAssetRegistries.returns(Promise.resolve([]));
            mockBusinessNetworkConnection.getAllParticipantRegistries.returns(Promise.resolve([]));
            mockBusinessNetworkConnection.getTransactionRegistry.returns(Promise.resolve('transactionRegistry'));
            mockClientService.getBusinessNetworkConnection.returns(mockBusinessNetworkConnection);

            component.ngOnInit();

            tick();

            mockClientService.getBusinessNetworkConnection.should.have.been.called;
            mockBusinessNetworkConnection.getAllAssetRegistries.should.have.been.called;

            component['assetRegistries'].length.should.equal(0);

            mockBusinessNetworkConnection.getAllParticipantRegistries.should.have.been.called;

            component['participantRegistries'].length.should.equal(0);

            mockBusinessNetworkConnection.getTransactionRegistry.should.have.been.called;

            component['transactionRegistry'].should.equal('transactionRegistry');

            component['chosenRegistry'].should.deep.equal('transactionRegistry');
        }));

        it('should handle error', fakeAsync(() => {
            mockInitializationService.initialize.returns(Promise.reject('some error'));
            mockClientService.getBusinessNetworkConnection.returns(mockBusinessNetworkConnection);

            mockAlertService.errorStatus$ = {next: sinon.stub()};

            component.ngOnInit();

            tick();

            mockAlertService.errorStatus$.next.should.have.been.called;
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
        let mockTransaction;
        beforeEach(() => {
            mockTransaction = sinon.createStubInstance(Resource);
            mockTransaction.getIdentifier.returns(1);
        });

        it('should submit a transaction', fakeAsync(() => {
            component['eventsTriggered'] = ['event', 'event'];
            mockAlertService.successStatus$ = {next: sinon.stub()};
            mockModal.open.returns({result: Promise.resolve(mockTransaction)});

            component['chosenRegistry'] = 'assetRegistry';
            component['transactionRegistry'] = 'transactionRegistry';

            component.submitTransaction();

            tick();

            component['chosenRegistry'].should.equal('transactionRegistry');
            component['registryReload'].should.equal(false);

            mockAlertService.successStatus$.next.should.have.been.calledWith({title: 'Submit Transaction Successful', text: '<p>Transaction ID <b>1</b> was submitted</p>', icon: '#icon-transaction', link: '2 events triggered', linkCallback: sinon.match.func});
        }));

        it('should submit a transaction with 1 event', fakeAsync(() => {
            mockBusinessNetworkConnection.listenerCount.returns(1);
            component['eventsTriggered'] = ['event'];
            mockAlertService.successStatus$ = {next: sinon.stub()};
            mockModal.open.returns({result: Promise.resolve(mockTransaction)});

            component['chosenRegistry'] = 'assetRegistry';
            component['transactionRegistry'] = 'transactionRegistry';

            component.submitTransaction();

            tick();

            component['chosenRegistry'].should.equal('transactionRegistry');
            component['registryReload'].should.equal(false);

            mockAlertService.successStatus$.next.should.have.been.calledWith({title: 'Submit Transaction Successful', text: '<p>Transaction ID <b>1</b> was submitted</p>', icon: '#icon-transaction', link: '1 event triggered', linkCallback: sinon.match.func});
        }));

        it('should update transaction registry view', fakeAsync(() => {
            mockAlertService.successStatus$ = {next: sinon.stub()};
            mockModal.open.returns({result: Promise.resolve(mockTransaction)});

            component['transactionRegistry'] = 'transactionRegistry';
            component['chosenRegistry'] = 'transactionRegistry';

            component.submitTransaction();

            tick();

            component['chosenRegistry'].should.equal('transactionRegistry');
            component['registryReload'].should.equal(true);

            mockAlertService.successStatus$.next.should.have.been.calledWith({title: 'Submit Transaction Successful', text: '<p>Transaction ID <b>1</b> was submitted</p>', icon: '#icon-transaction', link: null, linkCallback: null});
        }));

    });
});
