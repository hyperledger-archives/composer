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
/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { ComponentFixture, TestBed, inject } from '@angular/core/testing';
import { Directive, Input, Component, DebugElement, Output, EventEmitter } from '@angular/core';
import { By } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject } from 'rxjs/Rx';
import { EditorFileComponent } from './editor-file.component';
import { ClientService } from '../../services/client.service';

import { FileService } from '../../services/file.service';
import { EditorFile } from '../../services/editor-file';
import { ScriptManager, ModelManager, Logger, AclManager } from 'composer-common';

import * as sinon from 'sinon';
import * as chai from 'chai';

let should = chai.should();

@Directive({
    selector: 'codemirror'
})

class MockCodeMirrorDirective {
    @Input()
    public config;
}

@Directive({
    selector: 'perfect-scrollbar'
})

class MockPerfectScrollBarDirective {
}

@Directive({
    selector: '[debounce]'
})

class MockDebounceDirective {
    @Input() delay;
    @Output() debounceFunc = new EventEmitter<any>();
}

@Component({
    template: `
        <editor-file (packageJsonVersionChange)="editorFileVersionChange($event)" [editorFile]="editorFile" [previewReadmeActive]="previewReadmeActive"></editor-file>`
})
class TestHostComponent {
    editorFile;
    previewReadmeActive = false;

    editorFileVersionChange = sinon.stub();
}

describe('EditorFileComponent', () => {

    let component: TestHostComponent;
    let fixture: ComponentFixture<TestHostComponent>;
    let editorFileElement: DebugElement;
    let mockClientService;
    let mockFileService;

    beforeEach(() => {
        // webpack can't handle dymanically creating a logger
        Logger.setFunctionalLogger({
            log: sinon.stub()
        });

        mockClientService = sinon.createStubInstance(ClientService);
        mockFileService = sinon.createStubInstance(FileService);

        TestBed.configureTestingModule({
            imports: [FormsModule],
            declarations: [TestHostComponent, EditorFileComponent, MockCodeMirrorDirective, MockPerfectScrollBarDirective, MockDebounceDirective],
            providers: [
                {provide: FileService, useValue: mockFileService},
                {provide: ClientService, useValue: mockClientService}]
        });
        fixture = TestBed.createComponent(TestHostComponent);
        component = fixture.componentInstance;

        editorFileElement = fixture.debugElement.query(By.css('editor-file'));
    });

    it('should create', () => {
        component.should.be.ok;
    });

    it('should setup the mark down code config', () => {
        fixture.detectChanges();
        let mockCm = {
            foldCode: sinon.stub(),
            getCursor: sinon.stub().returns('myCursor')
        };
        editorFileElement.componentInstance['mdCodeConfig'].extraKeys['Ctrl-Q'](mockCm);
        mockCm.getCursor.should.have.been.called;
        mockCm.foldCode.should.have.been.calledWith('myCursor');
    });

    it('should setup the code config', () => {
        fixture.detectChanges();
        let mockCm = {
            foldCode: sinon.stub(),
            getCursor: sinon.stub().returns('myCursor')
        };
        editorFileElement.componentInstance['codeConfig'].extraKeys['Ctrl-Q'](mockCm);
        mockCm.getCursor.should.have.been.called;
        mockCm.foldCode.should.have.been.calledWith('myCursor');
    });

    describe('set previewReadmeActive', () => {
        // TODO: in the future the could check the html to check that the correct elements appear and disappear
        it('should set the preview boolean to true', () => {
            fixture.detectChanges();

            component.previewReadmeActive = true;

            fixture.detectChanges();

            editorFileElement.componentInstance['_previewReadmeActive'].should.equal(true);
        });

        it('should set the preview boolean to false', () => {
            fixture.detectChanges();

            component.previewReadmeActive = false;

            fixture.detectChanges();

            editorFileElement.componentInstance['_previewReadmeActive'].should.equal(false);
        });
    });

    describe('ngDoCheck', () => {
        it('should reload package file if version changes', () => {
            fixture.detectChanges();

            mockClientService.getBusinessNetwork.returns({
                getName: sinon.stub().returns('myBusinessNetworkName')
            });

            let jsonContent = {
                name: 'my network',
                version: '1.0.0'
            };
            let content = JSON.stringify(jsonContent, null, 2);

            jsonContent = {
                name: 'my network',
                version: '1.0.1'
            };
            let editedContent = JSON.stringify(jsonContent, null, 2);

            let myEditorFile = new EditorFile('myId', 'myDisplayId', content, 'package');
            mockFileService.getFile.returns(myEditorFile);

            component.editorFile = myEditorFile;

            fixture.detectChanges();

            myEditorFile = new EditorFile('myId', 'myDisplayId', editedContent, 'package');
            mockFileService.getFile.returns(myEditorFile);

            component.editorFile = myEditorFile;

            let mockLoadFile = sinon.stub(editorFileElement.componentInstance, 'loadFile');

            fixture.detectChanges();

            editorFileElement.componentInstance.previousPackageVersion.should.equal('1.0.1');
            mockLoadFile.should.have.been.calledTwice;
        });

        it('should not reload package file if version stays the same', () => {
            fixture.detectChanges();

            mockClientService.getBusinessNetwork.returns({
                getName: sinon.stub().returns('myBusinessNetworkName')
            });

            let jsonContent = {
                name: 'my network',
                version: '1.0.0'
            };
            let content = JSON.stringify(jsonContent, null, 2);

            jsonContent = {
                name: 'my network name',
                version: '1.0.0'
            };
            let editedContent = JSON.stringify(jsonContent, null, 2);

            let myEditorFile = new EditorFile('myId', 'myDisplayId', content, 'package');
            mockFileService.getFile.returns(myEditorFile);

            component.editorFile = myEditorFile;

            fixture.detectChanges();

            myEditorFile = new EditorFile('myId', 'myDisplayId', editedContent, 'package');
            mockFileService.getFile.returns(myEditorFile);

            component.editorFile = myEditorFile;

            let mockLoadFile = sinon.stub(editorFileElement.componentInstance, 'loadFile');

            fixture.detectChanges();

            editorFileElement.componentInstance.previousPackageVersion.should.equal('1.0.0');
            mockLoadFile.should.have.been.calledOnce;
        });

        it('should handle a package file that is invalid JSON', () => {
            fixture.detectChanges();

            mockClientService.getBusinessNetwork.returns({
                getName: sinon.stub().returns('myBusinessNetworkName')
            });

            let jsonContent = {
                name: 'my network',
                version: '1.0.0'
            };
            let content = JSON.stringify(jsonContent, null, 2);

            jsonContent = {
                name: 'my network',
                version: '1.0.1'
            };
            let editedContent = JSON.stringify(jsonContent, null, 2);
            editedContent = editedContent.replace(',', '');

            let myEditorFile = new EditorFile('myId', 'myDisplayId', content, 'package');
            mockFileService.getFile.returns(myEditorFile);

            component.editorFile = myEditorFile;

            fixture.detectChanges();

            myEditorFile = new EditorFile('myId', 'myDisplayId', editedContent, 'package');
            mockFileService.getFile.returns(myEditorFile);

            component.editorFile = myEditorFile;

            let mockLoadFile = sinon.stub(editorFileElement.componentInstance, 'loadFile');

            fixture.detectChanges();

            editorFileElement.componentInstance.previousPackageVersion.should.equal('1.0.0');
            mockLoadFile.should.have.been.calledOnce;
        });
    });

    describe('loadFile', () => {
        it('should load a model file', () => {
            fixture.detectChanges();

            let content = `/**
             * Sample business network definition.
             */
                namespace org.acme.sample

            participant SampleParticipant identified by participantId {
                o String participantId
                o String firstName
                o String lastName
            }`;

            let myEditorFile = new EditorFile('myId', 'myDisplayId', content, 'model');
            mockFileService.getFile.returns(myEditorFile);

            component.editorFile = myEditorFile;

            fixture.detectChanges();

            editorFileElement.componentInstance.editorContent.should.equal(content);
            editorFileElement.componentInstance.editorType.should.equal('code');
            should.not.exist(editorFileElement.componentInstance.currentError);
        });

        it('should load a model file but not find it', () => {
            fixture.detectChanges();

            let content = `/**
             * Sample business network definition.
             */
                namespace org.acme.sample

            participant SampleParticipant identified by participantId {
                o String participantId
                o String firstName
                o String lastName
            }`;

            component.editorFile = new EditorFile('myId', 'myDisplayId', content, 'model');

            fixture.detectChanges();

            should.not.exist(editorFileElement.componentInstance.editorContent);
        });

        it('should load a script file', () => {
            fixture.detectChanges();

            let content = `/**
             * Sample transaction processor function.
             * @param {org.acme.sample.SampleTransaction} tx The sample transaction instance.
             * @transaction
             */
            function sampleTransaction(tx) {
              
              console.log('hello');
            }`;

            let myEditorFile = new EditorFile('myId', 'myDisplayId', content, 'script');
            mockFileService.getFile.returns(myEditorFile);

            component.editorFile = myEditorFile;

            fixture.detectChanges();

            editorFileElement.componentInstance.editorContent.should.equal(content);
            editorFileElement.componentInstance.editorType.should.equal('code');
            should.not.exist(editorFileElement.componentInstance.currentError);
        });

        it('should load a script file but not find it', () => {
            fixture.detectChanges();

            let content = `/**
             * Sample transaction processor function.
             * @param {org.acme.sample.SampleTransaction} tx The sample transaction instance.
             * @transaction
             */
            function sampleTransaction(tx) {
              
              console.log('hello');
            }`;

            component.editorFile = new EditorFile('myId', 'myDisplayId', content, 'script');

            fixture.detectChanges();

            should.not.exist(editorFileElement.componentInstance.editorContent);
        });

        it('should load a acl file', () => {
            fixture.detectChanges();

            let content = `/**
             * New access control file
             */
            rule AllAccess {
                description: "AllAccess - grant everything to everybody."
                participant: "org.hyperledger.composer.system.Participant"
                operation: ALL
                resource: "org.hyperledger.composer.system.**"
                action: ALLOW
            }`;

            let myEditorFile = new EditorFile('myId', 'myDisplayId', content, 'acl');
            mockFileService.getFile.returns(myEditorFile);

            component.editorFile = myEditorFile;

            fixture.detectChanges();

            editorFileElement.componentInstance.editorContent.should.equal(content);
            editorFileElement.componentInstance.editorType.should.equal('code');
            should.not.exist(editorFileElement.componentInstance.currentError);
        });

        it('should load acl file but not find it', () => {
            fixture.detectChanges();

            let content = `/**
             * New access control file
             */
             rule AllAccess {
                description: "AllAccess - grant everything to everybody."
                participant: "org.hyperledger.composer.system.Participant"
                operation: ALL
                resource: "org.hyperledger.composer.system.**"
                action: ALLOW
            }`;

            component.editorFile = new EditorFile('myId', 'myDisplayId', content, 'acl');

            fixture.detectChanges();

            should.not.exist(editorFileElement.componentInstance.editorContent);
        });

        it('should load a package file', () => {
            fixture.detectChanges();

            mockClientService.getBusinessNetwork.returns({
                getName: sinon.stub().returns('myBusinessNetworkName')
            });

            let content = `{\n  "name": "my network"\n}`;

            let myEditorFile = new EditorFile('myId', 'myDisplayId', content, 'package');
            mockFileService.getFile.returns(myEditorFile);

            component.editorFile = myEditorFile;

            fixture.detectChanges();

            editorFileElement.componentInstance.editorContent.should.equal('{\n  \"name\": \"my network\"\n}');
            editorFileElement.componentInstance.editorType.should.equal('code');
            should.not.exist(editorFileElement.componentInstance.currentError);
        });

        it('should load a readme file', () => {
            fixture.detectChanges();

            let content = `readme`;

            let myEditorFile = new EditorFile('myId', 'myDisplayId', content, 'readme');
            mockFileService.getFile.returns(myEditorFile);

            component.editorFile = myEditorFile;

            fixture.detectChanges();

            editorFileElement.componentInstance.editorContent.should.equal(content);
            editorFileElement.componentInstance.previewContent.should.equal(`<p>readme</p>\n`);
            editorFileElement.componentInstance.editorType.should.equal('readme');
        });

        it('should load readme file but not find it', () => {
            fixture.detectChanges();

            let content = `readme`;

            component.editorFile = new EditorFile('myId', 'myDisplayId', content, 'readme');

            fixture.detectChanges();

            should.not.exist(editorFileElement.componentInstance.editorContent);
        });

        it('should load a query file', () => {
            fixture.detectChanges();

            let content = `query selectParticipants {
              description: "Select all participants"
              statement:
                  SELECT org.acme.sample.SampleParticipant
            }`;

            let myEditorFile = new EditorFile('myId', 'myDisplayId', content, 'query');
            mockFileService.getFile.returns(myEditorFile);

            component.editorFile = myEditorFile;

            fixture.detectChanges();

            editorFileElement.componentInstance.editorContent.should.equal(content);
            editorFileElement.componentInstance.editorType.should.equal('code');
            should.not.exist(editorFileElement.componentInstance.currentError);
        });

        it('should load a query file but not find it', () => {
            fixture.detectChanges();

            let content = `query selectParticipants {
              description: "Select all participants"
              statement:
                  SELECT org.acme.sample.SampleParticipant
            }`;

            component.editorFile = new EditorFile('myId', 'myDisplayId', content, 'query');

            fixture.detectChanges();

            should.not.exist(editorFileElement.componentInstance.editorContent);
        });

        it('should load no files', () => {
            fixture.detectChanges();

            let content = `/**
             * Sample business network definition.
             */
                namespace org.acme.sample

            participant SampleParticipant identified by participantId {
                o String participantId
                o String firstName
                o String lastName
            }`;

            component.editorFile = new EditorFile('myId', 'myDisplayId', content, 'bob');

            fixture.detectChanges();

            should.not.exist(editorFileElement.componentInstance.editorContent);
        });
    });

    describe('onCodeChanged', () => {
        let mockBehaviourSubject;

        beforeEach(() => {
            mockBehaviourSubject = sinon.createStubInstance(BehaviorSubject);
            mockFileService.businessNetworkChanged$ = mockBehaviourSubject;
        });

        it('should update the code model file', () => {
            fixture.detectChanges();

            let content = `/**
             * Sample business network definition.
             */
                namespace org.acme.sample

            participant SampleParticipant identified by participantId {
                o String participantId
                o String firstName
                o String lastName
            }`;

            let editedContent = `/**
             * Sample business network definition.
             */
                namespace org.acme.sample

            participant SampleParticipant identified by participantId {
                o String participantId
                o String firstName
                o String lastName
                o String middleName
            }`;

            let myEditorFile = new EditorFile('myId', 'myDisplayId', content, 'model');
            mockFileService.getFile.returns(myEditorFile);

            component.editorFile = myEditorFile;

            fixture.detectChanges();

            let mockCodeMirrorElement = editorFileElement.query(By.css('#editor-file_CodeMirror'));

            editorFileElement.componentInstance['editorContent'] = editedContent;

            mockCodeMirrorElement.triggerEventHandler('debounceFunc', null);

            mockBehaviourSubject.next.should.have.been.calledWith(true);
        });

        it('should update the code script file', () => {
            fixture.detectChanges();

            let content = `/**
             * Sample transaction processor function.
             * @param {org.acme.sample.SampleTransaction} tx The sample transaction instance.
             * @transaction
             */
            function sampleTransaction(tx) {
              
              console.log('hello');
            }`;

            let editedContent = `/**
             * Sample transaction processor function.
             * @param {org.acme.sample.SampleTransaction} tx The sample transaction instance.
             * @transaction
             */
            function sampleTransaction(tx) {
              
              console.log('hello');
              console.log('byeeeeeee');
            }`;

            let myEditorFile = new EditorFile('myId', 'myDisplayId', content, 'script');
            mockFileService.getFile.returns(myEditorFile);

            component.editorFile = myEditorFile;

            fixture.detectChanges();

            let mockCodeMirrorElement = editorFileElement.query(By.css('#editor-file_CodeMirror'));

            editorFileElement.componentInstance['editorContent'] = editedContent;

            mockCodeMirrorElement.triggerEventHandler('debounceFunc', null);

            mockBehaviourSubject.next.should.have.been.calledWith(true);
        });

        it('should update code an acl file', () => {
            fixture.detectChanges();

            let content = `/**
             * New access control file
             */
             rule AllAccess {
                 description: "AllAccess - grant everything to everybody."
                 participant: "org.hyperledger.composer.system.Participant"
                 operation: ALL
                 resource: "org.hyperledger.composer.system.**"
                 action: ALLOW
             }`;

            let editedContent = `/**
             * New access control file
             */
             rule AllAccess {
                 description: "AllAccess - grant everything to everybody and the world."
                 participant: "org.hyperledger.composer.system.Participant"
                 operation: ALL
                 resource: "org.hyperledger.composer.system.**"
                 action: ALLOW
             }`;

            let myEditorFile = new EditorFile('myId', 'myDisplayId', content, 'acl');
            mockFileService.getFile.returns(myEditorFile);

            component.editorFile = myEditorFile;

            fixture.detectChanges();

            let mockCodeMirrorElement = editorFileElement.query(By.css('#editor-file_CodeMirror'));

            editorFileElement.componentInstance['editorContent'] = editedContent;

            mockCodeMirrorElement.triggerEventHandler('debounceFunc', null);

            mockBehaviourSubject.next.should.have.been.calledWith(true);
        });

        it('should update code an query file', () => {
            fixture.detectChanges();

            let content = `query selectParticipants {
              description: "Select all participants"
              statement:
                  SELECT org.acme.sample.SampleParticipant
            }`;

            let editedContent = `query selectParticipants {
              description: "Select all participants in the world"
              statement:
                  SELECT org.acme.sample.SampleParticipant
            }`;

            let myEditorFile = new EditorFile('myId', 'myDisplayId', content, 'query');
            mockFileService.getFile.returns(myEditorFile);

            component.editorFile = myEditorFile;

            fixture.detectChanges();

            let mockCodeMirrorElement = editorFileElement.query(By.css('#editor-file_CodeMirror'));

            editorFileElement.componentInstance['editorContent'] = editedContent;

            mockCodeMirrorElement.triggerEventHandler('debounceFunc', null);

            mockBehaviourSubject.next.should.have.been.calledWith(true);
        });

        it('should update code an package file', () => {
            fixture.detectChanges();

            let content = `{\n  "name": "my network"\n}`;

            let editedContent = `{\n  "name": "my network",\n "version" : "0.3"\n}`;

            let myEditorFile = new EditorFile('myId', 'myDisplayId', content, 'package');
            mockFileService.getFile.returns(myEditorFile);

            component.editorFile = myEditorFile;

            fixture.detectChanges();

            let mockCodeMirrorElement = editorFileElement.query(By.css('#editor-file_CodeMirror'));

            editorFileElement.componentInstance['editorContent'] = editedContent;

            mockCodeMirrorElement.triggerEventHandler('debounceFunc', null);

            mockBehaviourSubject.next.should.have.been.calledWith(true);
        });

        it('should send version event with the package version', () => {
            fixture.detectChanges();

            let content = `{\n  "name": "my network"\n}`;

            let editedContent = `{\n  "name": "my network",\n "version" : "0.0.3"\n}`;

            let myEditorFile = new EditorFile('myId', 'myDisplayId', content, 'package');
            mockFileService.getFile.returns(myEditorFile);

            component.editorFile = myEditorFile;

            fixture.detectChanges();

            let mockCodeMirrorElement = editorFileElement.query(By.css('#editor-file_CodeMirror'));

            editorFileElement.componentInstance['editorContent'] = editedContent;

            mockCodeMirrorElement.triggerEventHandler('debounceFunc', null);

            component.editorFileVersionChange.should.have.been.calledWith({version: '0.0.3', jsonErr: false});
        });

        it('should send event with null version and jsonErr true if the package json cannot be parsed', () => {
            fixture.detectChanges();

            let content = `{\n  "name": "my network"\n}`;

            let editedContent = `{\n  "name": "my network"\n "version" : "0.0.3"\n}`;

            let myEditorFile = new EditorFile('myId', 'myDisplayId', content, 'package');
            mockFileService.getFile.returns(myEditorFile);

            component.editorFile = myEditorFile;

            fixture.detectChanges();

            let mockCodeMirrorElement = editorFileElement.query(By.css('#editor-file_CodeMirror'));

            editorFileElement.componentInstance['editorContent'] = editedContent;

            mockCodeMirrorElement.triggerEventHandler('debounceFunc', null);

            component.editorFileVersionChange.should.have.been.calledWith({ version: null, jsonErr: true });
        });

        it('should update code an readme file', () => {
            fixture.detectChanges();

            let content = `readme`;

            let editedContent = 'my readme';

            let myEditorFile = new EditorFile('myId', 'myDisplayId', content, 'readme');
            mockFileService.getFile.returns(myEditorFile);

            component.editorFile = myEditorFile;

            fixture.detectChanges();

            let mockCodeMirrorElement = editorFileElement.query(By.css('#editor-file_CodeMirror'));

            editorFileElement.componentInstance['editorContent'] = editedContent;

            mockCodeMirrorElement.triggerEventHandler('debounceFunc', null);

            mockBehaviourSubject.next.should.have.been.calledWith(true);

            editorFileElement.componentInstance.previewContent.should.equal(`<p>my readme</p>\n`);
        });

        it('should handle an error being thrown', () => {
            fixture.detectChanges();

            let content = `/**
             * Sample business network definition.
             */
                namespace org.acme.sample

            participant SampleParticipant identified by participantId {
                o String participantId
                o String firstName
                o String lastName
            }`;

            let editedContent = `/**
             * Sample business network definition.
             */
                namespace org.acme.sample

            participant SampleParticipant identified by participantId {
                o String participantId
                o String firstName
                o String lastName
                o String middleName
            }`;

            let myEditorFile = new EditorFile('myId', 'myDisplayId', content, 'model');
            mockFileService.getFile.returns(myEditorFile);
            mockFileService.updateFile.throws('Error');

            component.editorFile = myEditorFile;

            fixture.detectChanges();

            let mockCodeMirrorElement = editorFileElement.query(By.css('#editor-file_CodeMirror'));

            editorFileElement.componentInstance['editorContent'] = editedContent;

            mockCodeMirrorElement.triggerEventHandler('debounceFunc', null);

            mockBehaviourSubject.next.should.have.been.calledWith(false);

            should.exist(editorFileElement.componentInstance.currentError);
        });

        it('should not update if content hasn\'t changed', () => {
            fixture.detectChanges();

            let content = `/**
             * Sample business network definition.
             */
                namespace org.acme.sample

            participant SampleParticipant identified by participantId {
                o String participantId
                o String firstName
                o String lastName
            }`;

            let editedContent = `/**
             * Sample business network definition.
             */
                namespace org.acme.sample

            participant SampleParticipant identified by participantId {
                o String participantId
                o String firstName
                o String lastName
            }`;

            let myEditorFile = new EditorFile('myId', 'myDisplayId', content, 'model');
            mockFileService.getFile.returns(myEditorFile);

            component.editorFile = myEditorFile;

            fixture.detectChanges();

            let mockCodeMirrorElement = editorFileElement.query(By.css('#editor-file_CodeMirror'));

            editorFileElement.componentInstance['editorContent'] = editedContent;

            mockCodeMirrorElement.triggerEventHandler('debounceFunc', null);

            mockBehaviourSubject.next.should.not.have.been.called;
        });

        it('should not update if loading', () => {
            fixture.detectChanges();

            let content = `/**
             * Sample business network definition.
             */
                namespace org.acme.sample

            participant SampleParticipant identified by participantId {
                o String participantId
                o String firstName
                o String lastName
            }`;

            let editedContent = `/**
             * Sample business network definition.
             */
                namespace org.acme.sample

            participant SampleParticipant identified by participantId {
                o String participantId
                o String firstName
                o String lastName
                o String middleName
            }`;

            let myEditorFile = new EditorFile('myId', 'myDisplayId', content, 'model');
            mockFileService.getFile.returns(myEditorFile);

            component.editorFile = myEditorFile;

            fixture.detectChanges();

            editorFileElement.componentInstance.changingCurrentFile = true;

            let mockCodeMirrorElement = editorFileElement.query(By.css('#editor-file_CodeMirror'));

            editorFileElement.componentInstance['editorContent'] = editedContent;

            mockCodeMirrorElement.triggerEventHandler('debounceFunc', null);

            mockBehaviourSubject.next.should.not.have.been.called;
        });

        it('should set the error text if there is an error updating the business network', () => {
            fixture.detectChanges();

            let content = `/**
             * Sample business network definition.
             */
                namespace org.acme.sample

            participant SampleParticipant identified by participantId {
                o String participantId
                o String firstName
                o String lastName
            }`;

            let editedContent = `/**
             * Sample business network definition.
             */
                namespace org.acme.sample

            participant SampleParticipant identified by participantId {
                o String participantId
                o String firstName
                o String lastName
                o String middleName
            }`;

            let myEditorFile = new EditorFile('myId', 'myDisplayId', content, 'conga');
            let isModelStub = sinon.stub(myEditorFile, 'isModel');
            isModelStub.onCall(0).returns(true);
            isModelStub.onCall(1).returns(false);
            mockFileService.getFile.returns(myEditorFile);
            mockFileService.updateFile.throws('No file type');

            component.editorFile = myEditorFile;

            fixture.detectChanges();

            let mockCodeMirrorElement = editorFileElement.query(By.css('#editor-file_CodeMirror'));

            editorFileElement.componentInstance['editorContent'] = editedContent;

            mockCodeMirrorElement.triggerEventHandler('debounceFunc', null);

            mockBehaviourSubject.next.should.have.been.calledWith(false);
            editorFileElement.componentInstance.currentError.should.equal('No file type');
        });
    });
});
