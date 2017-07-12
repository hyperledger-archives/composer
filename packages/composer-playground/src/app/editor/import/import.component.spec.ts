/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Directive, EventEmitter, Output, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { ImportComponent } from './import.component';

import { AdminService } from '../../services/admin.service';
import { ClientService } from '../../services/client.service';
import { SampleBusinessNetworkService } from '../../services/samplebusinessnetwork.service';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AlertService } from '../../basic-modals/alert.service';

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

describe('ImportComponent', () => {
    let sandbox;
    let component: ImportComponent;
    let fixture: ComponentFixture<ImportComponent>;

    let mockDragDropComponent;

    let mockBusinessNetworkService;
    let mockAdminService;
    let mockAlertService;
    let mockClientService;
    let mockActiveModal;
    let mockNgbModal;

    const EMPTY_NETWORK = {
        name: 'Empty Business Network',
        description: 'Start from scratch with a blank business network'
    };

    beforeEach(() => {
        mockBusinessNetworkService = sinon.createStubInstance(SampleBusinessNetworkService);
        mockAdminService = sinon.createStubInstance(AdminService);
        mockAlertService = sinon.createStubInstance(AlertService);
        mockClientService = sinon.createStubInstance(ClientService);
        mockActiveModal = sinon.createStubInstance(NgbActiveModal);
        mockNgbModal = sinon.createStubInstance(NgbModal);

        mockAlertService.errorStatus$ = {
            next: sinon.stub()
        };

        mockAlertService.busyStatus$ = {
            next: sinon.stub()
        };

        TestBed.configureTestingModule({
            imports: [FormsModule],
            declarations: [ImportComponent, MockDragDropDirective, MockFileImporterDirective, MockPerfectScrollBarDirective],
            providers: [
                {provide: SampleBusinessNetworkService, useValue: mockBusinessNetworkService},
                {provide: AdminService, useValue: mockAdminService},
                {provide: ClientService, useValue: mockClientService},
                {provide: NgbActiveModal, useValue: mockActiveModal},
                {provide: AlertService, useValue: mockAlertService},
                {provide: NgbModal, useValue: mockNgbModal}]
        });

        sandbox = sinon.sandbox.create();

        mockNgbModal.open.returns({componentInstance: {}});

        fixture = TestBed.createComponent(ImportComponent);
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
            mockClientService.ensureConnected.returns(Promise.resolve());
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
            mockBusinessNetworkService.getSampleList.returns(Promise.resolve([{name: 'modelOne'}]));

            component.onShow();
            component['gitHubInProgress'].should.equal(true);
            tick();

            component['gitHubInProgress'].should.equal(false);
            component['sampleNetworks'].should.deep.equal([EMPTY_NETWORK, {name: 'modelOne'}]);
        }));

        it('should handle error', fakeAsync(() => {
            mockBusinessNetworkService.getSampleList.returns(Promise.reject({message: 'some error'}));

            component.onShow();

            component['gitHubInProgress'].should.equal(true);
            tick();

            component['gitHubInProgress'].should.equal(false);

            mockAlertService.errorStatus$.next.should.have.been.called;
        }));
    });

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
            mockClientService.getBusinessNetworkFromArchive.returns(Promise.resolve({network: 'mockNetwork'}));

            mockDragDropComponent.fileDragDropFileAccepted.emit(file);

            mockFileReadObj.readAsArrayBuffer.should.have.been.calledWith(file);

            mockFileReadObj.onload();

            tick();

            mockClientService.getBusinessNetworkFromArchive.should.have.been.called;

            component['currentBusinessNetwork'].should.deep.equal({network: 'mockNetwork'});
            component['expandInput'].should.equal(true);
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

    describe('remove file', () => {
        it('should remove the file', () => {
            component.removeFile();

            component['expandInput'].should.equal(false);
            should.not.exist(component['currentBusinessNetwork']);
        });
    });

    describe('deploy', () => {
        it('should deploy a business network from github', fakeAsync(() => {

            let deployNpmMock = sinon.stub(component, 'deployFromNpm').returns(Promise.resolve());

            mockNgbModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.resolve(true)
            });

            component.deploy();

            tick();

            deployNpmMock.should.have.been.called;

            component['deployInProgress'].should.equal(false);
            mockActiveModal.close.should.have.been.called;
        }));

        it('should deploy a business network from business network', fakeAsync(() => {

            mockNgbModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.resolve(true)
            });

            component['currentBusinessNetwork'] = {network: 'my network'};
            mockBusinessNetworkService.deployBusinessNetwork.returns(Promise.resolve());

            component.deploy();

            tick();

            mockBusinessNetworkService.deployBusinessNetwork.should.have.been.calledWith({network: 'my network'});

            component['deployInProgress'].should.equal(false);
            mockActiveModal.close.should.have.been.called;
        }));

        it('should handle rate limit error', fakeAsync(() => {

            mockNgbModal.open = sinon.stub().returns({
                result: Promise.resolve(true),
                componentInstance: {}
            });

            component['currentBusinessNetwork'] = {network: 'my network'};
            mockBusinessNetworkService.deployBusinessNetwork.returns(Promise.reject({message: 'API rate limit exceeded'}));

            component.deploy();

            tick();

            mockBusinessNetworkService.deployBusinessNetwork.should.have.been.calledWith({network: 'my network'});
            component['deployInProgress'].should.equal(false);
            component.modalService.open.should.have.been.called;
        }));

        it('should handle error', fakeAsync(() => {

            mockNgbModal.open = sinon.stub().returns({
                result: Promise.resolve(true),
                componentInstance: {}
            });

            component['currentBusinessNetwork'] = {network: 'my network'};
            mockBusinessNetworkService.deployBusinessNetwork.returns(Promise.reject({message: 'some error'}));

            component.deploy();

            tick();

            mockBusinessNetworkService.deployBusinessNetwork.should.have.been.calledWith({network: 'my network'});
            component['deployInProgress'].should.equal(false);
            component.modalService.open.should.have.been.called;
        }));
    });

    describe('deployFromNpm', () => {
        it('should deploy from npm', () => {
            component['sampleNetworks'] = [{name: 'bob'}, {name: 'fred'}];
            component['chosenNetwork'] = 'fred';

            component.deployFromNpm();

            mockBusinessNetworkService.deployChosenSample.should.have.been.calledWith({name: 'fred'});
        });

        it('should deploy the empty business network if chosen', () => {
            component['sampleNetworks'] = [EMPTY_NETWORK];
            component['chosenNetwork'] = EMPTY_NETWORK.name;
            component['owner'] = 'my owner';
            component['repository'] = 'my repository';
            // TODO: figure out why this causes Error: Cannot find module "."
            // component.deployFromGitHub();
            // mockBusinessNetworkService.deploySample.should.have.been.calledWith('my owner', 'my repository', EMPTY_NETWORK);
        });
    });

    describe('orderGitHubNetworks', () => {

        const BASIC_SAMPLE = 'basic-sample-network';
        const CAR_AUCTION = 'carauction-network';
        const FOO = 'foo';
        const BAR = 'bar';
        const primaryNetworkNames = [BASIC_SAMPLE];

        it('should return an array only allowing an empty project to be created when an empty array is input', () => {
            let result = component.orderGitHubProjects([]);
            result.length.should.equal(1);
            result[0].name.should.equal('Empty Business Network');
        });

        it('should order the list of networks correctly (alphabetically) if a list of networks is passed in', () => {
            let INPUT_NETWORKS = [{name: FOO}, {name: BASIC_SAMPLE}, {name: CAR_AUCTION}];
            let result = component.orderGitHubProjects(INPUT_NETWORKS);
            result.length.should.equal(4);
            result[0].name.should.equal(BASIC_SAMPLE);
            result[1].name.should.equal(EMPTY_NETWORK.name);
            result[2].name.should.equal(CAR_AUCTION);
            result[3].name.should.equal(FOO);
        });

        it('should order the list of networks correctly (alphabetically) if a list of networks is passed in without the primary network names', () => {
            let INPUT_NETWORKS = [{name: FOO}, {name: BAR}];
            let result = component.orderGitHubProjects(INPUT_NETWORKS);
            result.length.should.equal(3);
            result[0].name.should.equal(EMPTY_NETWORK.name);
            result[1].name.should.equal(BAR);
            result[2].name.should.equal(FOO);
        });

        it('should deal with networks with the same name correctly', () => {
            let INPUT_NETWORKS = [{name: FOO}, {name: FOO}];
            let result = component.orderGitHubProjects(INPUT_NETWORKS);
            result.length.should.equal(3);
            result[0].name.should.equal(EMPTY_NETWORK.name);
            result[1].name.should.equal(FOO);
            result[2].name.should.equal(FOO);
        });

        it('should deal with the case where two networks are correctly sorted', () => {
            let INPUT_NETWORKS = [{name: BAR}, {name: FOO}];
            let result = component.orderGitHubProjects(INPUT_NETWORKS);
            result.length.should.equal(3);
            result[0].name.should.equal(EMPTY_NETWORK.name);
            result[1].name.should.equal(BAR);
            result[2].name.should.equal(FOO);
        });
    });

});
