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
import { By } from '@angular/platform-browser';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { TransactionComponent } from './transaction.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ClientService } from '../../services/client.service';

import {
    AssetDeclaration,
    BusinessNetworkDefinition,
    ClassDeclaration,
    Factory,
    Introspector,
    ModelFile,
    ParticipantDeclaration,
    Resource,
    Serializer,
    TransactionDeclaration
} from 'composer-common';

import { AssetRegistry, BusinessNetworkConnection } from 'composer-client';

import { ResourceComponent } from './resource.component';

import * as sinon from 'sinon';

let should = chai.should();

@Component({
    selector: 'codemirror',
    template: ''
})
class MockCodeMirrorComponent {
    @Input() config: any;
}

describe('ResourceComponent', () => {
    let component: ResourceComponent;
    let fixture: ComponentFixture<ResourceComponent>;
    let element: HTMLElement;

    let mockNgbActiveModal;
    let mockClientService;

    let mockBusinessNetworkConnection;
    let mockBusinessNetwork;
    let mockSerializer;
    let mockFactory;
    let mockIntrospector;
    let mockResource;

    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();

        mockNgbActiveModal = sinon.createStubInstance(NgbActiveModal);
        mockClientService = sinon.createStubInstance(ClientService);

        mockNgbActiveModal.open = sandbox.stub();
        mockNgbActiveModal.close = sandbox.stub();

        mockResource = sinon.createStubInstance(Resource);
        mockBusinessNetworkConnection = sinon.createStubInstance(BusinessNetworkConnection);
        mockBusinessNetwork = sinon.createStubInstance(BusinessNetworkDefinition);
        mockSerializer = sinon.createStubInstance(Serializer);
        mockFactory = sinon.createStubInstance(Factory);
        mockIntrospector = sinon.createStubInstance(Introspector);

        mockClientService.getBusinessNetwork.returns(mockBusinessNetwork);
        mockClientService.getBusinessNetworkConnection.returns(mockBusinessNetworkConnection);
        mockBusinessNetwork.getSerializer.returns(mockSerializer);
        mockBusinessNetwork.getFactory.returns(mockFactory);
        mockBusinessNetwork.getIntrospector.returns(mockIntrospector);

        TestBed.configureTestingModule({
            imports: [
                FormsModule
            ],
            declarations: [
                ResourceComponent,
                MockCodeMirrorComponent
            ],
            providers: [
                {provide: NgbActiveModal, useValue: mockNgbActiveModal},
                {provide: ClientService, useValue: mockClientService}
            ]
        });
        fixture = TestBed.createComponent(ResourceComponent);
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
        let mockClassDeclaration;
        beforeEach(() => {
            component['registryId'] = 'org.acme.fqn';
            component['retrieveResourceType'] = sandbox.stub();
            component['generateResource'] = sandbox.stub();
            component['onDefinitionChanged'] = sandbox.stub();
            mockClassDeclaration = sinon.createStubInstance(ClassDeclaration);
            mockClassDeclaration.getFullyQualifiedName.returns('org.acme.fqn');
            mockIntrospector.getClassDeclarations.returns([mockClassDeclaration]);
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should prepare to create a resource', fakeAsync(() => {
            component['editMode'] = sandbox.stub().returns(false);
            component.ngOnInit();
            tick();
            component['retrieveResourceType'].should.be.called;
            component['editMode'].should.be.called;
            component['generateResource'].should.be.called;
        }));

        it('should prepare to edit a resource', fakeAsync(() => {
            component['editMode'] = sandbox.stub().returns(true);
            component.ngOnInit();
            tick();
            component['retrieveResourceType'].should.be.called;
            component['editMode'].should.be.called;
            component['generateResource'].should.not.be.called;
        }));

        it('should skip resources in the incorrect registry', fakeAsync(() => {
            mockClassDeclaration.getFullyQualifiedName.returns('org.acme.fqn.incorrect');
            component['editMode'] = sandbox.stub().returns(true);
            component.ngOnInit();
            tick();
            component['retrieveResourceType'].should.not.be.called;
            component['editMode'].should.not.be.called;
            component['onDefinitionChanged'].should.not.be.called;
            component['generateResource'].should.not.be.called;
        }));
    });

    describe('#editMode', () => {
        it('should return false', () => {
            const result = component['editMode']();
            result.should.be.false;
        });

        it('should return true', () => {
            component['resource'] = mockResource;
            const result = component['editMode']();
            result.should.be.true;
        });
    });

    describe('#generateResource', () => {
        let mockClassDeclaration;
        let mockModelFile;
        let mockField;

        beforeEach(() => {
            mockField = {
                getValidator: sinon.stub ().returns(null)
            };

            component['updateExistingJSON'] = sandbox.stub();
            mockModelFile = sinon.createStubInstance(ModelFile);
            mockModelFile.getName.returns('model.cto');
            mockClassDeclaration = sinon.createStubInstance(ClassDeclaration);
            mockClassDeclaration.getModelFile.returns(mockModelFile);
            mockClassDeclaration.getName.returns('class.declaration');
            mockClassDeclaration.getIdentifierFieldName.returns('resourceId');
            mockClassDeclaration.getProperty.returns(mockField);
        });

        it('should generate a valid resource with an empty ID', () => {
            mockField.getValidator.returns('/regex/');
            mockClassDeclaration.getOwnProperty.returns(mockField);
            mockSerializer.toJSON.returns({$class: 'com.org'});
            mockSerializer.fromJSON.returns(mockResource);
            mockResource.validate = sandbox.stub();
            component['resourceDeclaration'] = mockClassDeclaration;

            // should start clean
            should.not.exist(component['definitionError']);

            // run method
            component['generateResource']();

            // should not result in definitionError
            should.not.exist(component['definitionError']);

            // resourceDefinition should be set as per serializer.toJSON output
            component['resourceDefinition'].should.equal('{\n  "$class": "com.org"\n}');

            // We use the following internal calls
            mockFactory.newResource.should.be.calledWith(undefined,
                                                         'class.declaration',
                                                         '',
                                                         {
                                                            generate: 'empty',
                                                            includeOptionalFields: false,
                                                            disableValidation: true,
                                                            allowEmptyId: true
                                                         });
            component.onDefinitionChanged.should.be.calledOn;
            component['updateExistingJSON'].should.not.be.called;
        });

        it('should generate a valid resource with true', () => {

            mockSerializer.toJSON.returns({$class: 'com.org'});
            mockSerializer.fromJSON.returns(mockResource);
            mockResource.validate = sandbox.stub();
            component['resourceDeclaration'] = mockClassDeclaration;

            // should start clean
            should.not.exist(component['definitionError']);

            // run method
            component['generateResource'](true);

            // should not result in definitionError
            should.not.exist(component['definitionError']);

            // resourceDefinition should be set as per serializer.toJSON output
            component['resourceDefinition'].should.equal('{\n  "$class": "com.org"\n}');

            // We use the following internal calls
            mockFactory.newResource.should.be.called;
            component.onDefinitionChanged.should.be.calledOn;
            component['updateExistingJSON'].should.not.be.called;
        });

        it('should generate a valid resource with false', () => {

            mockSerializer.toJSON.returns({$class: 'com.org'});
            mockSerializer.fromJSON.returns(mockResource);
            mockResource.validate = sandbox.stub();
            component['resourceDeclaration'] = mockClassDeclaration;

            // should start clean
            should.not.exist(component['definitionError']);

            // run method
            component['generateResource'](false);

            // should not result in definitionError
            should.not.exist(component['definitionError']);

            // resourceDefinition should be set as per serializer.toJSON output
            component['resourceDefinition'].should.equal('{\n  "$class": "com.org"\n}');

            // We use the following internal calls
            mockFactory.newResource.should.be.called;
            component.onDefinitionChanged.should.be.calledOn;
            component['updateExistingJSON'].should.not.be.called;
        });

        it('should generate a valid resource when existing data exists adding extra data and preserving previous field values', () => {
            mockSerializer.toJSON.returns({$class: '', someField: '', optionalField: 'optional value'});
            mockSerializer.fromJSON.returns(mockResource);
            mockResource.validate = sandbox.stub();
            component['resourceDeclaration'] = mockClassDeclaration;

            component['resourceDefinition'] = JSON.stringify({$class: 'com.org', someField: 'some value'});

            // should start clean
            should.not.exist(component['definitionError']);

            // run method
            component['generateResource']();

            // We use the following internal calls
            mockFactory.newResource.should.be.called;
            component.onDefinitionChanged.should.be.calledOn;
            component['updateExistingJSON'].should.be.calledWith({$class: 'com.org', someField: 'some value'}, {$class: '', someField: '', optionalField: 'optional value'});

        });

        it('should generate a valid resource with a random 4-digit ID', () => {
            mockSerializer.toJSON.returns({$class: 'com.org'});
            mockSerializer.fromJSON.returns(mockResource);
            mockResource.validate = sandbox.stub();
            component['resourceDeclaration'] = mockClassDeclaration;

            // should start clean
            should.not.exist(component['definitionError']);

            // run method
            component['generateResource']();

            // should not result in definitionError
            should.not.exist(component['definitionError']);

            // resourceDefinition should be set as per serializer.toJSON output
            component['resourceDefinition'].should.equal('{\n  "$class": "com.org"\n}');

            // We use the following internal calls
            mockFactory.newResource.should.be.calledWith(undefined,
                                                        'class.declaration',
                                                        sinon.match(/[0-9]{4}/),
                                                        {
                                                        generate: 'empty',
                                                        includeOptionalFields: false,
                                                        disableValidation: true,
                                                        allowEmptyId: true
                                                        });
            component.onDefinitionChanged.should.be.calledOn;
        });

        it('should set definitionError on serializer fail', () => {
            component['resourceDeclaration'] = mockClassDeclaration;

            // Set serializer to throw
            mockSerializer.toJSON = () => {
                throw new Error('error');
            };

            // should start clean
            should.not.exist(component['definitionError']);

            // Run method
            component['generateResource']();

            // should be in error state
            should.exist(component['definitionError']);
        });

        it('should set definitionError on validation fail', () => {
            mockSerializer.toJSON.returns({$class: 'com.org'});
            mockSerializer.fromJSON.returns(mockResource);
            component['resourceDeclaration'] = mockClassDeclaration;

            // Set validate to throw
            mockResource.validate = () => {
                throw new Error('error');
            };

            // should start clean
            should.not.exist(component['definitionError']);

            // Run method
            component['generateResource']();

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

    describe('#addOrUpdateResource', () => {
        let mockRegistry;
        beforeEach(() => {
            mockRegistry = sinon.createStubInstance(AssetRegistry);
            component['retrieveResourceRegistry'] = () => {
                return Promise.resolve(mockRegistry);
            };
            mockResource.validate = sandbox.stub();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should call registry add and close the modal', fakeAsync(() => {
            component['editMode'] = sandbox.stub().returns(false);
            component['resourceDefinition'] = '{"class": "org.acme"}';
            mockSerializer.fromJSON.returns(mockResource);

            component['addOrUpdateResource']();

            component['actionInProgress'].should.be.true;
            tick();
            mockResource.validate.should.be.called;
            component['actionInProgress'].should.be.false;
            component['editMode'].should.be.called;
            mockRegistry.add.should.be.called;
            tick();
            component['actionInProgress'].should.be.false;
            mockNgbActiveModal.close.should.be.called;
        }));

        it('should call registry update and close the modal', fakeAsync(() => {
            component['editMode'] = sandbox.stub().returns(true);
            component['resourceDefinition'] = '{"class": "org.acme"}';
            mockSerializer.fromJSON.returns(mockResource);

            component['addOrUpdateResource']();

            component['actionInProgress'].should.be.true;
            tick();
            mockResource.validate.should.be.called;
            component['actionInProgress'].should.be.false;
            component['editMode'].should.be.called;
            mockRegistry.update.should.be.called;
            tick();
            component['actionInProgress'].should.be.false;
            mockNgbActiveModal.close.should.be.called;
        }));

        it('should set definitionError if error thrown', fakeAsync(() => {
            component['resourceDefinition'] = 'will error';

            component['addOrUpdateResource']();
            tick();
            should.exist(component['definitionError']);
            component['actionInProgress'].should.be.false;
        }));
    });

    describe('#onDefinitionChanged', () => {
        it('should call validate()', () => {
            mockResource.validate = sandbox.stub();
            component['resourceDefinition'] = '{"$class": "org.acme"}';
            mockSerializer.fromJSON.returns(mockResource);

            component['onDefinitionChanged']();

            mockSerializer.fromJSON.should.be.called;
            mockSerializer.fromJSON.should.be.calledWith({$class: 'org.acme'});
            mockResource.validate.should.be.called;
            should.not.exist(component['definitionError']);
        });

        it('should set definitionError', () => {
            component['resourceDefinition'] = 'will error';
            component['onDefinitionChanged']();
            should.exist(component['definitionError']);
        });

        it('should show definition errors to users', () => {
            sinon.stub(component, 'ngOnInit');

            // Insert definition error
            component['definitionError'] = 'Error: forced error content';

            // Check that the UI is showing the error
            fixture.detectChanges();
            element = fixture.debugElement.query(By.css('.resource-error-text')).nativeElement;
            element.textContent.should.contain('Error: forced error content');

        });

        it('should disable the create resource button if definition error present', () => {
            sinon.stub(component, 'ngOnInit');

            // Insert definition error
            component['definitionError'] = 'Error: forced error content';

            // Check that the transaction submission button is disabled in UI
            fixture.detectChanges();
            element = fixture.debugElement.query(By.css('#createResourceButton')).nativeElement;
            (element as HTMLButtonElement).disabled.should.be.true;

        });

        it('should re-enable the create resource button if definition error is fixed', () => {
            sinon.stub(component, 'ngOnInit');

            // Insert definition error
            component['definitionError'] = 'Error: forced error content';

            // Check that the transaction submission button is disabled
            fixture.detectChanges();
            element = fixture.debugElement.query(By.css('#createResourceButton')).nativeElement;
            (element as HTMLButtonElement).disabled.should.be.true;

            // Fix the definition error
            component['definitionError'] = undefined;

            // Check that the transaction submission button is enabled
            fixture.detectChanges();
            element = fixture.debugElement.query(By.css('#createResourceButton')).nativeElement;
            (element as HTMLButtonElement).disabled.should.be.false;

        });

    });

    describe('#retrieveResourceType', () => {
        it('should return transaction', () => {
            let mockTransaction = sinon.createStubInstance(TransactionDeclaration);
            let result = component['retrieveResourceType'](mockTransaction);
            result.should.equal('Transaction');
        });

        it('should return asset', () => {
            let mockAsset = sinon.createStubInstance(AssetDeclaration);
            let result = component['retrieveResourceType'](mockAsset);
            result.should.equal('Asset');
        });

        it('should return participant', () => {
            let mockParticipant = sinon.createStubInstance(ParticipantDeclaration);
            let result = component['retrieveResourceType'](mockParticipant);
            result.should.equal('Participant');
        });

        it('should return nothing', () => {
            let mockParticipant = sinon.createStubInstance(Object);
            let result = component['retrieveResourceType']({});
            should.not.exist(result);
        });
    });

    describe('#retrieveResourceRegistry', () => {
        it('should return an AssetRegistry', () => {
            let registryId = 'registryId';
            component['registryId'] = registryId;
            mockBusinessNetworkConnection.getAssetRegistry.returns('testing');

            let result = component['retrieveResourceRegistry']('Asset');
            mockBusinessNetworkConnection.getAssetRegistry.should.be.called;
            mockBusinessNetworkConnection.getAssetRegistry.should.be.calledWith(registryId);
            result.should.equal('testing');
        });

        it('should return a ParticipantRegistry', () => {
            let registryId = 'registryId';
            component['registryId'] = registryId;
            mockBusinessNetworkConnection.getParticipantRegistry.returns('testing');

            let result = component['retrieveResourceRegistry']('Participant');
            mockBusinessNetworkConnection.getParticipantRegistry.should.be.called;
            mockBusinessNetworkConnection.getParticipantRegistry.should.be.calledWith(registryId);
            result.should.equal('testing');
        });

        it('should return a TransactionRegistry', () => {
            let registryId = 'registryId';
            component['registryId'] = registryId;
            mockBusinessNetworkConnection.getTransactionRegistry.returns('testing');

            let result = component['retrieveResourceRegistry']('Transaction');
            mockBusinessNetworkConnection.getTransactionRegistry.should.be.called;
            result.should.equal('testing');
        });
    });
});
