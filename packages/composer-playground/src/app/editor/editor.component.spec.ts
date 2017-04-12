/* tslint:disable:no-unused-variable */
import {ComponentFixture, TestBed, async,fakeAsync, tick} from '@angular/core/testing';
import {Directive, Input} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {By} from '@angular/platform-browser';
import {DebugElement} from '@angular/core';

import {EditorComponent} from './editor.component';

import {AdminService} from '../services/admin.service';
import {ClientService} from '../services/client.service';
import {EditorService} from '../services/editor.service';
import {InitializationService} from '../initialization.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {SampleBusinessNetworkService} from '../services/samplebusinessnetwork.service';
import {AlertService} from '../services/alert.service';
import {ModelFile, Script} from 'composer-common';

import * as sinon from 'sinon';
import * as chai from 'chai';

let should = chai.should();


@Directive({
  selector: 'editor-file'
})

class MockEditorFileDirective {
  @Input()
  public editorFile;
}


describe('EditorComponent', () => {
  let component: EditorComponent;
  let fixture: ComponentFixture<EditorComponent>;

  let mockBusinessNetworkService = sinon.createStubInstance(SampleBusinessNetworkService);
  let mockAdminService = sinon.createStubInstance(AdminService);
  let mockAlertService = sinon.createStubInstance(AlertService);
  let mockClientService = sinon.createStubInstance(ClientService);
  let mockModal = sinon.createStubInstance(NgbModal);
  let mockInitializationService = sinon.createStubInstance(InitializationService);
  let mockModelFile = sinon.createStubInstance(ModelFile);
  let mockScriptFile = sinon.createStubInstance(Script);
  let editorService = new EditorService();


  let mockRouterParams = {
    subscribe: (callback) => {
      callback();
    }
  };

  let mockRouter = {
    queryParams: mockRouterParams
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [EditorComponent, MockEditorFileDirective],
      providers: [
        {provide: SampleBusinessNetworkService, useValue: mockBusinessNetworkService},
        {provide: AdminService, useValue: mockAdminService},
        {provide: ClientService, useValue: mockClientService},
        {provide: NgbModal, useValue: mockModal},
        {provide: AlertService, useValue: mockAlertService},
        {provide: InitializationService, useValue: mockInitializationService},
        {provide: ActivatedRoute, useValue: mockRouter},
        {provide: EditorService, useValue: editorService}]
    });

    fixture = TestBed.createComponent(EditorComponent);
    component = fixture.componentInstance;
  });

  describe('ngOnInit', () => {
    beforeEach(() => {
      mockBusinessNetworkService.OPEN_SAMPLE = false;
      mockInitializationService.initialize.returns(Promise.resolve());
      mockClientService.businessNetworkChanged$ = {
        subscribe: (callback) => {
          let noError = true;
          callback(noError);
        }
      }
    });

    it('should create', () => {
      component.should.be.ok;
    });

    it('should initialize the editor', fakeAsync(() => {
      let mockUpdatePackage = sinon.stub(component, 'updatePackageInfo');
      let mockUpdateFiles = sinon.stub(component, 'updateFiles');
      component.ngOnInit();

      tick();

      component['noError'].should.equal(true);
      component['dirty'].should.equal(true);

      mockUpdatePackage.should.have.been.called;
      mockUpdateFiles.should.have.been.called;
    }));

    it('should open import modal', fakeAsync(() => {
      mockBusinessNetworkService.OPEN_SAMPLE = true;
      let mockImportModal = sinon.stub(component, 'openImportModal');
      let mockUpdatePackage = sinon.stub(component, 'updatePackageInfo');
      let mockUpdateFiles = sinon.stub(component, 'updateFiles');
      component.ngOnInit();

      tick();

      mockBusinessNetworkService.OPEN_SAMPLE.should.equal(false);
      mockImportModal.should.have.been.called;
      mockUpdatePackage.should.have.been.called;
      mockUpdateFiles.should.have.been.called;
    }));

    it('should set no error false', fakeAsync(() => {
      mockClientService.businessNetworkChanged$ = {
        subscribe: (callback) => {
          let noError = false;
          callback(noError);
        }
      };
      let mockImportModal = sinon.stub(component, 'openImportModal');
      let mockUpdatePackage = sinon.stub(component, 'updatePackageInfo');
      let mockUpdateFiles = sinon.stub(component, 'updateFiles');
      component.ngOnInit();

      tick();

      component['noError'].should.equal(false);
      component['dirty'].should.equal(true);

      mockUpdatePackage.should.have.been.called;
      mockUpdateFiles.should.have.been.called;
    }));

    it('should set current file to readme', fakeAsync(() => {
      let mockUpdatePackage = sinon.stub(component, 'updatePackageInfo');
      let mockUpdateFiles = sinon.stub(component, 'updateFiles');
      let mockCurrentFile = sinon.stub(component, 'setCurrentFile');

      component['files'] = [{readme: true}, {model: true}];
      component.ngOnInit();

      tick();

      mockCurrentFile.should.have.been.calledWith({readme: true});

      mockUpdatePackage.should.have.been.called;
      mockUpdateFiles.should.have.been.called;
    }));

    it('should set current file to first one if no readme', fakeAsync(() => {
      let mockUpdatePackage = sinon.stub(component, 'updatePackageInfo');
      let mockUpdateFiles = sinon.stub(component, 'updateFiles');
      let mockCurrentFile = sinon.stub(component, 'setCurrentFile');

      component['files'] = [{model: true}, {script: true}];
      component.ngOnInit();

      tick();

      mockCurrentFile.should.have.been.calledWith({model: true});

      mockUpdatePackage.should.have.been.called;
      mockUpdateFiles.should.have.been.called;
    }));
  });

  describe('updatePackageInfo', () => {
    it('should set the package info', () => {
      let mockMetaData = {
        getName: sinon.stub().returns('my name'),
        getVersion: sinon.stub().returns('my version'),
        getDescription: sinon.stub().returns('my description'),
      };

      mockClientService.getMetaData = sinon.stub().returns(mockMetaData);

      component.updatePackageInfo();

      component['deployedPackageName'].should.equal('my name');
      component['deployedPackageVersion'].should.equal('my version');
      component['deployedPackageDescription'].should.equal('my description');
      component['inputPackageName'].should.equal('my name');
      component['inputPackageVersion'].should.equal('my version');
    });
  });

  describe('setCurrentFile', () => {
    it('should set current file', () => {
      component['currentFile'] = {file: 'oldFile'};
      let file = {file: 'myFile'};
      component.setCurrentFile(file);
      component['currentFile'].should.deep.equal(file);
    });

    it('should set current file', () => {
      component['currentFile'] = {file: 'oldFile'};
      component['editingPackage'] = true;

      let mockUpdatePackage = sinon.stub(component, 'updatePackageInfo');

      let file = {file: 'myFile'};
      component.setCurrentFile(file);
      component['currentFile'].should.deep.equal(file);

      mockUpdatePackage.should.have.been.called;
      component['editingPackage'].should.equal(false);
    });
  });

  describe('updateFiles', () => {
    it('should update the files', () => {
      mockClientService.getModelFiles.returns([
        {getNamespace: sinon.stub().returns('model 2')},
        {getNamespace: sinon.stub().returns('model 1')}
      ]);

      mockClientService.getScripts.returns([
        {getIdentifier: sinon.stub().returns('script 2')},
        {getIdentifier: sinon.stub().returns('script 1')}
      ]);

      mockClientService.getAclFile.returns({getIdentifier: sinon.stub().returns('acl')});

      mockClientService.getMetaData.returns({
        getREADME: sinon.stub().returns('readme')
      });

      component.updateFiles();
      component['files'].length.should.equal(6);

      component['files'][0].should.deep.equal({
        readme: true,
        id: 'readme',
        displayID: 'README.md',
      });

      component['files'][1].should.deep.equal({
        model: true,
        id: 'model 1',
        displayID: 'lib/model 1.cto',
      });

      component['files'][2].should.deep.equal({
        model: true,
        id: 'model 2',
        displayID: 'lib/model 2.cto',
      });

      component['files'][3].should.deep.equal({
        script: true,
        id: 'script 1',
        displayID: 'script 1'
      });

      component['files'][4].should.deep.equal({
        script: true,
        id: 'script 2',
        displayID: 'script 2'
      });

      component['files'][5].should.deep.equal({
        acl: true,
        id: 'acl',
        displayID: 'acl',
      });
    });
  });

  describe('addModelFile', () => {
    it('should add a model file', () => {
      let mockUpdateFiles = sinon.stub(component, 'updateFiles');
      let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');

      component['addModelNamespace'] = 'namespace';
      component['files'] = [{id: 'random'}, {id: 'namespace'}];

      let modelManagerMock = {
        addModelFile: sinon.stub()
      };

      mockClientService.getBusinessNetwork.returns({
        getModelManager: sinon.stub().returns(modelManagerMock)
      });

      component.addModelFile();

      modelManagerMock.addModelFile.should.have.been.calledWith(`/**
  * New model file
  */

  namespace namespace`);
      mockUpdateFiles.should.have.been.called;

      mockSetCurrentFile.should.have.been.calledWith({id: 'namespace'});
      component['dirty'].should.equal(true);
    });

    it('should add a model file with contents', () => {
      let mockUpdateFiles = sinon.stub(component, 'updateFiles');
      let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');

      component['addModelNamespace'] = 'namespace';
      component['files'] = [{id: 'random'}, {id: 'namespace'}];

      let modelManagerMock = {
        addModelFile: sinon.stub()
      };

      mockClientService.getBusinessNetwork.returns({
        getModelManager: sinon.stub().returns(modelManagerMock)
      });

      component.addModelFile('my code');

      modelManagerMock.addModelFile.should.have.been.calledWith('my code');
      mockUpdateFiles.should.have.been.called;

      mockSetCurrentFile.should.have.been.calledWith({id: 'namespace'});
      component['dirty'].should.equal(true);
    });
  });

  describe('addScriptFile', () => {
    it('should add a script file', () => {
      let mockUpdateFiles = sinon.stub(component, 'updateFiles');
      let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');

      component['addScriptFileName'] = 'script';
      component['files'] = [{id: 'random'}, {id: 'script'}];

      let scriptManagerMock = {
        createScript: sinon.stub(),
        addScript: sinon.stub()
      };

      mockClientService.getBusinessNetwork.returns({
        getScriptManager: sinon.stub().returns(scriptManagerMock)
      });

      component.addScriptFile();

      scriptManagerMock.createScript.should.have.been.calledWith('script', 'JS', `/**
  * New script file
  */`);

      scriptManagerMock.addScript.should.have.been.called;
      mockUpdateFiles.should.have.been.called;

      mockSetCurrentFile.should.have.been.calledWith({id: 'script'});
      component['dirty'].should.equal(true);
    });

    it('should add a script file with content', () => {
      let mockUpdateFiles = sinon.stub(component, 'updateFiles');
      let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');

      component['addScriptFileName'] = 'script';
      component['files'] = [{id: 'random'}, {id: 'script'}];

      let scriptManagerMock = {
        createScript: sinon.stub(),
        addScript: sinon.stub()
      };

      mockClientService.getBusinessNetwork.returns({
        getScriptManager: sinon.stub().returns(scriptManagerMock)
      });

      component.addScriptFile('my script');

      scriptManagerMock.createScript.should.not.have.been.called;

      scriptManagerMock.addScript.should.have.been.called;
      mockUpdateFiles.should.have.been.called;

      mockSetCurrentFile.should.have.been.calledWith({id: 'script'});
      component['dirty'].should.equal(true);
    });
  });

  describe('openImportModal', () => {
    it('should open the import modal', fakeAsync(() => {
      let mockUpdatePackage = sinon.stub(component, 'updatePackageInfo');
      let mockUpdateFiles = sinon.stub(component, 'updateFiles');

      mockModal.open = sinon.stub().returns({
        result: Promise.resolve()
      });

      component.openImportModal();

      tick();

      mockUpdatePackage.should.have.been.called;
      mockUpdateFiles.should.have.been.called;
    }));

    it('should open the import modal and set file to readme', fakeAsync(() => {
      let mockUpdatePackage = sinon.stub(component, 'updatePackageInfo');
      let mockUpdateFiles = sinon.stub(component, 'updateFiles');
      let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');

      mockAlertService.successStatus$ = {
        next: sinon.stub()
      };

      component['files'] = [{readme: true}, {model: true}];

      mockModal.open = sinon.stub().returns({
        result: Promise.resolve()
      });

      component.openImportModal();

      tick();

      mockUpdatePackage.should.have.been.called;
      mockUpdateFiles.should.have.been.called;
      mockSetCurrentFile.should.have.been.calledWith({readme: true});
      mockAlertService.successStatus$.next.should.have.been.called;
    }));

    it('should open the import modal and set file to first one if no readme', fakeAsync(() => {
      let mockUpdatePackage = sinon.stub(component, 'updatePackageInfo');
      let mockUpdateFiles = sinon.stub(component, 'updateFiles');
      let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');

      mockAlertService.successStatus$ = {
        next: sinon.stub()
      };

      component['files'] = [{model: true}, {script: true}];

      mockModal.open = sinon.stub().returns({
        result: Promise.resolve()
      });

      component.openImportModal();

      tick();

      mockUpdatePackage.should.have.been.called;
      mockUpdateFiles.should.have.been.called;
      mockSetCurrentFile.should.have.been.calledWith({model: true});
      mockAlertService.successStatus$.next.should.have.been.called;
    }));
  });

  describe('exportBNA', () => {
    it('should export file', (done) => {
      mockClientService.getBusinessNetwork.returns({
        toArchive: sinon.stub().returns(Promise.resolve('my data'))
      });

      mockClientService.getBusinessNetworkName.returns('my name');

      mockAlertService.successStatus$ = {
        next: sinon.stub()
      };

      component.exportBNA();

      fixture.whenStable().then(() => {
        mockAlertService.successStatus$.next.should.have.been.called;
        done();
      });
    });
  });

  describe('openAddFileModal', () => {
    let mockAddModel;
    let mockAddScript;

    beforeEach(() => {
      mockModal.open = sinon.stub().returns({
        componentInstance: {
          businessNetwork: {}
        },
        result: Promise.resolve(mockModelFile)
      });

      mockAddModel = sinon.stub(component, 'addModelFile');
      mockAddScript = sinon.stub(component, 'addScriptFile');
    });

    it('should open add file modal', fakeAsync(() => {

      component.openAddFileModal();

      tick();

      mockAddModel.should.have.been.called;
    }));

    it('should open add file script', fakeAsync(() => {
      mockModal.open = sinon.stub().returns({
        componentInstance: {
          businessNetwork: {}
        },
        result: Promise.resolve(mockScriptFile)
      });

      component.openAddFileModal();

      tick();

      mockAddScript.should.have.been.called;
    }));

    it('should do nothing if no result', fakeAsync(() => {
      mockAddScript.reset;
      mockAddModel.reset;

      mockModal.open = sinon.stub().returns({
        componentInstance: {
          businessNetwork: {}
        },
        result: Promise.resolve(0)
      });

      component.openAddFileModal();

      tick();

      mockAddScript.should.not.have.been.called;
      mockAddModel.should.not.have.been.called;
    }));
  });

  describe('deploy', () => {
    let mockUpdatePackage;
    let mockUpdateFiles;
    let mockSetCurrentFile;

    beforeEach(() => {
      mockUpdatePackage = sinon.stub(component, 'updatePackageInfo');
      mockUpdateFiles = sinon.stub(component, 'updateFiles');
      mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');

      mockAlertService.busyStatus$ = {
        next: sinon.stub()
      };

      mockAlertService.successStatus$ = {
        next: sinon.stub()
      };

      mockAlertService.errorStatus$ = {
        next: sinon.stub()
      };

      mockAdminService.update.returns(Promise.resolve());
      mockClientService.refresh.returns(Promise.resolve());

    });

    it('should deploy the file', fakeAsync(() => {
      component['currentFile'] = 'my file';

      component.deploy();

      tick();

      component['dirty'].should.equal(false);
      component['deploying'].should.equal(false);

      mockUpdatePackage.should.have.been.called;
      mockUpdateFiles.should.have.been.called;

      mockAlertService.busyStatus$.next.should.have.been.called;
      mockAlertService.successStatus$.next.should.have.been.called;
    }));

    it('should\'t deploy if already deploying', () => {
      mockAdminService.update.reset();
      component['deploying'] = true;

      component.deploy();

      mockAdminService.update.should.not.have.been.called;
    });

    it('should set current file to previous file', fakeAsync(() => {
      component['previousFile'] = 'my file';

      component.deploy();

      tick();

      component['dirty'].should.equal(false);
      component['deploying'].should.equal(false);

      mockUpdatePackage.should.have.been.called;
      mockUpdateFiles.should.have.been.called;

      mockAlertService.busyStatus$.next.should.have.been.called;
      mockAlertService.successStatus$.next.should.have.been.called;
    }));

    it('should handle error', fakeAsync(() => {
      mockAdminService.update.returns(Promise.reject('some error'));
      component.deploy();

      tick();

      component['deploying'].should.equal(false);
      mockUpdatePackage.should.have.been.called;
      mockUpdateFiles.should.have.been.called;
      mockAlertService.errorStatus$.next.should.have.been.calledWith('some error');
    }));
  });

  describe('toggleEditActive', () => {
    it('should toggle editing', () => {
      component['editActive'] = false;

      component.toggleEditActive();

      component['editActive'].should.equal(true);
    });
  });

  describe('editPackageName', () => {
    it('should edit the package name', () => {
      component['inputPackageName'] = 'my name';

      component.editPackageName();

      mockClientService.setBusinessNetworkName.should.have.been.calledWith('my name');
      component['editActive'].should.equal(false);
      component['deployedPackageName'].should.equal('my name');
    });
  });

  describe('editPackageVersion', () => {
    it('should edit the package version', () => {
      component['inputPackageVersion'] = 'my version';

      component.editPackageVersion();

      mockClientService.setBusinessNetworkVersion.should.have.been.calledWith('my version');
      component['editActive'].should.equal(false);
      component['deployedPackageVersion'].should.equal('my version');
    });
  });

  describe('hide edit', () => {
    it('should hide edit', () => {
      let mockToggleEdit = sinon.stub(component, 'toggleEditActive');

      component.hideEdit();

      mockToggleEdit.should.have.been.called;
      component['editingPackage'].should.equal(true);
    });
  });
});
