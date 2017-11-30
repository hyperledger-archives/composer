/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { ComponentFixture, TestBed, fakeAsync, tick, inject } from '@angular/core/testing';
import { DebugElement } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ModelManager, ScriptManager, Logger } from 'composer-common';

import { AddFileComponent } from './add-file.component';
import { FileImporterComponent } from '../../common/file-importer';
import { FileDragDropDirective } from '../../common/file-importer/file-drag-drop';

import { AlertService } from '../../basic-modals/alert.service';
import { FileService } from '../../services/file.service';
import { ClientService } from '../../services/client.service';

import * as sinon from 'sinon';
import * as chai from 'chai';

const should = chai.should();

describe('AddFileComponent', () => {
    let sandbox;
    let component: AddFileComponent;
    let fixture: ComponentFixture<AddFileComponent>;
    let addFileElement: DebugElement;

    let mockClientService;

    beforeEach(() => {
        // webpack can't handle dymanically creating a logger
        Logger.setFunctionalLogger({
            log: sinon.stub()
        });

        mockClientService = sinon.createStubInstance(ClientService);

        TestBed.configureTestingModule({
            declarations: [
                FileImporterComponent,
                AddFileComponent,
                FileDragDropDirective
            ],
            imports: [
                FormsModule
            ],
            providers: [AlertService, FileService,
                {provide: ClientService, useValue: mockClientService},
                NgbActiveModal
            ]
        });

        sandbox = sinon.sandbox.create();

        fixture = TestBed.createComponent(AddFileComponent);
        component = fixture.componentInstance;

        addFileElement = fixture.debugElement;
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#fileDetected', () => {
        it('should change this.expandInput to true', () => {
            fixture.detectChanges();
            component.expandInput = false;

            let dragDropElement = addFileElement.query(By.css('.import'));

            dragDropElement.triggerEventHandler('fileDragDropDragOver', null);
            component.expandInput.should.equal(true);
        });
    });

    describe('#fileLeft', () => {
        it('should change this.expectedInput to false', () => {
            fixture.detectChanges();
            component.expandInput = true;

            let dragDropElement = addFileElement.query(By.css('.import'));

            dragDropElement.triggerEventHandler('fileDragDropDragLeave', null);
            component.expandInput.should.equal(false);
        });
    });

    describe('#fileAccepted', () => {
        let mockFileReadObj;
        let mockFileRead;
        let content;

        beforeEach(inject([FileService], (fileService: FileService) => {
            mockFileReadObj = {
                readAsArrayBuffer: sandbox.stub(),
                result: content,
                onload: sinon.stub(),
                onerror: sinon.stub()
            };

            mockFileRead = sinon.stub((<any> window), 'FileReader');
            mockFileRead.returns(mockFileReadObj);

            const myModelManager = new ModelManager();

            fileService['currentBusinessNetwork'] = {
                getModelManager: (() => {
                    return myModelManager;
                }),
                getScriptManager: (() => {
                    return new ScriptManager(myModelManager);
                })
            };
        }));

        afterEach(() => {
            mockFileRead.restore();
        });

        it('should createModel if model file detected', fakeAsync(() => {
            content = `/**
             * Sample business network definition.
             */
                namespace org.acme.sample

            participant SampleParticipant identified by participantId {
                o String participantId
                o String firstName
                o String lastName
            }`;
            let b = new Blob([content], {type: 'text/plain'});
            let file = new File([b], 'newfile.cto');

            mockFileReadObj.result = content;

            fixture.detectChanges();

            let dragDropElement = addFileElement.query(By.css('.import'));
            dragDropElement.triggerEventHandler('fileDragDropFileAccepted', file);
            mockFileReadObj.onload();

            tick();

            component.fileType.should.equal('cto');
            component.currentFileName.should.equal('models/newfile.cto');
            component.currentFile.getDefinitions().should.equal(content);
        }));

        it('should createScript if script file detected', fakeAsync(() => {
            content = `/**
 * New script file
 */`;
            let b = new Blob([content], {type: 'text/plain'});
            let file = new File([b], 'newfile.js');

            mockFileReadObj.result = content;

            fixture.detectChanges();

            let dragDropElement = addFileElement.query(By.css('.import'));
            dragDropElement.triggerEventHandler('fileDragDropFileAccepted', file);
            mockFileReadObj.onload();

            tick();

            component.fileType.should.equal('js');
            component.currentFile.getContents().should.equal(content);
            component.currentFileName.should.equal('lib/newfile.js');
        }));

        it('should call this.createRules if ACL file detected', fakeAsync(() => {
            content = `/**
 * New access control file
 */
 rule AllAccess {
     description: "AllAccess - grant everything to everybody."
     participant: "org.hyperledger.composer.system.Participant"
     operation: ALL
     resource: "org.hyperledger.composer.system.**"
     action: ALLOW
 }`;
            let b = new Blob([content], {type: 'text/plain'});
            let file = new File([b], 'permissions.acl');

            mockFileReadObj.result = content;

            fixture.detectChanges();

            let dragDropElement = addFileElement.query(By.css('.import'));
            dragDropElement.triggerEventHandler('fileDragDropFileAccepted', file);
            mockFileReadObj.onload();

            tick();

            component.fileType.should.equal('acl');
            component.currentFile.getIdentifier().should.equal('permissions.acl');
            component.currentFile.getDefinitions().should.equal(content);
            component.currentFileName.should.equal('permissions.acl');
        }));

        it('should call this.createReadme if readme file detected', fakeAsync(() => {

            content = `# Basic Sample Business Network

> This is the "Hello World" of Hyperledger Composer samples, which demonstrates the core functionality of Hyperledger Composer by changing the value of an asset.

This business network defines:

**Participant**
\`SampleParticipant\`

**Asset**
\`SampleAsset\`

**Transaction**
\`SampleTransaction\`

**Event**
\`SampleEvent\``;
            let b = new Blob([content], {type: 'text/plain'});
            let file = new File([b], 'README.md');

            mockFileReadObj.result = content;

            fixture.detectChanges();

            let dragDropElement = addFileElement.query(By.css('.import'));
            dragDropElement.triggerEventHandler('fileDragDropFileAccepted', file);
            mockFileReadObj.onload();

            tick();

            component.fileType.should.equal('md');
            component.currentFile.should.equal(content);
            component.currentFileName.should.equal('README.md');
        }));

        it('should call this.createQuery if query file detected', fakeAsync(() => {
            content = `/**
 * New query file
 */`;
            let b = new Blob([content], {type: 'text/plain'});
            let file = new File([b], 'queries.qry');

            mockFileReadObj.result = content;

            fixture.detectChanges();

            let dragDropElement = addFileElement.query(By.css('.import'));
            dragDropElement.triggerEventHandler('fileDragDropFileAccepted', file);
            mockFileReadObj.onload();

            tick();

            component.fileType.should.equal('qry');
            component.currentFile.getIdentifier().should.equal('queries.qry');
            component.currentFile.getDefinitions().should.equal(content);
            component.currentFileName.should.equal('queries.qry');
        }));

        it('should throw error if unknown file type', fakeAsync(inject([AlertService], (alertService: AlertService) => {
            content = `/**
             * Sample business network definition.
             */
                namespace org.acme.sample

            participant SampleParticipant identified by participantId {
                o String participantId
                o String firstName
                o String lastName
            }`;
            let b = new Blob([content], {type: 'text/plain'});
            let file = new File([b], 'newfile.bob');

            mockFileReadObj.result = content;

            fixture.detectChanges();

            alertService.errorStatus$.subscribe((message) => {
                if (message !== null) {
                    message.toString().should.equal('Error: Unexpected File Type: bob');
                }
            });

            let errorStatusSpy = sinon.spy(alertService.errorStatus$, 'next');

            let dragDropElement = addFileElement.query(By.css('.import'));
            dragDropElement.triggerEventHandler('fileDragDropFileAccepted', file);
            mockFileReadObj.onload();

            tick();

            errorStatusSpy.should.have.been.called;
        })));

        it('should handle error reading file', fakeAsync(inject([AlertService], (alertService: AlertService) => {
            content = `/**
             * Sample business network definition.
             */
                namespace org.acme.sample

            participant SampleParticipant identified by participantId {
                o String participantId
                o String firstName
                o String lastName
            }`;
            let b = new Blob([content], {type: 'text/plain'});
            let file = new File([b], 'newfile.cto');

            mockFileReadObj.result = content;

            fixture.detectChanges();

            alertService.errorStatus$.subscribe((message) => {
                if (message !== null) {
                    message.toString().should.equal('Error: File has an error');
                }
            });

            let errorStatusSpy = sinon.spy(alertService.errorStatus$, 'next');

            let dragDropElement = addFileElement.query(By.css('.import'));
            dragDropElement.triggerEventHandler('fileDragDropFileAccepted', file);
            mockFileReadObj.onerror(new Error('File has an error'));

            tick();

            errorStatusSpy.should.have.been.called;
        })));
    });

    describe('#changeCurrentFileType', () => {
        let myScriptManager;
        let myModelManager;

        beforeEach(inject([FileService], (fileService: FileService) => {
            myModelManager = new ModelManager();
            myScriptManager = new ScriptManager(myModelManager);

            fileService['currentBusinessNetwork'] = {
                getModelManager: (() => {
                    return myModelManager;
                }),
                getScriptManager: (() => {
                    return myScriptManager;
                })
            };
        }));

        it('should set current file to a script file, created by calling createScript with correct parameters', fakeAsync(() => {
            fixture.detectChanges();
            tick();

            let scriptRadioElement = addFileElement.query(By.css('#file-type-js'));
            scriptRadioElement.nativeElement.checked = true;
            scriptRadioElement.nativeElement.dispatchEvent(new Event('change'));

            fixture.detectChanges();
            tick();

            component.currentFile.getContents().should.equal(`/**
 * New script file
 */`);
            component.currentFileName.should.equal('lib/script.js');
        }));

        it('should increment a script file name if one already exists', fakeAsync(inject([FileService], (fileService: FileService) => {
            fixture.detectChanges();
            tick();

            let myScriptFile = fileService.createScriptFile('lib/script.js', 'JS', `/**
 * New script file
 */`);
            myScriptManager.addScript(myScriptFile);

            let scriptRadioElement = addFileElement.query(By.css('#file-type-js'));
            scriptRadioElement.nativeElement.checked = true;
            scriptRadioElement.nativeElement.dispatchEvent(new Event('change'));

            fixture.detectChanges();
            tick();

            component.currentFile.getContents().should.equal(`/**
 * New script file
 */`);
            component.currentFileName.should.equal('lib/script0.js');
        })));

        it('should change this.currentFileType to a cto file', fakeAsync(() => {
            fixture.detectChanges();
            tick();

            let modelRadioElement = addFileElement.query(By.css('#file-type-cto'));
            modelRadioElement.nativeElement.checked = true;
            modelRadioElement.nativeElement.dispatchEvent(new Event('change'));

            fixture.detectChanges();
            tick();

            component.currentFile.getDefinitions().should.equal(`/**
 * New model file
 */

namespace org.acme.model`);

            component.currentFileName.should.equal('models/org.acme.model.cto');
        }));

        it('should append the file number to the cto file name and namespace', fakeAsync(inject([FileService], (fileService: FileService) => {
            fixture.detectChanges();
            tick();

            let modelFile = fileService.createModelFile(`/**
             * New model file
             */

            namespace org.acme.model`, 'models/org.acme.model.cto');

            myModelManager.addModelFile(modelFile, 'models/org.acme.model.cto');

            let modelRadioElement = addFileElement.query(By.css('#file-type-cto'));
            modelRadioElement.nativeElement.checked = true;
            modelRadioElement.nativeElement.dispatchEvent(new Event('change'));

            fixture.detectChanges();
            tick();

            component.currentFile.getDefinitions().should.equal(`/**
 * New model file
 */

namespace org.acme.model0`);
            component.currentFileName.should.equal('models/org.acme.model0.cto');
        })));

        it('should change current file to a query file upon calling createQueryFile', fakeAsync(() => {
            fixture.detectChanges();
            tick();

            let queryRadioElement = addFileElement.query(By.css('#file-type-qry'));
            queryRadioElement.nativeElement.checked = true;
            queryRadioElement.nativeElement.dispatchEvent(new Event('change'));

            fixture.detectChanges();
            tick();

            component.currentFile.getDefinitions().should.equal(`/**
 * New query file
 */`);

            component.currentFileName.should.equal('queries.qry');
        }));

        it('should change current file to an acl file upon calling createAclFile', fakeAsync(() => {
            fixture.detectChanges();
            tick();

            let queryRadioElement = addFileElement.query(By.css('#file-type-acl'));
            queryRadioElement.nativeElement.checked = true;
            queryRadioElement.nativeElement.dispatchEvent(new Event('change'));

            fixture.detectChanges();
            tick();

            component.currentFile.getDefinitions().should.equal(`/**
 * New access control file
 */
 rule AllAccess {
     description: "AllAccess - grant everything to everybody."
     participant: "org.hyperledger.composer.system.Participant"
     operation: ALL
     resource: "org.hyperledger.composer.system.**"
     action: ALLOW
 }`);

            component.currentFileName.should.equal('permissions.acl');
        }));
    });

    describe('#removeFile', () => {
        let mockFileReadObj;
        let mockFileRead;
        let content;

        beforeEach(fakeAsync(inject([FileService], (fileService: FileService) => {
            mockFileReadObj = {
                readAsArrayBuffer: sandbox.stub(),
                result: content,
                onload: sinon.stub(),
                onerror: sinon.stub()
            };

            mockFileRead = sinon.stub((<any> window), 'FileReader');
            mockFileRead.returns(mockFileReadObj);

            const myModelManager = new ModelManager();

            fileService['currentBusinessNetwork'] = {
                getModelManager: (() => {
                    return myModelManager;
                }),
                getScriptManager: (() => {
                    return new ScriptManager(myModelManager);
                })
            };

            content = `/**
             * Sample business network definition.
             */
                namespace org.acme.sample

            participant SampleParticipant identified by participantId {
                o String participantId
                o String firstName
                o String lastName
            }`;
            let b = new Blob([content], {type: 'text/plain'});
            let file = new File([b], 'newfile.cto');

            mockFileReadObj.result = content;

            fixture.detectChanges();

            let dragDropElement = addFileElement.query(By.css('.import'));
            dragDropElement.triggerEventHandler('fileDragDropFileAccepted', file);
            mockFileReadObj.onload();

            tick();
            fixture.detectChanges();
        })));

        afterEach(() => {
            mockFileRead.restore();
        });

        it('should reset back to default values', () => {
            let removeButton = addFileElement.query(By.css('.action'));

            removeButton.triggerEventHandler('click', null);

            // Assertions
            component.expandInput.should.not.be.true;
            should.not.exist(component.currentFile);
            should.not.exist(component.currentFileName);
            component.fileType.should.equal('');
        });
    });
});
