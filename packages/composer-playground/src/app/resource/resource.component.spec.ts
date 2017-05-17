/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement, Component, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { TransactionComponent } from './transaction.component';
import { CodemirrorComponent } from 'ng2-codemirror';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ClientService } from '../services/client.service';
import { InitializationService } from '../services/initialization.service';

import {
    Resource,
    BusinessNetworkDefinition,
    Serializer,
    Introspector,
    AssetDeclaration,
    ParticipantDeclaration,
    TransactionDeclaration,
    ClassDeclaration,
    Property,
    Factory,
    ModelFile
} from 'composer-common';

import { BusinessNetworkConnection, AssetRegistry } from 'composer-client';

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
    let mockInitializationService;

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
        mockInitializationService = sinon.createStubInstance(InitializationService);

        mockNgbActiveModal.open = sandbox.stub();
        mockNgbActiveModal.close = sandbox.stub();
        mockInitializationService.initialize.returns(Promise.resolve());

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
                {provide: ClientService, useValue: mockClientService},
                {provide: InitializationService, useValue: mockInitializationService}
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
            component['registryID'] = 'org.acme.fqn';
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
        beforeEach(() => {
            mockModelFile = sinon.createStubInstance(ModelFile);
            mockModelFile.getName.returns('model.cto');
            mockClassDeclaration = sinon.createStubInstance(ClassDeclaration);
            mockClassDeclaration.getModelFile.returns(mockModelFile);
            mockClassDeclaration.getName.returns('class.declaration');
            mockClassDeclaration.getIdentifierFieldName.returns('resourceId');

        });

        it('should generate a valid resource', () => {

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
            mockFactory.newResource.should.be.called;
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
            component['registryID'] = registryId;
            mockBusinessNetworkConnection.getAssetRegistry.returns('testing');

            let result = component['retrieveResourceRegistry']('Asset');
            mockBusinessNetworkConnection.getAssetRegistry.should.be.called;
            mockBusinessNetworkConnection.getAssetRegistry.should.be.calledWith(registryId);
            result.should.equal('testing');
        });

        it('should return a ParticipantRegistry', () => {
            let registryId = 'registryId';
            component['registryID'] = registryId;
            mockBusinessNetworkConnection.getParticipantRegistry.returns('testing');

            let result = component['retrieveResourceRegistry']('Participant');
            mockBusinessNetworkConnection.getParticipantRegistry.should.be.called;
            mockBusinessNetworkConnection.getParticipantRegistry.should.be.calledWith(registryId);
            result.should.equal('testing');
        });

        it('should return a TransactionRegistry', () => {
            let registryId = 'registryId';
            component['registryID'] = registryId;
            mockBusinessNetworkConnection.getTransactionRegistry.returns('testing');

            let result = component['retrieveResourceRegistry']('Transaction');
            mockBusinessNetworkConnection.getTransactionRegistry.should.be.called;
            result.should.equal('testing');
        });
    });
});
