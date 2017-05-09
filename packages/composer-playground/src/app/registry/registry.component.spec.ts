/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import {
    TestBed,
    ComponentFixture,
    fakeAsync,
    tick
} from '@angular/core/testing';
import { Input, Output, EventEmitter, Directive } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, Subject } from 'rxjs/Rx';

import { AssetRegistry, TransactionRegistry } from 'composer-client';
import { BusinessNetworkDefinition, Serializer, Resource } from 'composer-common';

// Load the implementations that should be tested
import { RegistryComponent } from './registry.component';
import { ResourceComponent } from './../resource/resource.component';

import { ClientService } from '../services/client.service';
import { AlertService } from '../services/alert.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import * as chai from 'chai';

import * as sinon from 'sinon';

let should = chai.should();

@Directive({
    selector: '[checkOverFlow]'
})
class MockCheckOverFlowDirective {
    @Output() public hasOverFlow: EventEmitter<boolean> = new EventEmitter<boolean>();
    @Input() public changed: boolean;
}

describe(`RegistryComponent`, () => {
    let component: RegistryComponent;
    let fixture: ComponentFixture<RegistryComponent>;
    let mockBusinessNetwork;
    let mockSerializer;
    let mockNgbModal;
    let mockAlertService;
    let mockClientService;
    let mockBehaviourSubject;
    let mockResourceComponent;

    let mockAssetRegistry;
    let assetRegistryContents;
    let mockTransactionRegistry;
    let transactionRegistryContents;

    let sandbox;

    beforeEach(() => {
        mockNgbModal = sinon.createStubInstance(NgbModal);
        mockAlertService = sinon.createStubInstance(AlertService);
        mockClientService = sinon.createStubInstance(ClientService);
        mockBusinessNetwork = sinon.createStubInstance(BusinessNetworkDefinition);
        mockSerializer = sinon.createStubInstance(Serializer);
        mockBehaviourSubject = sinon.createStubInstance(BehaviorSubject);
        mockResourceComponent = sinon.createStubInstance(ResourceComponent);

        mockClientService.getBusinessNetwork.returns(mockBusinessNetwork);
        mockBusinessNetwork.getSerializer.returns(mockSerializer);
        mockSerializer.toJSON.returns({$class: 'mock.class'});
        mockBehaviourSubject.next = sinon.stub();

        mockAlertService.errorStatus$ = mockBehaviourSubject;
        mockAlertService.busyStatus$ = mockBehaviourSubject;
        mockAlertService.successStatus$ = mockBehaviourSubject;

        TestBed.configureTestingModule({
            imports: [
                FormsModule
            ],
            declarations: [
                MockCheckOverFlowDirective,
                RegistryComponent,
            ],
            providers: [
                {provide: ClientService, useValue: mockClientService},
                {provide: AlertService, useValue: mockAlertService},
                {provide: NgbModal, useValue: mockNgbModal},
            ]
        });

        fixture = TestBed.createComponent(RegistryComponent);
        component = fixture.componentInstance;
        sandbox = sinon.sandbox.create();

        mockAssetRegistry = sinon.createStubInstance(AssetRegistry);
        mockAssetRegistry.registryType = 'Asset';

        mockTransactionRegistry = sinon.createStubInstance(TransactionRegistry);
        mockTransactionRegistry.registryType = 'Transaction';
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#loadResources', () => {

        beforeEach(() => {
            let asset1 = sinon.createStubInstance(Resource);
            asset1.getIdentifier.returns('1');
            let asset2 = sinon.createStubInstance(Resource);
            asset2.getIdentifier.returns('2');
            let asset3 = sinon.createStubInstance(Resource);
            asset3.getIdentifier.returns('3');
            assetRegistryContents = [asset2, asset3, asset1];

            let trans1 = sinon.createStubInstance(Resource);
            trans1.timestamp = '1';
            let trans2 = sinon.createStubInstance(Resource);
            trans2.timestamp = '2';
            let trans3 = sinon.createStubInstance(Resource);
            trans3.timestamp = '3';

            transactionRegistryContents = [trans1, trans2, trans3];
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should call loadResources when registry is set', () => {
            sandbox.stub(component, 'loadResources');
            mockAssetRegistry.registryType = 'transaction';
            component.registry = mockAssetRegistry;
            component.loadResources.should.be.called;
            component['_registry'].should.equal(mockAssetRegistry);
            component['registryType'].should.equal('transaction');
        });

        it('should not call loadResources if null registry is given', () => {
            sandbox.stub(component, 'loadResources');
            component.registry = null;
            component.loadResources.should.not.be.called;
        });

        it('should call loadResources when reload is set', () => {
            sandbox.stub(component, 'loadResources');
            component['_reload'] = true;
            component.reload = true;
            component.loadResources.should.be.called;
            component['_reload'].should.equal(true);
        });

        it('should not call loadResources if null reload is given', () => {
            sandbox.stub(component, 'loadResources');
            component['_reload'] = null;
            component.reload = true;
            component.loadResources.should.not.to.be.called;
        });

        it('should sort a list of assets by identifier', fakeAsync(() => {
            mockAssetRegistry.getAll.returns(Promise.resolve(assetRegistryContents));
            component['_registry'] = mockAssetRegistry;
            component['registryType'] = mockAssetRegistry.registryType;
            component.loadResources();
            tick();
            component['resources'][0].getIdentifier().should.equal('1');
            component['resources'][1].getIdentifier().should.equal('2');
            component['resources'][2].getIdentifier().should.equal('3');
        }));

        it('should sort a list of transactions by timestamp', fakeAsync(() => {
            mockTransactionRegistry.getAll.returns(Promise.resolve(transactionRegistryContents));
            component['_registry'] = mockTransactionRegistry;
            component['registryType'] = mockTransactionRegistry.registryType;
            component.loadResources();
            tick();
            component['resources'][0].timestamp.should.equal('3');
            component['resources'][1].timestamp.should.equal('2');
            component['resources'][2].timestamp.should.equal('1');
        }));

        it('should call AlertService.errorstatus$.next() on error', fakeAsync(() => {
            const error = 'error';
            mockAssetRegistry.getAll.returns(Promise.reject(error));
            component['_registry'] = mockAssetRegistry;
            component.loadResources();
            tick();
            component['alertService'].errorStatus$.next.should.be.called;
            component['alertService'].errorStatus$.next.should.be.calledWith(error);
        }));
    });

    describe('#serialize', () => {
        it('should return the stringified version of an object', () => {
            mockSerializer.toJSON.returns({$class: 'mock.class'});
            // Resource class is unimportant..
            let result = component.serialize({});
            result.should.equal('{\n  "$class": "mock.class"\n}');
        });
    });

    describe('#expandResource', () => {
        let mockResource;
        beforeEach(() => {
            mockResource = sinon.createStubInstance(Resource);
        });

        it('should set expandResource to null', () => {
            mockResource.getIdentifier.returns('1');
            component['expandedResource'] = '1';

            component.expandResource(mockResource);
            should.not.exist(component['expandedResource']);
        });

        it('should set expandResource to the chosen resource', () => {
            mockResource.getIdentifier.returns('1');
            component['expandedResource'] = '2';

            component.expandResource(mockResource);
            component['expandedResource'].should.equal('1');
        });
    });

    describe('#openNewResourceModal', () => {
        it('should call loadResources', fakeAsync(() => {
            mockNgbModal.open = sandbox.stub().returns({
                componentInstance: sandbox.stub(),
                result: Promise.resolve()
            });
            mockAssetRegistry.id = 'registry_id';
            component['_registry'] = mockAssetRegistry;

            sinon.stub(component, 'loadResources');

            component.openNewResourceModal();
            tick();
            component.loadResources.should.be.called;
        }));
    });

    describe('#hasOverflow', () => {
        it('should take the value of the prameter passed in', () => {
            component.hasOverFlow(true);
            component['showExpand'].should.be.true;
            component.hasOverFlow(false);
            component['showExpand'].should.be.false;
        });
    });

    describe('#editResource', () => {
        let mockAsset;
        beforeEach(() => {
            mockAsset = sinon.createStubInstance(Resource);
            mockAsset.getIdentifier.returns('1');
        });

        it('should call loadResources and set the correct values', fakeAsync(() => {
            let mockNgbModalRef = sandbox.stub();
            mockNgbModalRef.resource = null;

            mockNgbModal.open = sandbox.stub().returns({
                componentInstance: mockNgbModalRef,
                result: Promise.resolve()
            });
            mockAssetRegistry.id = 'registry_id';
            component['_registry'] = mockAssetRegistry;

            sinon.stub(component, 'loadResources');

            component.editResource(mockAsset);
            tick();
            mockNgbModalRef.resource.should.equal(mockAsset);
            mockNgbModalRef.registryID.should.equal('registry_id');
            component.loadResources.should.be.called;
        }));
    });

    describe('#openDeleteResourceModal', () => {
        let mockNgbModalRef;
        let mockResource;

        beforeEach(() => {
            mockResource = sinon.createStubInstance(Resource);
            mockResource.getIdentifier.returns('1');
            mockNgbModalRef = {
                result: Promise.resolve(true),
                componentInstance: {
                    confirmMessage: '',
                }
            };
            mockNgbModal.open = sandbox.stub().returns(mockNgbModalRef);
        });

        it('should run loadResources', fakeAsync(() => {
            sandbox.stub(component, 'loadResources');
            mockAssetRegistry.remove.returns(Promise.resolve());
            component['_registry'] = mockAssetRegistry;
            component.openDeleteResourceModal(mockResource);
            tick();
            tick();
            component.loadResources.should.be.called;
            mockNgbModalRef.componentInstance.confirmMessage.should.equal('Please confirm that you want to delete Asset: ' + mockResource.getIdentifier());
        }));

        it('should create a new error with the alert service', fakeAsync(() => {
            mockAssetRegistry.remove.returns(Promise.reject('error message'));
            component['_registry'] = mockAssetRegistry;
            component.openDeleteResourceModal(mockResource);
            tick();
            tick();
            mockNgbModalRef.componentInstance.confirmMessage.should.equal('Please confirm that you want to delete Asset: ' + mockResource.getIdentifier());
            mockAlertService.errorStatus$.next.should.be.called;
            mockAlertService.errorStatus$.next.should.be
            .calledWith('Removing the selected item from the registry failed:error message');
        }));

        it('should do nothing', fakeAsync(() => {
            sandbox.stub(component, 'loadResources');
            mockNgbModalRef.result = Promise.resolve(false);
            component['_registry'] = mockAssetRegistry;
            component.openDeleteResourceModal(mockResource);
            mockAlertService.errorStatus$.next.should.not.be.called;
            component.loadResources.should.not.be.called;
        }));
    });

    describe('#isTransactionRegistry', () => {
        it('should return true if reigstry type is transaction', () => {
            component['registryType'] = 'Transaction';

            component['isTransactionRegistry']().should.be.true;
        });

        it('should return false if registry type is not transaction', () => {
            component['registryType'] = 'NotTransaction';

            component['isTransactionRegistry']().should.be.false;
        });
    });
});
