import { ComponentFixture, TestBed, async, fakeAsync } from '@angular/core/testing';
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

  beforeEach(() => {
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
  });


  afterEach(() => {
    sandbox.restore();
  });

  describe('#fileDetected', () => {
    it('should change this.expandInput to true', () => {
      component.fileDetected();
      component.expandInput.should.equal(true);
    });
  });

  describe('#fileLeft', () => {
    it('should change this.expectedInput to false', () => {
      component.fileLeft();
      component.expandInput.should.equal(false);
    });
  });

  describe('#fileAccepted', () => {
    it('should call this.createModel', async(() => {
      let b = new Blob(['/**CTO File*/'], {type: 'text/plain'});
      let file = new File([b], 'newfile.cto');

      let createMock = sandbox.stub(component, 'createModel');
      let dataBufferMock = sandbox.stub(component, 'getDataBuffer')
                                .returns(Promise.resolve('some data'));

      component.fileAccepted(file);
      createMock.called;
    }));

    it('should call this.createScript', () => {

      let b = new Blob(['/**JS File*/'], {type: 'text/plain'});
      let file = new File([b], 'newfile.js');

      let createMock = sandbox.stub(component, 'createScript');
      let dataBufferMock = sandbox.stub(component, 'getDataBuffer')
                                .returns(Promise.resolve('some data'));

      component.fileAccepted(file);
      createMock.called;
    });

    it('should call this.fileRejected when there is an error reading the file', () => {

      let b = new Blob(['/**CTO File*/'], {type: 'text/plain'});
      let file = new File([b], 'newfile.cto');

      let createMock = sandbox.stub(component, 'fileRejected');
      let dataBufferMock = sandbox.stub(component, 'getDataBuffer')
                                .returns(Promise.reject('some data'));

      component.fileAccepted(file);
      createMock.called;
    });

    it('should throw when given incorrect file type', () => {

      let b = new Blob(['/**PNG File*/'], {type: 'text/plain'});
      let file = new File([b], 'newfile.png');

      let createMock = sandbox.stub(component, 'fileRejected');
      let dataBufferMock = sandbox.stub(component, 'getDataBuffer')
                                .returns(Promise.resolve('some data'));

      component.fileAccepted(file);
      createMock.called;
    });
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

  describe('#createModel', () => {
    it('should create a new model file', async(() => {
      component.businessNetwork = mockBusinessNetwork;
      let b = new Blob(
        [ `/**CTO File**/ namespace test` ],
        { type: 'text/plain' }
      );
      let file = new File([b], 'newfile.cto');
      let dataBuffer = new Buffer('/**CTO File**/ namespace test');
      let mockModel = new ModelFile(mockModelManager, dataBuffer.toString(), file.name);
      component.createModel(file, dataBuffer);
      component.fileType.should.equal('cto');
      component.currentFile.should.deep.equal(mockModel);
      component.currentFileName.should.equal(mockModel.getFileName());
    }));
  });

  describe('#changeCurrentFileType', () => {
    it('should change this.currentFileType to a js file', async(() => {
      let mockScript = sinon.createStubInstance(Script);
      mockScript.getIdentifier.returns('script.js');
      mockScriptManager.getScripts.returns([]);
      mockScriptManager.createScript.returns(mockScript);

      component.fileType = 'js';
      component.addScriptFileExtension = '.js';
      component.businessNetwork = mockBusinessNetwork;

      component.changeCurrentFileType();
      component.currentFileName.should.equal('script.js');
      component.currentFile.should.deep.equal(mockScript);
    }));

    it('should change this.currentFileType to a cto file', async(() => {
      mockModelManager.getModelFiles.returns([]);
      let b = new Blob(
        [ `/**
 * New model file
 */

namespace org.acme.model` ],
        { type: 'text/plain' }
      );
      let file = new File([b], 'lib/org.acme.model.cto');
      let dataBuffer = new Buffer(`/**
 * New model file
 */

namespace org.acme.model`);
      let mockModel = new ModelFile(mockModelManager, dataBuffer.toString(), file.name);

      component.fileType = 'cto';
      component.businessNetwork = mockBusinessNetwork;

      component.changeCurrentFileType();
      component.currentFileName.should.equal('lib/org.acme.model.cto');
      component.currentFile.should.deep.equal(mockModel);

    }));
  });

  describe('#removeFile', () => {
    it('should reset back to default values', async(() => {
      component.expandInput = true;
      component.currentFile = true;
      component.currentFileName = true;
      component.fileType = 'js';

      component.removeFile();
      component.expandInput.should.not.be.true;
      expect(component.currentFile).to.be.null;
      expect(component.currentFileName).to.be.null;
      component.fileType.should.equal('');
    }));
  });

  describe('#getDataBuffer', () => {
    let file;
    let mockFileReadObj;
    let mockBuffer;
    let mockFileRead;
    let content;

    beforeEach(() => {
      content = 'hello world';
      let data = new Blob([content], {type: 'text/plain'});
      file = new File([data], 'mock.bna');

      mockFileReadObj = {
        readAsArrayBuffer: sandbox.stub(),
        result: content,
        onload: () => {
        },
        onerror: () => {
        }
      };

      mockFileRead = sinon.stub(window, 'FileReader');
      mockFileRead.returns(mockFileReadObj);
    });

    afterEach(() => {
      mockFileRead.restore();
    });

    it('should return data from a file', () => {
      let promise = component.getDataBuffer(file);
      mockFileReadObj.onload();
      return promise
      .then(data => {
        data.toString().should.equal(content);
      });
    });

    it('should give error in promise chain', () => {
      let promise = component.getDataBuffer(file);
      mockFileReadObj.onerror('error');
      return promise
      .then(data => {
        data.should.be.null;
      })
      .catch(err => {
        err.should.equal('error');
      });
    });
  });
});
