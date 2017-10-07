/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Directive, EventEmitter, Output, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { ImportComponent } from './import.component';

import { AdminService } from '../services/admin.service';
import { ClientService } from '../services/client.service';
import { SampleBusinessNetworkService } from '../services/samplebusinessnetwork.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AlertService } from '../basic-modals/alert.service';
import { DeployComponent } from './deploy.component';
import { BusinessNetworkDefinition } from 'composer-common';

import * as sinon from 'sinon';
import * as chai from 'chai';

let should = chai.should();

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
    let mockAdminService;
    let mockAlertService;
    let mockClientService;
    let mockNgbModal;

    beforeEach(() => {
        mockBusinessNetworkService = sinon.createStubInstance(SampleBusinessNetworkService);
        mockAdminService = sinon.createStubInstance(AdminService);
        mockAlertService = sinon.createStubInstance(AlertService);
        mockClientService = sinon.createStubInstance(ClientService);
        mockNgbModal = sinon.createStubInstance(NgbModal);

        mockAlertService.errorStatus$ = {
            next: sinon.stub()
        };

        mockAlertService.busyStatus$ = {
            next: sinon.stub()
        };

        TestBed.configureTestingModule({
            imports: [FormsModule],
            declarations: [DeployComponent, ImportComponent, MockDragDropDirective, MockFileImporterDirective, MockPerfectScrollBarDirective],
            providers: [
                {provide: SampleBusinessNetworkService, useValue: mockBusinessNetworkService},
                {provide: AdminService, useValue: mockAdminService},
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
            mockAdminService.connectWithoutNetwork.returns(Promise.resolve());
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
        it('should get the list of sample networks', fakeAsync(() => {
            let selectNetworkStub = sinon.stub(component, 'selectNetwork');
            let addEmptyNetworkOption = sinon.stub(component, 'addEmptyNetworkOption').returns([{name: 'empty'}, {name: 'modelOne'}, {name: 'modelTwo'}]);
            mockBusinessNetworkService.getSampleList.returns(Promise.resolve([{name: 'modelTwo'}, {name: 'modelOne'}]));

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

            component.onShow();

            component['npmInProgress'].should.equal(true);
            tick();

            component['npmInProgress'].should.equal(false);

            mockAlertService.errorStatus$.next.should.have.been.called;
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
            businessNetworkDefinition.getAclManager().getAclFile().getDefinitions().should.be.a('string');
        }));
    });

    describe('selectNetwork', () => {
        it('should select the network', fakeAsync(() => {
            mockBusinessNetworkService.getChosenSample.returns(Promise.resolve({network: 'myNetwork'}));
            component.selectNetwork('bob');

            tick();

            component['chosenNetwork'];
            component['currentBusinessNetwork'].should.deep.equal({network: 'myNetwork'});
        }));

        it('should select the empty network', () => {
            let empty = sinon.stub(component, 'deployEmptyNetwork');

            component.selectNetwork({name: 'empty-business-network'});

            empty.should.have.been.called;
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
            selectStub.should.have.been.calledWith({network: 'two'});
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

            let businessNetworkMock = {
                network: 'mockNetwork',
                getMetadata: sinon.stub().returns(metaDataMock)
            };

            mockClientService.getBusinessNetworkFromArchive.returns(Promise.resolve(businessNetworkMock));

            mockDragDropComponent.fileDragDropFileAccepted.emit(file);

            mockFileReadObj.readAsArrayBuffer.should.have.been.calledWith(file);

            mockFileReadObj.onload();

            tick();

            mockClientService.getBusinessNetworkFromArchive.should.have.been.called;
            component['currentBusinessNetwork'].network.should.equal('mockNetwork');
            component['expandInput'].should.equal(false);
            component['chosenNetwork'].should.deep.equal({json: 'some json'});
            component['sampleDropped'].should.equal(true);
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

            mockBusinessNetworkService.deployBusinessNetwork.returns(Promise.resolve());

            component.finishedSampleImport.subscribe((result) => {
                result.should.deep.equal({deployed: true});
            });

            component.deploy();

            tick();

            mockBusinessNetworkService.deployBusinessNetwork.should.have.been.calledWith({network: 'my network'}, 'newNetwork', 'myDescription');

            component['deployInProgress'].should.equal(false);

            finishedSampleImportSpy.should.have.been.calledWith({deployed: true});
        }));

        it('should handle error', fakeAsync(() => {
            component['currentBusinessNetwork'] = {network: 'my network'};
            mockBusinessNetworkService.deployBusinessNetwork.returns(Promise.reject('some error'));

            component.finishedSampleImport.subscribe((result) => {
                result.should.deep.equal({deployed: false, error: 'some error'});
            });

            let deployPromise = component.deploy();

            tick();

            mockBusinessNetworkService.deployBusinessNetwork.should.have.been.calledWith({network: 'my network'});
            component['deployInProgress'].should.equal(false);
            finishedSampleImportSpy.should.have.been.calledWith({deployed: false, error: 'some error'});
            mockAlertService.errorStatus$.next.should.have.been.calledWith('some error');
        }));
    });

    describe('setNetworkName', () => {
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
});
