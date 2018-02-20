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
import {
    TestBed,
    ComponentFixture,
    fakeAsync,
    tick
} from '@angular/core/testing';
import { Input, Output, EventEmitter, Directive } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, Subject } from 'rxjs/Rx';

import { AssetRegistry, TransactionRegistry, Historian } from 'composer-client';
import { BusinessNetworkDefinition, Serializer, Resource } from 'composer-common';

// Load the implementations that should be tested
import { RegistryComponent } from './registry.component';
import { ResourceComponent } from '../resource/resource.component';

import { ClientService } from '../../services/client.service';
import { AlertService } from '../../basic-modals/alert.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { DrawerDismissReasons } from '../../common/drawer';

import * as chai from 'chai';

import * as sinon from 'sinon';

let should = chai.should();

@Directive({
    selector: '[checkOverFlow]'
})
class MockCheckOverFlowDirective {
    @Output() public hasOverFlow: EventEmitter<boolean> = new EventEmitter<boolean>();
    @Input() public changed: boolean;
    @Input() public expanded: boolean;
}

@Directive({
    selector: '[ngbTooltip]'
})
class MockToolTipDirective {
    @Input() public ngbTooltip: string;
    @Input() public placement: string;
    @Input() public container: string;
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
    let mockHistorian;
    let historianContents;

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
                MockToolTipDirective,
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

        mockHistorian = sinon.createStubInstance(Historian);
        mockHistorian.registryType = 'Asset';
        mockHistorian.id = 'org.hyperledger.composer.system.HistorianRecord';
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
            trans1.transactionTimestamp = '1';
            let trans2 = sinon.createStubInstance(Resource);
            trans2.transactionTimestamp = '2';
            let trans3 = sinon.createStubInstance(Resource);
            trans3.transactionTimestamp = '3';

            historianContents = [trans1, trans2, trans3];
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should call loadResources when registry is set', () => {
            sandbox.stub(component, 'loadResources');
            mockAssetRegistry.id = 'org.hyperledger.composer.system.HistorianRecord';
            component.registry = mockAssetRegistry;
            component.loadResources.should.be.called;
            component['_registry'].should.equal(mockAssetRegistry);
            component['registryId'].should.equal('org.hyperledger.composer.system.HistorianRecord');
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
            component['registryId'] = mockAssetRegistry.id;
            component.loadResources();
            tick();
            component['resources'][0].getIdentifier().should.equal('1');
            component['resources'][1].getIdentifier().should.equal('2');
            component['resources'][2].getIdentifier().should.equal('3');
        }));

        it('should sort a list of historian resources by timestamp', fakeAsync(() => {
            mockHistorian.getAll.returns(Promise.resolve(historianContents));
            component['_registry'] = mockHistorian;
            component['registryId'] = mockHistorian.id;
            component.loadResources();
            tick();
            component['resources'][0].transactionTimestamp.should.equal('3');
            component['resources'][1].transactionTimestamp.should.equal('2');
            component['resources'][2].transactionTimestamp.should.equal('1');
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

        it('shoud handle closing by escape', fakeAsync(() => {
            mockNgbModal.open = sandbox.stub().returns({
                componentInstance: sandbox.stub(),
                result: Promise.reject(DrawerDismissReasons.ESC)
            });
            mockAssetRegistry.id = 'registry_id';
            component['_registry'] = mockAssetRegistry;

            sinon.stub(component, 'loadResources');

            component.openNewResourceModal();
            tick();
            mockAlertService.errorStatus$.next.should.not.have.been.called;
        }));

        it('should handle closing due to an error', fakeAsync(() => {
            mockNgbModal.open = sandbox.stub().returns({
                componentInstance: sandbox.stub(),
                result: Promise.reject('error message')
            });
            mockAssetRegistry.id = 'registry_id';
            component['_registry'] = mockAssetRegistry;

            sinon.stub(component, 'loadResources');

            component.openNewResourceModal();
            tick();
            mockAlertService.errorStatus$.next.should.have.been.calledWith('error message');
        }));
    });

    describe('#hasOverflow', () => {
        it('should add resource to list if has over flow', () => {
            let resource = {
                getIdentifier: sinon.stub().returns('myId'),
                id: 'myId'
            };
            component.hasOverFlow(true, resource);

            component['overFlowedResources']['myId'].should.not.be.null;
        });

        it('should not add resource to list if hasn\'t got over flow', () => {
            let resource = {
                getIdentifier: sinon.stub().returns('myId'),
                id: 'myId'
            };
            component.hasOverFlow(false, resource);

            should.not.exist(component['overFlowedResources']['myId']);
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
            mockNgbModalRef.registryId.should.equal('registry_id');
            component.loadResources.should.be.called;
        }));

        it('should handle closing by escape', fakeAsync(() => {
            let mockNgbModalRef = sandbox.stub();
            mockNgbModalRef.resource = null;

            mockNgbModal.open = sandbox.stub().returns({
                componentInstance: mockNgbModalRef,
                result: Promise.reject(DrawerDismissReasons.ESC)
            });
            mockAssetRegistry.id = 'registry_id';
            component['_registry'] = mockAssetRegistry;

            sinon.stub(component, 'loadResources');

            component.editResource(mockAsset);
            tick();
            mockAlertService.errorStatus$.next.should.not.have.been.called;
        }));

        it('should handle closing due to an error', fakeAsync(() => {
            let mockNgbModalRef = sandbox.stub();
            mockNgbModalRef.resource = null;
            mockNgbModal.open = sandbox.stub().returns({
                componentInstance: mockNgbModalRef,
                result: Promise.reject('error message')
            });
            mockAssetRegistry.id = 'registry_id';
            component['_registry'] = mockAssetRegistry;

            sinon.stub(component, 'loadResources');

            component.editResource(mockAsset);
            tick();
            mockAlertService.errorStatus$.next.should.have.been.calledWith('error message');
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
            mockNgbModalRef.componentInstance.deleteMessage.should.equal('This action will be recorded in the Historian, and cannot be reversed. Are you sure you want to delete?');
        }));

        it('should create a new error with the alert service', fakeAsync(() => {
            mockAssetRegistry.remove.returns(Promise.reject('error message'));
            component['_registry'] = mockAssetRegistry;
            component.openDeleteResourceModal(mockResource);
            tick();
            tick();
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

        it('should handle closing by escape', fakeAsync(() => {
            sandbox.stub(component, 'loadResources');
            mockNgbModalRef.result = Promise.reject(DrawerDismissReasons.ESC);
            component['_registry'] = mockAssetRegistry;
            component.openDeleteResourceModal(mockResource);
            tick();
            mockAlertService.errorStatus$.next.should.not.have.been.called;
            component.loadResources.should.not.have.been.called;
        }));

        it('should handle closing due to an error', fakeAsync(() => {
            sandbox.stub(component, 'loadResources');
            mockNgbModalRef.result = Promise.reject('error message');
            component['_registry'] = mockAssetRegistry;
            component.openDeleteResourceModal(mockResource);
            tick();
            mockAlertService.errorStatus$.next.should.have.been.calledWith('error message');
            component.loadResources.should.not.have.been.called;
        }));
    });

    describe('viewTransactionData', () => {
        it('should open the modal', fakeAsync(() => {
            mockClientService.resolveTransactionRelationship.returns(Promise.resolve({$class: 'myTransaction'}));

            let componentInstance = {
                transaction: {},
                events: []
            };

            mockNgbModal.open = sinon.stub().returns({
                componentInstance: componentInstance,
                result: Promise.resolve()
            });

            let mockTransaction = {mock: 'transaction', eventsEmitted: ['event 1']};
            component.viewTransactionData(mockTransaction);

            tick();

            mockNgbModal.open.should.have.been.called;
            componentInstance.transaction.should.deep.equal({$class: 'myTransaction'});
            componentInstance.events.should.deep.equal(['event 1']);
        }));

        it('should handle error', fakeAsync(() => {
            mockClientService.resolveTransactionRelationship.returns(Promise.resolve({$class: 'myTransaction'}));

            let componentInstance = {
                transaction: {},
                events: []
            };

            mockNgbModal.open = sinon.stub().returns({
                componentInstance: componentInstance,
                result: Promise.reject('some error')
            });

            let mockTransaction = {mock: 'transaction', eventsEmitted: ['event 1']};
            component.viewTransactionData(mockTransaction);

            tick();

            mockNgbModal.open.should.have.been.called;
            componentInstance.transaction.should.deep.equal({$class: 'myTransaction'});
            componentInstance.events.should.deep.equal(['event 1']);

            mockAlertService.errorStatus$.next.should.have.been.calledWith('some error');
        }));

        it('should handle escape', fakeAsync(() => {
            mockClientService.resolveTransactionRelationship.returns(Promise.resolve({$class: 'myTransaction'}));

            let componentInstance = {
                transaction: {},
                events: []
            };

            mockNgbModal.open = sinon.stub().returns({
                componentInstance: componentInstance,
                result: Promise.reject(DrawerDismissReasons.ESC)
            });

            let mockTransaction = {mock: 'transaction', eventsEmitted: ['event 1']};
            component.viewTransactionData(mockTransaction);

            tick();

            mockNgbModal.open.should.have.been.called;
            componentInstance.transaction.should.deep.equal({$class: 'myTransaction'});
            componentInstance.events.should.deep.equal(['event 1']);

            mockAlertService.errorStatus$.next.should.not.have.been.called;
        }));
    });

    describe('updateTableScroll', () => {
        it('should assign a value to the tableScrolled variable', () => {
            component.tableScrolled.should.be.false;
            component.updateTableScroll(true);
            component.tableScrolled.should.be.true;
            component.updateTableScroll(false);
            component.tableScrolled.should.be.false;
        });
    });

    describe('#isHistorian', () => {
        it('should return true if registry type is historian', () => {
            component['registryId'] = 'org.hyperledger.composer.system.HistorianRecord';

            component['isHistorian']().should.be.true;
        });

        it('should return false if registry type is not historian', () => {
            component['registryId'] = 'org.hyperledger.composer.system.Identity';

            component['isHistorian']().should.be.false;
        });
    });
});
