/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Directive, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { By } from '@angular/platform-browser';

import { EditorComponent } from './editor.component';

import { AdminService } from '../services/admin.service';
import { ClientService } from '../services/client.service';
import { EditorService } from '../services/editor.service';
import { InitializationService } from '../services/initialization.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SampleBusinessNetworkService } from '../services/samplebusinessnetwork.service';
import { AlertService } from '../services/alert.service';
import { ModelFile, Script } from 'composer-common';

import * as sinon from 'sinon';
import * as chai from 'chai';

import 'rxjs/add/operator/takeWhile';
import * as fileSaver from 'file-saver';

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

    let mockBusinessNetworkService;
    let mockAdminService;
    let mockAlertService;
    let mockClientService;
    let mockModal;
    let mockInitializationService;
    let mockModelFile;
    let mockScriptFile;
    let editorService;

    let mockRouterParams;

    let mockRouter;

    beforeEach(() => {
        mockBusinessNetworkService = sinon.createStubInstance(SampleBusinessNetworkService);
        mockAdminService = sinon.createStubInstance(AdminService);
        mockAlertService = sinon.createStubInstance(AlertService);
        mockClientService = sinon.createStubInstance(ClientService);
        mockModal = sinon.createStubInstance(NgbModal);
        mockInitializationService = sinon.createStubInstance(InitializationService);
        mockModelFile = sinon.createStubInstance(ModelFile);
        mockScriptFile = sinon.createStubInstance(Script);
        editorService = new EditorService();

        mockRouterParams = {
            subscribe: (callback) => {
                callback();
            }
        };

        mockRouter = {
            queryParams: mockRouterParams
        };

        mockAlertService.successStatus$ = {next: sinon.stub()};
        mockAlertService.busyStatus$ = {next: sinon.stub()};
        mockAlertService.errorStatus$ = {next: sinon.stub()};

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
        let mockEditorFilesValidate;

        beforeEach(() => {
            mockBusinessNetworkService.OPEN_SAMPLE = false;
            mockInitializationService.initialize.returns(Promise.resolve());
            mockClientService.businessNetworkChanged$ = {
                takeWhile: sinon.stub().returns({
                    subscribe: (callback) => {
                        let noError = true;
                        callback(noError);
                    }
                })
            };
            mockClientService.fileNameChanged$ = {
                takeWhile: sinon.stub().returns({
                    subscribe: (callback) => {
                        callback('new-name');
                    }
                })
            };
            mockEditorFilesValidate = sinon.stub(component, 'editorFilesValidate').returns(true);
        });

        it('should create', () => {
            component.should.be.ok;
        });

        it('should initialize the editor', fakeAsync(() => {
            let mockUpdatePackage = sinon.stub(component, 'updatePackageInfo');
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');
            let mockSetFile = sinon.stub(component, 'setCurrentFile');
            let mockSetIntialFile = sinon.stub(component, 'setInitialFile');

            component.ngOnInit();

            tick();

            component['noError'].should.equal(true);
            component['dirty'].should.equal(true);

            mockUpdatePackage.should.have.been.called;
            mockUpdateFiles.should.have.been.called;
            mockSetFile.should.not.have.been.called;
            mockSetIntialFile.should.have.been.called;
        }));

        it('should re-initialize the editor', fakeAsync(() => {
            let mockUpdatePackage = sinon.stub(component, 'updatePackageInfo');
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');
            let mockSetFile = sinon.stub(component, 'setCurrentFile');
            let mockSetIntialFile = sinon.stub(component, 'setInitialFile');
            component['editorService'].setCurrentFile('file');

            component.ngOnInit();

            tick();

            component['noError'].should.equal(true);
            component['dirty'].should.equal(true);

            mockUpdatePackage.should.have.been.called;
            mockUpdateFiles.should.have.been.called;
            mockSetFile.should.have.been.called;
            mockSetIntialFile.should.not.have.been.called;
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

        it('should set noError to false when notified', fakeAsync(() => {
            mockClientService.businessNetworkChanged$ = {
                takeWhile: sinon.stub().returns({
                    subscribe: (callback) => {
                        let noError = false;
                        callback(noError);
                    }
                })
            };

            mockEditorFilesValidate.returns(false);
            let mockUpdatePackage = sinon.stub(component, 'updatePackageInfo');
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');
            component.ngOnInit();

            tick();

            component['noError'].should.equal(false);

            mockUpdatePackage.should.have.been.called;
            mockUpdateFiles.should.have.been.called;
        }));

        it('should set noError and dirty to be true when notified', fakeAsync(() => {
            mockClientService.businessNetworkChanged$ = {
                takeWhile: sinon.stub().returns({
                    subscribe: (callback) => {
                        let noError = true;
                        callback(noError);
                    }
                })
            };

            let mockUpdatePackage = sinon.stub(component, 'updatePackageInfo');
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');
            component.ngOnInit();

            tick();

            component['noError'].should.equal(true);
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

        it('should set current file from editor service if present', fakeAsync(() => {
            let mockUpdatePackage = sinon.stub(component, 'updatePackageInfo');
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');

            let file = {testFile: true};
            component['editorService'].setCurrentFile(file);

            component.ngOnInit();
            tick();

            let setFile = component['currentFile'];
            component['currentFile'].should.deep.equal(file);
        }));

        it('should not do anything through the newFileName callback if no files loaded', fakeAsync(() => {
            let mockUpdatePackage = sinon.stub(component, 'updatePackageInfo');
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');
            let mockCurrentFile = sinon.stub(component, 'setCurrentFile');

            let fileSpy = sinon.spy(component['files'], 'findIndex');
            component['files'] = [];

            component.ngOnInit();
            tick();

            fileSpy.should.not.have.been.called;
        }));

        it('should set a new file based on the passed file name through the newFileName callback if files loaded', fakeAsync(() => {
            let mockUpdatePackage = sinon.stub(component, 'updatePackageInfo');
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');
            let mockCurrentFile = sinon.stub(component, 'setCurrentFile');

            component['files'] = [{id: 'random'}, {id: 'new-name'}, {id: 'namespace'}];
            component['currentFile'] = component['files'][0];

            let fileSpy = sinon.spy(component['files'], 'findIndex');

            component.ngOnInit();
            tick();

            fileSpy.should.have.been.called;
        }));
    });

    describe('ngOnDestroy', () => {

        it('should set this.alive to be false', () => {

            component['alive'] = true;
            component.ngOnDestroy();
            component['alive'].should.equal(false);

        });
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
            component['currentFile'] = {displayID: 'oldFile'};
            let file = {file: 'myFile'};
            component.setCurrentFile(file);
            component['currentFile'].should.deep.equal(file);
        });

        it('should set current file', () => {
            component['currentFile'] = {displayID: 'oldFile'};
            component['editingPackage'] = true;

            let mockUpdatePackage = sinon.stub(component, 'updatePackageInfo');

            let file = {displayID: 'myFile'};
            component.setCurrentFile(file);
            component['currentFile'].should.deep.equal(file);

            mockUpdatePackage.should.have.been.called;
            component['editingPackage'].should.equal(false);
        });

        it('should always set current file, if same file selected and is readme file', () => {
            component['currentFile'] = {displayID: 'readme', readme: true};
            let serviceSpy = sinon.spy(editorService, 'setCurrentFile');
            let file = {displayID: 'readme', readme: true};

            component.setCurrentFile(file);

            serviceSpy.should.have.been.called;
        });

        it('should not set current file, if same file selected', () => {
            component['currentFile'] = {displayID: 'myFile'};
            let mockUpdatePackage = sinon.stub(component, 'updatePackageInfo');
            let serviceSpy = sinon.spy(editorService, 'setCurrentFile');
            let file = {displayID: 'myFile'};

            component.setCurrentFile(file);

            serviceSpy.should.not.have.been.called;
            mockUpdatePackage.should.not.have.been.called;
        });

        it('should mark a file as deletable if a script type', () => {
            let file = {script: true, displayID: 'myFile'};
            component.setCurrentFile(file);
            component['deletableFile'].should.equal(true);
        });

        it('should mark a file as deletable if a model type', () => {
            let file = {model: true, displayID: 'myFile'};
            component.setCurrentFile(file);
            component['deletableFile'].should.equal(true);
        });

        it('should not mark a file as deletable if a acl type', () => {
            let file = {acl: true, displayID: 'myFile'};
            component.setCurrentFile(file);
            component['deletableFile'].should.equal(false);
        });

        it('should not mark a file as deletable if a readme type', () => {
            let file = {readme: true, displayID: 'myFile'};
            component.setCurrentFile(file);
            component['deletableFile'].should.equal(false);
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
                displayID: 'models/model 1.cto',
            });

            component['files'][2].should.deep.equal({
                model: true,
                id: 'model 2',
                displayID: 'models/model 2.cto',
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

            let mockModelFile0 = sinon.createStubInstance(ModelFile);
            mockModelFile0.getNamespace.returns('namespace0');
            mockModelFile0.id = 'namespace0';

            let mockModelFile1 = sinon.createStubInstance(ModelFile);
            mockModelFile1.getNamespace.returns('namespace1');
            mockModelFile1.id = 'namespace1';

            let mockModelFile2 = sinon.createStubInstance(ModelFile);
            mockModelFile2.getNamespace.returns('namespace2');
            mockModelFile2.id = 'namespace2';

            component['addModelNamespace'] = 'namespace';
            component['files'] = [mockModelFile, mockModelFile0, mockModelFile1, mockModelFile2];

            mockModelFile.getNamespace.returns('namespace');
            mockModelFile.id = 'namespace';

            let modelManagerMock = {
                addModelFile: sinon.stub().returns(mockModelFile)
            };

            mockClientService.getBusinessNetwork.returns({
                getModelManager: sinon.stub().returns(modelManagerMock)
            });

            component.addModelFile();

            modelManagerMock.addModelFile.should.have.been.calledWith(`/**
  * New model file
  */

  namespace namespace3`);
            mockUpdateFiles.should.have.been.called;

            mockSetCurrentFile.should.have.been.calledWith({id: 'namespace'});
            component['dirty'].should.equal(true);
        });

        it('should add a model file with contents', () => {
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');
            let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');

            component['addModelNamespace'] = 'namespace';
            component['files'] = [{id: 'random'}, {id: 'namespace0'}];

            mockModelFile.getNamespace.returns('namespace0');
            let modelManagerMock = {
                addModelFile: sinon.stub().returns(mockModelFile)
            };

            mockClientService.getBusinessNetwork.returns({
                getModelManager: sinon.stub().returns(modelManagerMock)
            });

            component.addModelFile('my code');

            modelManagerMock.addModelFile.should.have.been.calledWith('my code');
            mockUpdateFiles.should.have.been.called;

            mockSetCurrentFile.should.have.been.calledWith({id: 'namespace0'});
            component['dirty'].should.equal(true);
        });
    });

    describe('addScriptFile', () => {
        it('should create and add a script file', () => {
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');
            let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');

            mockScriptFile.getIdentifier.returns('script');
            mockScriptFile.id = 'script';
            component['files'] = [mockScriptFile];

            let scriptManagerMock = {
                createScript: sinon.stub().returns(mockScriptFile),
                addScript: sinon.stub(),
                getScripts: sinon.stub().returns([]),
            };

            mockClientService.getBusinessNetwork.returns({
                getScriptManager: sinon.stub().returns(scriptManagerMock)
            });

            component.addScriptFile();

            scriptManagerMock.createScript.should.have.been.calledWith('lib/script.js', 'JS', `/**
  * New script file
  */`);

            scriptManagerMock.addScript.should.have.been.called;
            mockUpdateFiles.should.have.been.called;

            mockSetCurrentFile.should.have.been.calledWith({id: 'script'});
            component['dirty'].should.equal(true);
        });

        it('should create and add a script file with an incremented name', () => {
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');
            let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');

            let mockScript0 = sinon.createStubInstance(Script);
            mockScript0.getIdentifier.returns('lib/script.js');
            mockScript0.id = 'script';

            let mockScript1 = sinon.createStubInstance(Script);
            mockScript1.getIdentifier.returns('lib/script0.js');
            mockScript1.id = 'script0';

            let mockScript2 = sinon.createStubInstance(Script);
            mockScript2.getIdentifier.returns('lib/script1.js');
            mockScript2.id = 'script1';

            let mockScript3 = sinon.createStubInstance(Script);
            mockScript3.getIdentifier.returns('lib/script3.js');
            mockScript3.id = 'script3';

            component['files'] = [mockScript0, mockScript1, mockScript2, mockScript3];

            mockScriptFile.getIdentifier.returns('script');

            let scriptManagerMock = {
                createScript: sinon.stub().returns(mockScriptFile),
                addScript: sinon.stub(),
                getScripts: sinon.stub().returns([mockScript0, mockScript1, mockScript2, mockScript3]),
            };

            mockClientService.getBusinessNetwork.returns({
                getScriptManager: sinon.stub().returns(scriptManagerMock)
            });

            component.addScriptFile();

            scriptManagerMock.createScript.should.have.been.calledWith('lib/script2.js', 'JS', `/**
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

            mockScriptFile.getIdentifier.returns('script');

            let scriptManagerMock = {
                createScript: sinon.stub().returns(mockScriptFile),
                addScript: sinon.stub(),
                getScripts: sinon.stub().returns([]),
            };

            mockClientService.getBusinessNetwork.returns({
                getScriptManager: sinon.stub().returns(scriptManagerMock)
            });

            component.addScriptFile(mockScriptFile);

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

        it('should open the import modal and handle error', fakeAsync(() => {
            let mockUpdatePackage = sinon.stub(component, 'updatePackageInfo');
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');

            mockModal.open = sinon.stub().returns({
                result: Promise.reject('some error')
            });

            component.openImportModal();

            tick();

            mockUpdatePackage.should.not.have.been.called;
            mockUpdateFiles.should.not.have.been.called;

            mockAlertService.errorStatus$.next.should.have.been.calledWith('some error');
        }));

        it('should open the import modal and handle cancel', fakeAsync(() => {
            let mockUpdatePackage = sinon.stub(component, 'updatePackageInfo');
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');

            mockModal.open = sinon.stub().returns({
                result: Promise.reject(1)
            });

            component.openImportModal();

            tick();

            mockUpdatePackage.should.not.have.been.called;
            mockUpdateFiles.should.not.have.been.called;

            mockAlertService.errorStatus$.next.should.not.have.been.called;
        }));
    });

    describe('exportBNA', () => {

        afterAll(() => {
            fileSaver.saveAs.restore();
            (window as any).File.restore();
        });

        it('should export file with correct name and type', (done) => {

            let mockSave = sinon.stub(fileSaver, 'saveAs');
            let testFile = new File(['test'], 'my_business_name.bna', {type: 'application/octet-stream'});

            mockClientService.getBusinessNetwork.returns({
                toArchive: sinon.stub().returns(Promise.resolve('my_data'))
            });

            mockClientService.getBusinessNetworkName.returns('my_business_name');

            component.exportBNA();

            fixture.whenStable().then(() => {
                mockSave.should.have.been.called;

                let passedFile = mockSave.getCall(0).args[0];
                passedFile.name.should.equal(testFile.name);
                passedFile.type.should.equal(testFile.type);
                done();
            });
        });

        it('should export file with correct data', () => {

            let mockFile = sinon.stub(window, 'File');
            mockFile.returns(new File(['test'], 'my_business_name.json', {type: 'application/octet-stream'}));

            mockClientService.getBusinessNetwork.returns({
                toArchive: sinon.stub().returns(Promise.resolve('my_data'))
            });

            mockClientService.getBusinessNetworkName.returns('my_business_name');

            component.exportBNA();

            mockFile.should.have.been.calledWithNew;
            let actualData = mockFile.getCall(0).args[0];
            let expectedData = ['test'];
            actualData.should.deep.equal(expectedData);

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

            mockClientService.businessNetworkChanged$ = {
                next: sinon.stub()
            };

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
            mockClientService.businessNetworkChanged$.next.should.have.been.calledWith(true);
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
            mockClientService.businessNetworkChanged$.next.should.not.have.been.called;
        }));

        it('should open add file modal and handle error', fakeAsync(() => {
            mockModal.open = sinon.stub().returns({
                componentInstance: {
                    businessNetwork: {}
                },
                result: Promise.reject('some error')
            });

            component.openAddFileModal();

            tick();

            mockAddModel.should.not.have.been.called;
            mockClientService.businessNetworkChanged$.next.should.not.have.been.called;
            mockAlertService.errorStatus$.next.should.have.been.calledWith('some error');
        }));

        it('should open add file modal and handle cancel', fakeAsync(() => {
            mockModal.open = sinon.stub().returns({
                componentInstance: {
                    businessNetwork: {}
                },
                result: Promise.reject(1)
            });

            component.openAddFileModal();

            tick();

            mockAddModel.should.not.have.been.called;
            mockClientService.businessNetworkChanged$.next.should.not.have.been.called;
            mockAlertService.errorStatus$.next.should.not.have.been.called;
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
            mockAlertService.busyStatus$.next.should.have.been.calledWith(null);
            mockAlertService.errorStatus$.next.should.have.been.calledWith('some error');
        }));
    });

    describe('toggleEditActive', () => {

        beforeEach(() => {
            sinon.stub(component, 'ngOnInit');
        });

        it('should toggle editing', () => {
            component['editActive'] = false;

            component.toggleEditActive();

            component['editActive'].should.equal(true);
        });

        it('should make edit fields visible when true', () => {
            component['editActive'] = false;
            component['editingPackage'] = false;
            component['deployedPackageName'] = 'TestPackageName';
            component['deployedPackageVersion'] = '1.0.0';
            fixture.detectChanges();

            // Expect to see "deployedPackageName" visible within class="business-network-details"
            // Expect to have "edit" option available within class="business-network-details"
            let element = fixture.debugElement.query(By.css('.business-network-details')).nativeElement;
            element.textContent.should.contain('TestPackageName');
            element.innerHTML.should.contain('id="editFileButton"');

            // Flip editActive boolean
            component['editActive'] = true;
            fixture.detectChanges();

            // Expect three visible edit fields:
            // 1) Name (input text)
            // 2) Version (input text)
            // 3) Full package (button)
            element = fixture.debugElement.query(By.css('.business-network-details')).nativeElement;
            element.innerHTML.should.not.contain('id="editFileButton"');
            element.innerHTML.should.contain('id="editPackageButton"');
            element.textContent.should.contain('Name');
            element.textContent.should.contain('Version');
            element.textContent.should.contain('View/edit full metadata in package.json');

        });

        it('should make edit fields interactable when true', () => {
            component['editActive'] = true;

            fixture.detectChanges();

            // Expect edit fields:
            // 1) Name & Version (input text) should not be editable (focused)
            // 3) Full package (button) to be enabled

            let editItem = fixture.debugElement.query(By.css('#editName')).nativeElement;
            (editItem as HTMLInputElement).isContentEditable.should.be.false;

            editItem = fixture.debugElement.query(By.css('#editVersion')).nativeElement;
            (editItem as HTMLInputElement).isContentEditable.should.be.false;

            editItem = fixture.debugElement.query(By.css('#editPackageButton')).nativeElement;
            (editItem as HTMLButtonElement).disabled.should.be.false;

        });

        it('should only show package information if editingPackage==true', () => {
            component['editingPackage'] = true;
            component['deployedPackageName'] = 'TestPackageName';

            fixture.detectChanges();

            // Grab element
            let element = fixture.debugElement.query(By.css('.business-network-details')).nativeElement;

            // Should contain package name edit only
            element.textContent.should.contain('Editing package.json');

            // Should not contain any buttons/text entry
            should.not.exist(fixture.debugElement.query(By.css('#editName')));
            should.not.exist(fixture.debugElement.query(By.css('#editVersion')));
            should.not.exist(fixture.debugElement.query(By.css('#editPackageButton')));
        });

    });

    describe('editPackageName', () => {
        beforeEach(() => {
            mockClientService.setBusinessNetworkName.reset();
        });

        it('should edit the package name', () => {
            component['inputPackageName'] = 'my name';

            component.editPackageName();

            mockClientService.setBusinessNetworkName.should.have.been.calledWith('my name');
            component['editActive'].should.equal(false);
            component['deployedPackageName'].should.equal('my name');
        });

        it('should not edit the package name if not changed', () => {
            component['deployedPackageName'] = 'my name';
            component['inputPackageName'] = 'my name';

            component.editPackageName();

            mockClientService.setBusinessNetworkName.should.not.have.been.called;
        });
    });

    describe('editPackageVersion', () => {
        beforeEach(() => {
            mockClientService.setBusinessNetworkVersion.reset();
        });

        it('should edit the package version', () => {
            component['inputPackageVersion'] = 'my version';

            component.editPackageVersion();

            mockClientService.setBusinessNetworkVersion.should.have.been.calledWith('my version');
            component['editActive'].should.equal(false);
            component['deployedPackageVersion'].should.equal('my version');
        });

        it('should not edit the package version if not changed', () => {
            component['deployedPackageVersion'] = 'my version';
            component['inputPackageVersion'] = 'my version';

            component.editPackageVersion();

            mockClientService.setBusinessNetworkVersion.should.not.have.been.called;
        });
    });

    describe('hide edit', () => {
        it('should set editActive false, and editingPackage true', () => {
            component['editingPackage'] = false;
            component['editActive'] = true;

            component.hideEdit();

            component['editingPackage'].should.equal(true);
            component['editActive'].should.equal(false);
        });
    });

    describe('fileType', () => {

        it('should initialise model file parameters', () => {
            let testItem = {model: true, displayID: 'test_name'};

            let result = component['fileType'](testItem);

            result.should.equal('Model File');
        });

        it('should initialise script file parameters', () => {
            let testItem = {script: true, displayID: 'test_name'};

            let result = component['fileType'](testItem);

            result.should.equal('Script File');
        });

        it('should initialise unknown file parameters', () => {
            let testItem = {displayID: 'test_name'};

            let result = component['fileType'](testItem);

            result.should.equal('File');
        });
    });

    describe('editorFilesValidate', () => {

        beforeEach(() => {
            mockClientService.validateFile.returns(null);
            mockClientService.getModelFile.returns({getDefinitions: sinon.stub().returns({})});
            mockClientService.getScriptFile.returns({getContents: sinon.stub().returns({})});
            mockClientService.getAclFile.returns({getDefinitions: sinon.stub().returns({})});
        });

        it('should validate model files', () => {
            let fileArray = [];
            fileArray.push({model: true, displayID: 'test_name'});
            component['files'] = fileArray;

            let result = component['editorFilesValidate']();

            mockClientService.getModelFile.should.have.been.called;
            result.should.equal(true);
        });

        it('should validate script files', () => {
            let fileArray = [];
            fileArray.push({script: true, displayID: 'test_name'});
            component['files'] = fileArray;

            let result = component['editorFilesValidate']();

            mockClientService.getScriptFile.should.have.been.called;
            result.should.equal(true);
        });

        it('should validate acl files', () => {
            let fileArray = [];
            fileArray.push({acl: true, displayID: 'test_name'});
            component['files'] = fileArray;

            let result = component['editorFilesValidate']();

            mockClientService.getAclFile.should.have.been.called;
            result.should.equal(true);
        });

        it('should fail validation for invalid model files', () => {
            let fileArray = [];
            fileArray.push({model: true, displayID: 'test_name'});
            component['files'] = fileArray;

            mockClientService.validateFile.returns('error');

            let result = component['editorFilesValidate']();
            result.should.equal(false);
        });

        it('should fail validation for invalid acl files', () => {
            let fileArray = [];
            fileArray.push({acl: true, displayID: 'test_name'});
            component['files'] = fileArray;

            mockClientService.validateFile.returns('error');

            let result = component['editorFilesValidate']();
            result.should.equal(false);
        });

        it('should fail validation for invalid script files', () => {
            let fileArray = [];
            fileArray.push({script: true, displayID: 'test_name'});
            component['files'] = fileArray;

            mockClientService.validateFile.returns('error');

            let result = component['editorFilesValidate']();
            result.should.equal(false);
        });

        it('should fail validation for multiple invalid files', () => {
            let fileArray = [];
            fileArray.push({script: true, displayID: 'test_name'});
            fileArray.push({acl: true, displayID: 'test_name'});
            component['files'] = fileArray;

            mockClientService.validateFile.returns('error');

            let result = component['editorFilesValidate']();
            result.should.equal(false);

            component['files'][0].invalid.should.be.equal(true);
            component['files'][1].invalid.should.be.equal(true);

        });

    });

    describe('openDeleteFileModal', () => {

        let validateMock;

        beforeEach(() => {
            validateMock = sinon.stub(component, 'editorFilesValidate').returns(true);

            mockModal.open = sinon.stub().returns({
                componentInstance: {
                    businessNetwork: {}
                },
                result: Promise.resolve(true)
            });

            let scriptManagerMock = {
                deleteScript: sinon.stub()
            };

            let modelManagerMock = {
                deleteModelFile: sinon.stub()
            };

            mockClientService.getBusinessNetwork.returns({
                getScriptManager: sinon.stub().returns(scriptManagerMock),
                getModelManager: sinon.stub().returns(modelManagerMock)
            });

            mockClientService.businessNetworkChanged$ = {
                next: sinon.stub()
            };

            // Create file array of length 5
            let fileArray = [];
            fileArray.push({acl: true, displayID: 'acl0'});
            fileArray.push({script: true, displayID: 'script0'});
            fileArray.push({script: true, displayID: 'script1'});
            fileArray.push({model: true, displayID: 'model1'});
            fileArray.push({script: true, displayID: 'script2'});
            component['files'] = fileArray;
        });

        it('should open the delete-confirm modal', fakeAsync(() => {
            mockModal.open = sinon.stub().returns({
                componentInstance: {
                    businessNetwork: {}
                },
                result: Promise.resolve(0)
            });

            component.openDeleteFileModal();
            tick();

            mockModal.open.should.have.been.called;
        }));

        it('should open delete-confirm modal and handle error', fakeAsync(() => {
            mockModal.open = sinon.stub().returns({
                componentInstance: {
                    businessNetwork: {}
                },
                result: Promise.reject('some error')
            });

            component.openDeleteFileModal();
            tick();

            mockAlertService.errorStatus$.next.should.have.been.called;
            mockClientService.businessNetworkChanged$.next.should.not.have.been.called;
        }));

        it('should open delete-confirm modal and handle cancel', fakeAsync(() => {
            mockModal.open = sinon.stub().returns({
                componentInstance: {
                    businessNetwork: {}
                },
                result: Promise.reject(null)
            });

            component.openDeleteFileModal();
            tick();

            mockAlertService.errorStatus$.next.should.not.have.been.called;
        }));

        it('should open delete-confirm modal and handle no result', fakeAsync(() => {
            mockModal.open = sinon.stub().returns({
                componentInstance: {
                    businessNetwork: {}
                },
                result: Promise.resolve()
            });

            component.openDeleteFileModal();
            tick();

            mockAlertService.successStatus$.next.should.not.have.been.called;
            mockClientService.businessNetworkChanged$.next.should.not.have.been.called;
        }));

        it('should delete the correct script file', fakeAsync(() => {

            component['currentFile'] = component['files'][2];

            component.openDeleteFileModal();
            tick();

            // Check services called
            mockClientService.businessNetworkChanged$.next.should.have.been.called;
            mockAlertService.successStatus$.next.should.have.been.called;

            // check remaining files
            let currentFiles = component['files'];
            // should have only deleted one
            currentFiles.length.should.equal(4);
            // should have deleted the correct one
            let index = currentFiles.findIndex((x) => {
                x.displayID === 'script1';
            });
            index.should.equal(-1);

        }));

        it('should delete the correct model file', fakeAsync(() => {

            component['currentFile'] = component['files'][3];

            component.openDeleteFileModal();
            tick();

            // Check services called
            mockClientService.businessNetworkChanged$.next.should.have.been.called;
            mockAlertService.successStatus$.next.should.have.been.called;

            // check remaining files
            let currentFiles = component['files'];
            // should have only deleted one
            currentFiles.length.should.equal(4);
            // should have deleted the correct one
            let index = currentFiles.findIndex((x) => {
                x.displayID === 'model1';
            });
            index.should.equal(-1);
        }));

        it('should only enable deletion of model or script files', fakeAsync(() => {

            // should not be able to delete an acl file
            component['currentFile'] = component['files'][0];

            component.openDeleteFileModal();
            tick();

            // Check services called
            mockClientService.businessNetworkChanged$.next.should.not.have.been.called;
            mockAlertService.errorStatus$.next.should.have.been.called;

            // check no files removed
            let currentFiles = component['files'];
            // should have only deleted one
            currentFiles.length.should.equal(5);
        }));

        it('should set viewed file to existing item in file list', fakeAsync(() => {
            component['currentFile'] = component['files'][2];

            component.openDeleteFileModal();
            tick();

            let currentFile = component['currentFile'];
            currentFile.displayID.should.equal('acl0');
        }));

        it('should disable the deploy button if remaining files are invalid', fakeAsync(() => {

            validateMock.returns(false);

            component['currentFile'] = component['files'][3];

            component.openDeleteFileModal();
            tick();

            // Check services called
            mockClientService.businessNetworkChanged$.next.should.have.been.calledWith(false);
            mockAlertService.successStatus$.next.should.have.been.called;

            // check we still deleted the file
            let currentFiles = component['files'];
            // should have only deleted one
            currentFiles.length.should.equal(4);
            // should have deleted the correct one
            let index = currentFiles.findIndex((x) => {
                x.displayID === 'model1';
            });
            index.should.equal(-1);
        }));
    });
});
