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
import { ComponentFixture, TestBed, fakeAsync, tick, inject } from '@angular/core/testing';
import { Directive, Input, Component, Pipe, PipeTransform } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { EditorComponent } from './editor.component';

import { AdminService } from '../services/admin.service';
import { ClientService } from '../services/client.service';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { AlertService } from '../basic-modals/alert.service';
import { BusinessNetworkDefinition, ModelFile, Script, AclFile, QueryFile, IdCard } from 'composer-common';
import { EditorFile } from '../services/editor-file';
import { ScrollToElementDirective } from '../directives/scroll/scroll-to-element.directive';
import { FileService } from '../services/file.service';

import * as sinon from 'sinon';
import * as chai from 'chai';

import 'rxjs/add/operator/takeWhile';
import * as fileSaver from 'file-saver';
import { DrawerService } from '../common/drawer';
import { SampleBusinessNetworkService } from '../services/samplebusinessnetwork.service';
import { IdentityCardService } from '../services/identity-card.service';
import { LocalStorageService } from 'angular-2-local-storage';

import {
    HttpModule,
} from '@angular/http';

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

@Pipe({
    name: 'editorFilesFilter'
})
class MockEditorFilesPipe implements PipeTransform {
    transform() {
        return;
    }
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
    let mockLocalStorage;

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
        mockLocalStorage = sinon.createStubInstance(LocalStorageService);

        mockFileService.getQueryFile.returns(mockQueryFile);

        mockAlertService.successStatus$ = {next: sinon.stub()};
        mockAlertService.busyStatus$ = {next: sinon.stub()};
        mockAlertService.errorStatus$ = {next: sinon.stub()};

        TestBed.configureTestingModule({
            imports: [FormsModule, HttpModule],
            declarations: [EditorComponent, MockEditorFileDirective, MockPerfectScrollBarDirective, ScrollToElementDirective, MockFooterComponent, MockEditorFilesPipe],
            providers: [
                {provide: AdminService, useValue: mockAdminService},
                {provide: ClientService, useValue: mockClientService},
                {provide: NgbModal, useValue: mockModal},
                {provide: AlertService, useValue: mockAlertService},
                {provide: FileService, useValue: mockFileService},
                {provide: DrawerService, useValue: mockDrawer},
                {provide: LocalStorageService, useValue: mockLocalStorage},
                SampleBusinessNetworkService,
                IdentityCardService
            ]
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
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');

            mockFileService.getEditorFiles.returns([]);
            mockFileService.getCurrentFile.returns(null);
            component.ngOnInit();

            tick();

            component['noError'].should.equal(true);

            mockUpdatePackage.should.have.been.called;
            mockSetFile.should.not.have.been.called;
            mockUpdateFiles.should.have.been.called;
            mockFileService.loadFiles.should.have.been.called;
        }));

        it('should re-initialize the editor', fakeAsync(() => {
            let mockUpdatePackage = sinon.stub(component, 'updatePackageInfo');
            let mockSetFile = sinon.stub(component, 'setCurrentFile');
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');

            mockFileService.getEditorFiles.returns(['myFile']);
            mockFileService.getCurrentFile.returns('myFile');

            component.ngOnInit();

            tick();

            component['noError'].should.equal(true);

            mockUpdatePackage.should.have.been.called;
            mockUpdateFiles.should.have.been.called;
            mockFileService.getEditorFiles.should.have.been.calledOnce;
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

    describe('checkCanDeploy', () => {
        it('should check that the current business network can be deployed', inject([IdentityCardService], (service: IdentityCardService) => {
            sinon.stub(service, 'getCurrentIdentityCard').returns({
                getConnectionProfile: sinon.stub()
            });
            sinon.stub(service, 'getQualifiedProfileName').returns('myProfile');
            let canDeployStub = sinon.stub(service, 'canDeploy').returns(true);

            component.checkCanDeploy();

            canDeployStub.should.have.been.calledWith('myProfile');
        }));
    });

    describe('updatePackageInfo', () => {
        it('should set the package info', () => {
            mockFileService.getBusinessNetworkVersion.returns('my new version');
            mockClientService.getDeployedBusinessNetworkVersion.returns('my version');
            mockClientService.getBusinessNetwork.returns({
                getName: sinon.stub().returns('my name')
            });

            component.updatePackageInfo();
            component['deployedPackageVersion'].should.equal('my version');
            component['inputPackageVersion'].should.equal('my new version');
        });

        it('should set the package info and automatically bump the new package version', () => {
            mockFileService.getBusinessNetworkVersion.onCall(0).returns('my version');
            mockFileService.getBusinessNetworkVersion.onCall(1).returns('my new version');
            mockClientService.getDeployedBusinessNetworkVersion.returns('my version');
            mockClientService.getBusinessNetwork.returns({
                getName: sinon.stub().returns('my name')
            });

            component.updatePackageInfo();
            component['deployedPackageVersion'].should.equal('my version');
            component['inputPackageVersion'].should.equal('my new version');
            mockFileService.incrementBusinessNetworkVersion.should.have.been.called;
        });

        it('should do nothing if the file service is unavailable', () => {
            component['fileService'] = null;

            component.updatePackageInfo();

            component['deployedPackageVersion'].should.equal('');
            component['inputPackageVersion'].should.equal('');
        });
    });

    describe('setCurrentFile', () => {

        it('should set current file', () => {
            component['currentFile'] = new EditorFile('oldID', 'oldFile', 'myContent', 'model');
            let file = new EditorFile('newID', 'newFile', 'myContent', 'model');
            component.setCurrentFile(file);
            component['currentFile'].should.deep.equal(file);
        });

        it('should not update package if current file is not package file', () => {
            component['currentFile'] = new EditorFile('oldID', 'oldFile', 'myContent', 'model');

            let mockUpdatePackage = sinon.stub(component, 'updatePackageInfo');

            let file = new EditorFile('newID', 'newFile', 'myContent', 'model');
            component.setCurrentFile(file);
            component['currentFile'].should.deep.equal(file);

            mockUpdatePackage.should.not.have.been.called;
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
        let readmeFile;
        let packageFile;
        let aclFile;
        let modelFile;
        let scriptFile;
        let queryFile;
        let mockSetCurrentFile;

        beforeEach(() => {
            readmeFile = new EditorFile('readme', 'myReadmeID', 'myReadmeContent', 'readme');
            packageFile = new EditorFile('package', 'myPackageID', 'myPackageContent', 'package');
            aclFile = new EditorFile('acl', 'myDisplayAcl', 'myContent', 'acl');
            modelFile = new EditorFile('model', 'myDisplayIDModel', 'myContent', 'model');
            scriptFile = new EditorFile('script', 'myDisplayIDScript', 'myContent', 'script');
            queryFile = new EditorFile('query', 'myDisplayID', 'myContent', 'query');

            mockFileService.getEditorFiles.returns([readmeFile, packageFile, modelFile, scriptFile, aclFile, queryFile]);

            mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');
        });

        it('should update the files, and not include system model files', () => {
            component.updateFiles();
            component['files'].should.deep.equal([readmeFile, packageFile, modelFile, scriptFile, aclFile, queryFile]);
        });

        it('should set the current file to a specific file', () => {
            component.updateFiles(aclFile);
            mockSetCurrentFile.should.have.been.calledWith(aclFile);
        });

        it('should set the current file to the current file from the file service', () => {
            mockFileService.getCurrentFile.returns(modelFile);
            component.updateFiles();
            mockSetCurrentFile.should.have.been.calledWith(modelFile);
        });

        it('should set the current file to the readme if there is one', () => {
            component.updateFiles();
            mockSetCurrentFile.should.have.been.calledWith(readmeFile);
        });

        it('should set the current file to the first non-package file if there is no readme', () => {
            mockFileService.getEditorFiles.returns([packageFile, modelFile, scriptFile, aclFile, queryFile]);
            component.updateFiles();
            mockSetCurrentFile.should.have.been.calledWith(modelFile);
        });

        it('should not set the current file if there is nothing suitable', () => {
            mockFileService.getEditorFiles.returns([packageFile]);
            component.updateFiles();
            mockSetCurrentFile.should.not.have.been.called;
        });
    });

    describe('addModelFile', () => {
        it('should add a model file', () => {
            let mockEditorFilesValidateStub = sinon.stub(component, 'editorFilesValidate').returns(true);
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');

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

            mockUpdateFiles.should.have.been.calledWith(file);
            mockEditorFilesValidateStub.should.have.been.called;
            component['noError'].should.equal(true);
        });

        it('should add a model file with contents', () => {
            let mockEditorFilesValidateStub = sinon.stub(component, 'editorFilesValidate').returns(true);
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');

            component['files'] = [{id: 'random'}, {id: 'namespace0'}];

            mockModelFile.getNamespace.returns('namespace0');

            let file = new EditorFile('myId', 'myDisplayID', 'myContent', 'model');

            mockFileService.addFile.returns(file);

            component.addModelFile({namespace: 'namespace', fileName: 'myFile', definitions: 'myCode'});

            mockFileService.addFile.should.have.been.calledWith('namespace', 'myFile', 'myCode', 'model');

            mockUpdateFiles.should.have.been.calledWith(file);
            mockEditorFilesValidateStub.should.have.been.called;
            component['noError'].should.equal(true);
        });

        it('should add a model file with contents that doesn\'t validate', () => {
            let mockEditorFilesValidateStub = sinon.stub(component, 'editorFilesValidate').returns(false);
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');

            component['files'] = [{id: 'random'}, {id: 'namespace0'}];

            mockModelFile.getNamespace.returns('namespace0');

            let file = new EditorFile('myId', 'myDisplayID', 'myContent', 'model');

            mockFileService.addFile.returns(file);

            mockFileService.validateFile.returns('error');

            component.addModelFile({namespace: 'namespace', fileName: 'myFile', definitions: 'myCode'});

            mockFileService.addFile.should.have.been.calledWith('namespace', 'myFile', 'myCode', 'model');

            mockFileService.updateBusinessNetworkFile.should.not.have.been.called;

            mockUpdateFiles.should.have.been.calledWith(file);
            mockEditorFilesValidateStub.should.have.been.called;
            component['noError'].should.equal(false);
        });
    });

    describe('addScriptFile', () => {
        it('should create and add a script file', () => {
            let mockEditorFilesValidateStub = sinon.stub(component, 'editorFilesValidate').returns(true);
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');

            mockScriptFile.getIdentifier.returns('script');
            mockScriptFile.id = 'script';
            component['files'] = [mockScriptFile];

            let file = new EditorFile('myId', 'myDisplayID', 'myContent', 'script');

            mockFileService.addFile.returns(file);

            component.addScriptFile();

            mockUpdateFiles.should.have.been.calledWith(file);
            mockEditorFilesValidateStub.should.have.been.called;

            component['noError'].should.equal(true);
        });

        it('should create and add a script file with an incremented name', () => {
            let mockEditorFilesValidateStub = sinon.stub(component, 'editorFilesValidate').returns(true);
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');

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

            mockUpdateFiles.should.have.been.calledWith(file);
            mockEditorFilesValidateStub.should.have.been.called;

            component['noError'].should.equal(true);
        });

        it('should add a script file with content', () => {
            let mockEditorFilesValidateStub = sinon.stub(component, 'editorFilesValidate').returns(true);
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');

            component['addScriptFileName'] = 'script';
            component['files'] = [{id: 'random'}, {id: 'script'}];

            let file = new EditorFile('myId', 'myDisplayID', 'myContent', 'script');

            mockFileService.addFile.returns(file);

            component.addScriptFile(mockScriptFile);

            mockUpdateFiles.should.have.been.calledWith(file);
            mockEditorFilesValidateStub.should.have.been.called;

            component['noError'].should.equal(true);
        });

        it('should add a script file with content with increment file name', () => {
            let mockEditorFilesValidateStub = sinon.stub(component, 'editorFilesValidate').returns(true);
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');

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

            mockUpdateFiles.should.have.been.calledWith(file);
            mockEditorFilesValidateStub.should.have.been.called;

            component['noError'].should.equal(true);
        });

        it('should add a script file with content and not validate', () => {
            let mockEditorFilesValidateStub = sinon.stub(component, 'editorFilesValidate').returns(false);
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');

            component['addScriptFileName'] = 'script';
            component['files'] = [{id: 'random'}, {id: 'script'}];

            let file = new EditorFile('myId', 'myDisplayID', 'myContent', 'script');

            mockFileService.addFile.returns(file);

            mockFileService.validateFile.returns('error');

            component.addScriptFile(mockScriptFile);

            mockUpdateFiles.should.have.been.calledWith(file);
            mockEditorFilesValidateStub.should.have.been.called;

            mockFileService.updateBusinessNetworkFile.should.not.have.been.called;
            component['noError'].should.equal(false);
        });
    });

    describe('addReadme', () => {
        it('should not open confirm modal if no readme present', fakeAsync(() => {
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');
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
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');

            let files = [new EditorFile('myId', 'myDisplay', 'myContent', 'script')];
            component['files'] = files;

            mockFileService.getEditorFiles.returns(files);

            let b = new Blob(['/**README File*/'], {type: 'text/plain'});
            let mockReadmeFile = new File([b], 'readme.md');

            component.addReadme(mockReadmeFile);

            tick();

            mockFileService.setBusinessNetworkReadme.should.have.been.calledWith(mockReadmeFile);
            mockUpdateFiles.should.have.been.calledWith(mockReadmeFile);
        }));

        it('should open confirm modal if readme present and handle error', fakeAsync(() => {
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');
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
            mockUpdateFiles.should.not.have.been.called;
        }));

        it('should handle confirm modal cancel', fakeAsync(() => {
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');
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
            mockUpdateFiles.should.not.have.been.called;
        }));

        it('should create readme on modal confirm', fakeAsync(() => {
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');
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
            mockUpdateFiles.should.have.been.calledWith(files[0]);
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
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');

            let file = new EditorFile('myId', 'myDisplayID', 'myContent', 'acl');

            mockFileService.addFile.returns(file);
            mockFileService.validateFile.returns(null);

            component.processRuleFileAddition(mockRuleFile);

            mockFileService.updateBusinessNetwork.should.have.been.calledWith('myId', file);
            editorFilesValidateStub.should.have.been.called;
            mockUpdateFiles.should.have.been.calledWith(file);
            component['noError'].should.equal(true);
        });

        it('should not update business network if not valid', () => {
            let editorFilesValidateStub = sinon.stub(component, 'editorFilesValidate').returns(false);
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');
            let mockFindIndex = sinon.stub(component, 'findFileIndex');
            mockFindIndex.returns(7);

            let file = new EditorFile('myId', 'myDisplayID', 'myContent', 'acl');

            mockFileService.addFile.returns(file);
            mockFileService.validateFile.returns('error');

            component.processRuleFileAddition(mockRuleFile);

            mockFileService.updateBusinessNetwork.should.not.have.been.called;
            editorFilesValidateStub.should.have.been.called;
            mockUpdateFiles.should.have.been.calledWith(file);
            component['noError'].should.equal(false);
        });
    });

    describe('processQueryFileAddition', () => {

        it('should set the queryFile as that passed in', () => {
            let editorFilesValidateStub = sinon.stub(component, 'editorFilesValidate').returns(true);
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');

            let file = new EditorFile('myId', 'myDisplayID', 'myContent', 'query');

            mockFileService.addFile.returns(file);
            mockFileService.validateFile.returns(null);

            component.processQueryFileAddition(mockQueryFile);

            mockFileService.updateBusinessNetwork.should.have.been.calledWith('myId', file);
            editorFilesValidateStub.should.have.been.called;
            mockUpdateFiles.should.have.been.calledWith(file);
            component['noError'].should.equal(true);
        });

        it('should not update business network if not valid', () => {
            let editorFilesValidateStub = sinon.stub(component, 'editorFilesValidate').returns(false);
            let mockUpdateFiles = sinon.stub(component, 'updateFiles');
            let mockFindIndex = sinon.stub(component, 'findFileIndex');
            mockFindIndex.returns(7);

            let file = new EditorFile('myId', 'myDisplayID', 'myContent', 'query');

            mockFileService.addFile.returns(file);
            mockFileService.validateFile.returns('error');

            component.processQueryFileAddition(mockQueryFile);

            mockFileService.updateBusinessNetwork.should.not.have.been.called;
            editorFilesValidateStub.should.have.been.called;
            mockUpdateFiles.should.have.been.calledWith(file);
            component['noError'].should.equal(false);
        });
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

        let peerCard: IdCard;
        let channelCard: IdCard;
        let idCard: IdCard;
        let businessNetworkDef: BusinessNetworkDefinition;

        beforeEach(fakeAsync(inject([IdentityCardService], (service: IdentityCardService) => {
            mockUpdatePackage = sinon.stub(component, 'updatePackageInfo');
            mockUpdateFiles = sinon.stub(component, 'updateFiles');
            mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');
            businessNetworkDef = new BusinessNetworkDefinition('test-network@1.0.0');
            mockFileService.getBusinessNetwork.returns(businessNetworkDef);

            mockAdminService.connect.returns(Promise.resolve());
            mockAdminService.install.returns(Promise.resolve());
            mockAdminService.importCard.returns(Promise.resolve());

            mockAdminService.hasCard.returns(Promise.resolve(false));

            mockClientService.refresh.returns(Promise.resolve());

            sinon.stub(component, 'ngOnInit').resolves();

            peerCard = new IdCard({userName: 'peer', roles: ['PeerAdmin']}, {'x-type': 'web', 'name': 'myProfile'});
            channelCard = new IdCard({userName: 'channel', roles: ['ChannelAdmin']}, {
                'x-type': 'web',
                'name': 'myProfile'
            });
            idCard = new IdCard({userName: 'banana'}, {'x-type': 'web', 'name': 'myProfile'});

            service.addIdentityCard(idCard, 'myCardRef')
                .then(() => {
                    return service.setCurrentIdentityCard('myCardRef');
                })
                .then(() => {
                    return service.addIdentityCard(peerCard, 'peerRef');
                })
                .then(() => {
                    return service.addIdentityCard(channelCard, 'channelRef');
                });

            tick();

        })));

        afterEach(() => {
            mockUpdateFiles.reset();
            mockUpdatePackage.reset();
        });

        it('should deploy the file using current web profile card', fakeAsync(inject([SampleBusinessNetworkService], (sampleBusinessNetworkService: SampleBusinessNetworkService) => {
            mockFileService.isDirty.returns(true);
            component['canDeploy'] = true;

            fixture.detectChanges();
            tick();

            const upgradeSpy = sinon.spy(sampleBusinessNetworkService, 'upgradeBusinessNetwork');

            component['currentFile'] = 'my file';

            let deployButton = fixture.debugElement.query(By.css('#editor_deploy'));

            deployButton.triggerEventHandler('click', null);

            component['deploying'].should.equal(true);

            tick();

            component['deploying'].should.equal(false);

            mockModal.open.should.not.have.been.called;
            upgradeSpy.should.have.been.calledWith(businessNetworkDef, 'myCardRef', 'myCardRef');
            mockUpdatePackage.should.have.been.called;
            mockUpdateFiles.should.have.been.called;

            mockAlertService.busyStatus$.next.should.have.been.called;
            mockAlertService.successStatus$.next.should.have.been.called;
        })));

        it('should show an error if there is no PeerAdmin or ChannelAdmin card', fakeAsync(inject([SampleBusinessNetworkService], (sampleBusinessNetworkService: SampleBusinessNetworkService) => {
            mockFileService.isDirty.returns(true);
            component['canDeploy'] = true;
            sinon.stub(idCard, 'getConnectionProfile').returns({'x-type': 'hlfv1', 'name': 'myOtherProfile'});

            fixture.detectChanges();
            tick();

            const upgradeSpy = sinon.spy(sampleBusinessNetworkService, 'upgradeBusinessNetwork');

            component['currentFile'] = 'my file';

            let deployButton = fixture.debugElement.query(By.css('#editor_deploy'));

            deployButton.triggerEventHandler('click', null);

            tick();

            component['deploying'].should.equal(false);

            mockModal.open.should.not.have.been.called;
            upgradeSpy.should.not.have.been.called;
            mockUpdatePackage.should.not.have.been.called;
            mockUpdateFiles.should.not.have.been.called;

            mockAlertService.busyStatus$.next.should.not.have.been.called;
            mockAlertService.successStatus$.next.should.not.have.been.called;
            mockAlertService.errorStatus$.next.should.have.been.calledWith(sinon.match(/You must import business network cards with the correct admin rights/));
        })));

        it('should deploy the file using selected fabric profile admin cards', fakeAsync(inject([SampleBusinessNetworkService], (sampleBusinessNetworkService: SampleBusinessNetworkService) => {
            mockFileService.isDirty.returns(true);
            component['canDeploy'] = true;
            sinon.stub(idCard, 'getConnectionProfile').returns({'x-type': 'hlfv1', 'name': 'myProfile'});
            sinon.stub(peerCard, 'getConnectionProfile').returns({'x-type': 'hlfv1', 'name': 'myProfile'});
            sinon.stub(channelCard, 'getConnectionProfile').returns({'x-type': 'hlfv1', 'name': 'myProfile'});
            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.resolve({peerCardRef: 'peerRef', channelCardRef: 'channelRef'})
            });

            fixture.detectChanges();
            tick();

            const upgradeSpy = sinon.spy(sampleBusinessNetworkService, 'upgradeBusinessNetwork');

            component['currentFile'] = 'my file';

            let deployButton = fixture.debugElement.query(By.css('#editor_deploy'));

            deployButton.triggerEventHandler('click', null);

            component['deploying'].should.equal(true);

            tick();

            component['deploying'].should.equal(false);

            mockModal.open.should.have.been.called;
            upgradeSpy.should.have.been.calledWith(businessNetworkDef, 'peerRef', 'channelRef');
            mockUpdatePackage.should.have.been.called;
            mockUpdateFiles.should.have.been.called;

            mockAlertService.busyStatus$.next.should.have.been.called;
            mockAlertService.successStatus$.next.should.have.been.called;
        })));

        it('should\'t deploy if already deploying', fakeAsync(inject([IdentityCardService], (identityCardService: IdentityCardService) => {
            const identitySpy = sinon.spy(identityCardService, 'getCurrentIdentityCard');
            component['deploying'] = true;
            component['canDeploy'] = true;

            mockFileService.isDirty.returns(true);

            fixture.detectChanges();
            tick();

            let deployButton = fixture.debugElement.query(By.css('#editor_deploy'));

            deployButton.triggerEventHandler('click', null);

            identitySpy.should.not.have.been.called;
        })));

        it('should handle error from upgrade modal', fakeAsync(inject([SampleBusinessNetworkService], (sampleBusinessNetworkService: SampleBusinessNetworkService) => {
            component['canDeploy'] = true;
            sinon.stub(idCard, 'getConnectionProfile').returns({'x-type': 'hlfv1', 'name': 'myProfile'});
            sinon.stub(peerCard, 'getConnectionProfile').returns({'x-type': 'hlfv1', 'name': 'myProfile'});
            sinon.stub(channelCard, 'getConnectionProfile').returns({'x-type': 'hlfv1', 'name': 'myProfile'});
            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.reject('some error')
            });

            mockFileService.isDirty.returns(true);

            fixture.detectChanges();

            let deployButton = fixture.debugElement.query(By.css('#editor_deploy'));

            deployButton.triggerEventHandler('click', null);

            tick();

            component['deploying'].should.equal(false);
            mockUpdatePackage.should.have.been.called;
            mockUpdateFiles.should.have.been.called;
            mockAlertService.busyStatus$.next.should.have.been.calledWith(null);
            mockAlertService.errorStatus$.next.should.have.been.calledWith('some error');
        })));

        it('should handle cancel from upgrade modal', fakeAsync(inject([SampleBusinessNetworkService], (sampleBusinessNetworkService: SampleBusinessNetworkService) => {
            component['canDeploy'] = true;
            sinon.stub(idCard, 'getConnectionProfile').returns({'x-type': 'hlfv1', 'name': 'myProfile'});
            sinon.stub(peerCard, 'getConnectionProfile').returns({'x-type': 'hlfv1', 'name': 'myProfile'});
            sinon.stub(channelCard, 'getConnectionProfile').returns({'x-type': 'hlfv1', 'name': 'myProfile'});
            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.reject(null)
            });

            mockFileService.isDirty.returns(true);

            fixture.detectChanges();

            let deployButton = fixture.debugElement.query(By.css('#editor_deploy'));

            deployButton.triggerEventHandler('click', null);

            tick();

            component['deploying'].should.equal(false);
            mockUpdatePackage.should.not.have.been.called;
            mockUpdateFiles.should.not.have.been.called;
            mockAlertService.busyStatus$.next.should.not.have.been.called;
            mockAlertService.errorStatus$.next.should.not.have.been.called;
        })));

        it('should handle ESC from upgrade modal', fakeAsync(inject([SampleBusinessNetworkService], (sampleBusinessNetworkService: SampleBusinessNetworkService) => {
            component['canDeploy'] = true;
            sinon.stub(idCard, 'getConnectionProfile').returns({'x-type': 'hlfv1', 'name': 'myProfile'});
            sinon.stub(peerCard, 'getConnectionProfile').returns({'x-type': 'hlfv1', 'name': 'myProfile'});
            sinon.stub(channelCard, 'getConnectionProfile').returns({'x-type': 'hlfv1', 'name': 'myProfile'});
            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.reject(ModalDismissReasons.ESC)
            });
            mockFileService.isDirty.returns(true);

            fixture.detectChanges();

            let deployButton = fixture.debugElement.query(By.css('#editor_deploy'));

            deployButton.triggerEventHandler('click', null);

            tick();

            component['deploying'].should.equal(false);
            mockUpdatePackage.should.not.have.been.called;
            mockUpdateFiles.should.not.have.been.called;
            mockAlertService.busyStatus$.next.should.not.have.been.called;
            mockAlertService.errorStatus$.next.should.not.have.been.called;
        })));

        it('should handle error', fakeAsync(inject([SampleBusinessNetworkService], (sampleBusinessNetworkService: SampleBusinessNetworkService) => {
            sinon.stub(sampleBusinessNetworkService, 'upgradeBusinessNetwork').returns(Promise.reject('some error'));
            component['canDeploy'] = true;

            mockFileService.isDirty.returns(true);

            fixture.detectChanges();

            let deployButton = fixture.debugElement.query(By.css('#editor_deploy'));

            deployButton.triggerEventHandler('click', null);

            tick();

            component['deploying'].should.equal(false);
            mockUpdatePackage.should.have.been.called;
            mockUpdateFiles.should.have.been.called;
            mockAlertService.busyStatus$.next.should.have.been.calledWith(null);
            mockAlertService.errorStatus$.next.should.have.been.called;
        })));
    });

    describe('toggleEditVersionActive', () => {
        it('should toggle version editing', () => {
            component['editVersionActive'] = false;

            component.toggleEditVersionActive();

            component['editVersionActive'].should.equal(true);
        });
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

        it('should identify Package file via parameters', () => {
            let testItem = new EditorFile('1', '1', 'this is the package', 'package');

            let result = component['fileType'](testItem);

            result.should.equal('Package');
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

        it('should not validate readme files', () => {
            let fileArray = [];
            fileArray.push(new EditorFile('myId', 'myDisplayID', 'myContent', 'readme'));
            component['files'] = fileArray;

            let result = component['editorFilesValidate']();

            mockFileService.validateFile.should.not.have.been.called;
            mockFileService.updateBusinessNetwork.should.have.been.calledOnce;
            result.should.equal(true);
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

            mockFileService.validateFile.should.have.been.calledWith('myId', 'package');
            result.should.equal(true);
            component['invalidAboutFileIDs'].should.deep.equal([]);
        });

        it('should fail to validate package files', () => {
            let fileArray = [];
            fileArray.push(new EditorFile('myId', 'myDisplayID', 'myContent', 'package'));
            component['files'] = fileArray;

            mockFileService.validateFile.returns('error');

            let result = component['editorFilesValidate']();

            mockFileService.validateFile.should.have.been.calledWith('myId', 'package');
            result.should.equal(false);
            component['invalidAboutFileIDs'].should.deep.equal(['myId']);
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

    describe('editorFileVersionChange', () => {
        it('should set the input package version', () => {
            component.editorFileVersionChange({version: '9.9.9-9', jsonErr: false});

            component['inputPackageVersion'].should.equal('9.9.9-9');
            component['invalidPackage'].should.equal(false);
        });
    });

    describe('updateVersion', () => {
        it('should update the business network with the new version', () => {
            component['inputPackageVersion'] = '9.9.9-9';
            let packageFile = new EditorFile('packageId', 'packageDisplayId', 'this is the package', 'package');
            mockFileService.updateBusinessNetworkVersion.returns(packageFile);
            mockFileService.businessNetworkChanged$ = {
                next: sinon.stub()
            };

            component.updateVersion();

            mockFileService.updateBusinessNetworkVersion.should.have.been.calledWith('9.9.9-9');
            mockFileService.updateBusinessNetwork.should.have.been.calledWith('packageId', packageFile);
            mockFileService.businessNetworkChanged$.next.should.have.been.calledWith(true);
        });

        it('should handle errors', () => {
            component['inputPackageVersion'] = '9.9.9-9';
            mockFileService.updateBusinessNetworkVersion.throws('Oh bother');
            mockFileService.businessNetworkChanged$ = {
                next: sinon.stub()
            };

            component.updateVersion();

            mockFileService.updateBusinessNetworkVersion.should.have.been.calledWith('9.9.9-9');
            mockFileService.updateBusinessNetwork.should.not.have.been.called;
            mockFileService.businessNetworkChanged$.next.should.have.been.calledWith(false);
        });
    });

    describe('openDeleteFileModal', () => {

        let updateFilesMock;
        let validateMock;

        beforeEach(() => {
            updateFilesMock = sinon.stub(component, 'updateFiles');
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

            component.openDeleteFileModal();
            tick();

            // Check the file list gets updated
            updateFilesMock.should.have.been.called;

            // Check services called
            mockFileService.deleteFile.should.have.been.calledWith('script1', 'script');
            component['noError'].should.equal(true);
            mockAlertService.successStatus$.next.should.have.been.called;
        }));

        it('should delete the correct model file', fakeAsync(() => {

            component['currentFile'] = component['files'][3];

            component.openDeleteFileModal();
            tick();

            // Check the file list gets updated
            updateFilesMock.should.have.been.called;

            // Check services called
            mockFileService.deleteFile.should.have.been.calledWith('model', 'model');
            component['noError'].should.equal(true);
            mockAlertService.successStatus$.next.should.have.been.called;
        }));

        it('should delete the query file', fakeAsync(() => {

            component['currentFile'] = component['files'][5];

            component.openDeleteFileModal();
            tick();

            // Check the file list gets updated
            updateFilesMock.should.have.been.called;

            // Check services called
            mockFileService.deleteFile.should.have.been.calledWith('query', 'query');
            component['noError'].should.equal(true);
            mockAlertService.successStatus$.next.should.have.been.called;
        }));

        it('should only enable deletion of model or script files', fakeAsync(() => {

            // should not be able to delete an acl file
            component['currentFile'] = component['files'][0];

            component.openDeleteFileModal();
            tick();

            // Check services called
            mockFileService.deleteFile.should.not.have.been.called;
            validateMock.should.not.have.been.called;
            mockAlertService.errorStatus$.next.should.have.been.called;

            // check no files removed
            let currentFiles = component['files'];
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

            component['currentFile'] = component['files'][3];

            component.openDeleteFileModal();
            tick();

            // Check services called
            validateMock.should.have.been.called;
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
        it('should set the current file to the read me and enable preview', () => {
            mockFileService.getEditorReadMe.returns('README');
            let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');
            component.setReadmePreview(true);
            mockSetCurrentFile.should.have.been.calledWith('README');
            component['previewReadme'].should.equal(true);
        });

        it('should set the current file to the read me and disable preview', () => {
            mockFileService.getEditorReadMe.returns('README');
            let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');
            component.setReadmePreview(false);
            mockSetCurrentFile.should.have.been.calledWith('README');
            component['previewReadme'].should.equal(false);
        });
    });

    describe('editPackageJson', () => {
        it('should set the current file to the package json', () => {
            mockFileService.getEditorPackageFile.returns('PACKAGE');
            let mockSetCurrentFile = sinon.stub(component, 'setCurrentFile');
            component.editPackageJson();
            mockSetCurrentFile.should.have.been.calledWith('PACKAGE');
        });
    });
});
