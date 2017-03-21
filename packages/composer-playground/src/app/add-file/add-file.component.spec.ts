import { ComponentFixture, TestBed, async } from '@angular/core/testing';
import { By }              from '@angular/platform-browser';
import { DebugElement }    from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { BehaviorSubject, Subject } from 'rxjs/Rx';

import { BusinessNetworkDefinition, AdminConnection } from 'composer-admin';
import { ModelFile, ModelManager, ScriptManager, Script } from 'composer-common';

import { AddFileComponent } from './add-file.component';
import { FileImporterComponent } from './../file-importer';
import { FileDragDropDirective } from './../directives/file-drag-drop';

import { AdminService } from '../services/admin.service';
import { ClientService } from '../services/client.service';
import { AlertService } from '../services/alert.service';

import * as sinon from 'sinon';

import { expect } from 'chai';

const fs = require('fs');

class MockAdminService {
  constructor() {
  }

  getAdminConnection(): AdminConnection {
    return new AdminConnection();
  }

  ensureConnection(): Promise<any> {
    return new Promise((resolve, reject) => {
      resolve(true);
    });
  }

  deploy(): Promise<any> {
    return new Promise((resolve, reject) => {
      resolve(new BusinessNetworkDefinition('org.acme.biznet@0.0.1', 'Acme Business Network'));
    });
  }

  update(): Promise<any> {
    return new Promise((resolve, reject) => {
      resolve(new BusinessNetworkDefinition('org.acme.biznet@0.0.1', 'Acme Business Network'));
    });
  }

  generateDefaultBusinessNetwork(): BusinessNetworkDefinition {
    return new BusinessNetworkDefinition('org.acme.biznet@0.0.1', 'Acme Business Network');
  }

  isInitialDeploy(): boolean {
    return true;
  }
}

class MockAlertService {
  public errorStatus$: Subject<string> = new BehaviorSubject<string>(null);
  public busyStatus$: Subject<string> = new BehaviorSubject<string>(null);
}


describe('AddFileComponent', () => {
  let sandbox;
  let component: AddFileComponent;
  let fixture: ComponentFixture<AddFileComponent>;
  let mockBusinessNetwork;
  let mockModelManager;
  let mockScriptManager;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        FileImporterComponent,
        AddFileComponent,
        FileDragDropDirective
      ],
      imports: [
        FormsModule
      ],
      providers: [
        { provide: AdminService, useClass: MockAdminService },
        { provide: AlertService, useClass: MockAlertService },
        NgbActiveModal
      ]
    });

    sandbox = sinon.sandbox.create();

    fixture = TestBed.createComponent(AddFileComponent);
    component = fixture.componentInstance;

    mockModelManager = sinon.createStubInstance(ModelManager);
    mockScriptManager = sinon.createStubInstance(ScriptManager);
    mockBusinessNetwork = sinon.createStubInstance(BusinessNetworkDefinition);
    mockBusinessNetwork.getModelManager.returns(mockModelManager);
    mockBusinessNetwork.getScriptManager.returns(mockScriptManager);
  }));


  afterEach(async(() => {
    sandbox.restore();
  }));

  describe('#fileDetected', () => {
    it('should change this.expandInput to true', () => {
      component.fileDetected();
      component.expandInput.should.equal(true);
    });
  });

  describe('#fileLeft', () => {
    it('should change this.expectedInput to false', () => {
      component.fileLeft();
      component.expandInput.should.equal(false)
    });
  });

  describe('#fileAccepted', () => {
    it('should call this.createModel', async(() => {
      let b = new Blob(['/**CTO File*/'], {type: 'text/plain'});
      let file = new File([b], 'newfile.cto');

      let createMock = sinon.stub(component, 'createModel');
      let dataBufferMock = sinon.stub(component, 'getDataBuffer')
                                .returns(Promise.resolve('some data'));

      component.fileAccepted(file);
      createMock.called;
    }));

    it('should call this.createScript', async(() => {

      let b = new Blob(['/**JS File*/'], {type: 'text/plain'});
      let file = new File([b], 'newfile.js');

      let createMock = sinon.stub(component, 'createScript');
      let dataBufferMock = sinon.stub(component, 'getDataBuffer')
                                .returns(Promise.resolve('some data'));

      component.fileAccepted(file);
      createMock.called;
    }));

    it('should call this.fileRejected when there is an error reading the file', async(() => {

      let b = new Blob(['/**CTO File*/'], {type: 'text/plain'});
      let file = new File([b], 'newfile.cto');

      let createMock = sinon.stub(component, 'fileRejected');
      let dataBufferMock = sinon.stub(component, 'getDataBuffer')
                                .returns(Promise.reject('some data'));

      component.fileAccepted(file);
      createMock.called;
    }));

    it('should throw when given incorrect file type', async(() => {

      let b = new Blob(['/**PNG File*/'], {type: 'text/plain'});
      let file = new File([b], 'newfile.png');

      let createMock = sinon.stub(component, 'fileRejected');
      let dataBufferMock = sinon.stub(component, 'getDataBuffer')
                                .returns(Promise.resolve('some data'));

      component.fileAccepted(file);
      createMock.called;
    }));
  });

  describe('#fileRejected', () => {
    it('should return an error status', async(() => {
      component.fileRejected('long reason to reject file');

      component['alertService'].errorStatus$.subscribe(
        message => {
          expect(message).to.be.equal('long reason to reject file');
        }
      );
    }));
  });

  describe('#createScript', () => {
    it('should create a new script file', async(() => {
      component.businessNetwork = mockBusinessNetwork;
      let mockScript = sinon.createStubInstance(Script);
      mockScript.getIdentifier.returns('newfile.js');
      mockScriptManager.createScript.returns(mockScript);

      let b = new Blob(['/**JS File*/'], {type: 'text/plain'});
      let file = new File([b], 'newfile.js');

      component.createScript(file, file);
      component.fileType.should.equal('js');
      component.currentFile.should.deep.equal(mockScript);
      component.currentFileName = mockScript.getIdentifier();
    }));
  });

  // describe('#createModel', () => {
  //   it('should create a new model file', async(() => {
  //     component.businessNetwork = mockBusinessNetwork;
  //     let mockModel = sinon.createStubInstance(ModelFile);
  //     mockModel.getFileName.returns('newfile.cto');
  //     let b = new Blob([
  //       `/**CTO File**/
  //       namespace test`
  //       ], {type: 'text/plain'});
  //     let file = new File([b], 'newfile.cto');

  //     component.createModel(file, file);
  //     component.fileType.should.equal('cto');
  //     component.currentFile.should.deep.equal(mockModel);
  //     component.currentFileName = mockModel.getIdentifier();
  //   }));
  // });

  describe('#changeCurrentFileType', () => {
    it('should change this.currentFileType to a js file', async(() => {
      let mockScript = sinon.createStubInstance(Script);
      mockScript.getIdentifier.returns('script.js');
      mockScriptManager.getScripts.returns([]);
      mockScriptManager.createScript.returns(mockScript);

      component.fileType = 'js';
      component.addScriptFileExtension = 'js';
      component.businessNetwork = mockBusinessNetwork;

      component.changeCurrentFileType();
      component.currentFileName.should.equal('script.js');
      component.currentFile.should.deep.equal(mockScript);
    }));
  });
});
