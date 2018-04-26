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
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Directive, EventEmitter, Output, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { ClientService } from '../services/client.service';
import { SampleBusinessNetworkService } from '../services/samplebusinessnetwork.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AlertService } from '../basic-modals/alert.service';
import { DeployComponent } from './deploy.component';
import {
    ModelManager,
    BusinessNetworkDefinition,
    AssetDeclaration,
    ParticipantDeclaration,
    TransactionDeclaration
} from 'composer-common';

import * as sinon from 'sinon';
import * as chai from 'chai';

let should = chai.should();

@Directive({
    selector: 'credentials'
})
class MockCredentialsDirective {
    @Output()
    public credentials: EventEmitter<any> = new EventEmitter<any>();
}

@Directive({
    selector: '[fileDragDrop]'
})
class MockDragDropDirective {
    @Output()
    public fileDragDropFileAccepted: EventEmitter<File> = new EventEmitter<File>();
    @Output()
    public fileDragDropFileRejected: EventEmitter<string> = new EventEmitter<string>();
    @Output()
    public fileDragDropDragOver: EventEmitter<string> = new EventEmitter<string>();
    @Output()
    public fileDragDropDragLeave: EventEmitter<string> = new EventEmitter<string>();

    @Input()
    public supportedFileTypes: string[] = [];
    @Input()
    maxFileSize: number = 0;
}

@Directive({
    selector: 'file-importer'
})
class MockFileImporterDirective {
    @Output()
    public fileAccepted: EventEmitter<File> = new EventEmitter<File>();

    @Output()
    public fileRejected: EventEmitter<File> = new EventEmitter<File>();

    @Input()
    public expandInput: boolean = false;

    @Input()
    public svgName: string = '#icon-BNA_Upload';

    @Input()
    public maxFileSize: number = 0;

    @Input()
    public supportedFileTypes: string[] = [];
}

@Directive({
    selector: 'perfect-scrollbar'
})
class MockPerfectScrollBarDirective {
}

describe('DeployComponent', () => {
    let sandbox;
    let component: DeployComponent;
    let fixture: ComponentFixture<DeployComponent>;

    let mockDragDropComponent;

    let mockBusinessNetworkService;
    let mockAlertService;
    let mockClientService;
    let mockNgbModal;
    let mockModelManager;
    let mockBusinessNetworkDefinition;
    let mockAssetDeclaration;
    let mockParticipantDeclaration;
    let mockTransactionDeclaration;

    beforeEach(() => {
        mockBusinessNetworkService = sinon.createStubInstance(SampleBusinessNetworkService);
        mockAlertService = sinon.createStubInstance(AlertService);
        mockClientService = sinon.createStubInstance(ClientService);
        mockNgbModal = sinon.createStubInstance(NgbModal);
        mockModelManager = sinon.createStubInstance(ModelManager);
        mockBusinessNetworkDefinition = sinon.createStubInstance(BusinessNetworkDefinition);
        mockAssetDeclaration = sinon.createStubInstance(AssetDeclaration);
        mockParticipantDeclaration = sinon.createStubInstance(ParticipantDeclaration);
        mockTransactionDeclaration = sinon.createStubInstance(TransactionDeclaration);

        mockAlertService.errorStatus$ = {
            next: sinon.stub()
        };

        mockAlertService.busyStatus$ = {
            next: sinon.stub()
        };

        TestBed.configureTestingModule({
            imports: [FormsModule],
            declarations: [DeployComponent, MockDragDropDirective, MockFileImporterDirective, MockPerfectScrollBarDirective, MockCredentialsDirective],
            providers: [
                {provide: SampleBusinessNetworkService, useValue: mockBusinessNetworkService},
                {provide: ClientService, useValue: mockClientService},
                {provide: AlertService, useValue: mockAlertService},
                {provide: NgbModal, useValue: mockNgbModal}],
        });

        sandbox = sinon.sandbox.create();

        mockNgbModal.open.returns({componentInstance: {}});

        fixture = TestBed.createComponent(DeployComponent);
        component = fixture.componentInstance;

        let mockDragDropElement = fixture.debugElement.query(By.directive(MockDragDropDirective));
        mockDragDropComponent = mockDragDropElement.injector.get(MockDragDropDirective) as MockDragDropDirective;
    });

    afterAll(() => {
        sandbox.restore();
    });

    describe('ngInit', () => {
        let onShowMock;

        beforeEach(() => {
            onShowMock = sinon.stub(component, 'onShow');
        });

        it('should create', () => {
            component.should.be.ok;
        });

        it('should setup the import modal', fakeAsync(() => {
            component.ngOnInit();

            tick();

            should.not.exist(component['currentBusinessNetwork']);
            onShowMock.should.have.been.called;
        }));
    });

    describe('onShow', () => {

        let selectNetworkStub;
        let addEmptyNetworkOption;
        beforeEach(() => {
            selectNetworkStub = sinon.stub(component, 'selectNetwork');
        });

        it('should get the list of sample networks', fakeAsync(() => {
            mockBusinessNetworkService.getSampleList.returns(Promise.resolve([{name: 'modelTwo'}, {name: 'modelOne'}]));
            addEmptyNetworkOption = sinon.stub(component, 'addEmptyNetworkOption').returns([{name: 'empty'}, {name: 'modelOne'}, {name: 'modelTwo'}]);
            component.onShow();
            component['npmInProgress'].should.equal(true);
            tick();

            addEmptyNetworkOption.should.have.been.calledWith([{name: 'modelTwo'}, {name: 'modelOne'}]);
            selectNetworkStub.should.have.been.calledWith({name: 'modelOne'});
            component['npmInProgress'].should.equal(false);
            component['sampleNetworks'].should.deep.equal([{name: 'empty'}, {name: 'modelOne'}, {name: 'modelTwo'}]);
        }));

        it('should handle error', fakeAsync(() => {
            mockBusinessNetworkService.getSampleList.returns(Promise.reject({message: 'some error'}));
            addEmptyNetworkOption = sinon.stub(component, 'addEmptyNetworkOption').returns([{name: 'empty'}]);
            component.onShow();
            component['npmInProgress'].should.equal(true);
            tick();

            addEmptyNetworkOption.should.have.been.calledWith([]);
            selectNetworkStub.should.have.been.calledWith({name: 'empty'});
            component['npmInProgress'].should.equal(false);
        }));
    });

    describe('remove file', () => {
        it('should remove the file', () => {
            component.removeFile();

            component['expandInput'].should.equal(false);
            should.not.exist(component['currentBusinessNetwork']);
        });
    });

    describe('deployEmptyNetwork', () => {
        it('should create the empty business network if chosen', fakeAsync(() => {
            component['networkName'] = 'myName';
            component['networkDescription'] = 'myDescription';

            const businessNetworkDefinition = new BusinessNetworkDefinition('my-network@1.0.0');
            mockBusinessNetworkService.createNewBusinessDefinition.returns(businessNetworkDefinition);

            component.deployEmptyNetwork();

            tick();
            mockBusinessNetworkService.createNewBusinessDefinition.should.have.been.calledWith('', '', sinon.match.object, sinon.match.string);
            component['currentBusinessNetwork'].should.equal(businessNetworkDefinition);
            component['currentBusinessNetwork']['participants'].should.deep.equal([]);
            component['currentBusinessNetwork']['assets'].should.deep.equal([]);
            component['currentBusinessNetwork']['transactions'].should.deep.equal([]);
            // system namespace plus model namespace = 2
            businessNetworkDefinition.getModelManager().getNamespaces().length.should.equal(2);
            businessNetworkDefinition.getAclManager().getAclFile().getDefinitions().should.be.a('string');
        }));
    });

    describe('selectNetwork', () => {
        it('should select the network', fakeAsync(() => {
            let mockUpdateBusinessNetworkNameAndDesc = sinon.stub(component, 'updateBusinessNetworkNameAndDesc');

            mockModelManager.getParticipantDeclarations.returns([mockParticipantDeclaration]);
            mockModelManager.getTransactionDeclarations.returns([mockTransactionDeclaration]);
            mockModelManager.getAssetDeclarations.returns([mockAssetDeclaration]);
            mockBusinessNetworkDefinition.getModelManager.returns(mockModelManager);
            mockBusinessNetworkService.getChosenSample.returns(Promise.resolve(mockBusinessNetworkDefinition));
            component.selectNetwork('bob');

            tick();

            component['chosenNetwork'];
            mockUpdateBusinessNetworkNameAndDesc.should.have.been.calledWith('bob');
            component['currentBusinessNetwork'].should.deep.equal(mockBusinessNetworkDefinition);
            component['currentBusinessNetwork']['participants'].should.deep.equal([mockParticipantDeclaration]);
            component['currentBusinessNetwork']['transactions'].should.deep.equal([mockTransactionDeclaration]);
            component['currentBusinessNetwork']['assets'].should.deep.equal([mockAssetDeclaration]);
        }));

        it('should select the empty network', () => {
            let mockUpdateBusinessNetworkNameAndDesc = sinon.stub(component, 'updateBusinessNetworkNameAndDesc');
            let empty = sinon.stub(component, 'deployEmptyNetwork');

            component.selectNetwork({name: 'empty-business-network'});
            empty.should.have.been.called;
            mockUpdateBusinessNetworkNameAndDesc.should.have.been.calledWith({name: 'empty-business-network'});
        });
    });

    describe('addEmptyNetworkOption', () => {

        const BASIC_SAMPLE = 'basic-sample-network';
        const FOO = 'foo';
        const BAR = 'bar';

        it('should correctly add an empty network option to the start of the list', () => {
            let INPUT_NETWORKS = [{name: BASIC_SAMPLE}, {name: BAR}, {name: FOO}];
            let result = component.addEmptyNetworkOption(INPUT_NETWORKS);
            result.length.should.equal(4);
            result[0].name.should.equal('empty-business-network');
            result[1].name.should.equal(BASIC_SAMPLE);
            result[2].name.should.equal(BAR);
            result[3].name.should.equal(FOO);
        });
    });

    describe('closeSample', (() => {
        it('should set the dragged sample back to empty', () => {
            let selectStub = sinon.stub(component, 'selectNetwork');
            component['sampleDropped'] = true;

            component['sampleNetworks'] = [{network: 'one'}, {network: 'two'}];

            component.closeSample();

            component['sampleDropped'].should.equal(false);
            selectStub.should.have.been.calledWith({network: 'one'});
        });
    }));

    describe('fileDetected', () => {
        it('should set expand input to true', () => {
            component['expandInput'].should.equal(false);
            mockDragDropComponent.fileDragDropDragOver.emit();

            component['expandInput'].should.equal(true);
        });
    });

    describe('fileLeft', () => {
        it('should set expand input to false', () => {
            component['expandInput'] = true;
            mockDragDropComponent.fileDragDropDragLeave.emit();

            component['expandInput'].should.equal(false);
        });
    });

    describe('fileAccepted', () => {
        let file;
        let mockFileReadObj;
        let mockFileRead;

        beforeEach(() => {
            sandbox = sinon.sandbox.create();
            mockFileRead = sandbox.stub(window, 'FileReader');
            let content = 'Hello World';
            let data = new Blob([content], {type: 'text/plain'});
            let arrayOfBlob = new Array<Blob>();
            arrayOfBlob.push(data);
            file = new File(arrayOfBlob, 'mock.bna');

            mockFileReadObj = {
                onload: sinon.stub(),
                readAsArrayBuffer: sandbox.stub(),
                result: 'my file'
            };

            mockFileRead.returns(mockFileReadObj);
        });

        afterEach(() => {
            mockFileRead.restore();
            sandbox.restore();
        });

        it('should read a file', fakeAsync(() => {
            let metaDataMock = {
                getPackageJson: sinon.stub().returns({json: 'some json'})
            };

            mockAssetDeclaration = sinon.createStubInstance(AssetDeclaration);
            mockParticipantDeclaration = sinon.createStubInstance(ParticipantDeclaration);
            mockTransactionDeclaration = sinon.createStubInstance(TransactionDeclaration);

            mockModelManager = sinon.createStubInstance(ModelManager);
            mockModelManager.getParticipantDeclarations.returns([mockParticipantDeclaration]);
            mockModelManager.getTransactionDeclarations.returns([mockTransactionDeclaration]);
            mockModelManager.getAssetDeclarations.returns([mockAssetDeclaration]);

            let businessNetworkMock = {
                network: 'mockNetwork',
                getMetadata: sinon.stub().returns(metaDataMock),
                getModelManager: sinon.stub().returns(mockModelManager)
            };

            let mockUpdateBusinessNetworkNameAndDesc = sinon.stub(component, 'updateBusinessNetworkNameAndDesc');

            mockClientService.getBusinessNetworkFromArchive.returns(Promise.resolve(businessNetworkMock));

            mockDragDropComponent.fileDragDropFileAccepted.emit(file);

            mockFileReadObj.readAsArrayBuffer.should.have.been.calledWith(file);

            mockFileReadObj.onload();

            tick();

            mockClientService.getBusinessNetworkFromArchive.should.have.been.called;
            component['currentBusinessNetwork'].network.should.equal('mockNetwork');
            component['currentBusinessNetwork']['participants'].should.deep.equal([mockParticipantDeclaration]);
            component['currentBusinessNetwork']['transactions'].should.deep.equal([mockTransactionDeclaration]);
            component['currentBusinessNetwork']['assets'].should.deep.equal([mockAssetDeclaration]);
            component['expandInput'].should.equal(false);
            component['chosenNetwork'].should.deep.equal({json: 'some json'});
            component['sampleDropped'].should.equal(true);
            mockUpdateBusinessNetworkNameAndDesc.should.have.been.calledWith({json: 'some json'});
        }));

        it('should handle error', fakeAsync(() => {
            mockClientService.getBusinessNetworkFromArchive.returns(Promise.reject('some error'));

            mockDragDropComponent.fileDragDropFileAccepted.emit(file);

            mockFileReadObj.readAsArrayBuffer.should.have.been.calledWith(file);

            mockFileReadObj.onload();

            tick();

            mockClientService.getBusinessNetworkFromArchive.should.have.been.called;

            mockAlertService.errorStatus$.next.should.have.been.called;
            component['expandInput'].should.equal(false);
        }));
    });

    describe('file rejected', () => {

        it('should reject the file', () => {
            mockDragDropComponent.fileDragDropFileRejected.emit();

            mockAlertService.errorStatus$.next.should.have.been.called;
            component['expandInput'].should.equal(false);
        });
    });

    describe('deploy', () => {
        let finishedSampleImportSpy;

        beforeEach(() => {
            mockNgbModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.resolve(true)
            });

            finishedSampleImportSpy = sinon.spy(component.finishedSampleImport, 'emit');
        });

        it('should deploy a business network', fakeAsync(() => {
            component['currentBusinessNetwork'] = {network: 'my network'};
            component['networkName'] = 'newNetwork';
            component['networkDescription'] = 'myDescription';
            component['cardName'] = 'myCardName';

            mockBusinessNetworkService.deployBusinessNetwork.returns(Promise.resolve());

            component.finishedSampleImport.subscribe((result) => {
                result.should.deep.equal({deployed: true});
            });

            component.deploy();

            tick();

            mockBusinessNetworkService.deployBusinessNetwork.should.have.been.calledWith({network: 'my network'}, 'myCardName', 'newNetwork', 'myDescription', '', null, null);

            component['deployInProgress'].should.equal(false);

            finishedSampleImportSpy.should.have.been.calledWith({deployed: true});
        }));

        it('should handle error', fakeAsync(() => {
            component['currentBusinessNetwork'] = {network: 'my network'};
            mockBusinessNetworkService.deployBusinessNetwork.returns(Promise.reject({message: 'some error'}));

            component.finishedSampleImport.subscribe((result) => {
                result.should.deep.equal({deployed: false, error: {message: 'some error'}});
            });

            let deployPromise = component.deploy();

            tick();

            mockBusinessNetworkService.deployBusinessNetwork.should.have.been.calledWith({network: 'my network'});
            component['deployInProgress'].should.equal(false);
            finishedSampleImportSpy.should.have.been.calledWith({deployed: false, error: {message: 'some error'}});
            mockAlertService.errorStatus$.next.should.have.been.calledWith({message: 'some error'});
        }));

        it('should handle error with card name', fakeAsync(() => {
            component['currentBusinessNetwork'] = {network: 'my network'};
            mockBusinessNetworkService.deployBusinessNetwork.returns(Promise.reject({message: 'Card already exists: bob'}));

            let deployPromise = component.deploy();

            tick();

            mockBusinessNetworkService.deployBusinessNetwork.should.have.been.calledWith({network: 'my network'});
            component['deployInProgress'].should.equal(false);
            component['cardNameValid'].should.equal(false);
            finishedSampleImportSpy.should.not.have.been.called;
            mockAlertService.errorStatus$.next.should.not.have.been.called;
        }));
    });

    describe('setNetworkName', () => {

        it('should set the name and desc to values passed', fakeAsync(() => {
            component.updateBusinessNetworkNameAndDesc({name: 'my-network', description: 'some description'});

            tick();

            component['networkName'].should.deep.equal('my-network');
            component['networkDescription'].should.deep.equal('some description');
        }));

        it('should not update the name if a user has changed the value', fakeAsync(() => {
            component['networkName'] = 'user-entered-name';
            component.updateBusinessNetworkNameAndDesc({name: 'my-network', description: 'some description'});

            tick();

            component['networkName'].should.deep.equal('user-entered-name');
            component['networkDescription'].should.deep.equal('some description');
        }));

        it('should not update the description if a user has changed the value', fakeAsync(() => {
            component['networkDescription'] = 'user entered description';
            component.updateBusinessNetworkNameAndDesc({name: 'my-network', description: 'some description'});

            tick();

            component['networkName'].should.deep.equal('my-network');
            component['networkDescription'].should.deep.equal('user entered description');
        }));

        it('should set name to undefined when no name sent', fakeAsync(() => {
            component.updateBusinessNetworkNameAndDesc({});

            tick();

            should.equal(component['networkName'], undefined);
        }));

        it('should set desc to \'\' when no desc sent', fakeAsync(() => {
            component.updateBusinessNetworkNameAndDesc({});

            tick();

            component['networkDescription'].should.deep.equal('');
        }));

        it('should set the network name', () => {
            component['setNetworkName']('bob');

            component['networkName'].should.equal('bob');
            component['networkNameValid'].should.equal(true);
        });

        it('should allow numbers and letters and -', () => {
            component['setNetworkName']('bob-123');

            component['networkName'].should.equal('bob-123');
            component['networkNameValid'].should.equal(true);
        });

        it('show not allow capitals', () => {
            component['setNetworkName']('BOB-123');

            component['networkName'].should.equal('BOB-123');
            component['networkNameValid'].should.equal(false);
        });

        it('should not allow non alphanumeric characters', () => {
            component['setNetworkName']('bob?');

            component['networkName'].should.equal('bob?');
            component['networkNameValid'].should.equal(false);
        });

        it('should permit no input', () => {
            component['setNetworkName']('');

            component['networkName'].should.equal('');
            component['networkNameValid'].should.equal(true);
        });
    });

    describe('updateCredentials', () => {
        it('should set details to null if no event', () => {
            component.updateCredentials(null);

            should.not.exist(component['userId']);
            should.not.exist(component['userSecret']);
            should.not.exist(component['credentials']);
        });

        it('should set the userId and secret', () => {
            let event = {userId: 'myUserId', secret: 'mySecret'};

            component.updateCredentials(event);

            component['userId'].should.equal('myUserId');
            component['userSecret'].should.equal('mySecret');

            should.not.exist(component['credentials']);
        });

        it('should set the credentials', () => {
            let event = {userId: 'myUserId', cert: 'myCert', key: 'myKey'};

            component.updateCredentials(event);

            component['userId'].should.equal('myUserId');
            component['credentials'].should.deep.equal({certificate: 'myCert', privateKey: 'myKey'});

            should.not.exist(component['userSecret']);
        });
    });

    describe('isInvalidDeploy', () => {
        it('should set invalid if no network name', () => {
            component['networkName'] = null;

            component['networkNameValid'] = true;

            component['deployInProgress'] = false;

            component['showCredentials'] = false;

            let result = component.isInvalidDeploy();

            result.should.equal(true);
        });

        it('should set invalid if network name invalid', () => {
            component['networkName'] = 'myNetwork';

            component['networkNameValid'] = false;

            component['deployInProgress'] = false;

            component['showCredentials'] = false;

            let result = component.isInvalidDeploy();

            result.should.equal(true);
        });

        it('should set invalid if deploy in progress', () => {
            component['networkName'] = 'myNetwork';

            component['networkNameValid'] = true;

            component['deployInProgress'] = true;

            component['showCredentials'] = false;

            let result = component.isInvalidDeploy();

            result.should.equal(true);
        });

        it('should set invalid if no userId', () => {
            component['networkName'] = 'myNetwork';

            component['networkNameValid'] = true;

            component['deployInProgress'] = false;

            component['showCredentials'] = true;

            component['userId'] = null;

            let result = component.isInvalidDeploy();

            result.should.equal(true);
        });

        it('should set valid', () => {
            component['networkName'] = 'myNetwork';

            component['networkNameValid'] = true;

            component['deployInProgress'] = false;

            component['showCredentials'] = false;

            let result = component.isInvalidDeploy();

            result.should.equal(false);
        });
    });

    describe('setCardName', () => {
        it('should set the card name and cardNameValid to true', () => {
            component['setCardName']('myCardName');

            component['cardName'].should.equal('myCardName');
            component['cardNameValid'].should.equal(true);
        });

        it('should not set the card name if it hasn\'t changed and not update cardNameValid', () => {
            component['cardNameValid'] = false;
            component['cardName'] = 'myCardName';
            component['setCardName']('myCardName');

            component['cardName'].should.equal('myCardName');
            component['cardNameValid'].should.equal(false);
        });
    });
});
