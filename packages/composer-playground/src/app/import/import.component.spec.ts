/* tslint:disable:no-unused-variable */
import {ComponentFixture, TestBed, fakeAsync, tick} from '@angular/core/testing';
import {Directive, EventEmitter, Output, Input} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {By} from '@angular/platform-browser';

import {ImportComponent} from './import.component';

import {AdminService} from '../services/admin.service';
import {ClientService} from '../services/client.service';
import {SampleBusinessNetworkService} from '../services/samplebusinessnetwork.service';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {AlertService} from '../services/alert.service';

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
  public dragFileAccepted: EventEmitter<File> = new EventEmitter<File>();

  @Input()
  public expandInput: boolean = false;

  @Input()
  public svgName: string = '#icon-BNA_Upload';
}

describe('ImportComponent', () => {
  let sandbox;
  let component: ImportComponent;
  let fixture: ComponentFixture<ImportComponent>;

  let mockDragDropComponent;

  let mockBusinessNetworkService = sinon.createStubInstance(SampleBusinessNetworkService);
  let mockAdminService = sinon.createStubInstance(AdminService);
  let mockAlertService = sinon.createStubInstance(AlertService);
  let mockClientService = sinon.createStubInstance(ClientService);
  let mockActiveModal = sinon.createStubInstance(NgbActiveModal);

  mockAlertService.errorStatus$ = {
    next: sinon.stub()
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [ImportComponent, MockDragDropDirective, MockFileImporterDirective],
      providers: [
        {provide: SampleBusinessNetworkService, useValue: mockBusinessNetworkService},
        {provide: AdminService, useValue: mockAdminService},
        {provide: ClientService, useValue: mockClientService},
        {provide: NgbActiveModal, useValue: mockActiveModal},
        {provide: AlertService, useValue: mockAlertService}]
    });

    sandbox = sinon.sandbox.create();

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
      mockAdminService.ensureConnected.returns(Promise.resolve());
      mockClientService.ensureConnected.returns(Promise.resolve());
      mockBusinessNetworkService.isOAuthEnabled.returns(Promise.resolve(true));
      onShowMock = sinon.stub(component, 'onShow');
    });

    it('should create', () => {
      component.should.be.ok;
    });

    it('should setup the import modal', fakeAsync(() => {
      mockBusinessNetworkService.isOAuthEnabled.returns(Promise.resolve(false));

      component.ngOnInit();

      tick();

      should.not.exist(component['currentBusinessNetwork']);
      component['oAuthEnabled'].should.equal(false);
      onShowMock.should.have.been.called;
    }));

    it('should setup the import modal and get client', fakeAsync(() => {
      mockBusinessNetworkService.getGithubClientId.returns(Promise.resolve('client_id'));
      component.ngOnInit();

      tick();

      should.not.exist(component['currentBusinessNetwork']);
      component['oAuthEnabled'].should.equal(true);
      component['clientId'].should.equal('client_id');
      onShowMock.should.have.been.called;
    }));

    it('should exit and give an error if no client id', fakeAsync(() => {
      mockBusinessNetworkService.getGithubClientId.returns(Promise.resolve());
      component.ngOnInit();

      tick();

      should.not.exist(component['currentBusinessNetwork']);
      component['oAuthEnabled'].should.equal(true);
      mockActiveModal.dismiss.should.have.been.called;
      onShowMock.should.not.have.been.called;
    }));
  });

  describe('onShow', () => {
    it('should check if authenticated with github', fakeAsync(() => {
      mockBusinessNetworkService.isAuthenticatedWithGitHub.returns(true);
      mockBusinessNetworkService.getModelsInfo.returns(Promise.resolve([{name: 'modelOne'}]));

      component.onShow();

      component['gitHubInProgress'].should.equal(true);
      tick();

      component['sampleNetworks'].should.deep.equal([{name: 'modelOne'}]);
      component['gitHubInProgress'].should.equal(false);
    }));

    it('should handle rate limit error', fakeAsync(() => {
      mockBusinessNetworkService.isAuthenticatedWithGitHub.returns(true);
      mockBusinessNetworkService.getModelsInfo.returns(Promise.reject({message: 'API rate limit exceeded'}));
      mockBusinessNetworkService.RATE_LIMIT_MESSAGE = 'api limit';

      component.onShow();

      component['gitHubInProgress'].should.equal(true);
      tick();

      component['gitHubInProgress'].should.equal(false);
      mockActiveModal.dismiss.should.have.been.called;
     }));

    it('should handle error', fakeAsync(() => {
      mockBusinessNetworkService.isAuthenticatedWithGitHub.returns(true);
      mockBusinessNetworkService.getModelsInfo.returns(Promise.reject({message: 'some error'}));

      component.onShow();

      component['gitHubInProgress'].should.equal(true);
      tick();

      component['gitHubInProgress'].should.equal(false);
      mockActiveModal.dismiss.should.have.been.called;
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
      let content = "Hello World";
      let data = new Blob([content], {type: 'text/plain'});
      let arrayOfBlob = new Array<Blob>();
      arrayOfBlob.push(data);
      file = new File(arrayOfBlob, "mock.bna");

      mockFileReadObj = {
        onload: () => {
        },
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
      mockBusinessNetworkService.getBusinessNetworkFromArchive.returns(Promise.resolve({network: 'mockNetwork'}));

      mockDragDropComponent.fileDragDropFileAccepted.emit(file);

      mockFileReadObj.readAsArrayBuffer.should.have.been.calledWith(file);

      mockFileReadObj.onload();

      tick();

      mockBusinessNetworkService.getBusinessNetworkFromArchive.should.have.been.called;

      component['currentBusinessNetwork'].should.deep.equal({network: 'mockNetwork'});
      component['expandInput'].should.equal(true);
    }));

    it('should handle error', fakeAsync(() => {
      mockBusinessNetworkService.getBusinessNetworkFromArchive.returns(Promise.reject('some error'));

      mockDragDropComponent.fileDragDropFileAccepted.emit(file);

      mockFileReadObj.readAsArrayBuffer.should.have.been.calledWith(file);

      mockFileReadObj.onload();

      tick();

      mockBusinessNetworkService.getBusinessNetworkFromArchive.should.have.been.called;

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
    it('should remove thie file', () => {
      component.removeFile();

      component['expandInput'].should.equal(false);
      should.not.exist(component['currentBusinessNetwork']);
    });
  });

  describe('deploy', () => {
    it('should deploy a business network from github', fakeAsync(() => {

      let deployGithubMock = sinon.stub(component, 'deployFromGitHub').returns(Promise.resolve());

      component.deploy();

      component['deployInProgress'].should.equal(true);

      deployGithubMock.should.have.been.called;

      tick();

      component['deployInProgress'].should.equal(false);
      mockActiveModal.close.should.have.been.called;
    }));

    it('should deploy a business network from business network', fakeAsync(() => {

      component['currentBusinessNetwork'] = {network: 'my network'};
      mockBusinessNetworkService.deployBusinessNetwork.returns(Promise.resolve());

      component.deploy();

      component['deployInProgress'].should.equal(true);
      mockBusinessNetworkService.deployBusinessNetwork.should.have.been.calledWith({network: 'my network'});

      tick();

      component['deployInProgress'].should.equal(false);
      mockActiveModal.close.should.have.been.called;
    }));

    it('should handle rate limit error', fakeAsync(() => {

      component['currentBusinessNetwork'] = {network: 'my network'};
      mockBusinessNetworkService.deployBusinessNetwork.returns(Promise.reject({message: 'API rate limit exceeded'}));

      component.deploy();

      component['deployInProgress'].should.equal(true);
      mockBusinessNetworkService.deployBusinessNetwork.should.have.been.calledWith({network: 'my network'});

      tick();

      component['deployInProgress'].should.equal(false);
      mockActiveModal.dismiss.should.have.been.called;
    }));

    it('should handle error', fakeAsync(() => {

      component['currentBusinessNetwork'] = {network: 'my network'};
      mockBusinessNetworkService.deployBusinessNetwork.returns(Promise.reject({message : 'some error'}));

      component.deploy();

      component['deployInProgress'].should.equal(true);
      mockBusinessNetworkService.deployBusinessNetwork.should.have.been.calledWith({network: 'my network'});

      tick();

      component['deployInProgress'].should.equal(false);
      mockActiveModal.dismiss.should.have.been.called;
    }));
  });

  describe('deployFromGitHub', () => {
    it('should deploy from github', () => {
      component['sampleNetworks'] = [{name: 'bob'}, {name: 'fred'}];
      component['chosenNetwork'] = 'fred';

      component.deployFromGitHub();

      mockBusinessNetworkService.deploySample.should.have.been.calledWith('hyperledger', 'composer-sample-networks', {name: 'fred'});
    });

    it('should deploy from github using custom repo', () => {
      component['sampleNetworks'] = [{name: 'bob'}, {name: 'fred'}];
      component['chosenNetwork'] = 'bob';

      component['owner'] = 'my owner';
      component['repository'] = 'my repository';

      component.deployFromGitHub();

      mockBusinessNetworkService.deploySample.should.have.been.calledWith('my owner', 'my repository', {name: 'bob'});
    });
  });
});
