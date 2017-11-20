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
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AlertService } from '../basic-modals/alert.service';
import { ModelFile, Script, AclFile, QueryFile } from 'composer-common';
import { EditorFile } from '../services/editor-file';
import { ScrollToElementDirective } from '../directives/scroll/scroll-to-element.directive';
import { BehaviorSubject } from 'rxjs/Rx';
import { FileService } from '../services/file.service';

import * as sinon from 'sinon';
import * as chai from 'chai';

import 'rxjs/add/operator/takeWhile';
import * as fileSaver from 'file-saver';
import { DrawerService } from '../common/drawer/drawer.service';

let should = chai.should();

@Directive({
    selector: 'editor-file'
})

class MockEditorFileDirective {
    @Input()
    public editorFile;

    @Input()
    public previewReadmeActive;
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
    let mockFileService;
    let mockModal;
    let mockDrawer;
    let mockModelFile;
    let mockScriptFile;
    let mockRuleFile;
    let mockQueryFile;
    let editorService;

    beforeEach(() => {
        mockAdminService = sinon.createStubInstance(AdminService);
        mockAlertService = sinon.createStubInstance(AlertService);
        mockClientService = sinon.createStubInstance(ClientService);
        mockFileService = sinon.createStubInstance(FileService);
        mockModal = sinon.createStubInstance(NgbModal);
        mockDrawer = sinon.createStubInstance(DrawerService);
        mockModelFile = sinon.createStubInstance(ModelFile);
        mockScriptFile = sinon.createStubInstance(Script);
        mockRuleFile = sinon.createStubInstance(AclFile);
        mockQueryFile = sinon.createStubInstance(QueryFile);

        mockFileService.getQueryFile.returns(mockQueryFile);

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
                {provide: FileService, useValue: mockFileService},
                {provide: DrawerService, useValue: mockDrawer}]
        });

        fixture = TestBed.createComponent(EditorComponent);
        component = fixture.componentInstance;
    });

    describe('ngOnInit', () => {
        let mockEditorFilesValidate;

        beforeEach(() => {
            mockClientService.ensureConnected.returns(Promise.resolve());
            mockFileService.businessNetworkChanged$ = {
                takeWhile: sinon.stub().returns({
                    subscribe: (callback) => {
                        let noError = true;
                        callback(noError);
                    }
                })
            };
            mockFileService.namespaceChanged$ = {
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
            let mockSetFile = sinon.stub(component, 'setCurrentFile');
            let mockSetIntialFile = sinon.stub(component, 'setInitialFile');

            mockFileService.getEditorFiles.returns([]);
            mockFileService.getCurrentFile.returns(null);
            component.ngOnInit();

            tick();

            component['noError'].should.equal(true);

            mockUpdatePackage.should.have.been.called;
            mockSetFile.should.not.have.been.called;
            mockSetIntialFile.should.have.been.called;
            mockFileService.loadFiles.should.have.been.called;
        }));

        it('should re-initialize the editor', fakeAsync(() => {
            let mockUpdatePackage = sinon.stub(component, 'updatePackageInfo');
            let mockSetFile = sinon.stub(component, 'setCurrentFile');
            let mockSetIntialFile = sinon.stub(component, 'setInitialFile');

            mockFileService.getEditorFiles.returns(['myFile']);
            mockFileService.getCurrentFile.returns('myFile');

            component.ngOnInit();

            tick();

            component['noError'].should.equal(true);

            mockUpdatePackage.should.have.been.called;
            mockSetFile.should.have.been.called;
            mockSetIntialFile.should.not.have.been.called;
            mockFileService.getEditorFiles.should.have.been.calledTwice;
        }));

        it('should set noError to false when notified', fakeAsync(() => {
            mockFileService.businessNetworkChanged$ = {
                takeWhile: sinon.stub().returns({
                    subscribe: (callback) => {
                        let noError = false;
                        callback(noError);
                    }
                })
            };

            mockEditorFilesValidate.returns(false);

            component.ngOnInit();

            tick();

            component['noError'].should.equal(false);
        }));

        it('should set noError to be true when notified', fakeAsync(() => {
            mockFileService.businessNetworkChanged$ = {
                takeWhile: sinon.stub().returns({
                    subscribe: (callback) => {
                        let noError = true;
                        callback(noError);
                    }
                })
            };

            component.ngOnInit();

            tick();

            component['noError'].should.equal(true);
        }));

        it('should handle namespace change', fakeAsync(() => {
            component['currentFile'] = 'myFile';
            let updateFilesStub = sinon.stub(component, 'updateFiles');
            let findFileStub = sinon.stub(component, 'findFileIndex').returns(0);
            let currentFileStub = sinon.stub(component, 'setCurrentFile');

            component['files'] = ['myFile'];

            mockFileService.namespaceChanged$ = {
                takeWhile: sinon.stub().returns({
                    subscribe: (callback) => {
                        let newName = 'bob';
                        callback(newName);
                    }
                })
            };

            component.ngOnInit();

            tick();

            component['noError'].should.equal(true);

            updateFilesStub.should.have.been.called;
            findFileStub.should.have.been.calledWith(true, 'bob');
            currentFileStub.should.have.been.calledWith('myFile');
        }));

        it('should handle error', fakeAsync(() => {
            mockClientService.ensureConnected.returns(Promise.reject('some error'));

            component.ngOnInit();

            tick();

            mockAlertService.errorStatus$.next.should.have.been.calledWith('some error');
        }));

        it('should set current file to readme', fakeAsync(() => {
            let mockUpdatePackage = sinon.stub(component, 'updatePackageInfo');
            let mockCurrentFile = sinon.stub(component, 'setCurrentFile');

            let readMeFile = new EditorFile('1', '1', 'this is the readme', 'readme');
            let modelFile = new EditorFile('2', '2', 'this is the model', 'model');

            mockFileService.getEditorFiles.returns([readMeFile, modelFile]);
            mockFileService.getCurrentFile.returns(null);

            component.ngOnInit();

            tick();

            mockCurrentFile.should.have.been.calledWith(readMeFile);

            mockUpdatePackage.should.have.been.called;
        }));

        it('should set current file to first one if no readme', fakeAsync(() => {
            let mockUpdatePackage = sinon.stub(component, 'updatePackageInfo');
            let mockCurrentFile = sinon.stub(component, 'setCurrentFile');

            let modelFile = new EditorFile('2', '2', 'this is the model', 'model');
            let scriptFile = new EditorFile('1', '1', 'this is the script', 'script');

            mockFileService.getEditorFiles.returns([modelFile, scriptFile]);
            mockFileService.getCurrentFile.returns(null);
            component.ngOnInit();

            tick();

            mockCurrentFile.should.have.been.calledWith(modelFile);

            mockUpdatePackage.should.have.been.called;
        }));

        it('should do nothing if no files', fakeAsync(() => {
            let mockUpdatePackage = sinon.stub(component, 'updatePackageInfo');
            let mockCurrentFile = sinon.stub(component, 'setCurrentFile');

            mockFileService.getEditorFiles.returns([]);
            mockFileService.loadFiles.returns([]);
            mockFileService.getCurrentFile.returns(null);
            component.ngOnInit();

            tick();

            mockCurrentFile.should.not.have.been.called;

            mockUpdatePackage.should.have.been.called;
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
                getVersion: sinon.stub().returns('my version'),
            };

            mockFileService.getMetaData = sinon.stub().returns(mockMetaData);

            component.updatePackageInfo();
            component['deployedPackageVersion'].should.equal('my version');
            component['inputPackageVersion'].should.equal('my version');
        });
    });

    describe('setCurrentFile', () => {

        it('should set current file', () => {
            component['currentFile'] = new EditorFile('oldID', 'oldFile', 'myContent', 'model');
            let file = new EditorFile('newID', 'newFile', 'myContent', 'model');
            component.setCurrentFile(file);
            component['currentFile'].should.deep.equal(file);
        });

        it('should set current file', () => {
            component['currentFile'] = new EditorFile('oldID', 'oldFile', 'myContent', 'model');
            component['editingPackage'] = true;

            let mockUpdatePackage = sinon.stub(component, 'updatePackageInfo');

            let file = new EditorFile('newID', 'newFile', 'myContent', 'model');
            component.setCurrentFile(file);
            component['currentFile'].should.deep.equal(file);

            mockUpdatePackage.should.have.been.called;
            component['editingPackage'].should.equal(false);
        });

        it('should set current file with an error', () => {
            component['currentFile'] = new EditorFile('oldID', 'oldFile', 'myContent', 'model');
            component['editingPackage'] = true;

            let mockUpdatePackage = sinon.stub(component, 'updatePackageInfo');

            let file = new EditorFile('newID', 'newFile', 'myContent', 'model');
            component.setCurrentFile(file);
            component['currentFile'].should.deep.equal(file);

            mockUpdatePackage.should.have.been.called;
            component['editingPackage'].should.equal(false);
        });

        it('should always set current file, if same file selected and is readme file', () => {
            component['currentFile'] = new EditorFile('readme', 'readme.md', 'myContent', 'readme');
            let file = new EditorFile('readme', 'readme.md', 'myContent', 'readme');

            component.setCurrentFile(file);

            mockFileService.setCurrentFile.should.have.been.called;
        });

        it('should always set current file, if same file selected and is acl file', () => {
            component['currentFile'] = new EditorFile('acl', 'acl', 'myContent', 'acl');
            let file = new EditorFile('acl', 'acl', 'myContent', 'acl');

            component.setCurrentFile(file);

            mockFileService.setCurrentFile.should.have.been.called;
        });

        it('should not set current file, if same file selected', () => {
            component['currentFile'] = new EditorFile('model', 'model', 'myContent', 'model');
            let mockUpdatePackage = sinon.stub(component, 'updatePackageInfo');
            let file = new EditorFile('model', 'model', 'myContent', 'model');

            component.setCurrentFile(file);

            mockFileService.setCurrentFile.should.not.have.been.called;
            mockUpdatePackage.should.not.have.been.called;
        });

        it('should mark a file as deletable if a script type', () => {
            let file = new EditorFile('script', 'script', 'myContent', 'script');
            component.setCurrentFile(file);
            component['deletableFile'].should.equal(true);
        });

        it('should mark a file as deletable if a model type', () => {
            let file = new EditorFile('model', 'model', 'myContent', 'model');
            component.setCurrentFile(file);
            component['deletableFile'].should.equal(true);
        });

        it('should mark a file as deletable if a query type', () => {
            let file = new EditorFile('query', 'query', 'myContent', 'query');
            component.setCurrentFile(file);
            component['deletableFile'].should.equal(true);
        });

        it('should not mark a file as deletable if a acl type', () => {
            let file = new EditorFile('acl', 'acl', 'myContent', 'acl');
            component.setCurrentFile(file);
            component['deletableFile'].should.equal(false);
        });

        it('should not mark a file as deletable if a readme type', () => {
            let file = new EditorFile('readme', 'readme', 'myContent', 'readme');
            component.setCurrentFile(file);
            component['deletableFile'].should.equal(false);
        });
    });

    describe('updateFiles', () => {
        it('should update the files, and not include system model files', () => {
            mockFileService.getEditorFiles.returns(['myFile']);
            component.updateFiles();
            component['files'].should.deep.equal(['myFile']);
        });
    });

    describe('addModelFile', () => {
        it('should add a model file', () => {
            let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');
            let mockEditorFilesValidateStub = sinon.stub(component, 'editorFilesValidate').returns(true);

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

            let file = new EditorFile('myId', 'myDisplayID', 'myContent', 'model');

            mockFileService.addFile.returns(file);

            component.addModelFile();

            mockFileService.getEditorFiles.should.have.been.called;

            mockSetCurrentFile.should.have.been.calledWith(file);
            mockEditorFilesValidateStub.should.have.been.called;
            component['noError'].should.equal(true);
        });

        it('should add a model file with contents', () => {
            let mockEditorFilesValidateStub = sinon.stub(component, 'editorFilesValidate').returns(true);
            let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');

            component['files'] = [{id: 'random'}, {id: 'namespace0'}];

            mockModelFile.getNamespace.returns('namespace0');

            let file = new EditorFile('myId', 'myDisplayID', 'myContent', 'model');

            mockFileService.addFile.returns(file);

            component.addModelFile({namespace: 'namespace', fileName: 'myFile', definitions: 'myCode'});

            mockFileService.addFile.should.have.been.calledWith('namespace', 'myFile', 'myCode', 'model');

            mockFileService.getEditorFiles.should.have.been.called;
            mockEditorFilesValidateStub.should.have.been.called;

            mockSetCurrentFile.should.have.been.calledWith(file);
            component['noError'].should.equal(true);
        });

        it('should add a model file with contents that doesn\'t validate', () => {
            let mockEditorFilesValidateStub = sinon.stub(component, 'editorFilesValidate').returns(false);
            let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');

            component['files'] = [{id: 'random'}, {id: 'namespace0'}];

            mockModelFile.getNamespace.returns('namespace0');

            let file = new EditorFile('myId', 'myDisplayID', 'myContent', 'model');

            mockFileService.addFile.returns(file);

            mockFileService.validateFile.returns('error');

            component.addModelFile({namespace: 'namespace', fileName: 'myFile', definitions: 'myCode'});

            mockFileService.addFile.should.have.been.calledWith('namespace', 'myFile', 'myCode', 'model');

            mockFileService.getEditorFiles.should.have.been.called;
            mockEditorFilesValidateStub.should.have.been.called;

            mockFileService.updateBusinessNetworkFile.should.not.have.been.called;

            mockSetCurrentFile.should.have.been.calledWith(file);
            component['noError'].should.equal(false);
        });
    });

    describe('addScriptFile', () => {
        it('should create and add a script file', () => {
            let mockEditorFilesValidateStub = sinon.stub(component, 'editorFilesValidate').returns(true);
            let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');

            mockScriptFile.getIdentifier.returns('script');
            mockScriptFile.id = 'script';
            component['files'] = [mockScriptFile];

            let file = new EditorFile('myId', 'myDisplayID', 'myContent', 'script');

            mockFileService.addFile.returns(file);

            component.addScriptFile();

            mockFileService.getEditorFiles.should.have.been.called;
            mockEditorFilesValidateStub.should.have.been.called;

            mockSetCurrentFile.should.have.been.calledWith(file);
            component['noError'].should.equal(true);
        });

        it('should create and add a script file with an incremented name', () => {
            let mockEditorFilesValidateStub = sinon.stub(component, 'editorFilesValidate').returns(true);
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

            mockFileService.getFile.onFirstCall().returns('myFile');
            mockFileService.getFile.onSecondCall().returns(null);

            let file = new EditorFile('myId', 'myDisplayID', 'myContent', 'script');

            mockFileService.addFile.returns(file);

            component.addScriptFile();

            mockFileService.addFile.should.have.been.calledWith('lib/script2.js', 'lib/script2.js', `/**
          * New script file
          */`, 'script');

            mockFileService.getEditorFiles.should.have.been.called;
            mockEditorFilesValidateStub.should.have.been.called;

            mockSetCurrentFile.should.have.been.calledWith(file);
            component['noError'].should.equal(true);
        });

        it('should add a script file with content', () => {
            let mockEditorFilesValidateStub = sinon.stub(component, 'editorFilesValidate').returns(true);
            let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');

            component['addScriptFileName'] = 'script';
            component['files'] = [{id: 'random'}, {id: 'script'}];

            let file = new EditorFile('myId', 'myDisplayID', 'myContent', 'script');

            mockFileService.addFile.returns(file);

            component.addScriptFile(mockScriptFile);

            mockFileService.getEditorFiles.should.have.been.called;
            mockEditorFilesValidateStub.should.have.been.called;

            mockSetCurrentFile.should.have.been.calledWith(file);
            component['noError'].should.equal(true);
        });

        it('should add a script file with content with increment file name', () => {
            let mockEditorFilesValidateStub = sinon.stub(component, 'editorFilesValidate').returns(true);
            let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');

            mockScriptFile.getIdentifier.returns('bob');
            mockScriptFile.contents = `/**
          * New script file
          */`;

            component['addScriptFileName'] = 'script';
            component['files'] = [{id: 'random'}, {id: 'script'}];

            let file = new EditorFile('myId', 'myDisplayID', 'myContent', 'script');

            mockFileService.getFile.onFirstCall().returns('myFile');
            mockFileService.getFile.onSecondCall().returns(null);

            mockFileService.addFile.returns(file);

            component.addScriptFile(mockScriptFile);

            mockFileService.addFile.should.have.been.calledWith('2bob', '2bob', `/**
          * New script file
          */`, 'script');

            mockFileService.getEditorFiles.should.have.been.called;
            mockEditorFilesValidateStub.should.have.been.called;

            mockSetCurrentFile.should.have.been.calledWith(file);
            component['noError'].should.equal(true);
        });

        it('should add a script file with content and not validate', () => {
            let mockEditorFilesValidateStub = sinon.stub(component, 'editorFilesValidate').returns(false);
            let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');

            component['addScriptFileName'] = 'script';
            component['files'] = [{id: 'random'}, {id: 'script'}];

            let file = new EditorFile('myId', 'myDisplayID', 'myContent', 'script');

            mockFileService.addFile.returns(file);

            mockFileService.validateFile.returns('error');

            component.addScriptFile(mockScriptFile);

            mockFileService.getEditorFiles.should.have.been.called;
            mockEditorFilesValidateStub.should.have.been.called;

            mockSetCurrentFile.should.have.been.calledWith(file);
            mockFileService.updateBusinessNetworkFile.should.not.have.been.called;
            component['noError'].should.equal(false);
        });
    });

    describe('addReadme', () => {
        it('should not open confirm modal if no readme present', fakeAsync(() => {
            let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');

            let files = [new EditorFile('myId', 'myDisplay', 'myContent', 'script')];
            component['files'] = files;

            mockFileService.getEditorFiles.returns(files);

            let b = new Blob(['/**README File*/'], {type: 'text/plain'});
            let mockReadmeFile = new File([b], 'readme.md');

            component.addReadme(mockReadmeFile);
            tick();

            mockModal.open.should.not.have.been.called;
        }));

        it('should create readme if no existing readme present', fakeAsync(() => {
            let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');

            let files = [new EditorFile('myId', 'myDisplay', 'myContent', 'script')];
            component['files'] = files;

            mockFileService.getEditorFiles.returns(files);

            let b = new Blob(['/**README File*/'], {type: 'text/plain'});
            let mockReadmeFile = new File([b], 'readme.md');

            component.addReadme(mockReadmeFile);

            tick();

            mockFileService.setBusinessNetworkReadme.should.have.been.calledWith(mockReadmeFile);
            mockSetCurrentFile.should.have.been.calledWith(files[0]);
        }));

        it('should open confirm modal if readme present and handle error', fakeAsync(() => {
            let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');
            let files = [new EditorFile('myId', 'myDisplay', 'myContent', 'readme')];
            component['files'] = files;

            mockFileService.getEditorFiles.returns(files);

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
            mockFileService.setBusinessNetworkReadme.should.not.have.been.called;
            mockSetCurrentFile.should.not.have.been.called;
        }));

        it('should handle confirm modal cancel', fakeAsync(() => {
            let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');
            let files = [new EditorFile('myId', 'myDisplay', 'myContent', 'readme')];
            component['files'] = files;

            mockFileService.getEditorFiles.returns(files);

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
            mockFileService.setBusinessNetworkReadme.should.not.have.been.called;
            mockSetCurrentFile.should.not.have.been.called;
        }));

        it('should create readme on modal confirm', fakeAsync(() => {
            let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');
            let files = [new EditorFile('myId', 'myDisplay', 'myContent', 'readme')];
            component['files'] = files;

            mockFileService.getEditorFiles.returns(files);
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
            mockFileService.setBusinessNetworkReadme.should.have.been.called;
            mockSetCurrentFile.should.have.been.calledWith(files[0]);
        }));

    });

    describe('addRuleFile', () => {
        it('should not open confirm modal if no ACL file present', fakeAsync(() => {
            let mockProcessRules = sinon.stub(component, 'processRuleFileAddition');
            component['files'] = [new EditorFile('myId', 'myDisplay', 'myContent', 'script')];

            component.addRuleFile(mockRuleFile);
            tick();

            mockModal.open.should.not.have.been.called;
        }));

        it('should call processRuleFileAddition if no existing rules present', fakeAsync(() => {
            let mockProcessRules = sinon.stub(component, 'processRuleFileAddition');
            component['files'] = [new EditorFile('myId', 'myDisplay', 'myContent', 'script')];

            component.addRuleFile(mockRuleFile);
            tick();

            mockModal.open.should.not.have.been.called;
            mockProcessRules.should.have.been.calledWith(mockRuleFile);
        }));

        it('should open confirm modal if rule file present and handle error', fakeAsync(() => {
            let mockProcessRules = sinon.stub(component, 'processRuleFileAddition');
            component['files'] = [new EditorFile('myId', 'myDisplay', 'myContent', 'acl')];

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
            component['files'] = [new EditorFile('myId', 'myDisplay', 'myContent', 'acl')];

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
            component['files'] = [new EditorFile('myId', 'myDisplay', 'myContent', 'acl')];

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
            component['files'] = [new EditorFile('myId', 'myDisplay', 'myContent', 'script')];

            component.addQueryFile(mockQueryFile);
            tick();

            mockModal.open.should.not.have.been.called;
        }));

        it('should call processQueryFileAddition if no existing rules present', fakeAsync(() => {
            let mockProcessQuery = sinon.stub(component, 'processQueryFileAddition');
            component['files'] = [new EditorFile('myId', 'myDisplay', 'myContent', 'script')];

            component.addQueryFile(mockQueryFile);
            tick();

            mockModal.open.should.not.have.been.called;
            mockProcessQuery.should.have.been.calledWith(mockQueryFile);
        }));

        it('should open confirm modal if query file present and handle error', fakeAsync(() => {
            let mockProcessQuery = sinon.stub(component, 'processQueryFileAddition');
            component['files'] = [new EditorFile('myId', 'myDisplay', 'myContent', 'query')];

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
            component['files'] = [new EditorFile('myId', 'myDisplay', 'myContent', 'query')];

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
            component['files'] = [new EditorFile('myId', 'myDisplay', 'myContent', 'query')];

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
            let editorFilesValidateStub = sinon.stub(component, 'editorFilesValidate').returns(true);
            let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');
            mockFileService.getEditorFiles.returns(['myFile']);

            let file = new EditorFile('myId', 'myDisplayID', 'myContent', 'acl');

            mockFileService.addFile.returns(file);
            mockFileService.validateFile.returns(null);

            component.processRuleFileAddition(mockRuleFile);

            mockFileService.updateBusinessNetwork.should.have.been.calledWith('myId', file);
            editorFilesValidateStub.should.have.been.called;
            component['files'].should.deep.equal(['myFile']);
            component['noError'].should.equal(true);
        });

        it('should not update business network if not valid', () => {
            let editorFilesValidateStub = sinon.stub(component, 'editorFilesValidate').returns(false);
            let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');
            mockFileService.getEditorFiles.returns(['myFile']);
            let mockFindIndex = sinon.stub(component, 'findFileIndex');
            mockFindIndex.returns(7);

            let file = new EditorFile('myId', 'myDisplayID', 'myContent', 'acl');

            mockFileService.addFile.returns(file);
            mockFileService.validateFile.returns('error');

            component.processRuleFileAddition(mockRuleFile);

            mockFileService.updateBusinessNetwork.should.not.have.been.called;
            editorFilesValidateStub.should.have.been.called;
            component['files'].should.deep.equal(['myFile']);
            component['noError'].should.equal(false);
        });
    });

    describe('processQueryFileAddition', () => {

        it('should set the queryFile as that passed in', () => {
            let editorFilesValidateStub = sinon.stub(component, 'editorFilesValidate').returns(true);
            let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');
            mockFileService.getEditorFiles.returns(['myFile']);

            let file = new EditorFile('myId', 'myDisplayID', 'myContent', 'query');

            mockFileService.addFile.returns(file);
            mockFileService.validateFile.returns(null);

            component.processQueryFileAddition(mockQueryFile);

            mockFileService.updateBusinessNetwork.should.have.been.calledWith('myId', file);
            editorFilesValidateStub.should.have.been.called;
            component['files'].should.deep.equal(['myFile']);
            component['noError'].should.equal(true);
        });

        it('should not update business network if not valid', () => {
            let editorFilesValidateStub = sinon.stub(component, 'editorFilesValidate').returns(false);
            let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');
            mockFileService.getEditorFiles.returns(['myFile']);
            let mockFindIndex = sinon.stub(component, 'findFileIndex');
            mockFindIndex.returns(7);

            let file = new EditorFile('myId', 'myDisplayID', 'myContent', 'query');

            mockFileService.addFile.returns(file);
            mockFileService.validateFile.returns('error');

            component.processQueryFileAddition(mockQueryFile);

            mockFileService.updateBusinessNetwork.should.not.have.been.called;
            editorFilesValidateStub.should.have.been.called;
            component['files'].should.deep.equal(['myFile']);
            component['noError'].should.equal(false);
        });
    });

    describe('openImportModal', () => {
        it('should open the import modal', fakeAsync(() => {
            let mockUpdatePackage = sinon.stub(component, 'updatePackageInfo');

            mockFileService.loadFiles.returns([]);

            let finishedImport = new BehaviorSubject<any>(true);

            mockDrawer.open = sinon.stub().returns({
                componentInstance: {
                    finishedSampleImport: finishedImport
                },
                close: sinon.stub()
            });

            component.openImportModal();

            finishedImport.next({deployed: true});

            tick();

            mockUpdatePackage.should.have.been.called;
            mockFileService.loadFiles.should.have.been.called;
        }));

        it('should open the import modal and set file to readme', fakeAsync(() => {
            let mockUpdatePackage = sinon.stub(component, 'updatePackageInfo');
            let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');

            let file = new EditorFile('myId', 'myDisplay', 'myContent', 'readme');

            mockFileService.loadFiles.returns([file]);

            let finishedImport = new BehaviorSubject<any>(true);

            mockDrawer.open = sinon.stub().returns({
                componentInstance: {
                    finishedSampleImport: finishedImport
                },
                close: sinon.stub()
            });

            component.openImportModal();

            finishedImport.next({deployed: true});

            tick();

            mockUpdatePackage.should.have.been.called;
            mockFileService.loadFiles.should.have.been.called;
            mockSetCurrentFile.should.have.been.calledWith(file);
            mockAlertService.successStatus$.next.should.have.been.called;
        }));

        it('should open the import modal and set file to first one if no readme', fakeAsync(() => {
            let mockUpdatePackage = sinon.stub(component, 'updatePackageInfo');
            let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');

            let file = new EditorFile('myId', 'myDisplay', 'myContent', 'model');

            mockFileService.loadFiles.returns([file, new EditorFile('myId', 'myDisplay', 'myContent', 'script')]);

            let finishedImport = new BehaviorSubject<any>(true);

            mockDrawer.open = sinon.stub().returns({
                componentInstance: {
                    finishedSampleImport: finishedImport
                },
                close: sinon.stub()
            });

            component.openImportModal();

            finishedImport.next({deployed: true});

            tick();

            mockUpdatePackage.should.have.been.called;
            mockFileService.loadFiles.should.have.been.called;
            mockSetCurrentFile.should.have.been.calledWith(file);
            mockAlertService.successStatus$.next.should.have.been.called;
        }));

        it('should open the import modal and handle error', fakeAsync(() => {
            let mockUpdatePackage = sinon.stub(component, 'updatePackageInfo');

            let finishedImport = new BehaviorSubject<any>(true);

            let drawerItem = {
                componentInstance: {
                    finishedSampleImport: finishedImport
                },
                close: sinon.stub()
            };
            mockDrawer.open = sinon.stub().returns(drawerItem);

            component.openImportModal();

            finishedImport.next({deployed: false, error: 'some error'});

            tick();

            mockUpdatePackage.should.not.have.been.called;
            mockFileService.loadFiles.should.not.have.been.called;
            drawerItem.close.should.have.been.called;
            mockAlertService.errorStatus$.next.should.have.been.calledWith('some error');
        }));

        it('should open the import modal and handle cancel', fakeAsync(() => {
            let mockUpdatePackage = sinon.stub(component, 'updatePackageInfo');

            let finishedImport = new BehaviorSubject<any>(true);

            let drawerItem = {
                componentInstance: {
                    finishedSampleImport: finishedImport
                },
                close: sinon.stub()
            };
            mockDrawer.open = sinon.stub().returns(drawerItem);

            component.openImportModal();

            finishedImport.next({deployed: false});

            tick();

            mockUpdatePackage.should.not.have.been.called;
            mockFileService.loadFiles.should.not.have.been.called;
            drawerItem.close.should.have.been.called;
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
            let testFile = new Blob(['test'], {type: 'application/octet-stream'});
            let testFilename: string = 'my_business_name.bna';

            mockFileService.getBusinessNetwork.returns({
                toArchive: sinon.stub().returns(Promise.resolve('my_data'))
            });

            mockFileService.getBusinessNetworkName.returns('my_business_name');

            component.exportBNA();

            fixture.whenStable().then(() => {
                mockSave.should.have.been.called;

                let passedFile = mockSave.getCall(0).args[0];
                passedFile.type.should.equal(testFile.type);

                let passedFilename = mockSave.getCall(0).args[1];
                passedFilename.should.equal(testFilename);
                done();
            });
        });

        it('should export file with correct data', () => {

            let mockFile = sinon.stub(window, 'Blob');
            mockFile.returns(new Blob(['test'], {type: 'application/octet-stream'}));

            mockFileService.getBusinessNetwork.returns({
                toArchive: sinon.stub().returns(Promise.resolve('my_data'))
            });

            mockFileService.getBusinessNetworkName.returns('my_business_name');

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

            mockFileService.businessNetworkChanged$ = {
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
            mockFileService.businessNetworkChanged$.next.should.have.been.calledWith(true);
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
            mockFileService.businessNetworkChanged$.next.should.have.been.calledWith(true);
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
            mockFileService.businessNetworkChanged$.next.should.have.been.calledWith(true);
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
            mockFileService.businessNetworkChanged$.next.should.have.been.calledWith(true);
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
            mockFileService.businessNetworkChanged$.next.should.have.been.calledWith(true);
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
            mockFileService.businessNetworkChanged$.next.should.not.have.been.called;
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
            mockFileService.businessNetworkChanged$.next.should.not.have.been.called;
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
            mockFileService.businessNetworkChanged$.next.should.not.have.been.called;
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
            component['currentFile'] = new EditorFile('1', '1', 'this is the model', 'model');
            component['editActive'] = false;

            component.toggleEditActive();

            component['editActive'].should.equal(true);
        });

        it('should make edit package fields visible when true for README', () => {
            component['editActive'] = false;
            component['editingPackage'] = false;
            component['deployedPackageVersion'] = '1.0.0';

            mockFileService.getMetaData.returns({name: 'package'});

            // Specify README file
            let file = new EditorFile('readme', 'README.md', 'this is the readme', 'readme');
            component.setCurrentFile(file);

            fixture.detectChanges();

            // Expect to see "description" visible within class="business-network-details"
            // Expect to have "edit" option available within class="business-network-details"
            let element = fixture.debugElement.query(By.css('.business-network-details')).nativeElement;
            element.innerHTML.should.contain('id="editFileButton"');

            // Flip editActive boolean
            component.toggleEditActive();
            fixture.detectChanges();

            // Should show the package json
            element = fixture.debugElement.query(By.css('.business-network-details')).nativeElement;
            element.innerHTML.should.not.contain('id="editFileButton"');
            element.textContent.should.contain('Editing package.json');
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
            let testItem = new EditorFile('1', '1', 'this is the model', 'model');

            let result = component['fileType'](testItem);

            result.should.equal('Model');
        });

        it('should identify script file via parameters', () => {
            let testItem = new EditorFile('1', '1', 'this is the script', 'script');

            let result = component['fileType'](testItem);

            result.should.equal('Script');
        });

        it('should identify ACL file via parameters', () => {
            let testItem = new EditorFile('1', '1', 'this is the acl', 'acl');

            let result = component['fileType'](testItem);

            result.should.equal('ACL');
        });

        it('should identify Query file via parameters', () => {
            let testItem = new EditorFile('1', '1', 'this is the query', 'query');

            let result = component['fileType'](testItem);

            result.should.equal('Query');
        });

        it('should identify unknown file via parameters as README', () => {
            let testItem = new EditorFile('1', '1', 'this is the octopus', 'octopus');

            let result = component['fileType'](testItem);

            result.should.equal('Readme');
        });
    });

    describe('editorFilesValidate', () => {

        beforeEach(() => {
            mockFileService.validateFile.returns(null);
            mockFileService.getModelFile.returns({getDefinitions: sinon.stub().returns({})});
            mockFileService.getScriptFile.returns({getContents: sinon.stub().returns({})});
            mockFileService.getAclFile.returns({getDefinitions: sinon.stub().returns({})});
            mockFileService.getQueryFile.returns({getDefinitions: sinon.stub().returns({})});
        });

        it('should validate model files', () => {
            let fileArray = [];
            fileArray.push(new EditorFile('myId', 'myDisplayID', 'myContent', 'model'));
            component['files'] = fileArray;

            let result = component['editorFilesValidate']();

            mockFileService.validateFile.should.have.been.calledWith('myId', 'model');
            mockFileService.updateBusinessNetwork.should.have.been.calledOnce;
            result.should.equal(true);
        });

        it('should validate script files', () => {
            let fileArray = [];
            fileArray.push(new EditorFile('myId', 'myDisplayID', 'myContent', 'script'));
            component['files'] = fileArray;

            let result = component['editorFilesValidate']();

            mockFileService.validateFile.should.have.been.calledWith('myId', 'script');
            mockFileService.updateBusinessNetwork.should.have.been.calledOnce;
            result.should.equal(true);
        });

        it('should validate acl files', () => {
            let fileArray = [];
            fileArray.push(new EditorFile('myId', 'myDisplayID', 'myContent', 'acl'));
            component['files'] = fileArray;

            let result = component['editorFilesValidate']();

            mockFileService.validateFile.should.have.been.calledWith('myId', 'acl');
            mockFileService.updateBusinessNetwork.should.have.been.calledOnce;
            result.should.equal(true);
        });

        it('should validate query files', () => {
            let fileArray = [];
            fileArray.push(new EditorFile('myId', 'myDisplayID', 'myContent', 'query'));
            component['files'] = fileArray;

            let result = component['editorFilesValidate']();

            mockFileService.validateFile.should.have.been.calledWith('myId', 'query');
            mockFileService.updateBusinessNetwork.should.have.been.calledOnce;
            result.should.equal(true);
        });

        it('should validate package files', () => {
            let fileArray = [];
            fileArray.push(new EditorFile('myId', 'myDisplayID', 'myContent', 'package'));
            component['files'] = fileArray;

            let result = component['editorFilesValidate']();

            mockFileService.validateFile.should.have.been.calledWith('package', 'package');
            result.should.equal(true);
        });

        it('should fail to validate package files', () => {
            let fileArray = [];
            fileArray.push(new EditorFile('myId', 'myDisplayID', 'myContent', 'package'));
            component['files'] = fileArray;

            mockFileService.validateFile.returns('error');

            let result = component['editorFilesValidate']();

            mockFileService.validateFile.should.have.been.calledWith('package', 'package');
            result.should.equal(false);
        });

        it('should fail validation for invalid model files', () => {
            let fileArray = [];
            fileArray.push(new EditorFile('myId', 'myDisplayID', 'myContent', 'model'));
            component['files'] = fileArray;

            mockFileService.validateFile.returns('error');

            let result = component['editorFilesValidate']();
            mockFileService.updateBusinessNetwork.should.not.have.been.called;
            result.should.equal(false);
        });

        it('should fail validation for invalid acl files', () => {
            let fileArray = [];
            fileArray.push(new EditorFile('myId', 'myDisplayID', 'myContent', 'acl'));
            component['files'] = fileArray;

            mockFileService.validateFile.returns('error');

            let result = component['editorFilesValidate']();
            mockFileService.updateBusinessNetwork.should.not.have.been.called;
            result.should.equal(false);
        });

        it('should fail validation for invalid script files', () => {
            let fileArray = [];
            fileArray.push(new EditorFile('myId', 'myDisplayID', 'myContent', 'script'));
            component['files'] = fileArray;

            mockFileService.validateFile.returns('error');

            let result = component['editorFilesValidate']();
            mockFileService.updateBusinessNetwork.should.not.have.been.called;
            result.should.equal(false);
        });

        it('should fail validation for invalid query files', () => {
            let fileArray = [];
            fileArray.push(new EditorFile('myId', 'myDisplayID', 'myContent', 'query'));
            component['files'] = fileArray;

            mockFileService.validateFile.returns('error');

            let result = component['editorFilesValidate']();
            mockFileService.updateBusinessNetwork.should.not.have.been.called;
            result.should.equal(false);
        });

        it('should fail validation for multiple invalid files', () => {
            let fileArray = [];
            fileArray.push(new EditorFile('myIdScript', 'myDisplayIDScript', 'myContent', 'script'));
            fileArray.push(new EditorFile('myIdAcl', 'myDisplayIDAcl', 'myContent', 'acl'));
            component['files'] = fileArray;

            mockFileService.validateFile.returns('error');

            let result = component['editorFilesValidate']();
            mockFileService.updateBusinessNetwork.should.not.have.been.called;
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

            let queryManagerMock = {
                deleteQueryFile: sinon.stub()
            };

            mockFileService.getBusinessNetwork.returns({
                getScriptManager: sinon.stub().returns(scriptManagerMock),
                getModelManager: sinon.stub().returns(modelManagerMock),
                getQueryManager: sinon.stub().returns(queryManagerMock)
            });

            // Create file array of length 6
            let fileArray = [];
            fileArray.push(new EditorFile('acl', 'myDisplayAcl', 'myContent', 'acl'));
            fileArray.push(new EditorFile('script0', 'myDisplayIDScript0', 'myContent', 'script'));
            fileArray.push(new EditorFile('script1', 'myDisplayIDScript1', 'myContent', 'script'));
            fileArray.push(new EditorFile('model', 'myDisplayIDModel', 'myContent', 'model'));
            fileArray.push(new EditorFile('script2', 'myDisplayIDScript2', 'myContent', 'script'));
            fileArray.push(new EditorFile('query', 'myDisplayID', 'myContent', 'query'));
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
            validateMock.should.not.have.been.called;
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
            validateMock.should.not.have.been.called;
        }));

        it('should delete the correct script file', fakeAsync(() => {
            component['currentFile'] = component['files'][2];
            let mockSetIntialFile = sinon.stub(component, 'setInitialFile');

            mockFileService.getEditorFiles.returns(['myFile']);

            component.openDeleteFileModal();
            tick();

            // Check services called
            component['noError'].should.equal(true);
            mockAlertService.successStatus$.next.should.have.been.called;

            // Check initial file set
            mockSetIntialFile.should.have.been.called;

            component['files'].should.deep.equal(['myFile']);
        }));

        it('should delete the correct model file', fakeAsync(() => {

            component['currentFile'] = component['files'][3];
            let mockSetIntialFile = sinon.stub(component, 'setInitialFile');

            mockFileService.getEditorFiles.returns(['myFile']);

            component.openDeleteFileModal();
            tick();

            // Check initial file set
            mockSetIntialFile.should.have.been.called;

            // Check services called
            component['noError'].should.equal(true);
            mockAlertService.successStatus$.next.should.have.been.called;

            component['files'].should.deep.equal(['myFile']);
        }));

        it('should delete the query file', fakeAsync(() => {

            component['currentFile'] = component['files'][5];
            let mockSetIntialFile = sinon.stub(component, 'setInitialFile');
            mockFileService.getEditorFiles.returns(['myFile']);

            component.openDeleteFileModal();
            tick();

            // Check initial file set
            mockSetIntialFile.should.have.been.called;

            // Check services called
            component['noError'].should.equal(true);
            mockAlertService.successStatus$.next.should.have.been.called;

            component['files'].should.deep.equal(['myFile']);
        }));

        it('should only enable deletion of model or script files', fakeAsync(() => {

            // should not be able to delete an acl file
            component['currentFile'] = component['files'][0];

            component.openDeleteFileModal();
            tick();

            // Check services called
            validateMock.should.not.have.been.called;
            mockAlertService.errorStatus$.next.should.have.been.called;

            // check no files removed
            let currentFiles = component['files'];
            // should have only deleted one
            currentFiles.length.should.equal(6);
        }));

        it('should set viewed file to existing item in file list', fakeAsync(() => {
            component['currentFile'] = component['files'][2];

            component.openDeleteFileModal();
            tick();

            let currentFile = component['currentFile'];
            currentFile.displayID.should.equal('myDisplayIDScript1');
        }));

        it('should disable the deploy button if remaining files are invalid', fakeAsync(() => {
            validateMock.returns(false);
            let mockSetIntialFile = sinon.stub(component, 'setInitialFile');

            component['currentFile'] = component['files'][3];

            component.openDeleteFileModal();
            tick();

            // Check services called
            component['noError'].should.equal(false);
            mockAlertService.successStatus$.next.should.have.been.called;
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
            component['currentFile'] = new EditorFile('1', '1', 'this is the acl', 'acl');

            component['editFileName']();
            component['fileNameError'].should.be.equal('Error: Unable to process rename on current file type');
        });

        it('should prevent edit of readme file', () => {
            // Attempt edit of README
            component['inputFileNameArray'] = ['', 'README', '.md'];
            component['currentFile'] = new EditorFile('1', '1', 'this is the readme', 'readme');

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
            component['currentFile'] = new EditorFile('myScriptFile.js', 'myScriptFile.js', 'this is the script', 'script');

            component['files'] = [{id: 'muchRandom'},
                {id: 'myScriptFile.js'},
                {id: 'oldNameID'}];

            component['editFileName']();
        });

        it('should not rename model file if name unchanged', () => {
            // Attempt edit of model
            component['inputFileNameArray'] = ['', 'myModelFile', '.cto'];
            component['currentFile'] = new EditorFile('myModelFile.cto', 'myModelFile.cto', 'this is the model', 'model');

            component['files'] = [{displayID: 'muchRandom'},
                {displayID: 'myModelFile.cto'},
                {displayID: 'oldNameID'}];

            component['editFileName']();
        });

        it('should enable script file rename by replacing script', () => {
            let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');
            let mockFindIndex = sinon.stub(component, 'findFileIndex');
            mockFindIndex.onCall(0).returns(-1);
            mockFindIndex.onCall(1).returns(2);

            mockFileService.getScriptFile.returns({
                getContents: sinon.stub().returns('my script content')
            });

            component['inputFileNameArray'] = ['', 'myNewScriptFile', '.js'];
            component['currentFile'] = new EditorFile('myCurrentScriptFile.js', 'myCurrentScriptFile.js', 'my script content', 'script');

            component['files'] = [{id: 'muchRandom'},
                {id: 'myCurrentScriptFile.js'},
                {id: 'otherScriptFile.js'},
                {id: 'oldNameID'}];

            let file = new EditorFile('myId', 'myDisplay', 'myContent', 'script');

            mockFileService.replaceFile.returns(file);

            // Call Method
            component['editFileName']();

            mockFileService.replaceFile.should.have.been.calledWith('myCurrentScriptFile.js', 'myNewScriptFile.js', 'my script content', 'script');
            mockFileService.getEditorFiles.should.have.been.called;
            mockSetCurrentFile.should.have.been.calledWith(file);
        });

        it('should enable model file rename by editing filename', () => {
            let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');
            let mockFindIndex = sinon.stub(component, 'findFileIndex');
            mockFindIndex.onCall(0).returns(-1);
            mockFindIndex.onCall(1).returns(2);

            mockFileService.getModelFile.returns({
                getDefinitions: sinon.stub().returns('My ModelFile content')
            });
            component['inputFileNameArray'] = ['', 'myNewModelFile', '.cto'];
            component['currentFile'] = new EditorFile('myCurrentFile.cto', 'myCurrentFile.cto', 'My ModelFile content', 'model');

            component['files'] = [{id: 'muchRandom'},
                {displayID: 'myCurrentModelFile.cto'},
                {displayID: 'otherModelFile.cto'},
                {id: 'oldNameID'}];

            let file = new EditorFile('myId', 'myDisplay', 'myContent', 'model');
            mockFileService.replaceFile.returns(file);

            // Call Method
            component['editFileName']();

            mockFileService.replaceFile.should.have.been.calledWith('myCurrentFile.cto', 'myNewModelFile.cto', 'My ModelFile content', 'model');
            mockFileService.getEditorFiles.should.have.been.called;
            mockSetCurrentFile.should.have.been.calledWith(file);
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
            let testFile = new EditorFile('1', '1', 'this is the acl', 'acl');

            let response = component.preventNameEdit(testFile);

            response.should.be.true;
        });

        it('should prevent name edit of query', () => {
            let testFile = new EditorFile('1', '1', 'this is the query', 'query');

            let response = component.preventNameEdit(testFile);

            response.should.be.true;
        });

        it('should permit name edit of unknown', () => {
            let testFile = new EditorFile('1', '1', 'this is the octopus', 'octopus');

            let response = component.preventNameEdit(testFile);

            response.should.be.false;
        });

        it('should permit name edit of model', () => {
            let testFile = new EditorFile('1', '1', 'this is the model', 'model');

            let response = component.preventNameEdit(testFile);

            response.should.be.false;
        });

        it('should permit name edit of script', () => {
            let testFile = new EditorFile('1', '1', 'this is the script', 'script');

            let response = component.preventNameEdit(testFile);

            response.should.be.false;
        });
    });

    describe('setReadmePreview', () => {

        it('should set the read me', () => {
            component.setReadmePreview(true);
            component['previewReadme'].should.equal(true);
        });
    });
});
