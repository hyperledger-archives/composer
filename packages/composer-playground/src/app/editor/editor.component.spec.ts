/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Directive, Input, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { EditorComponent } from './editor.component';

import { AdminService } from '../services/admin.service';
import { ClientService } from '../services/client.service';
import { EditorService } from './editor.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AlertService } from '../basic-modals/alert.service';
import { ModelFile, Script, AclManager, AclFile, QueryFile } from 'composer-common';
import { ScrollToElementDirective } from '../directives/scroll/scroll-to-element.directive';

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

@Directive({
    selector: 'perfect-scrollbar'
})

class MockPerfectScrollBarDirective {
}

@Component({
    selector: 'app-footer',
    template: ''
})
class MockFooterComponent {

}

describe('EditorComponent', () => {
    let component: EditorComponent;
    let fixture: ComponentFixture<EditorComponent>;

    let mockAdminService;
    let mockAlertService;
    let mockClientService;
    let mockModal;
    let mockModelFile;
    let mockScriptFile;
    let mockRuleFile;
    let mockQueryFile;
    let editorService;

    beforeEach(() => {
        mockAdminService = sinon.createStubInstance(AdminService);
        mockAlertService = sinon.createStubInstance(AlertService);
        mockClientService = sinon.createStubInstance(ClientService);
        mockModal = sinon.createStubInstance(NgbModal);
        mockModelFile = sinon.createStubInstance(ModelFile);
        mockScriptFile = sinon.createStubInstance(Script);
        mockRuleFile = sinon.createStubInstance(AclFile);
        mockQueryFile = sinon.createStubInstance(QueryFile);
        editorService = new EditorService();

        mockClientService.getQueryFile.returns(mockQueryFile);

        mockAlertService.successStatus$ = {next: sinon.stub()};
        mockAlertService.busyStatus$ = {next: sinon.stub()};
        mockAlertService.errorStatus$ = {next: sinon.stub()};

        TestBed.configureTestingModule({
            imports: [FormsModule],
            declarations: [EditorComponent, MockEditorFileDirective, MockPerfectScrollBarDirective, ScrollToElementDirective, MockFooterComponent],
            providers: [
                {provide: AdminService, useValue: mockAdminService},
                {provide: ClientService, useValue: mockClientService},
                {provide: NgbModal, useValue: mockModal},
                {provide: AlertService, useValue: mockAlertService},
                {provide: EditorService, useValue: editorService}]
        });

        fixture = TestBed.createComponent(EditorComponent);
        component = fixture.componentInstance;
    });

    describe('ngOnInit', () => {
        let mockEditorFilesValidate;

        beforeEach(() => {
            mockClientService.ensureConnected.returns(Promise.resolve());
            mockClientService.businessNetworkChanged$ = {
                takeWhile: sinon.stub().returns({
                    subscribe: (callback) => {
                        let noError = true;
                        callback(noError);
                    }
                })
            };
            mockClientService.namespaceChanged$ = {
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

            let file = {id: 'testFile', displayID: 'script.js'};
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

        it('should handle error', fakeAsync(() => {
            mockClientService.ensureConnected.returns(Promise.reject('some error'));

            component.ngOnInit();

            tick();

            mockAlertService.errorStatus$.next.should.have.been.calledWith('some error');
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
            component['currentFile'] = {displayID: 'oldFile', id: 'oldID'};
            let file = {displayID: 'newFile', id: 'newID'};
            component.setCurrentFile(file);
            component['currentFile'].should.deep.equal(file);
        });

        it('should set current file', () => {
            component['currentFile'] = {displayID: 'oldFile', id: 'oldID'};
            component['editingPackage'] = true;

            let mockUpdatePackage = sinon.stub(component, 'updatePackageInfo');

            let file = {displayID: 'myFile', id: 'newID'};
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

        it('should always set current file, if same file selected and is acl file', () => {
            component['currentFile'] = {displayID: 'acl', acl: true};
            let serviceSpy = sinon.spy(editorService, 'setCurrentFile');
            let file = {displayID: 'acl', acl: true};

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
        it('should update the files, and not include system model files', () => {
            mockClientService.getModelFiles.returns([
                {
                    getNamespace: sinon.stub().returns('model 2'),
                    getName: sinon.stub().returns('models/model2.cto'),
                    isSystemModelFile: sinon.stub().returns(false)
                },
                {
                    getNamespace: sinon.stub().returns('model 1'),
                    getName: sinon.stub().returns('models/model1.cto'),
                    isSystemModelFile: sinon.stub().returns(false)
                },
                {
                    getNamespace: sinon.stub().returns('system 1'),
                    getName: sinon.stub().returns('models/system1.cto'),
                    isSystemModelFile: sinon.stub().returns(true)
                },
            ]);

            mockClientService.getScripts.returns([
                {getIdentifier: sinon.stub().returns('script 2')},
                {getIdentifier: sinon.stub().returns('script 1')}
            ]);

            mockClientService.getAclFile.returns({getIdentifier: sinon.stub().returns('acl')});

            mockClientService.getMetaData.returns({
                getREADME: sinon.stub().returns('readme')
            });

            mockQueryFile.getIdentifier.returns('query 1');

            component.updateFiles();
            component['files'].length.should.equal(7);

            component['files'][0].should.deep.equal({
                readme: true,
                id: 'readme',
                displayID: 'README.md',
            });

            component['files'][1].should.deep.equal({
                model: true,
                id: 'model 1',
                displayID: 'models/model1.cto',
            });

            component['files'][2].should.deep.equal({
                model: true,
                id: 'model 2',
                displayID: 'models/model2.cto',
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

            component['files'][6].should.deep.equal({
                query: true,
                id: 'query 1',
                displayID: 'query 1',
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

    describe('addReadme', () => {
        it('should not open confirm modal if no readme present', fakeAsync(() => {
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');
            let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');
            component['files'] = [{id: 'random'}, {id: 'script'}];

            let b = new Blob(['/**README File*/'], {type: 'text/plain'});
            let mockReadmeFile = new File([b], 'readme.md');

            component.addReadme(mockReadmeFile);
            tick();

            mockModal.open.should.not.have.been.called;
        }));

        it('should create readme if no existing readme present', fakeAsync(() => {
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');
            let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');

            component['files'] = [{id: 'zero-index'}, {id: 'script'}];

            let b = new Blob(['/**README File*/'], {type: 'text/plain'});
            let mockReadmeFile = new File([b], 'readme.md');

            component.addReadme(mockReadmeFile);

            tick();

            mockClientService.setBusinessNetworkReadme.should.have.been.calledWith(mockReadmeFile);
            mockUpdateFiles.should.have.been.called;
            mockSetCurrentFile.should.have.been.calledWith({id: 'zero-index'});
            component['dirty'].should.be.equal(true);
        }));

        it('should open confirm modal if readme present and handle error', fakeAsync(() => {
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');
            let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');
            component['files'] = [{readme: true}, {id: 'script'}];

            let b = new Blob(['/**README File*/'], {type: 'text/plain'});
            let mockReadmeFile = new File([b], 'readme.md');

            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.reject('some error')
            });

            component.addReadme(mockReadmeFile);
            tick();

            mockModal.open.should.have.been.called;
            mockAlertService.errorStatus$.next.should.have.been.calledWith('some error');
            mockClientService.setBusinessNetworkReadme.should.not.have.been.called;
            mockUpdateFiles.should.not.have.been.called;
            mockSetCurrentFile.should.not.have.been.called;
        }));

        it('should handle confirm modal cancel', fakeAsync(() => {
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');
            let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');
            component['files'] = [{readme: true}, {id: 'script'}];

            let b = new Blob(['/**README File*/'], {type: 'text/plain'});
            let mockReadmeFile = new File([b], 'readme.md');

            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.reject(1)
            });

            component.addReadme(mockReadmeFile);
            tick();

            mockModal.open.should.have.been.called;
            mockAlertService.errorStatus$.next.should.not.have.been.called;
            mockClientService.setBusinessNetworkReadme.should.not.have.been.called;
            mockUpdateFiles.should.not.have.been.called;
            mockSetCurrentFile.should.not.have.been.called;
        }));

        it('should create readme on modal confirm', fakeAsync(() => {
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');
            let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');
            component['files'] = [{readme: true}, {id: 'script'}];

            let b = new Blob(['/**README File*/'], {type: 'text/plain'});
            let mockReadmeFile = new File([b], 'readme.md');

            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.resolve()
            });

            component.addReadme(mockReadmeFile);
            tick();

            mockModal.open.should.have.been.called;
            mockAlertService.errorStatus$.next.should.not.have.been.called;
            mockClientService.setBusinessNetworkReadme.should.have.been.called;
            mockUpdateFiles.should.have.been.called;
            mockSetCurrentFile.should.have.been.calledWith({readme: true});
        }));

    });

    describe('addRuleFile', () => {
        it('should not open confirm modal if no ACL file present', fakeAsync(() => {
            let mockProcessRules = sinon.stub(component, 'processRuleFileAddition');
            component['files'] = [{id: 'random'}, {id: 'script'}];

            component.addRuleFile(mockRuleFile);
            tick();

            mockModal.open.should.not.have.been.called;
        }));

        it('should call processRuleFileAddition if no existing rules present', fakeAsync(() => {
            let mockProcessRules = sinon.stub(component, 'processRuleFileAddition');
            component['files'] = [{id: 'zero-index'}, {id: 'script'}];

            component.addRuleFile(mockRuleFile);
            tick();

            mockModal.open.should.not.have.been.called;
            mockProcessRules.should.have.been.calledWith(mockRuleFile);
        }));

        it('should open confirm modal if rule file present and handle error', fakeAsync(() => {
            let mockProcessRules = sinon.stub(component, 'processRuleFileAddition');
            component['files'] = [{acl: true}, {id: 'permissions.acl'}];

            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.reject('some error')
            });

            component.addRuleFile(mockRuleFile);
            tick();

            mockModal.open.should.have.been.called;
            mockAlertService.errorStatus$.next.should.have.been.calledWith('some error');
            mockProcessRules.should.not.have.been.called;
        }));

        it('should handle confirm modal cancel', fakeAsync(() => {
            let mockProcessRules = sinon.stub(component, 'processRuleFileAddition');
            component['files'] = [{acl: true}, {id: 'permissions.acl'}];

            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.reject(1)
            });

            component.addRuleFile(mockRuleFile);
            tick();

            mockModal.open.should.have.been.called;
            mockAlertService.errorStatus$.next.should.not.have.been.called;
            mockProcessRules.should.not.have.been.called;
        }));

        it('should call processRuleFileAddition on modal confirm', fakeAsync(() => {
            let mockProcessRules = sinon.stub(component, 'processRuleFileAddition');
            component['files'] = [{acl: true}, {id: 'permissions.acl'}];

            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.resolve()
            });

            component.addRuleFile(mockRuleFile);
            tick();

            mockModal.open.should.have.been.called;
            mockAlertService.errorStatus$.next.should.not.have.been.called;
            mockProcessRules.should.have.been.calledWith(mockRuleFile);
        }));
    });

    describe('addQueryFile', () => {
        it('should not open confirm modal if no query file present', fakeAsync(() => {
            let mockProcessQuery = sinon.stub(component, 'processQueryFileAddition');
            component['files'] = [{id: 'random'}, {id: 'script'}];

            component.addQueryFile(mockQueryFile);
            tick();

            mockModal.open.should.not.have.been.called;
        }));

        it('should call processQueryFileAddition if no existing rules present', fakeAsync(() => {
            let mockProcessQuery = sinon.stub(component, 'processQueryFileAddition');
            component['files'] = [{id: 'zero-index'}, {id: 'script'}];

            component.addQueryFile(mockQueryFile);
            tick();

            mockModal.open.should.not.have.been.called;
            mockProcessQuery.should.have.been.calledWith(mockQueryFile);
        }));

        it('should open confirm modal if query file present and handle error', fakeAsync(() => {
            let mockProcessQuery = sinon.stub(component, 'processQueryFileAddition');
            component['files'] = [{query: true}, {id: 'queries.qry'}];

            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.reject('some error')
            });

            component.addQueryFile(mockQueryFile);
            tick();

            mockModal.open.should.have.been.called;
            mockAlertService.errorStatus$.next.should.have.been.calledWith('some error');
            mockProcessQuery.should.not.have.been.called;
        }));

        it('should handle confirm modal cancel', fakeAsync(() => {
            let mockProcessQuery = sinon.stub(component, 'processQueryFileAddition');
            component['files'] = [{query: true}, {id: 'queries.qry'}];

            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.reject(1)
            });

            component.addQueryFile(mockQueryFile);
            tick();

            mockModal.open.should.have.been.called;
            mockAlertService.errorStatus$.next.should.not.have.been.called;
            mockProcessQuery.should.not.have.been.called;
        }));

        it('should call processQueryFileAddition on modal confirm', fakeAsync(() => {
            let mockProcessQuery = sinon.stub(component, 'processQueryFileAddition');
            component['files'] = [{query: true}, {id: 'queries.qry'}];

            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.resolve()
            });

            component.addQueryFile(mockQueryFile);
            tick();

            mockModal.open.should.have.been.called;
            mockAlertService.errorStatus$.next.should.not.have.been.called;
            mockProcessQuery.should.have.been.calledWith(mockQueryFile);
        }));
    });

    describe('processRuleFileAddition', () => {

        it('should set the aclFile as that passed in', () => {
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');
            let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');
            let mockFindIndex = sinon.stub(component, 'findFileIndex');
            mockFindIndex.returns(7);

            let aclManagerMock = {
                setAclFile: sinon.stub()
            };

            mockClientService.getBusinessNetwork.returns({
                getAclManager: sinon.stub().returns(aclManagerMock)
            });

            component.processRuleFileAddition(mockRuleFile);

            aclManagerMock.setAclFile.should.have.been.calledWith(mockRuleFile);
        });

        it('should call updateFiles, setCurrentFile and set editor dirty', () => {
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');
            let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');
            let mockFindIndex = sinon.stub(component, 'findFileIndex');
            mockFindIndex.returns(0);
            component['files'] = [{acl: true}];

            let aclManagerMock = {
                setAclFile: sinon.stub()
            };

            mockClientService.getBusinessNetwork.returns({
                getAclManager: sinon.stub().returns(aclManagerMock)
            });

            component.processRuleFileAddition(mockRuleFile);

            mockUpdateFiles.should.have.been.called;
            mockSetCurrentFile.should.have.been.calledWith({acl: true});
            component['dirty'].should.be.equal(true);
        });
    });

    describe('processQueryFileAddition', () => {

        it('should set the queryFile as that passed in', () => {
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');
            let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');
            let mockFindIndex = sinon.stub(component, 'findFileIndex');
            mockFindIndex.returns(7);

            let queryManagerMock = {
                setQueryFile: sinon.stub()
            };

            mockClientService.getBusinessNetwork.returns({
                getQueryManager: sinon.stub().returns(queryManagerMock)
            });

            component.processQueryFileAddition(mockQueryFile);

            queryManagerMock.setQueryFile.should.have.been.calledWith(mockQueryFile);
        });

        it('should call updateFiles, setCurrentFile and set editor dirty', () => {
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');
            let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');
            let mockFindIndex = sinon.stub(component, 'findFileIndex');
            mockFindIndex.returns(0);
            component['files'] = [{query: true}];

            let queryManagerMock = {
                setQueryFile: sinon.stub()
            };

            mockClientService.getBusinessNetwork.returns({
                getQueryManager: sinon.stub().returns(queryManagerMock)
            });

            component.processQueryFileAddition(mockQueryFile);

            mockUpdateFiles.should.have.been.called;
            mockSetCurrentFile.should.have.been.calledWith({query: true});
            component['dirty'].should.be.equal(true);
        });
    });

    describe('openImportModal', () => {
        it('should open the import modal', fakeAsync(() => {
            let mockUpdatePackage = sinon.stub(component, 'updatePackageInfo');
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');

            mockModal.open = sinon.stub().returns({
                componentInstance: {},
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
                componentInstance: {},
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
                componentInstance: {},
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
                componentInstance: {},
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
                componentInstance: {},
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
        let mockAddReadme;
        let mockAddRule;
        let mockAddQuery;

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
            mockAddReadme = sinon.stub(component, 'addReadme');
            mockAddRule = sinon.stub(component, 'addRuleFile');
            mockAddQuery = sinon.stub(component, 'addQueryFile');
        });

        it('should open add file modal', fakeAsync(() => {

            component.openAddFileModal();

            tick();

            mockAddModel.should.have.been.called;
        }));

        it('should open AddFileComponent modal and call addModelFile if model returned', fakeAsync(() => {
            mockModal.open = sinon.stub().returns({
                componentInstance: {
                    businessNetwork: {}
                },
                result: Promise.resolve(mockModelFile)
            });

            component.openAddFileModal();

            tick();

            mockAddModel.should.have.been.called;
            mockClientService.businessNetworkChanged$.next.should.have.been.calledWith(true);
        }));

        it('should open AddFileComponent modal and call addScriptFile if script returned', fakeAsync(() => {
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

        it('should open AddFileComponent modal and call addreadme if README returned', fakeAsync(() => {
            mockModal.open = sinon.stub().returns({
                componentInstance: {
                    businessNetwork: {}
                },
                result: Promise.resolve({})
            });

            component.openAddFileModal();

            tick();

            mockAddReadme.should.have.been.called;
            mockClientService.businessNetworkChanged$.next.should.have.been.calledWith(true);
        }));

        it('should open AddFileComponent modal and call addRuleFile if acl file returned', fakeAsync(() => {
            mockModal.open = sinon.stub().returns({
                componentInstance: {
                    businessNetwork: {}
                },
                result: Promise.resolve(mockRuleFile)
            });

            component.openAddFileModal();

            tick();

            mockAddRule.should.have.been.called;
            mockClientService.businessNetworkChanged$.next.should.have.been.calledWith(true);
        }));

        it('should open AddFileComponent modal and call addQueryFile if query file returned', fakeAsync(() => {
            mockModal.open = sinon.stub().returns({
                componentInstance: {
                    businessNetwork: {}
                },
                result: Promise.resolve(mockQueryFile)
            });

            component.openAddFileModal();

            tick();

            mockAddQuery.should.have.been.called;
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
                componentInstance: {},
                result: Promise.reject(1)
            });

            component.openAddFileModal();

            tick();

            mockAddModel.should.not.have.been.called;
            mockClientService.businessNetworkChanged$.next.should.not.have.been.called;
            mockAlertService.errorStatus$.next.should.not.have.been.called;
        }));

        it('should open AddFileComponent modal and show error if business network not valid', fakeAsync(() => {

            mockAddModel.throws('some error');
            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.resolve(mockModelFile)
            });

            component.openAddFileModal();

            tick();

            mockAddModel.should.have.been.called;
            mockAlertService.errorStatus$.next.should.have.been.called;
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

        it('should make edit package fields visible when true for README', () => {
            component['editActive'] = false;
            component['editingPackage'] = false;
            component['deployedPackageDescription'] = 'description';
            component['deployedPackageVersion'] = '1.0.0';

            mockClientService.getMetaData.returns({
                getPackageJson: sinon.stub().returns('description')
            });

            // Specify README file
            let file = {readme: true, id: 'readme', displayID: 'README.md'};
            component.setCurrentFile(file);

            fixture.detectChanges();

            // Expect to see "description" visible within class="business-network-details"
            // Expect to have "edit" option available within class="business-network-details"
            let element = fixture.debugElement.query(By.css('.business-network-details')).nativeElement;
            element.textContent.should.contain('description');
            element.innerHTML.should.contain('id="editFileButton"');

            // Flip editActive boolean
            component['editActive'] = true;
            fixture.detectChanges();

            // Expect two visible edit fields:
            // 1) Version (input text)
            // 2) Full package (button)
            element = fixture.debugElement.query(By.css('.business-network-details')).nativeElement;
            element.innerHTML.should.not.contain('id="editFileButton"');
            element.innerHTML.should.contain('id="editPackageButton"');
            element.textContent.should.contain('Version');
            element.textContent.should.contain('View/edit full metadata in package.json');

        });

        it('should make edit fields interactable when true for README', () => {
            component['editActive'] = true;

            // Specify README file
            let file = {readme: true, id: 'readme', displayID: 'README.md'};
            component['currentFile'] = file;

            fixture.detectChanges();

            // Expect edit fields:
            // 1) Name & Version (input text) should not be editable (focused)
            // 2) Full package (button) to be enabled

            let editItem = fixture.debugElement.query(By.css('#editVersion')).nativeElement;
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

        it('should identify model file via parameters', () => {
            let testItem = {model: true, displayID: 'test_name'};

            let result = component['fileType'](testItem);

            result.should.equal('Model');
        });

        it('should identify script file via parameters', () => {
            let testItem = {script: true, displayID: 'test_name'};

            let result = component['fileType'](testItem);

            result.should.equal('Script');
        });

        it('should identify ACL file via parameters', () => {
            let testItem = {acl: true, displayID: 'test_name'};

            let result = component['fileType'](testItem);

            result.should.equal('ACL');
        });

        it('should identify Query file via parameters', () => {
            let testItem = {query: true, displayID: 'test_name'};

            let result = component['fileType'](testItem);

            result.should.equal('Query');
        });

        it('should identify unknown file via parameters as README', () => {
            let testItem = {displayID: 'test_name'};

            let result = component['fileType'](testItem);

            result.should.equal('Readme');
        });
    });

    describe('editorFilesValidate', () => {

        beforeEach(() => {
            mockClientService.validateFile.returns(null);
            mockClientService.getModelFile.returns({getDefinitions: sinon.stub().returns({})});
            mockClientService.getScriptFile.returns({getContents: sinon.stub().returns({})});
            mockClientService.getAclFile.returns({getDefinitions: sinon.stub().returns({})});
            mockClientService.getQueryFile.returns({getDefinitions: sinon.stub().returns({})});
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

        it('should validate query files', () => {
            let fileArray = [];
            fileArray.push({query: true, displayID: 'test_name'});
            component['files'] = fileArray;

            let result = component['editorFilesValidate']();

            mockClientService.getQueryFile.should.have.been.called;
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

        it('should fail validation for invalid query files', () => {
            let fileArray = [];
            fileArray.push({query: true, displayID: 'test_name'});
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
            fileArray.push({acl: true, id: 'acl file', displayID: 'acl0'});
            fileArray.push({script: true, id: 'script 0', displayID: 'script0'});
            fileArray.push({script: true, id: 'script 1', displayID: 'script1'});
            fileArray.push({model: true, id: 'model 1', displayID: 'model1'});
            fileArray.push({script: true, id: 'script 2', displayID: 'script2'});
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
            let mockSetIntialFile = sinon.stub(component, 'setInitialFile');

            component.openDeleteFileModal();
            tick();

            // Check innitial file set
            mockSetIntialFile.should.have.been.called;

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
            let mockSetIntialFile = sinon.stub(component, 'setInitialFile');

            component.openDeleteFileModal();
            tick();

            // Check innitial file set
            mockSetIntialFile.should.have.been.called;

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

    describe('editFileName', () => {

        it('should prevent user creating invalid file names during edit', () => {
            let invalidNames = [];
            invalidNames.push('name with spaces');
            invalidNames.push('name!');
            invalidNames.push('name#');
            invalidNames.push('/name');
            invalidNames.push('name/name');
            invalidNames.push('/name');
            invalidNames.push('na]me');
            invalidNames.push('na:me');
            invalidNames.push('na`me');

            invalidNames.forEach((fileName) => {
                component['inputFileNameArray'] = ['', fileName, ''];
                component['editFileName']();
                component['fileNameError'].should.be.equal('Error: Invalid filename, file must be alpha-numeric with no spaces');
            });
        });

        it('should prevent edit of acl file', () => {
            // Attempt edit of ACL
            component['inputFileNameArray'] = ['', 'permissions', '.acl'];
            component['currentFile'] = {acl: true};

            component['editFileName']();
            component['fileNameError'].should.be.equal('Error: Unable to process rename on current file type');
        });

        it('should prevent edit of readme file', () => {
            // Attempt edit of README
            component['inputFileNameArray'] = ['', 'README', '.md'];
            component['currentFile'] = {readme: true};

            component['editFileName']();
            component['fileNameError'].should.be.equal('Error: Unable to process rename on current file type');
        });

        it('should prevent renaming file to existing file', () => {
            // Attempt edit of model
            component['inputFileNameArray'] = ['', 'myModelFile', '.cto'];
            component['currentFile'] = {model: true, displayID: 'oldNameID.cto'};

            component['files'] = [{displayID: 'muchRandom'},
                {displayID: 'oldNameID.cto'},
                {displayID: 'myModelFile.cto'}];

            component['editFileName']();
            component['fileNameError'].should.be.equal('Error: Filename already exists');
        });

        it('should not rename script file if name unchanged', () => {
            // Attempt edit of script
            component['inputFileNameArray'] = ['', 'myScriptFile', '.js'];
            component['currentFile'] = {script: true, id: 'myScriptFile.js'};

            component['files'] = [{id: 'muchRandom'},
                {id: 'myScriptFile.js'},
                {id: 'oldNameID'}];

            component['editFileName']();
        });

        it('should not rename model file if name unchanged', () => {
            // Attempt edit of model
            component['inputFileNameArray'] = ['', 'myModelFile', '.cto'];
            component['currentFile'] = {model: true, displayID: 'myModelFile.cto'};

            component['files'] = [{displayID: 'muchRandom'},
                {displayID: 'myModelFile.cto'},
                {displayID: 'oldNameID'}];

            component['editFileName']();
        });

        it('should enable script file rename by replacing script', () => {
            // Should call:
            // - this.clientService.replaceFile(this.currentFile.id, inputFileName, contents, 'script');
            // - this.updateFiles();
            // - this.setCurrentFile(this.files[index]);
            // Should set:
            // - this.dirty = true;
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');
            let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');
            let mockFindIndex = sinon.stub(component, 'findFileIndex');
            mockFindIndex.onCall(0).returns(-1);
            mockFindIndex.onCall(1).returns(2);

            mockClientService.getScriptFile.returns({
                getContents: sinon.stub().returns('my script content')
            });

            component['inputFileNameArray'] = ['', 'myNewScriptFile', '.js'];
            component['currentFile'] = {script: true, id: 'myCurrentScriptFile.js'};

            component['files'] = [{id: 'muchRandom'},
                {id: 'myCurrentScriptFile.js'},
                {id: 'otherScriptFile.js'},
                {id: 'oldNameID'}];

            // Call Method
            component['editFileName']();

            mockClientService.replaceFile.should.have.been.calledWith('myCurrentScriptFile.js', 'myNewScriptFile.js', 'my script content', 'script');
            mockUpdateFiles.should.have.been.called;
            mockSetCurrentFile.should.have.been.calledWith({id: 'otherScriptFile.js'});
            component['dirty'].should.be.equal(true);
        });

        it('should enable model file rename by editing filename', () => {
            // Should call:
            // - this.clientService.replaceFile(this.currentFile.id, inputFileName, contents, 'script');
            // - this.updateFiles();
            // - this.setCurrentFile(this.files[index]);
            // Should set:
            // - this.dirty = true;
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');
            let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');
            let mockFindIndex = sinon.stub(component, 'findFileIndex');
            mockFindIndex.onCall(0).returns(-1);
            mockFindIndex.onCall(1).returns(2);

            mockClientService.getModelFile.returns({
                getDefinitions: sinon.stub().returns('My ModelFile content')
            });
            component['inputFileNameArray'] = ['', 'myNewModelFile', '.cto'];
            component['currentFile'] = {model: true, id: 'myCurrentModelFile.cto'};

            component['files'] = [{id: 'muchRandom'},
                {displayID: 'myCurrentModelFile.cto'},
                {displayID: 'otherModelFile.cto'},
                {id: 'oldNameID'}];

            // Call Method
            component['editFileName']();

            mockClientService.replaceFile.should.have.been.calledWith('myCurrentModelFile.cto', 'myNewModelFile.cto', 'My ModelFile content', 'model');
            mockUpdateFiles.should.have.been.called;
            mockSetCurrentFile.should.have.been.calledWith({displayID: 'otherModelFile.cto'});
            component['dirty'].should.be.equal(true);
        });

    });

    describe('findFileIndex', () => {

        it('should find a file index by id', () => {
            component['files'] = [{id: 'match0'},
                {id: 'match1'},
                {id: 'match2'},
                {id: 'match3'},
                {id: 'match4'}];

            for (let i = 0; i < 4; i++) {
                let match = component['findFileIndex'](true, 'match' + i);
                match.should.be.equal(i);
            }
        });

        it('should find a file index by displayID', () => {
            component['files'] = [{displayID: 'match0'},
                {displayID: 'match1'},
                {displayID: 'match2'},
                {displayID: 'match3'},
                {displayIDid: 'match4'}];

            for (let i = 0; i < 4; i++) {
                let match = component['findFileIndex'](false, 'match' + i);
                match.should.be.equal(i);
            }
        });

        it('should find a file index by id within mixed items', () => {
            component['files'] = [{id: 'match0'},
                {displayID: 'match0'},
                {id: 'match1'},
                {displayID: 'match1'},
                {id: 'match2'},
                {displayID: 'match2'},
                {id: 'match3'},
                {displayID: 'match3'}];
            let j = 0;
            for (let i = 0; i < 4; i++) {
                let match = component['findFileIndex'](true, 'match' + i);
                match.should.be.equal(j);
                j += 2;
            }
        });

        it('should find a file index by displayID within mixed items', () => {
            component['files'] = [{id: 'match0'},
                {displayID: 'match0'},
                {id: 'match1'},
                {displayID: 'match1'},
                {id: 'match2'},
                {displayID: 'match2'},
                {id: 'match3'},
                {displayID: 'match3'}];
            let j = 1;
            for (let i = 0; i < 4; i++) {
                let match = component['findFileIndex'](false, 'match' + i);
                match.should.be.equal(j);
                j += 2;
            }
        });

    });

    describe('preventNameEdit', () => {
        it('should prevent name edit of acl', () => {
            let resource = {
                acl: true
            };

            let response = component.preventNameEdit(resource);

            response.should.be.true;
        });

        it('should prevent name edit of query', () => {
            let resource = {
                query: true
            };

            let response = component.preventNameEdit(resource);

            response.should.be.true;
        });

        it('should permit name edit of unknown', () => {
            let resource = {
                wombat: true
            };

            let response = component.preventNameEdit(resource);

            response.should.be.false;
        });

        it('should permit name edit of model', () => {
            let resource = {
                model: true
            };

            let response = component.preventNameEdit(resource);

            response.should.be.false;
        });

        it('should permit name edit of script', () => {
            let resource = {
                script: true
            };

            let response = component.preventNameEdit(resource);

            response.should.be.false;
        });
    });

});
