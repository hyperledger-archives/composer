/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Directive, Input } from '@angular/core';
import { TestComponent } from './test.component';
import { ClientService } from '../services/client.service';
import { InitializationService } from '../services/initialization.service';
import { AlertService } from '../services/alert.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import * as sinon from 'sinon';

import * as chai from 'chai';
import { BusinessNetworkConnection } from 'composer-client';

let should = chai.should();

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
    let mockModal;

    let mockBusinessNetworkConnection;

    beforeEach(() => {
        mockClientService = sinon.createStubInstance(ClientService);
        mockInitializationService = sinon.createStubInstance(InitializationService);
        mockAlertService = sinon.createStubInstance(AlertService);
        mockModal = sinon.createStubInstance(NgbModal);
        mockBusinessNetworkConnection = sinon.createStubInstance(BusinessNetworkConnection);

        TestBed.configureTestingModule({
            declarations: [TestComponent, MockRegistryDirective],
            providers: [
                {provide: NgbModal, useValue: mockModal},
                {provide: InitializationService, useValue: mockInitializationService},
                {provide: AlertService, useValue: mockAlertService},
                {provide: ClientService, useValue: mockClientService}
            ]
        });

        fixture = TestBed.createComponent(TestComponent);
        component = fixture.componentInstance;
    });

    describe('ngOnInit', () => {
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

            mockAlertService.errorStatus$ = {next: sinon.stub()};

            component.ngOnInit();

            tick();

            mockAlertService.errorStatus$.next.should.have.been.called;
        }));
    });

    describe('setChosenRegistry', () => {
        it('should set the chosen registry', () => {
            component.setChosenRegistry({id: 'bob'});

            component['chosenRegistry'].should.deep.equal({id: 'bob'});
        });
    });

    describe('submitTransaction', () => {
        it('should submit a transaction', fakeAsync(() => {
            mockAlertService.successStatus$ = {next: sinon.stub()};
            mockModal.open.returns({result: Promise.resolve()});

            component['chosenRegistry'] = 'assetRegistry';
            component['transactionRegistry'] = 'transactionRegistry';

            component.submitTransaction();

            tick();

            component['chosenRegistry'].should.equal('transactionRegistry');
            component['registryReload'].should.equal(false);

            mockAlertService.successStatus$.next.should.have.been.calledWith({title: 'Submit Transaction Successful', text: 'A transaction was successfully submitted', icon: '#icon-transaction'});
        }));

        it('should update transaction registry view', fakeAsync(() => {
            mockAlertService.successStatus$ = {next: sinon.stub()};
            mockModal.open.returns({result: Promise.resolve()});

            component['transactionRegistry'] = 'transactionRegistry';
            component['chosenRegistry'] = 'transactionRegistry';

            component.submitTransaction();

            tick();

            component['chosenRegistry'].should.equal('transactionRegistry');
            component['registryReload'].should.equal(true);

            mockAlertService.successStatus$.next.should.have.been.calledWith({title: 'Submit Transaction Successful', text: 'A transaction was successfully submitted', icon: '#icon-transaction'});
        }));

    });
});
