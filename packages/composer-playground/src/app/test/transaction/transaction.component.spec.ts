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
import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By, BrowserModule } from '@angular/platform-browser';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { TransactionComponent } from './transaction.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ClientService } from '../../services/client.service';

import {
    TransactionDeclaration,
    BusinessNetworkDefinition,
    Serializer,
    Factory,
    ModelFile,
    Introspector
} from 'composer-common';

import { BusinessNetworkConnection } from 'composer-client';

import * as chai from 'chai';
import * as sinon from 'sinon';

let should = chai.should();

@Component({
    selector: 'codemirror',
    template: ''
})
class MockCodeMirrorComponent {
    @Input() config: any;
}

describe('TransactionComponent', () => {
    let component: TransactionComponent;
    let fixture: ComponentFixture<TransactionComponent>;
    let element: HTMLElement;
    let mockNgbActiveModal;
    let mockClientService;
    let mockTransaction;
    let mockBusinessNetwork;
    let mockBusinessNetworkConnection;
    let mockSerializer;
    let mockIntrospector;
    let mockFactory;

    let sandbox;

    beforeEach(async(() => {

        sandbox = sinon.sandbox.create();
        mockNgbActiveModal = sinon.createStubInstance(NgbActiveModal);
        mockClientService = sinon.createStubInstance(ClientService);
        mockBusinessNetwork = sinon.createStubInstance(BusinessNetworkDefinition);
        mockBusinessNetworkConnection = sinon.createStubInstance(BusinessNetworkConnection);
        mockSerializer = sinon.createStubInstance(Serializer);
        mockIntrospector = sinon.createStubInstance(Introspector);
        mockFactory = sinon.createStubInstance(Factory);
        mockClientService.getBusinessNetworkConnection.returns(mockBusinessNetworkConnection);
        mockClientService.getBusinessNetwork.returns(mockBusinessNetwork);
        mockBusinessNetwork.getSerializer.returns(mockSerializer);
        mockBusinessNetwork.getFactory.returns(mockFactory);
        mockBusinessNetwork.getIntrospector.returns(mockIntrospector);
        mockSerializer.toJSON.returns({
            $class: 'mock.class',
            timestamp: 'now',
            transactionId: 'A'
        });
        mockBusinessNetworkConnection.submitTransaction = sandbox.stub();
        mockTransaction = sinon.createStubInstance(TransactionDeclaration);
        mockNgbActiveModal.close = sandbox.stub();

        TestBed.configureTestingModule({
            imports: [
                FormsModule,
                BrowserModule
            ],
            declarations: [
                TransactionComponent,
                MockCodeMirrorComponent
            ],
            providers: [
                {provide: NgbActiveModal, useValue: mockNgbActiveModal},
                {provide: ClientService, useValue: mockClientService}
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(TransactionComponent);
        component = fixture.componentInstance;
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#CodeMirror', () => {
        it('should call the correct functions', () => {
            let cm = {
                foldCode: sandbox.stub(),
                getCursor: sandbox.stub()
            };

            component['codeConfig'].extraKeys['Ctrl-Q'](cm);
            cm.foldCode.should.be.called;
            cm.getCursor.should.be.called;
        });
    });

    describe('#ngOnInit', () => {

        it('should set and sort transactionTypes and set selectedTransaction and hiddenTransactionItems',
            fakeAsync(() => {
                sandbox.stub(component, 'generateTransactionDeclaration');
                mockTransaction.isAbstract.returns(false);

                let mockTransaction2 = sinon.createStubInstance(TransactionDeclaration);
                let mockTransaction3 = sinon.createStubInstance(TransactionDeclaration);
                let mockTransaction4 = sinon.createStubInstance(TransactionDeclaration);
                mockTransaction.getName.returns('A name');
                mockTransaction2.getName.returns('B name');
                mockTransaction3.getName.returns('C name');
                mockTransaction4.getName.returns('C name');
                mockIntrospector.getClassDeclarations.returns([mockTransaction3, mockTransaction, mockTransaction2, mockTransaction4]);
                component.ngOnInit();
                tick();
                mockBusinessNetwork.getIntrospector.should.be.called;
                component['transactionTypes'].length.should.equal(4);
                component['transactionTypes'].should.deep.equal([mockTransaction, mockTransaction2, mockTransaction3, mockTransaction4]);
                component['generateTransactionDeclaration'].should.be.called;
            }));

        it('should not set transactionTypes, selectedTransaction and hiddenTransactionItems',
            fakeAsync(() => {
                mockIntrospector.getClassDeclarations.returns([]);
                component.ngOnInit();
                tick();
                mockBusinessNetwork.getIntrospector.should.be.called;
                component['transactionTypes'].length.should.equal(0);
            }));

        it('should not set transactionTypes when abstract class', fakeAsync(() => {
            sandbox.stub(component, 'generateTransactionDeclaration');
            mockTransaction.isAbstract.returns(true);
            mockIntrospector.getClassDeclarations.returns([mockTransaction]);
            component.ngOnInit();
            tick();
            mockBusinessNetwork.getIntrospector.should.be.called;
            component['transactionTypes'].length.should.equal(0);
        }));

        it('should not set transactionTypes when system class', fakeAsync(() => {
            sandbox.stub(component, 'generateTransactionDeclaration');
            mockTransaction.isSystemType.returns(true);
            mockIntrospector.getClassDeclarations.returns([mockTransaction]);
            component.ngOnInit();
            tick();
            mockBusinessNetwork.getIntrospector.should.be.called;
            component['transactionTypes'].length.should.equal(0);
        }));
    });

    describe('#onTransactionSelect', () => {
        it('should call generateTransactionDeclaration', () => {
            sandbox.stub(component, 'generateTransactionDeclaration');
            let transactionName = 'mockTransaction';
            let transactionType = 'Transaction';
            mockTransaction.getName.returns(transactionName);

            component.onTransactionSelect(mockTransaction);
            component['selectedTransaction'].should.equal(mockTransaction);
            component['selectedTransactionName'].should.equal(transactionName);
            component['generateTransactionDeclaration'].should.be.called;
        });
    });

    describe('#generateTransactionDeclaration', () => {
        let mockModelFile;
        beforeEach(() => {
            component['updateExistingJSON'] = sandbox.stub();
            mockModelFile = sinon.createStubInstance(ModelFile);
            mockModelFile.getNamespace.returns('com.test');
        });

        it('should generate valid transaction definition with undefined', () => {
            mockSerializer.fromJSON.returns(mockTransaction);
            mockTransaction.getIdentifierFieldName.returns('transactionId');
            mockTransaction.getModelFile.returns(mockModelFile);
            mockTransaction.validate = sandbox.stub();
            component['selectedTransaction'] = mockTransaction;

            // should start clean
            should.not.exist(component['definitionError']);

            // run method (no params)
            component['generateTransactionDeclaration']();

            // should not result in definitionError
            should.not.exist(component['definitionError']);

            // resourceDefinition should be set as per serializer.toJSON output
            component['resourceDefinition'].should.equal('{\n  "$class": "mock.class",\n  "timestamp": "now",\n  "transactionId": "A"\n}');

            // We use the following methods:
            mockFactory.newTransaction.should.be.called;
            mockSerializer.toJSON.should.be.called;
            component.onDefinitionChanged.should.be.calledOn;
            component['updateExistingJSON'].should.not.be.called;
        });

        it('should generate valid transaction definition with false', () => {
            mockSerializer.fromJSON.returns(mockTransaction);
            mockTransaction.getIdentifierFieldName.returns('transactionId');
            mockTransaction.getModelFile.returns(mockModelFile);
            mockTransaction.validate = sandbox.stub();
            component['selectedTransaction'] = mockTransaction;

            // should start clean
            should.not.exist(component['definitionError']);

            // run method (false)
            component['generateTransactionDeclaration'](false);

            // should not result in definitionError
            should.not.exist(component['definitionError']);

            // resourceDefinition should be set as per serializer.toJSON output
            component['resourceDefinition'].should.equal('{\n  "$class": "mock.class",\n  "timestamp": "now",\n  "transactionId": "A"\n}');

            // We use the following methods:
            mockFactory.newTransaction.should.be.called;
            mockSerializer.toJSON.should.be.called;
            component.onDefinitionChanged.should.be.calledOn;
            component['updateExistingJSON'].should.not.be.called;
        });

        it('should generate valid transaction definition with true', () => {
            mockSerializer.fromJSON.returns(mockTransaction);
            mockTransaction.getIdentifierFieldName.returns('transactionId');
            mockTransaction.getModelFile.returns(mockModelFile);
            mockTransaction.validate = sandbox.stub();
            component['selectedTransaction'] = mockTransaction;

            // should start clean
            should.not.exist(component['definitionError']);

            // run method (true)
            component['generateTransactionDeclaration'](true);

            // should not result in definitionError
            should.not.exist(component['definitionError']);

            // resourceDefinition should be set as per serializer.toJSON output
            component['resourceDefinition'].should.equal('{\n  "$class": "mock.class",\n  "timestamp": "now",\n  "transactionId": "A"\n}');

            // We use the following methods:
            mockFactory.newTransaction.should.be.called;
            mockSerializer.toJSON.should.be.called;
            component.onDefinitionChanged.should.be.calledOn;
            component['updateExistingJSON'].should.not.be.called;
        });

        it('should generate a valid transactions when existing data exists adding extra data and preserving previous field values', () => {
            mockSerializer.toJSON.returns({$class: '', someField: '', optionalField: 'optional value'});
            mockTransaction.getIdentifierFieldName.returns('transactionId');
            mockTransaction.getModelFile.returns(mockModelFile);
            mockTransaction.validate = sandbox.stub();
            component['selectedTransaction'] = mockTransaction;

            component['resourceDefinition'] = JSON.stringify({$class: 'com.org', someField: 'some value'});

            // should start clean
            should.not.exist(component['definitionError']);

            // run method
            component['generateTransactionDeclaration']();

            // We use the following internal calls
            mockFactory.newTransaction.should.be.called;
            component.onDefinitionChanged.should.be.calledOn;
            component['updateExistingJSON'].should.be.calledWith({$class: 'com.org', someField: 'some value'}, {$class: '', someField: '', optionalField: 'optional value'});

        });

        it('should remove hidden transactions', () => {
            component['selectedTransaction'] = mockTransaction;
            mockTransaction.getIdentifierFieldName.returns('transactionId');
            mockTransaction.getModelFile.returns(mockModelFile);

            component['hiddenTransactionItems'].set('transactionId', 'transactionId');
            component['hiddenTransactionItems'].set('timestamp', 'transactionId');

            component['generateTransactionDeclaration']();

            let resourceDefenition = component['resourceDefinition'];
            resourceDefenition = JSON.parse(resourceDefenition);

            mockSerializer.toJSON.should.be.called;
            should.not.exist(resourceDefenition['timestamp']);
            should.not.exist(resourceDefenition['transactionId']);
        });

        it('should set definitionError on serializer fail', () => {
            component['selectedTransaction'] = mockTransaction;
            mockTransaction.getIdentifierFieldName.returns('transactionId');
            mockTransaction.getModelFile.returns(mockModelFile);

            // Validation requires serialisation to pass
            mockSerializer.toJSON = () => {
                throw new Error();
            };

            component['generateTransactionDeclaration']();
            component['definitionError'].should.not.be.null;

        });

        it('should set definitionError on validation fail', () => {
            component['selectedTransaction'] = mockTransaction;
            mockTransaction.getIdentifierFieldName.returns('transactionId');
            mockTransaction.getModelFile.returns(mockModelFile);
            mockSerializer.toJSON.returns({$class: 'com.org'});
            mockSerializer.fromJSON.returns(mockTransaction);
            mockTransaction.validate = () => {
                throw new Error('error');
            };

            // should start clean
            should.not.exist(component['definitionError']);

            component['generateTransactionDeclaration']();

            // should be in error state
            should.exist(component['definitionError']);
        });
    });

    describe('#updateExistingJSON', () => {
        it('should merge two JSON objects together keeping the data in fields from the first object if they exist in the second', () => {
            let result = component['updateExistingJSON']({$class: 'com.org', someField: 'some value'}, {$class: '', someField: '', optionalField: 'optional value'});
            result.should.have.deep.property('$class', 'com.org');
            result.should.have.deep.property('someField', 'some value');
            result.should.have.deep.property('optionalField', 'optional value');
        });

        it('should merge two JSON objects together keeping the data in fields from the first object if they exist in the second and are not blank', () => {
            let result = component['updateExistingJSON']({$class: 'com.org', someField: ''}, {$class: '', someField: 'not blank', optionalField: 'optional value'});
            result.should.have.deep.property('$class', 'com.org');
            result.should.have.deep.property('someField', 'not blank');
            result.should.have.deep.property('optionalField', 'optional value');
        });

        it('should merge two JSON objects together keeping the data in fields from the first object if they exist in the second and ignoring fields from the first that do not exist in the second', () => {
            let result = component['updateExistingJSON']({$class: 'com.org', someField: 'some value', anotherField: 'another field'}, {$class: '', someField: '', optionalField: 'optional value'});
            result.should.have.deep.property('$class', 'com.org');
            result.should.have.deep.property('someField', 'some value');
            result.should.have.deep.property('optionalField', 'optional value');
            result.should.not.have.property('anotherField');
        });

        it('should merge two JSON objects together keeping the data in fields from the first object if they exist in the second including individual values in fields of sub objects', () => {
            let spy = sinon.spy(component['updateExistingJSON']);
            let result = component['updateExistingJSON']({objectField: {subProperty: 'value to keep'}}, {objectField: {subProperty: 'value to discard', optionalSubProperty: 'value that exists in second object not first'}});
            result.should.deep.equal({objectField: {subProperty: 'value to keep', optionalSubProperty: 'value that exists in second object not first'}});
        });
    });

    describe('#onDefinitionChanged', () => {
        it('should validate a resource', () => {
            mockTransaction.validate = sandbox.stub();
            mockSerializer.fromJSON.returns(mockTransaction);
            component['resourceDefinition'] = JSON.stringify({
                $class: 'mock.class',
                timestamp: 'now',
                transactionId: 'A'
            });
            component['hiddenTransactionItems'].set('transactionId', 'transactionId');
            component['hiddenTransactionItems'].set('timestamp', 'transactionId');

            component['onDefinitionChanged']();
            should.not.exist(component['definitionError']);
            mockTransaction.validate.should.be.called;
        });

        it('should set definitionError if validation fails', () => {
            component['resourceDefinition'] = JSON.stringify({
                $class: 'mock.class',
                timestamp: 'now',
                transactionId: 'A'
            });

            // Force a validation fail
            mockTransaction.validate = () => {
                throw new Error('error');
            };

            // Run method and check
            component['onDefinitionChanged']();
            should.exist(component['definitionError']);

        });

        it('should show definition errors to users', () => {
            sinon.stub(component, 'ngOnInit');
            component['definitionError'] = 'Error: forced error';

            // Check that the UI is showing the error
            fixture.detectChanges();
            element = fixture.debugElement.query(By.css('.resource-error-text')).nativeElement;
            element.textContent.should.contain('Error: forced error');

        });

        it('should disable the submit transaction button if definition error detected', () => {
            sinon.stub(component, 'ngOnInit');
            component['definitionError'] = 'Error: forced error';

            // Check that the transaction submission button is disabled in UI
            fixture.detectChanges();
            element = fixture.debugElement.query(By.css('#submitTransactionButton')).nativeElement;
            (element as HTMLButtonElement).disabled.should.be.true;

        });

        it('should re-enable the submit transaction button if definition error is fixed', () => {
            sinon.stub(component, 'ngOnInit');
            component['definitionError'] = 'Error: forced error';

            // Check that the transaction submission button is disabled
            fixture.detectChanges();
            element = fixture.debugElement.query(By.css('#submitTransactionButton')).nativeElement;
            (element as HTMLButtonElement).disabled.should.be.true;

            // Fix the definition error
            component['definitionError'] = null;

            // Check that the transaction submission button is enabled
            fixture.detectChanges();
            element = fixture.debugElement.query(By.css('#submitTransactionButton')).nativeElement;
            (element as HTMLButtonElement).disabled.should.be.false;

        });

    });

    describe('#submitTransaction', () => {

        it('should change button display on transaction submission', () => {
            sinon.stub(component, 'ngOnInit');
            mockSerializer.fromJSON.returns(mockTransaction);
            component['hiddenTransactionItems'].set('transactionId', 'transactionId');
            component['hiddenTransactionItems'].set('timestamp', 'transactionId');

            component['resourceDefinition'] = JSON.stringify({
                $class: 'mock.class',
                timestamp: 'now',
                transactionId: 'A'
            });

            component['selectedTransaction'] = mockTransaction;

            // Check that the transaction submission button is labelled correctly on initialisation
            fixture.detectChanges();
            element = fixture.debugElement.query(By.css('#submitTransactionButton')).nativeElement;
            element.innerHTML.should.contain('Submit');

            // Flip Submit boolean
            component['submitInProgress'] = true;

            // Update element and check that button now contains spinner
            fixture.detectChanges();
            element = fixture.debugElement.query(By.css('#submitTransactionButton')).nativeElement;
            element.innerHTML.should.contain('class="ibm-spinner-indeterminate small loop"');

        });

        it('should submit a transaction and close the modal', fakeAsync(() => {
            mockSerializer.fromJSON.returns(mockTransaction);
            component['resourceDefinition'] = JSON.stringify({
                $class: 'mock.class',
                timestamp: 'now',
                transactionId: 'A'
            });
            component['selectedTransaction'] = mockTransaction;
            component['submitTransaction']();
            component['submitInProgress'].should.be.true;
            tick();
            tick();
            component['submitInProgress'].should.be.false;
            should.not.exist(component['definitionError']);
            mockNgbActiveModal.close.should.be.called;
        }));

        it('should deal with error', fakeAsync(() => {
            mockClientService.getBusinessNetworkConnection.throws(new Error('test error'));
            component['resourceDefinition'] = JSON.stringify({
                $class: 'mock.class',
                timestamp: 'now',
                transactionId: 'A'
            });
            component['selectedTransaction'] = mockTransaction;

            component['submitTransaction']();

            component['submitInProgress'].should.be.true;
            tick();
            tick();
            component['submitInProgress'].should.be.false;
            should.exist(component['definitionError']);
        }));

    });

});
