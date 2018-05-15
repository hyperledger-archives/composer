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
import { DebugElement } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ModelFile, AclFile, QueryFile, Script, Logger } from 'composer-common';

import { AddFileComponent } from './add-file.component';
import { FileImporterComponent } from '../../common/file-importer';
import { FileDragDropDirective } from '../../common/file-importer/file-drag-drop';

import { AlertService } from '../../basic-modals/alert.service';
import { FileService } from '../../services/file.service';
import { ClientService } from '../../services/client.service';

import * as sinon from 'sinon';
import * as chai from 'chai';
import { EditorFile } from '../../services/editor-file';

const should = chai.should();

describe('AddFileComponent', () => {
    let sandbox;
    let component: AddFileComponent;
    let fixture: ComponentFixture<AddFileComponent>;
    let addFileElement: DebugElement;

    let mockClientService;
    let mockModelFile;
    let mockScriptFile;
    let mockAclFile;
    let mockQueryFile;
    let mockFileService;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();

        // webpack can't handle dymanically creating a logger
        Logger.setFunctionalLogger({
            log: sandbox.stub()
        });

        mockClientService = sinon.createStubInstance(ClientService);
        mockModelFile = sinon.createStubInstance(ModelFile);
        mockScriptFile = sinon.createStubInstance(Script);
        mockAclFile = sinon.createStubInstance(AclFile);
        mockQueryFile = sinon.createStubInstance(QueryFile);
        mockFileService = sinon.createStubInstance(FileService);
        mockFileService.createModelFile.returns(mockModelFile);
        mockFileService.createScriptFile.returns(mockScriptFile);
        mockFileService.createAclFile.returns(mockAclFile);
        mockFileService.createQueryFile.returns(mockQueryFile);

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
                AlertService,
                {provide: FileService, useValue: mockFileService},
                {provide: ClientService, useValue: mockClientService},
                NgbActiveModal
            ]
        });

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

        beforeEach(() => {
            mockFileReadObj = {
                readAsArrayBuffer: sandbox.stub(),
                result: content,
                onload: sandbox.stub(),
                onerror: sandbox.stub()
            };

            mockFileRead = sandbox.stub((<any> window), 'FileReader');
            mockFileRead.returns(mockFileReadObj);
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
            mockModelFile.getName.returns('models/newfile.cto');

            mockFileReadObj.result = content;

            fixture.detectChanges();

            let dragDropElement = addFileElement.query(By.css('.import'));
            dragDropElement.triggerEventHandler('fileDragDropFileAccepted', file);
            mockFileReadObj.onload();

            tick();

            component.fileType.should.equal('cto');
            mockFileService.createModelFile.should.have.been.calledWith(content, 'models/newfile.cto');
            component.currentFileName.should.equal('models/newfile.cto');
            component.currentFile.should.equal(mockModelFile);
        }));

        it('should createScript if script file detected', fakeAsync(() => {
            content = `/**
 * New script file
 */`;
            let b = new Blob([content], {type: 'text/plain'});
            let file = new File([b], 'newfile.js');
            mockScriptFile.getIdentifier.returns('lib/newfile.js');

            mockFileReadObj.result = content;

            fixture.detectChanges();

            let dragDropElement = addFileElement.query(By.css('.import'));
            dragDropElement.triggerEventHandler('fileDragDropFileAccepted', file);
            mockFileReadObj.onload();

            tick();

            component.fileType.should.equal('js');
            mockFileService.createScriptFile.should.have.been.calledWith('lib/newfile.js', 'JS', content);
            component.currentFileName.should.equal('lib/newfile.js');
            component.currentFile.should.equal(mockScriptFile);
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
            mockFileService.createAclFile.should.have.been.calledWith('permissions.acl', content);
            component.currentFileName.should.equal('permissions.acl');
            component.currentFile.should.equal(mockAclFile);
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
            component.currentFileName.should.equal('README.md');
            component.currentFile.should.equal(content);
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
            mockFileService.createQueryFile.should.have.been.calledWith('queries.qry', content);
            component.currentFileName.should.equal('queries.qry');
            component.currentFile.should.equal(mockQueryFile);
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

            let errorStatusSpy = sandbox.spy(alertService.errorStatus$, 'next');

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

            let errorStatusSpy = sandbox.spy(alertService.errorStatus$, 'next');

            let dragDropElement = addFileElement.query(By.css('.import'));
            dragDropElement.triggerEventHandler('fileDragDropFileAccepted', file);
            mockFileReadObj.onerror(new Error('File has an error'));

            tick();

            errorStatusSpy.should.have.been.called;
        })));
    });

    describe('#changeCurrentFileType', () => {
        it('should set current file to a script file, created by calling createScript with correct parameters', fakeAsync(() => {
            fixture.detectChanges();
            tick();

            mockFileService.getScripts.returns([]);

            let scriptRadioElement = addFileElement.query(By.css('#file-type-js'));
            scriptRadioElement.nativeElement.checked = true;
            scriptRadioElement.nativeElement.dispatchEvent(new Event('change'));

            fixture.detectChanges();
            tick();

            component.fileType.should.equal('js');
            component.currentFile.should.equal(mockScriptFile);
            component.currentFileName.should.equal('lib/script.js');
        }));

        it('should increment a script file name if one already exists', fakeAsync(inject([FileService], (fileService: FileService) => {
            fixture.detectChanges();
            tick();

//             let myScriptFile = fileService.createScriptFile('lib/script.js', 'JS', `/**
//  * New script file
//  */`);
            let existingScriptFile = sinon.createStubInstance(Script);
            existingScriptFile.getIdentifier.returns('lib/script.js');

            // myScriptManager.addScript(myScriptFile);
            mockFileService.getScripts.returns([existingScriptFile]);

            let scriptRadioElement = addFileElement.query(By.css('#file-type-js'));
            scriptRadioElement.nativeElement.checked = true;
            scriptRadioElement.nativeElement.dispatchEvent(new Event('change'));

            fixture.detectChanges();
            tick();

            component.fileType.should.equal('js');
            component.currentFile.should.equal(mockScriptFile);
            component.currentFileName.should.equal('lib/script0.js');
        })));

        it('should change this.currentFileType to a cto file', fakeAsync(() => {
            fixture.detectChanges();
            tick();

            mockFileService.getModelFiles.returns([]);

            let modelRadioElement = addFileElement.query(By.css('#file-type-cto'));
            modelRadioElement.nativeElement.checked = true;
            modelRadioElement.nativeElement.dispatchEvent(new Event('change'));

            fixture.detectChanges();
            tick();

            component.fileType.should.equal('cto');
            component.currentFile.should.equal(mockModelFile);
            component.currentFileName.should.equal('models/org.example.model.cto');
        }));

        it('should append the file number to the cto file name and namespace', fakeAsync(inject([FileService], (fileService: FileService) => {
            fixture.detectChanges();
            tick();

            let existingModelFile = sinon.createStubInstance(ModelFile);
            existingModelFile.getNamespace.returns('org.example.model');
            mockFileService.getModelFiles.returns([existingModelFile]);

            let modelRadioElement = addFileElement.query(By.css('#file-type-cto'));
            modelRadioElement.nativeElement.checked = true;
            modelRadioElement.nativeElement.dispatchEvent(new Event('change'));

            fixture.detectChanges();
            tick();

            mockFileService.createModelFile.should.have.been.calledWith(sinon.match(/namespace org.example.model0/), 'models/org.example.model0.cto');
            component.fileType.should.equal('cto');
            component.currentFile.should.equal(mockModelFile);
            component.currentFileName.should.equal('models/org.example.model0.cto');
        })));

        it('should change current file to a query file upon calling createQueryFile', fakeAsync(() => {
            fixture.detectChanges();
            tick();

            let queryRadioElement = addFileElement.query(By.css('#file-type-qry'));
            queryRadioElement.nativeElement.checked = true;
            queryRadioElement.nativeElement.dispatchEvent(new Event('change'));

            fixture.detectChanges();
            tick();

            component.fileType.should.equal('qry');
            component.currentFile.should.equal(mockQueryFile);
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

            component.fileType.should.equal('acl');
            component.currentFile.should.equal(mockAclFile);
            component.currentFileName.should.equal('permissions.acl');
        }));
    });

    describe('#removeFile', () => {
        it('should reset back to default values', fakeAsync(() => {
            component['expandInput'] = true;
            component['currentFile'] = 'Readme';
            component['currentFileName'] = 'README.md';
            component['fileType'] = 'md';

            fixture.detectChanges();
            tick();

            let removeButton = addFileElement.query(By.css('.action'));

            removeButton.triggerEventHandler('click', null);

            // Assertions
            component.expandInput.should.not.be.true;
            should.not.exist(component.currentFile);
            should.not.exist(component.currentFileName);
            component.fileType.should.equal('');
        }));
    });
});
