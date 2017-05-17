/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Directive, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

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
            };
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
                displayID: 'model/model 1.cto',
            });

            component['files'][2].should.deep.equal({
                model: true,
                id: 'model 2',
                displayID: 'model/model 2.cto',
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

        it('should open the import modal and handle error', fakeAsync(() => {
            mockAlertService.errorStatus$ = {next: sinon.stub()};
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
            mockAlertService.errorStatus$ = {next: sinon.stub()};
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

        it('should open add file modal and handle error', fakeAsync(() => {

            mockAlertService.errorStatus$ = {next : sinon.stub()};

            mockModal.open = sinon.stub().returns({
                componentInstance: {
                    businessNetwork: {}
                },
                result: Promise.reject('some error')
            });

            component.openAddFileModal();

            tick();

            mockAddModel.should.not.have.been.called;

            mockAlertService.errorStatus$.next.should.have.been.calledWith('some error');
        }));

        it('should open add file modal and handle cancel', fakeAsync(() => {

            mockAlertService.errorStatus$ = {next : sinon.stub()};

            mockModal.open = sinon.stub().returns({
                componentInstance: {
                    businessNetwork: {}
                },
                result: Promise.reject(1)
            });

            component.openAddFileModal();

            tick();

            mockAddModel.should.not.have.been.called;

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
});
