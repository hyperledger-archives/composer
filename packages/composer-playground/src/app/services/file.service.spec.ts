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
import { TestBed, inject, fakeAsync } from '@angular/core/testing';

import * as sinon from 'sinon';
import * as chai from 'chai';

let should = chai.should();
let assert = chai.assert;

import { EditorFile } from './editor-file';
import { FileService } from './file.service';
import { ModelFile, BusinessNetworkDefinition, Script, AclFile, QueryFile } from 'composer-common';
import { ClientService } from './client.service';

describe('FileService', () => {

    let sandbox;

    let mockClientService;
    let businessNetworkDefMock;
    let modelFileMock;
    let aclFileMock;
    let scriptFileMock;
    let queryFileMock;

    beforeEach(() => {

        modelFileMock = sinon.createStubInstance(ModelFile);
        scriptFileMock = sinon.createStubInstance(Script);
        aclFileMock = sinon.createStubInstance(AclFile);
        queryFileMock = sinon.createStubInstance(QueryFile);
        businessNetworkDefMock = sinon.createStubInstance(BusinessNetworkDefinition);
        mockClientService = sinon.createStubInstance(ClientService);
        sandbox = sinon.sandbox.create();

        TestBed.configureTestingModule({
            providers: [FileService,
                {provide: ClientService, useValue: mockClientService}]
        });
    });

    describe('getFile', () => {

        it('should return model files when provided with the model file type', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the model', 'model');
            let file2 = new EditorFile('2', '2', 'this is the 2 model', 'model');
            let testModels = new Map<string, EditorFile>();

            testModels.set('1', file);
            testModels.set('2', file2);

            fileService['modelFiles'] = testModels;

            let testFile = fileService.getFile('1', 'model');

            testFile.getId().should.equal('1');
            testFile.getContent().should.equal('this is the model');
            testFile.getType().should.equal('model');

        })));

        it('should return script files when provided with the script file type', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the script', 'script');
            let file2 = new EditorFile('2', '2', 'this is the 2 script', 'script');
            let testScripts = new Map<string, EditorFile>();

            testScripts.set('1', file);
            testScripts.set('2', file2);

            fileService['scriptFiles'] = testScripts;

            let testFile = fileService.getFile('1', 'script');

            testFile.getId().should.equal('1');
            testFile.getContent().should.equal('this is the script');
            testFile.getType().should.equal('script');

        })));

        it('should return the query file when provided with the query file type', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the query', 'query');

            fileService['queryFile'] = file;

            let testFile = fileService.getFile('1', 'query');

            testFile.getId().should.equal('1');
            testFile.getContent().should.equal('this is the query');
            testFile.getType().should.equal('query');

        })));

        it('should return the acl file when provided with the acl file type', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the acl', 'acl');

            fileService['aclFile'] = file;

            let testFile = fileService.getFile('1', 'acl');

            testFile.getId().should.equal('1');
            testFile.getContent().should.equal('this is the acl');
            testFile.getType().should.equal('acl');

        })));

        it('should return the readme file when provided with the readme file type', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the readme', 'readme');

            fileService['readMe'] = file;

            let testFile = fileService.getFile('1', 'readme');

            testFile.getId().should.equal('1');
            testFile.getContent().should.equal('this is the readme');
            testFile.getType().should.equal('readme');

        })));

        it('should return the packageJson file when provided with the package file type', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the packageJson', 'package');

            fileService['packageJson'] = file;

            let testFile = fileService.getFile('1', 'package');

            testFile.getId().should.equal('1');
            testFile.getContent().should.equal('this is the packageJson');
            testFile.getType().should.equal('package');

        })));

        it('should throw an error if none of the above cases are matched', fakeAsync(inject([FileService], (fileService: FileService) => {
            let id = '1';
            let type = 'octopus';

            (() => {
                fileService.getFile(id, type);
            }).should.throw(/Type passed must be one of readme, acl, query, script, model or packageJson/);

        })));
    });

    describe('getReadMe', () => {
        it('should return the readme file', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the readme', 'readme');

            fileService['readMe'] = file;

            let testReadMeFile = fileService.getEditorReadMe();

            testReadMeFile.getId().should.equal('1');
            testReadMeFile.getContent().should.equal('this is the readme');
            testReadMeFile.getType().should.equal('readme');
        })));
    });

    describe('getEditorModelFiles', () => {
        it('should return all of the model files', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the model', 'model');
            let file2 = new EditorFile('2', '2', 'this is the model 2', 'model');
            let testModels = new Map<string, EditorFile>();

            testModels.set('1', file);
            testModels.set('2', file2);

            fileService['modelFiles'] = testModels;

            let testModelsArray = fileService.getEditorModelFiles();

            testModelsArray[0].getId().should.equal('1');
            testModelsArray[0].getContent().should.equal('this is the model');
            testModelsArray[0].getType().should.equal('model');

            testModelsArray[1].getId().should.equal('2');
            testModelsArray[1].getContent().should.equal('this is the model 2');
            testModelsArray[1].getType().should.equal('model');
        })));
    });

    describe('getScriptFiles', () => {
        it('should return all of the script files', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the script', 'script');
            let file2 = new EditorFile('2', '2', 'this is the script 2', 'script');
            let testScripts = new Map<string, EditorFile>();

            testScripts.set('1', file);
            testScripts.set('2', file2);

            fileService['scriptFiles'] = testScripts;

            let testScriptsArray = fileService.getEditorScriptFiles();

            testScriptsArray[0].getId().should.equal('1');
            testScriptsArray[0].getContent().should.equal('this is the script');
            testScriptsArray[0].getType().should.equal('script');

            testScriptsArray[1].getId().should.equal('2');
            testScriptsArray[1].getContent().should.equal('this is the script 2');
            testScriptsArray[1].getType().should.equal('script');
        })));
    });

    describe('getAclFile', () => {
        it('should return the acl file', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the acl', 'acl');

            fileService['aclFile'] = file;

            let testAclFile = fileService.getEditorAclFile();

            testAclFile.getId().should.equal('1');
            testAclFile.getContent().should.equal('this is the acl');
            testAclFile.getType().should.equal('acl');
        })));
    });

    describe('getQueryFile', () => {
        it('should return the query file', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the query', 'query');

            fileService['queryFile'] = file;

            let testQueryFile = fileService.getEditorQueryFile();

            testQueryFile.getId().should.equal('1');
            testQueryFile.getContent().should.equal('this is the query');
            testQueryFile.getType().should.equal('query');
        })));
    });

    describe('getPackageFile', () => {
        it('should return the package file', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the package', 'package');

            fileService['packageJson'] = file;

            let testPackageFile = fileService.getEditorPackageFile();

            testPackageFile.getId().should.equal('1');
            testPackageFile.getContent().should.equal('this is the package');
            testPackageFile.getType().should.equal('package');
        })));
    });

    describe('getEditorFiles', () => {

        it('should return an empty array if no files stored in the file service', fakeAsync(inject([FileService], (fileService: FileService) => {
            let testArray = fileService.getEditorFiles();

        })));

        it('should return the readme if only readme stored in the file service', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the readme', 'readme');

            fileService['readMe'] = file;

            let testArray = fileService.getEditorFiles();

            testArray[0].getId().should.equal('1');
            testArray[0].getContent().should.equal('this is the readme');
            testArray[0].getType().should.equal('readme');
        })));

        it('should return readme + model files if they are only items stored in the file service', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the readme', 'readme');
            let file2 = new EditorFile('1', '1', 'this is the model', 'model');

            let testModels = new Map<string, EditorFile>();
            testModels.set('1', file2);

            fileService['readMe'] = file;
            fileService['modelFiles'] = testModels;

            let testArray = fileService.getEditorFiles();

            testArray[0].getId().should.equal('1');
            testArray[0].getContent().should.equal('this is the readme');
            testArray[0].getType().should.equal('readme');

            testArray[1].getId().should.equal('1');
            testArray[1].getContent().should.equal('this is the model');
            testArray[1].getType().should.equal('model');
        })));

        it('should return readme + model + script files if they are only items stored in the file service', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the readme', 'readme');
            let file2 = new EditorFile('1', '1', 'this is the model', 'model');
            let file3 = new EditorFile('1', '1', 'this is the script', 'script');

            let testModels = new Map<string, EditorFile>();
            let testScripts = new Map<string, EditorFile>();

            testModels.set('1', file2);
            testScripts.set('1', file3);

            fileService['readMe'] = file;
            fileService['modelFiles'] = testModels;
            fileService['scriptFiles'] = testScripts;

            let testArray = fileService.getEditorFiles();

            testArray[0].getId().should.equal('1');
            testArray[0].getContent().should.equal('this is the readme');
            testArray[0].getType().should.equal('readme');

            testArray[1].getId().should.equal('1');
            testArray[1].getContent().should.equal('this is the model');
            testArray[1].getType().should.equal('model');

            testArray[2].getId().should.equal('1');
            testArray[2].getContent().should.equal('this is the script');
            testArray[2].getType().should.equal('script');
        })));

        it('should return readme + model + script + acl files if they are only items stored in the file service', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the readme', 'readme');
            let file2 = new EditorFile('1', '1', 'this is the model', 'model');
            let file3 = new EditorFile('1', '1', 'this is the script', 'script');
            let file4 = new EditorFile('1', '1', 'this is the acl', 'acl');

            let testModels = new Map<string, EditorFile>();
            let testScripts = new Map<string, EditorFile>();

            testModels.set('1', file2);
            testScripts.set('1', file3);

            fileService['readMe'] = file;
            fileService['modelFiles'] = testModels;
            fileService['scriptFiles'] = testScripts;
            fileService['aclFile'] = file4;

            let testArray = fileService.getEditorFiles();

            testArray[0].getId().should.equal('1');
            testArray[0].getContent().should.equal('this is the readme');
            testArray[0].getType().should.equal('readme');

            testArray[1].getId().should.equal('1');
            testArray[1].getContent().should.equal('this is the model');
            testArray[1].getType().should.equal('model');

            testArray[2].getId().should.equal('1');
            testArray[2].getContent().should.equal('this is the script');
            testArray[2].getType().should.equal('script');

            testArray[3].getId().should.equal('1');
            testArray[3].getContent().should.equal('this is the acl');
            testArray[3].getType().should.equal('acl');
        })));

        it('should return readme + model + script + acl + query files if they are only items stored in the file service', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the readme', 'readme');
            let file2 = new EditorFile('1', '1', 'this is the model', 'model');
            let file3 = new EditorFile('1', '1', 'this is the script', 'script');
            let file4 = new EditorFile('1', '1', 'this is the acl', 'acl');
            let file5 = new EditorFile('1', '1', 'this is the query', 'query');

            let testModels = new Map<string, EditorFile>();
            let testScripts = new Map<string, EditorFile>();

            testModels.set('1', file2);
            testScripts.set('1', file3);

            fileService['readMe'] = file;
            fileService['modelFiles'] = testModels;
            fileService['scriptFiles'] = testScripts;
            fileService['aclFile'] = file4;
            fileService['queryFile'] = file5;

            let testArray = fileService.getEditorFiles();

            testArray[0].getId().should.equal('1');
            testArray[0].getContent().should.equal('this is the readme');
            testArray[0].getType().should.equal('readme');

            testArray[1].getId().should.equal('1');
            testArray[1].getContent().should.equal('this is the model');
            testArray[1].getType().should.equal('model');

            testArray[2].getId().should.equal('1');
            testArray[2].getContent().should.equal('this is the script');
            testArray[2].getType().should.equal('script');

            testArray[3].getId().should.equal('1');
            testArray[3].getContent().should.equal('this is the acl');
            testArray[3].getType().should.equal('acl');

            testArray[4].getId().should.equal('1');
            testArray[4].getContent().should.equal('this is the query');
            testArray[4].getType().should.equal('query');
        })));

        it('should return readme + pacakage + model + script + acl + query files if they are only items stored in the file service', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the readme', 'readme');
            let file2 = new EditorFile('1', '1', 'this is the model', 'model');
            let file3 = new EditorFile('1', '1', 'this is the script', 'script');
            let file4 = new EditorFile('1', '1', 'this is the acl', 'acl');
            let file5 = new EditorFile('1', '1', 'this is the query', 'query');
            let file6 = new EditorFile('1', '1', 'this is the package', 'package');

            let testModels = new Map<string, EditorFile>();
            let testScripts = new Map<string, EditorFile>();

            testModels.set('1', file2);
            testScripts.set('1', file3);

            fileService['readMe'] = file;
            fileService['modelFiles'] = testModels;
            fileService['scriptFiles'] = testScripts;
            fileService['aclFile'] = file4;
            fileService['queryFile'] = file5;
            fileService['packageJson'] = file6;

            let testArray = fileService.getEditorFiles();

            testArray[0].getId().should.equal('1');
            testArray[0].getContent().should.equal('this is the readme');
            testArray[0].getType().should.equal('readme');

            testArray[1].getId().should.equal('1');
            testArray[1].getContent().should.equal('this is the package');
            testArray[1].getType().should.equal('package');

            testArray[2].getId().should.equal('1');
            testArray[2].getContent().should.equal('this is the model');
            testArray[2].getType().should.equal('model');

            testArray[3].getId().should.equal('1');
            testArray[3].getContent().should.equal('this is the script');
            testArray[3].getType().should.equal('script');

            testArray[4].getId().should.equal('1');
            testArray[4].getContent().should.equal('this is the acl');
            testArray[4].getType().should.equal('acl');

            testArray[5].getId().should.equal('1');
            testArray[5].getContent().should.equal('this is the query');
            testArray[5].getType().should.equal('query');
        })));
    });

    describe('addFile', () => {
        it('should add a new model file if one with the same ID does not exist', fakeAsync(inject([FileService], (fileService: FileService) => {

            let id = '1';
            let displayID = '1';
            let content = 'this is the model';
            let type = 'model';

            fileService.addFile(id, displayID, content, type);

            let testModels = fileService.getEditorModelFiles();

            testModels[0].getId().should.equal('1');
            testModels[0].getContent().should.equal('this is the model');
            testModels[0].getType().should.equal('model');

            fileService['dirty'].should.equal(true);
        })));

        it('should throw an error when trying to add a model file with existing ID', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the model', 'model');
            let testModels = new Map<string, EditorFile>();

            testModels.set('1', file);

            fileService['modelFiles'] = testModels;

            let id = '1';
            let displayID = '1';
            let content = 'this is the model';
            let type = 'model';

            (() => {
                fileService.addFile(id, displayID, content, type);
            }).should.throw(/FileService already contains model file with ID: 1/);

            fileService['dirty'].should.equal(false);
        })));

        it('should add a new script file if one with the same ID does not exist', fakeAsync(inject([FileService], (fileService: FileService) => {
            let id = '1';
            let displayID = '1';
            let content = 'this is the script';
            let type = 'script';

            fileService.addFile(id, displayID, content, type);

            let testScripts = fileService.getEditorScriptFiles();

            testScripts[0].getId().should.equal('1');
            testScripts[0].getContent().should.equal('this is the script');
            testScripts[0].getType().should.equal('script');

            fileService['dirty'].should.equal(true);
        })));

        it('should throw an error when trying to add a script file with existing ID', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the script', 'script');
            let testScripts = new Map<string, EditorFile>();

            testScripts.set('1', file);

            fileService['scriptFiles'] = testScripts;

            let id = '1';
            let displayID = '1';
            let content = 'this is the script';
            let type = 'script';

            (() => {
                fileService.addFile(id, displayID, content, type);
            }).should.throw(/FileService already contains script file with ID: 1/);

            fileService['dirty'].should.equal(false);
        })));

        it('should add a new query file if one with the same ID does not exist', fakeAsync(inject([FileService], (fileService: FileService) => {
            let id = '1';
            let displayID = '1';
            let content = 'this is the query';
            let type = 'query';

            fileService.addFile(id, displayID, content, type);

            let testQuery = fileService.getEditorQueryFile();

            testQuery.getId().should.equal('1');
            testQuery.getContent().should.equal('this is the query');
            testQuery.getType().should.equal('query');

            fileService['dirty'].should.equal(true);
        })));

        it('should throw an error when trying to add a query file with existing ID', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the query', 'query');

            fileService['queryFile'] = file;

            let id = '1';
            let displayID = '1';
            let content = 'this is the query';
            let type = 'query';

            (() => {
                fileService.addFile(id, displayID, content, type);
            }).should.throw(/FileService already contains a query file/);

            fileService['dirty'].should.equal(false);
        })));

        it('should add a new acl file if one with the same ID does not exist', fakeAsync(inject([FileService], (fileService: FileService) => {
            let id = '1';
            let displayID = '1';
            let content = 'this is the acl';
            let type = 'acl';

            fileService.addFile(id, displayID, content, type);

            let testAcl = fileService.getEditorAclFile();

            testAcl.getId().should.equal('1');
            testAcl.getContent().should.equal('this is the acl');
            testAcl.getType().should.equal('acl');

            fileService['dirty'].should.equal(true);
        })));

        it('should throw an error when trying to add an acl file with existing ID', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the acl', 'acl');

            fileService['aclFile'] = file;

            let id = '1';
            let displayID = '1';
            let content = 'this is the acl';
            let type = 'acl';

            (() => {
                fileService.addFile(id, displayID, content, type);
            }).should.throw(/FileService already contains an acl file/);

            fileService['dirty'].should.equal(false);
        })));

        it('should add a new readme if one with the same ID does not exist', fakeAsync(inject([FileService], (fileService: FileService) => {
            let id = '1';
            let displayID = '1';
            let content = 'this is the readme';
            let type = 'readme';

            fileService.addFile(id, displayID, content, type);

            let testReadMe = fileService.getEditorReadMe();

            testReadMe.getId().should.equal('1');
            testReadMe.getContent().should.equal('this is the readme');
            testReadMe.getType().should.equal('readme');

            fileService['dirty'].should.equal(true);
        })));

        it('should throw an error when trying to add a readme file with existing ID', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the readme', 'readme');

            fileService['readMe'] = file;

            let id = '1';
            let displayID = '1';
            let content = 'this is the readme';
            let type = 'readme';

            (() => {
                fileService.addFile(id, displayID, content, type);
            }).should.throw(/FileService already contains a readme file/);

            fileService['dirty'].should.equal(false);
        })));

        it('should add a new package if one with the same ID does not exist', fakeAsync(inject([FileService], (fileService: FileService) => {
            let id = '1';
            let displayID = '1';
            let content = 'this is the package';
            let type = 'package';

            fileService.addFile(id, displayID, content, type);

            let testPackage = fileService.getEditorPackageFile();

            testPackage.getId().should.equal('1');
            testPackage.getContent().should.equal('this is the package');
            testPackage.getType().should.equal('package');

            fileService['dirty'].should.equal(true);
        })));

        it('should throw an error when trying to add a package file with existing ID', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the package', 'package');

            fileService['packageJson'] = file;

            let id = '1';
            let displayID = '1';
            let content = 'this is the package';
            let type = 'package';

            (() => {
                fileService.addFile(id, displayID, content, type);
            }).should.throw(/FileService already contains a package.json file/);

            fileService['dirty'].should.equal(false);
        })));

        it('should default to throwing an error', fakeAsync(inject([FileService], (fileService: FileService) => {
            let id = '1';
            let displayID = '1';
            let content = 'this is the octopus';
            let type = 'octopus';

            (() => {
                fileService.addFile(id, displayID, content, type);
            }).should.throw(/Attempted addition of unknown file type: octopus/);

            fileService['dirty'].should.equal(false);
        })));
    });

    describe('incrementBusinessNetworkVersion', () => {
        it('should increment prerelease version in the packageJson file', inject([FileService], (fileService: FileService) => {
            let businessNetworkChangedSpy = sinon.spy(fileService.businessNetworkChanged$, 'next');

            let file = new EditorFile('package', 'package', JSON.stringify({name: 'composer-ftw', version: '1.0.0'}), 'package');
            fileService['packageJson'] = file;

            fileService.incrementBusinessNetworkVersion();

            fileService['packageJson'].getContent().should.equal('{\n  "name": "composer-ftw",\n  "version": "1.0.1-deploy.0"\n}');
            fileService['dirty'].should.equal(false);
            businessNetworkChangedSpy.should.have.been.calledWith(true);
        }));
    });

    describe('updateBusinessNetworkVersion', () => {
        it('should update version in the packageJson file', inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('package', 'package', JSON.stringify({name: 'composer-ftw', version: '1.0.0'}), 'package');

            fileService['packageJson'] = file;

            sinon.stub(fileService, 'validateFile').returns(null);

            let updatedPackageFile = fileService.updateBusinessNetworkVersion('1.0.1-test.0');

            updatedPackageFile.getContent().should.equal('{\n  "name": "composer-ftw",\n  "version": "1.0.1-test.0"\n}');
            fileService['packageJson'].should.deep.equal(updatedPackageFile);
            fileService['dirty'].should.equal(true);
        }));
    });

    describe('updateFile', () => {
        it('should update the correct model file', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the model', 'model');
            let testModels = new Map<string, EditorFile>();

            let id = '1';
            let content = 'this is the NEW model';
            let type = 'model';

            testModels.set('1', file);

            sinon.stub(fileService, 'getModelFile');
            sinon.stub(fileService, 'validateFile').returns(null);

            fileService['modelFiles'] = testModels;

            fileService.updateFile(id, content, type);

            let testFile = fileService.getFile('1', 'model');

            testFile.getId().should.equal('1');
            testFile.getContent().should.equal('this is the NEW model');
            testFile.getType().should.equal('model');

            fileService['dirty'].should.equal(true);
        })));

        it('should update the correct model file with a namespace change', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the model', 'model');
            let testModels = new Map<string, EditorFile>();

            let id = '1';
            let content = 'this is the NEW model';
            let type = 'model';

            testModels.set('1', file);

            sinon.stub(fileService, 'getModelFile').returns({getName: sinon.stub().returns('myName')});
            sinon.stub(fileService, 'modelNamespaceCollides').returns(false);

            sinon.stub(fileService, 'createModelFile').returns({
                getNamespace: sinon.stub().returns('myNamespace'),
                getName: sinon.stub().returns('myName'),
                getDefinitions: sinon.stub().returns('myDefs')
            });

            sinon.stub(fileService, 'validateFile').returns(null);

            let addFileStub = sinon.stub(fileService, 'addFile').returns('myFile');
            let deleteFileStub = sinon.stub(fileService, 'deleteFile');

            fileService['modelFiles'] = testModels;

            let result = fileService.updateFile(id, content, type);

            result.should.equal('myFile');

            let testFile = fileService.getFile('1', 'model');

            testFile.getId().should.equal('1');
            testFile.getContent().should.equal('this is the NEW model');
            testFile.getType().should.equal('model');

            deleteFileStub.should.have.been.called;

            fileService['dirty'].should.equal(true);
        })));

        it('should return if namespace collides', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the model', 'model');
            let testModels = new Map<string, EditorFile>();

            let id = '1';
            let content = 'this is the NEW model';
            let type = 'model';

            testModels.set('1', file);

            let addFileStub = sinon.stub(fileService, 'addFile').returns('myFile');

            sinon.stub(fileService, 'getModelFile').returns({getName: sinon.stub().returns('myName')});
            sinon.stub(fileService, 'modelNamespaceCollides').returns(true);

            sinon.stub(fileService, 'createModelFile').returns({
                getNamespace: sinon.stub().returns('myNamespace'),
                getName: sinon.stub().returns('myName'),
                getDefinitions: sinon.stub().returns('myDefs')
            });

            sinon.stub(fileService, 'validateFile').returns(null);

            fileService['modelFiles'] = testModels;

            fileService.updateFile(id, content, type);

            fileService['dirty'].should.equal(false);

            addFileStub.should.not.have.been.called;
        })));

        it('should throw an error if validate file returns a message for model files', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the model', 'model');
            let testModels = new Map<string, EditorFile>();

            let id = '1';
            let content = 'this is the NEW model';
            let type = 'model';

            testModels.set('1', file);

            sinon.stub(fileService, 'getModelFile').returns({getName: sinon.stub().returns('myName')});

            sinon.stub(fileService, 'createModelFile').returns({
                getNamespace: sinon.stub().returns('myNamespace'),
                getName: sinon.stub().returns('myName'),
                getDefinitions: sinon.stub().returns('myDefs')
            });

            sinon.stub(fileService, 'validateFile').returns('Validator error message');

            fileService['modelFiles'] = testModels;

            (() => {
                fileService.updateFile(id, content, type);
            }).should.throw(/Validator error message/);

            fileService['dirty'].should.equal(false);
        })));

        it('should throw an error if there is no model file with the given ID', fakeAsync(inject([FileService], (fileService: FileService) => {
            let id = '1';
            let content = 'this is the NEW model';
            let type = 'model';

            (() => {
                fileService.updateFile(id, content, type);
            }).should.throw(/File does not exist of type model and id 1/);

            fileService['dirty'].should.equal(false);
        })));

        it('should update the correct model file with a not namespace', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the model', 'model');
            let testModels = new Map<string, EditorFile>();

            let id = '1';
            let content = 'this is the NEW model';
            let type = 'model';

            testModels.set('1', file);

            sinon.stub(fileService, 'getModelFile').returns({getName: sinon.stub().returns('myName')});
            sinon.stub(fileService, 'createModelFile').returns({
                getNamespace: sinon.stub().returns('1'),
                getName: sinon.stub().returns('myName'),
                getDefinitions: sinon.stub().returns('myDefs')
            });

            sinon.stub(fileService, 'modelNamespaceCollides').returns(false);

            sinon.stub(fileService, 'validateFile').returns(null);

            let addFileStub = sinon.stub(fileService, 'addFile');

            fileService['modelFiles'] = testModels;

            fileService.updateFile(id, content, type);

            let testFile = fileService.getFile('1', 'model');

            testFile.getId().should.equal('1');
            testFile.getContent().should.equal('this is the NEW model');
            testFile.getType().should.equal('model');

            addFileStub.should.not.have.been.called;

            fileService['dirty'].should.equal(true);
        })));

        it('should update the correct script file', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the script', 'script');
            let testScripts = new Map<string, EditorFile>();

            sinon.stub(fileService, 'validateFile').returns(null);

            let id = '1';
            let content = 'this is the NEW script';
            let type = 'script';

            testScripts.set('1', file);

            fileService['scriptFiles'] = testScripts;

            fileService.updateFile(id, content, type);

            let testFile = fileService.getFile('1', 'script');

            testFile.getId().should.equal('1');
            testFile.getContent().should.equal('this is the NEW script');
            testFile.getType().should.equal('script');

            fileService['dirty'].should.equal(true);
        })));

        it('should through an error if validate file on the script returns something', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the script', 'script');
            let testScripts = new Map<string, EditorFile>();

            sinon.stub(fileService, 'validateFile').returns('Validator error message');

            let id = '1';
            let content = 'this is the NEW script';
            let type = 'script';

            testScripts.set('1', file);

            fileService['scriptFiles'] = testScripts;

            (() => {
                fileService.updateFile(id, content, type);
            }).should.throw(/Validator error message/);

            fileService['dirty'].should.equal(false);
        })));

        it('should throw an error if there is no script file with the given ID', fakeAsync(inject([FileService], (fileService: FileService) => {
            let id = '1';
            let content = 'this is the NEW script';
            let type = 'script';

            (() => {
                fileService.updateFile(id, content, type);
            }).should.throw(/File does not exist of type script and id 1/);

            fileService['dirty'].should.equal(false);
        })));

        it('should update the correct query file', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the query', 'query');

            let id = '1';
            let content = 'this is the NEW query';
            let type = 'query';

            fileService['queryFile'] = file;

            sinon.stub(fileService, 'validateFile').returns(null);

            fileService.updateFile(id, content, type);

            let testFile = fileService.getFile('1', 'query');

            testFile.getId().should.equal('1');
            testFile.getContent().should.equal('this is the NEW query');
            testFile.getType().should.equal('query');

            fileService['dirty'].should.equal(true);
        })));

        it('should through an error if validate file on the query returns something', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the query', 'query');

            let id = '1';
            let content = 'this is the NEW query';
            let type = 'query';

            fileService['queryFile'] = file;

            sinon.stub(fileService, 'validateFile').returns('Validator error message');

            (() => {
                fileService.updateFile(id, content, type);
            }).should.throw(/Validator error message/);

            fileService['dirty'].should.equal(false);
        })));

        it('should throw an error if there is no query file with the given ID', fakeAsync(inject([FileService], (fileService: FileService) => {
            let id = '1';
            let content = 'this is the NEW query';
            let type = 'query';

            (() => {
                fileService.updateFile(id, content, type);
            }).should.throw(/Query file does not exist in file service/);

            fileService['dirty'].should.equal(false);
        })));

        it('should update the correct acl file', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the acl', 'acl');

            sinon.stub(fileService, 'validateFile').returns(null);

            let id = '1';
            let content = 'this is the NEW acl';
            let type = 'acl';

            fileService['aclFile'] = file;

            fileService.updateFile(id, content, type);

            let testFile = fileService.getFile('1', 'acl');

            testFile.getId().should.equal('1');
            testFile.getContent().should.equal('this is the NEW acl');
            testFile.getType().should.equal('acl');

            fileService['dirty'].should.equal(true);
        })));

        it('should through an error if validate file on the acl returns something', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the acl', 'acl');

            sinon.stub(fileService, 'validateFile').returns('Validator error message');

            let id = '1';
            let content = 'this is the NEW acl';
            let type = 'acl';

            fileService['aclFile'] = file;

            (() => {
                fileService.updateFile(id, content, type);
            }).should.throw(/Validator error message/);

            fileService['dirty'].should.equal(false);
        })));

        it('should throw an error if there is no acl file with the given ID', fakeAsync(inject([FileService], (fileService: FileService) => {
            let id = '1';
            let content = 'this is the NEW acl';
            let type = 'acl';

            (() => {
                fileService.updateFile(id, content, type);
            }).should.throw(/Acl file does not exist in file service/);

            fileService['dirty'].should.equal(false);
        })));

        it('should update the correct readme file', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the readme', 'readme');

            let id = '1';
            let content = 'this is the NEW readme';
            let type = 'readme';

            fileService['readMe'] = file;

            fileService.updateFile(id, content, type);

            let testFile = fileService.getFile('1', 'readme');

            testFile.getId().should.equal('1');
            testFile.getContent().should.equal('this is the NEW readme');
            testFile.getType().should.equal('readme');

            fileService['dirty'].should.equal(true);
        })));

        it('should throw an error if there is no readme file with the given ID', fakeAsync(inject([FileService], (fileService: FileService) => {
            let id = '1';
            let content = 'this is the NEW readme';
            let type = 'readme';

            (() => {
                fileService.updateFile(id, content, type);
            }).should.throw(/ReadMe file does not exist in file service/);

            fileService['dirty'].should.equal(false);
        })));

        it('should update the correct packageJson file', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', '{"name" : "this is the NEW packageJson"}', 'package');

            let id = '1';
            let content = '{"name" : "this is the NEW packageJson"}';
            let type = 'package';

            fileService['packageJson'] = file;

            sinon.stub(fileService, 'validateFile').returns(null);

            fileService.updateFile(id, content, type);

            let testFile = fileService.getFile('1', 'package');

            testFile.getId().should.equal('1');
            testFile.getContent().should.deep.equal('{"name" : "this is the NEW packageJson"}');
            testFile.getType().should.equal('package');

            fileService['dirty'].should.equal(true);
        })));

        it('should through an error if validate file on the packageJSON returns something', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', '{"name" : "this is the NEW packageJson"}', 'package');

            let id = '1';
            let content = '{"name" : "this is the NEW packageJson"}';
            let type = 'package';

            fileService['packageJson'] = file;

            sinon.stub(fileService, 'validateFile').returns('Validator error message');

            (() => {
                fileService.updateFile(id, content, type);
            }).should.throw(/Validator error message/);

            fileService['dirty'].should.equal(false);
        })));

        it('should throw an error if there is no packageJson file with the given ID', fakeAsync(inject([FileService], (fileService: FileService) => {
            let id = '1';
            let content = 'this is the NEW packageJson';
            let type = 'package';

            (() => {
                fileService.updateFile(id, content, type);
            }).should.throw(/PackageJson file does not exist in file service/);

            fileService['dirty'].should.equal(false);
        })));

        it('should default to throwing an error', fakeAsync(inject([FileService], (fileService: FileService) => {
            let id = '1';
            let content = 'this is the octopus';
            let type = 'octopus';

            (() => {
                fileService.updateFile(id, content, type);
            }).should.throw(/Attempted update of unknown file type: octopus/);

            fileService['dirty'].should.equal(false);
        })));
    });

    describe('deleteFile', () => {
        it('should delete the correct model file', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the model', 'model');
            let testModels = new Map<string, EditorFile>();

            testModels.set('1', file);

            fileService['modelFiles'] = testModels;

            let id = '1';
            let type = 'model';

            fileService.deleteFile(id, type);

            should.not.exist(testModels.get('1'));

            fileService['dirty'].should.equal(true);
        })));

        it('should delete the correct script file', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the script', 'script');
            let testScripts = new Map<string, EditorFile>();

            testScripts.set('1', file);

            fileService['scriptFiles'] = testScripts;

            let id = '1';
            let type = 'script';

            fileService.deleteFile(id, type);

            should.not.exist(testScripts.get('1'));

            fileService['dirty'].should.equal(true);
        })));

        it('should delete the correct query file', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the query', 'query');

            let id = '1';
            let type = 'query';

            fileService['queryFile'] = file;

            fileService.deleteFile(id, type);

            let testQuery = fileService.getEditorQueryFile();
            should.not.exist(testQuery);

            fileService['dirty'].should.equal(true);
        })));

        it('should delete the correct acl file', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the acl', 'acl');

            let id = '1';
            let type = 'acl';

            fileService['aclFile'] = file;

            fileService.deleteFile(id, type);

            let testAcl = fileService.getEditorAclFile();
            should.not.exist(testAcl);

            fileService['dirty'].should.equal(true);
        })));

        it('should delete the correct readme file', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the readme', 'readme');

            let id = '1';
            let type = 'readme';

            fileService['readMe'] = file;

            fileService.deleteFile(id, type);

            let testReadMe = fileService.getEditorReadMe();
            should.not.exist(testReadMe);

            fileService['dirty'].should.equal(true);
        })));

        it('should delete the correct package file', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the package', 'package');

            let id = '1';
            let type = 'package';

            fileService['packageJson'] = file;

            fileService.deleteFile(id, type);

            let testPackage = fileService.getEditorPackageFile();
            should.not.exist(testPackage);

            fileService['dirty'].should.equal(true);
        })));

        it('should default to throwing an error', fakeAsync(inject([FileService], (fileService: FileService) => {
            let id = '1';
            let type = 'octopus';

            (() => {
                fileService.deleteFile(id, type);
            }).should.throw(/Attempted deletion of file unknown type: octopus/);

            fileService['dirty'].should.equal(false);

        })));

        it('should unset the current file if it was deleted', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the model', 'model');
            let testModels = new Map<string, EditorFile>();

            testModels.set('1', file);

            fileService['currentFile'] = file;
            fileService['modelFiles'] = testModels;

            let id = '1';
            let type = 'model';

            fileService.deleteFile(id, type);

            should.not.exist(fileService['currentFile']);
            should.not.exist(testModels.get('1'));

            fileService['dirty'].should.equal(true);
        })));
    });

    describe('deleteAllFiles', () => {
        it('should delete all files', fakeAsync(inject([FileService], (fileService: FileService) => {
            let file = new EditorFile('1', '1', 'this is the readme', 'readme');
            let file2 = new EditorFile('1', '1', 'this is the model', 'model');
            let file3 = new EditorFile('1', '1', 'this is the script', 'script');
            let file4 = new EditorFile('1', '1', 'this is the acl', 'acl');
            let file5 = new EditorFile('1', '1', 'this is the query', 'query');

            let testModels = new Map<string, EditorFile>();
            let testScripts = new Map<string, EditorFile>();

            testModels.set('1', file2);
            testScripts.set('1', file3);

            fileService['readMe'] = file;
            fileService['modelFiles'] = testModels;
            fileService['scriptFiles'] = testScripts;
            fileService['aclFile'] = file4;
            fileService['queryFile'] = file5;

            fileService.deleteAllFiles();

            let testReadMe = fileService.getEditorReadMe();
            let testAcl = fileService.getEditorAclFile();
            let testQuery = fileService.getEditorQueryFile();

            should.not.exist(testReadMe);
            should.not.exist(testModels.get('1'));
            should.not.exist(testScripts.get('1'));
            should.not.exist(testAcl);
            should.not.exist(testQuery);

            fileService['dirty'].should.equal(true);
        })));
    });

    describe('replaceFile', () => {
        it('should throw an error if there in no model file with the given "file to replace" ID', fakeAsync(inject([FileService], (fileService: FileService) => {
            let oldId = '1';
            let newId = '2';
            let content = 'this is the replacement model file';
            let type = 'model';

            (() => {
                fileService.replaceFile(oldId, newId, content, type);
            }).should.throw(/There is no existing file of type model with the id 1/);

            fileService['dirty'].should.equal(false);
        })));

        it('should throw an error if there is an existing model file with the given replacement file ID', fakeAsync(inject([FileService], (fileService: FileService) => {
            let oldId = '2';
            let newId = '3';
            let content = 'this is the replacement model file';
            let type = 'model';

            let file = new EditorFile('2', '2', 'this is the model', 'model');
            let file2 = new EditorFile('3', '3', 'this is the other model', 'model');
            let testModels = new Map<string, EditorFile>();
            testModels.set('2', file);
            testModels.set('3', file2);

            fileService['modelFiles'] = testModels;

            (() => {
                fileService.replaceFile(oldId, newId, content, type);
            }).should.throw(/There is an existing file of type model with the id 2/);

            fileService['dirty'].should.equal(false);
        })));

        it('should throw an error if there in no script file with the given "file to replace" ID', fakeAsync(inject([FileService], (fileService: FileService) => {
            let oldId = '1';
            let newId = '2';
            let content = 'this is the replacement script file';
            let type = 'script';

            (() => {
                fileService.replaceFile(oldId, newId, content, type);
            }).should.throw(/There is no existing file of type script with the id 1/);

            fileService['dirty'].should.equal(false);
        })));

        it('should throw an error if there is an existing script file with the given replacement file ID', fakeAsync(inject([FileService], (fileService: FileService) => {
            let oldId = '2';
            let newId = '3';
            let content = 'this is the replacement script file';
            let type = 'script';

            let file = new EditorFile('2', '2', 'this is the script', 'script');
            let file2 = new EditorFile('3', '3', 'this is the other script', 'script');
            let testScripts = new Map<string, EditorFile>();
            testScripts.set('2', file);
            testScripts.set('3', file2);

            fileService['scriptFiles'] = testScripts;

            (() => {
                fileService.replaceFile(oldId, newId, content, type);
            }).should.throw(/There is an existing file of type script with the id 2/);

            fileService['dirty'].should.equal(false);
        })));

        it('should default to throw an error', fakeAsync(inject([FileService], (fileService: FileService) => {
            let oldId = '1';
            let newId = '2';
            let content = 'this is the replacement octopus';
            let type = 'octopus';

            (() => {
                fileService.replaceFile(oldId, newId, content, type);
            }).should.throw(/Attempted replace of ununsupported file type: octopus/);

            fileService['dirty'].should.equal(false);
        })));

        it('should correctly replace a model file', fakeAsync(inject([FileService], (fileService: FileService) => {
            let oldId = '1';
            let newId = '2';
            let content = 'this is the replacement model file';
            let type = 'model';

            modelFileMock.getNamespace.returns('model-ns');
            modelFileMock.getName.returns('model-name');
            sinon.stub(fileService, 'createModelFile').returns(modelFileMock);

            let file = new EditorFile('1', '1', 'this is the model', 'model');
            let testModels = new Map<string, EditorFile>();
            testModels.set('1', file);

            fileService['modelFiles'] = testModels;

            let replacedFile = fileService.replaceFile(oldId, newId, content, type);

            fileService['dirty'].should.equal(true);
        })));

        it('should correctly replace a model file', fakeAsync(inject([FileService], (fileService: FileService) => {
            let oldId = '1';
            let newId = '2';
            let content = 'this is the replacement model file';
            let type = 'model';

            modelFileMock.getNamespace.returns('model-ns');
            modelFileMock.getName.returns('model-name');
            let createmodelMock = sinon.stub(fileService, 'createModelFile');
            createmodelMock.onCall(0).throws();
            createmodelMock.onCall(1).returns(modelFileMock);

            let file = new EditorFile('1', '1', 'this is the model', 'model');
            let testModels = new Map<string, EditorFile>();
            testModels.set('1', file);

            fileService['modelFiles'] = testModels;

            let replacedFile = fileService.replaceFile(oldId, newId, content, type);

            fileService['dirty'].should.equal(true);
        })));

        it('should correctly replace a model file', fakeAsync(inject([FileService], (fileService: FileService) => {
            let oldId = '1';
            let newId = '2';
            let content = 'this is the replacement model file';
            let type = 'model';

            modelFileMock.getNamespace.returns('model-ns');
            modelFileMock.getName.returns('model-name');
            let createmodelMock = sinon.stub(fileService, 'createModelFile');
            createmodelMock.onCall(0).throws();
            createmodelMock.onCall(1).throws();
            createmodelMock.onCall(2).returns(modelFileMock);

            let file = new EditorFile('1', '1', 'this is the model', 'model');
            let testModels = new Map<string, EditorFile>();
            testModels.set('1', file);

            fileService['modelFiles'] = testModels;

            (() => {
                fileService.replaceFile(oldId, newId, content, type);
            }).should.throw();

            fileService['dirty'].should.equal(false);
        })));

        it('should correctly replace a script file', fakeAsync(inject([FileService], (fileService: FileService) => {
            let oldId = '1';
            let newId = '2';
            let content = 'this is the replacement script file';
            let type = 'script';

            let file = new EditorFile('1', '1', 'this is the script', 'script');
            let testScripts = new Map<string, EditorFile>();
            testScripts.set('1', file);

            fileService['scriptFiles'] = testScripts;

            let replacedFile = fileService.replaceFile(oldId, newId, content, type);

            replacedFile.getId().should.equal('2');
            replacedFile.getContent().should.equal('this is the script');
            replacedFile.getType().should.equal('script');

            fileService['dirty'].should.equal(true);
        })));
    });

    describe('validateFile', () => {
        it('should validate a given model file', fakeAsync(inject([FileService], (fileService: FileService) => {
            let id = '1';
            let type = 'model';

            let testModels = new Map<string, EditorFile>();
            let testScripts = new Map<string, EditorFile>();

            businessNetworkDefMock.getModelManager.returns({getModelFile: sinon.stub()});

            fileService['currentBusinessNetwork'] = businessNetworkDefMock;

            let mockModelFile = sinon.createStubInstance(EditorFile);
            mockModelFile.validate.returns(null);

            // cases to throw if validation slips in to incorrect case.

            let mockScriptFile = sinon.createStubInstance(EditorFile);
            mockScriptFile.validate.throws('should not be called');

            let mockAclFile = sinon.createStubInstance(EditorFile);
            mockAclFile.validate.throws('should not be called');

            let mockQueryFile = sinon.createStubInstance(EditorFile);
            mockScriptFile.validate.throws('should not be called');

            testModels.set('1', mockModelFile);
            testScripts.set('1', mockScriptFile);

            fileService['modelFiles'] = testModels;
            fileService['scriptFiles'] = testScripts;
            fileService['aclFile'] = mockAclFile;
            fileService['queryFile'] = mockQueryFile;

            should.not.exist(fileService.validateFile(id, type));
        })));

        it('should throw an error if namespace collides given model file', fakeAsync(inject([FileService], (fileService: FileService) => {
            let id = '1';
            let type = 'model';

            let testModels = new Map<string, EditorFile>();
            let testScripts = new Map<string, EditorFile>();

            businessNetworkDefMock.getModelManager.returns({getModelFile: sinon.stub().returns({getName: sinon.stub().returns('myName')})});

            fileService['currentBusinessNetwork'] = businessNetworkDefMock;

            sinon.stub(fileService, 'createModelFile').returns({getNamespace: sinon.stub().returns('myNamespace')});

            let mockNamspaceCollides = sinon.stub(fileService, 'modelNamespaceCollides').returns(true);

            let mockModelFile = sinon.createStubInstance(EditorFile);
            mockModelFile.validate.returns(null);

            // cases to throw if validation slips in to incorrect case.

            let mockScriptFile = sinon.createStubInstance(EditorFile);
            mockScriptFile.validate.throws('should not be called');

            let mockAclFile = sinon.createStubInstance(EditorFile);
            mockAclFile.validate.throws('should not be called');

            let mockQueryFile = sinon.createStubInstance(EditorFile);
            mockScriptFile.validate.throws('should not be called');

            testModels.set('1', mockModelFile);
            testScripts.set('1', mockScriptFile);

            fileService['modelFiles'] = testModels;
            fileService['scriptFiles'] = testScripts;
            fileService['aclFile'] = mockAclFile;
            fileService['queryFile'] = mockQueryFile;

            let result = fileService.validateFile(id, type);
            result.toString().should.equal('Error: The namespace collides with existing model namespace myNamespace');
        })));

        it('should validate if already exists', fakeAsync(inject([FileService], (fileService: FileService) => {
            let id = '1';
            let type = 'model';

            let testModels = new Map<string, EditorFile>();
            let testScripts = new Map<string, EditorFile>();

            businessNetworkDefMock.getModelManager.returns({getModelFile: sinon.stub().returns({getName: sinon.stub().returns('myName')})});

            fileService['currentBusinessNetwork'] = businessNetworkDefMock;

            sinon.stub(fileService, 'createModelFile').returns({getNamespace: sinon.stub().returns('myNamespace')});

            let mockNamspaceCollides = sinon.stub(fileService, 'modelNamespaceCollides').returns(false);

            let mockModelFile = sinon.createStubInstance(EditorFile);
            mockModelFile.validate.returns(null);

            // cases to throw if validation slips in to incorrect case.

            let mockScriptFile = sinon.createStubInstance(EditorFile);
            mockScriptFile.validate.throws('should not be called');

            let mockAclFile = sinon.createStubInstance(EditorFile);
            mockAclFile.validate.throws('should not be called');

            let mockQueryFile = sinon.createStubInstance(EditorFile);
            mockScriptFile.validate.throws('should not be called');

            testModels.set('1', mockModelFile);
            testScripts.set('1', mockScriptFile);

            fileService['modelFiles'] = testModels;
            fileService['scriptFiles'] = testScripts;
            fileService['aclFile'] = mockAclFile;
            fileService['queryFile'] = mockQueryFile;

            should.not.exist(fileService.validateFile(id, type));
        })));

        it('should validate a given script file', fakeAsync(inject([FileService], (fileService: FileService) => {
            let id = '1';
            let type = 'script';

            let testScripts = new Map<string, EditorFile>();
            let testModels = new Map<string, EditorFile>();

            fileService['currentBusinessNetwork'] = businessNetworkDefMock;

            let mockScriptFile = sinon.createStubInstance(EditorFile);
            mockScriptFile.validate.returns(null);

            // cases to throw if validation slips in to incorrect case.

            let mockModelFile = sinon.createStubInstance(EditorFile);
            mockModelFile.validate.throws('should not be called');

            let mockAclFile = sinon.createStubInstance(EditorFile);
            mockAclFile.validate.throws('should not be called');

            let mockQueryFile = sinon.createStubInstance(EditorFile);
            mockQueryFile.validate.throws('should not be called');

            testScripts.set('1', mockScriptFile);
            testModels.set('1', mockModelFile);

            fileService['modelFiles'] = testModels;
            fileService['scriptFiles'] = testScripts;
            fileService['aclFile'] = mockAclFile;
            fileService['queryFile'] = mockQueryFile;

            should.not.exist(fileService.validateFile(id, type));
        })));

        it('should validate a given acl file', fakeAsync(inject([FileService], (fileService: FileService) => {
            let id = '1';
            let type = 'acl';

            let testScripts = new Map<string, EditorFile>();
            let testModels = new Map<string, EditorFile>();

            fileService['currentBusinessNetwork'] = businessNetworkDefMock;

            let mockAclFile = sinon.createStubInstance(EditorFile);
            mockAclFile.validate.returns(null);

            // cases to throw if validation slips in to incorrect case.

            let mockScriptFile = sinon.createStubInstance(EditorFile);
            mockScriptFile.validate.throws('should not be called');

            let mockModelFile = sinon.createStubInstance(EditorFile);
            mockModelFile.validate.throws('should not be called');

            let mockQueryFile = sinon.createStubInstance(EditorFile);
            mockScriptFile.validate.throws('should not be called');

            testModels.set('1', mockModelFile);
            testScripts.set('1', mockScriptFile);

            fileService['modelFiles'] = testModels;
            fileService['scriptFiles'] = testScripts;
            fileService['aclFile'] = mockAclFile;
            fileService['queryFile'] = mockQueryFile;

            should.not.exist(fileService.validateFile(id, type));
        })));

        it('should validate a given query file', fakeAsync(inject([FileService], (fileService: FileService) => {
            let id = '1';
            let type = 'query';

            let testScripts = new Map<string, EditorFile>();
            let testModels = new Map<string, EditorFile>();

            fileService['currentBusinessNetwork'] = businessNetworkDefMock;

            let mockQueryFile = sinon.createStubInstance(EditorFile);
            mockQueryFile.validate.returns(null);

            // cases to throw if validation slips in to incorrect case.

            let mockScriptFile = sinon.createStubInstance(EditorFile);
            mockScriptFile.validate.throws('should not be called');

            let mockAclFile = sinon.createStubInstance(EditorFile);
            mockAclFile.validate.throws('should not be called');

            let mockModelFile = sinon.createStubInstance(EditorFile);
            mockModelFile.validate.throws('should not be called');

            testModels.set('1', mockModelFile);
            testScripts.set('1', mockScriptFile);

            fileService['modelFiles'] = testModels;
            fileService['scriptFiles'] = testScripts;
            fileService['aclFile'] = mockAclFile;
            fileService['queryFile'] = mockQueryFile;

            should.not.exist(fileService.validateFile(id, type));
        })));

        it('should successfully validate package file', inject([FileService], (fileService: FileService) => {
            mockClientService.getDeployedBusinessNetworkVersion.returns('1.0.0');
            fileService['currentBusinessNetwork'] = businessNetworkDefMock;
            businessNetworkDefMock.getMetadata.returns({
                getName: sinon.stub().returns('myName')
            });

            let packageFile = new EditorFile('package', 'package', 'myContent', 'package');
            packageFile.setJsonContent({name: 'myName', version: '1.0.1'});
            fileService['packageJson'] = packageFile;

            should.not.exist(fileService.validateFile('package', 'package'));
        }));

        it('should validate package file and throw an error if the package name changes', inject([FileService], (fileService: FileService) => {
            mockClientService.getDeployedBusinessNetworkVersion.returns('1.0.0');
            fileService['currentBusinessNetwork'] = businessNetworkDefMock;
            businessNetworkDefMock.getMetadata.returns({
                getName: sinon.stub().returns('oldName')
            });

            let packageFile = new EditorFile('package', 'package', 'myContent', 'package');
            packageFile.setJsonContent({name: 'myName', version: '1.0.1'});
            fileService['packageJson'] = packageFile;

            let result = fileService.validateFile('package', 'package');
            result.toString().should.contain('Unsupported attempt to update Business Network Name.');
        }));

        it('should validate package file and throw an error if the version matches the deployed version', inject([FileService], (fileService: FileService) => {
            mockClientService.getDeployedBusinessNetworkVersion.returns('1.0.0');
            fileService['currentBusinessNetwork'] = businessNetworkDefMock;
            businessNetworkDefMock.getMetadata.returns({
                getName: sinon.stub().returns('myName')
            });

            let packageFile = new EditorFile('package', 'package', 'myContent', 'package');
            packageFile.setJsonContent({name: 'myName', version: '1.0.0'});
            fileService['packageJson'] = packageFile;

            let result = fileService.validateFile('package', 'package');
            result.toString().should.contain('The Business Network has already been deployed at the current version.');
        }));

        it('should validate package file and throw an error if the version older than the deployed version', inject([FileService], (fileService: FileService) => {
            mockClientService.getDeployedBusinessNetworkVersion.returns('1.0.1');
            fileService['currentBusinessNetwork'] = businessNetworkDefMock;
            businessNetworkDefMock.getMetadata.returns({
                getName: sinon.stub().returns('myName')
            });

            let packageFile = new EditorFile('package', 'package', 'myContent', 'package');
            packageFile.setJsonContent({name: 'myName', version: '1.0.0'});
            fileService['packageJson'] = packageFile;

            let result = fileService.validateFile('package', 'package');
            result.toString().should.contain('A more recent version of the Business Network has already been deployed.');
        }));

        it('should throw an error when no match with provided file type', fakeAsync(inject([FileService], (fileService: FileService) => {
            let id = '1';
            let type = 'octopus';

            let result = fileService.validateFile(id, type);
            result.toString().should.contain('Attempted validation of unknown file of type: octopus');
        })));
    });

    describe('set and get current file', () => {
        it('should set and get the current file for the editor', inject([FileService], (fileService: FileService) => {
            let TEST = {name: 'foo', val: 'bar'};
            assert.isNull(fileService.getCurrentFile());
            fileService.setCurrentFile(TEST);
            assert.equal(fileService.getCurrentFile(), TEST);
        }));
    });

    describe('loadFiles', () => {
        let deleteAllFileStub;
        let addFileStub;
        let getFilesStub;

        let aclStub;
        let queryStub;
        let metaStub;

        beforeEach(inject([FileService], (fileService: FileService) => {
            deleteAllFileStub = sinon.stub(fileService, 'deleteAllFiles');
            addFileStub = sinon.stub(fileService, 'addFile');
            getFilesStub = sinon.stub(fileService, 'getEditorFiles').returns(['myFiles']);

            sinon.stub(fileService, 'getModelFiles').returns([{
                getNamespace: sinon.stub().returns('myNameSpace'),
                getName: sinon.stub().returns('myName'),
                getDefinitions: sinon.stub().returns('myDefs')
            }]);

            sinon.stub(fileService, 'getScripts').returns([{
                getIdentifier: sinon.stub().returns('myId'),
                getContents: sinon.stub().returns('contents')
            }]);

            aclStub = sinon.stub(fileService, 'getAclFile').returns({
                getIdentifier: sinon.stub().returns('myId'),
                getDefinitions: sinon.stub().returns('myDefs')
            });

            queryStub = sinon.stub(fileService, 'getQueryFile').returns({
                getIdentifier: sinon.stub().returns('myId'),
                getDefinitions: sinon.stub().returns('myDefs')
            });

            metaStub = sinon.stub(fileService, 'getMetaData').returns({
                getPackageJson: sinon.stub().returns('myJson'),
                getREADME: sinon.stub().returns('myReadMe')
            });
        }));

        it('should load all the files', inject([FileService], (fileService: FileService) => {

            let result = fileService.loadFiles();

            result.should.deep.equal(['myFiles']);

            deleteAllFileStub.should.have.been.called;

            addFileStub.firstCall.should.have.been.calledWith('myNameSpace', 'myName', 'myDefs', 'model');
            addFileStub.secondCall.should.have.been.calledWith('myId', 'myId', 'contents', 'script');
            addFileStub.thirdCall.should.have.been.calledWith('myId', 'myId', 'myDefs', 'acl');
            addFileStub.getCall(3).should.have.been.calledWith('myId', 'myId', 'myDefs', 'query');
            addFileStub.getCall(4).should.have.been.calledWith('readme', 'README.md', 'myReadMe', 'readme');
            addFileStub.getCall(5).should.have.been.calledWith('package', 'package.json', '"myJson"', 'package');

            getFilesStub.should.have.been.called;

            fileService['dirty'].should.deep.equal(false);

            should.not.exist(fileService['currentFile']);
        }));

        it('should load files without acl, query, package and readme', inject([FileService], (fileService: FileService) => {
            aclStub.returns(null);

            queryStub.returns(null);

            metaStub.returns({getREADME: sinon.stub(), getPackageJson: sinon.stub()});

            let result = fileService.loadFiles();

            result.should.deep.equal(['myFiles']);

            deleteAllFileStub.should.have.been.called;

            addFileStub.firstCall.should.have.been.calledWith('myNameSpace', 'myName', 'myDefs', 'model');
            addFileStub.secondCall.should.have.been.calledWith('myId', 'myId', 'contents', 'script');

            addFileStub.callCount.should.equal(2);

            getFilesStub.should.have.been.called;

            fileService['dirty'].should.deep.equal(false);

            should.not.exist(fileService['currentFile']);
        }));

        it('should load all the files and unset currentFile', inject([FileService], (fileService: FileService) => {

            let file = {
                getType: sinon.stub().returns('model'),
                getContent: sinon.stub().returns('myContent'),
                getId: sinon.stub().returns('myId')
            };

            let file2 = {
                getType: sinon.stub().returns('script'),
                getContent: sinon.stub().returns('myContent'),
                getId: sinon.stub().returns('myId')
            };

            fileService['currentFile'] = file;

            getFilesStub.returns([file2]);

            let result = fileService.loadFiles();

            result[0].should.deep.equal(file2);

            deleteAllFileStub.should.have.been.called;

            addFileStub.firstCall.should.have.been.calledWith('myNameSpace', 'myName', 'myDefs', 'model');
            addFileStub.secondCall.should.have.been.calledWith('myId', 'myId', 'contents', 'script');
            addFileStub.thirdCall.should.have.been.calledWith('myId', 'myId', 'myDefs', 'acl');
            addFileStub.getCall(3).should.have.been.calledWith('myId', 'myId', 'myDefs', 'query');
            addFileStub.getCall(4).should.have.been.calledWith('readme', 'README.md', 'myReadMe', 'readme');

            getFilesStub.should.have.been.called;

            fileService['dirty'].should.deep.equal(false);

            should.not.exist(fileService['currentFile']);
        }));

        it('should load all the files and keep currentFile', inject([FileService], (fileService: FileService) => {

            let file = {
                getType: sinon.stub().returns('model'),
                getContent: sinon.stub().returns('myContent'),
                getId: sinon.stub().returns('myId')
            };

            fileService['currentFile'] = file;

            getFilesStub.returns([file]);

            let result = fileService.loadFiles();

            result.should.deep.equal([file]);

            deleteAllFileStub.should.have.been.called;

            addFileStub.firstCall.should.have.been.calledWith('myNameSpace', 'myName', 'myDefs', 'model');
            addFileStub.secondCall.should.have.been.calledWith('myId', 'myId', 'contents', 'script');
            addFileStub.thirdCall.should.have.been.calledWith('myId', 'myId', 'myDefs', 'acl');
            addFileStub.getCall(3).should.have.been.calledWith('myId', 'myId', 'myDefs', 'query');
            addFileStub.getCall(4).should.have.been.calledWith('readme', 'README.md', 'myReadMe', 'readme');

            getFilesStub.should.have.been.called;

            this.dirty = false;

            fileService['currentFile'].should.deep.equal(file);
        }));
    });

    describe('updateBusinessNetwork', () => {
        let updateBusinessNetworkFileStub;

        beforeEach(inject([FileService], (fileService: FileService) => {
            updateBusinessNetworkFileStub = sinon.stub(fileService, 'updateBusinessNetworkFile');
        }));

        it('should update a model file', inject([FileService], (fileService: FileService) => {
            let editorFile = new EditorFile('myId', 'myDisplayId', 'myContent', 'model');

            sinon.stub(fileService, 'getModelFile').returns('myFile');

            fileService.updateBusinessNetwork('oldId', editorFile);

            updateBusinessNetworkFileStub.should.have.been.calledWith('oldId', 'myContent', 'model');
        }));

        it('should add a model file', inject([FileService], (fileService: FileService) => {
            let editorFile = new EditorFile('myId', 'myDisplayId', 'myContent', 'model');

            sinon.stub(fileService, 'getModelFile');

            let mockModelManager = {
                addModelFile: sinon.stub()
            };

            businessNetworkDefMock.getModelManager.returns(mockModelManager);
            fileService['currentBusinessNetwork'] = businessNetworkDefMock;

            fileService.updateBusinessNetwork('oldId', editorFile);

            mockModelManager.addModelFile.should.have.been.calledWith('myContent', 'myDisplayId');
        }));

        it('should update a script file', inject([FileService], (fileService: FileService) => {
            let editorFile = new EditorFile('myId', 'myDisplayId', 'myContent', 'script');

            sinon.stub(fileService, 'getScriptFile').returns('myFile');

            fileService.updateBusinessNetwork('oldId', editorFile);

            updateBusinessNetworkFileStub.should.have.been.calledWith('oldId', 'myContent', 'script');
        }));

        it('should add a script file', inject([FileService], (fileService: FileService) => {
            let editorFile = new EditorFile('myId', 'myDisplayId', 'myContent', 'script');

            sinon.stub(fileService, 'getScriptFile');
            sinon.stub(fileService, 'createScriptFile').returns('myScriptFile');

            let mockScriptManager = {
                addScript: sinon.stub()
            };

            businessNetworkDefMock.getScriptManager.returns(mockScriptManager);
            fileService['currentBusinessNetwork'] = businessNetworkDefMock;

            fileService.updateBusinessNetwork('oldId', editorFile);

            mockScriptManager.addScript.should.have.been.calledWith('myScriptFile');
        }));

        it('should update a acl file', inject([FileService], (fileService: FileService) => {
            let editorFile = new EditorFile('myId', 'myDisplayId', 'myContent', 'acl');

            sinon.stub(fileService, 'getAclFile').returns('myFile');

            fileService.updateBusinessNetwork('oldId', editorFile);

            updateBusinessNetworkFileStub.should.have.been.calledWith('oldId', 'myContent', 'acl');
        }));

        it('should add a acl file', inject([FileService], (fileService: FileService) => {
            let editorFile = new EditorFile('myId', 'myDisplayId', 'myContent', 'acl');

            sinon.stub(fileService, 'getAclFile');
            sinon.stub(fileService, 'createAclFile').returns('myAclFile');

            let mockAclManager = {
                setAclFile: sinon.stub()
            };

            businessNetworkDefMock.getAclManager.returns(mockAclManager);
            fileService['currentBusinessNetwork'] = businessNetworkDefMock;

            fileService.updateBusinessNetwork('oldId', editorFile);

            mockAclManager.setAclFile.should.have.been.calledWith('myAclFile');
        }));

        it('should update a query file', inject([FileService], (fileService: FileService) => {
            let editorFile = new EditorFile('myId', 'myDisplayId', 'myContent', 'query');

            sinon.stub(fileService, 'getQueryFile').returns('myFile');

            fileService.updateBusinessNetwork('oldId', editorFile);

            updateBusinessNetworkFileStub.should.have.been.calledWith('oldId', 'myContent', 'query');
        }));

        it('should add a query file', inject([FileService], (fileService: FileService) => {
            let editorFile = new EditorFile('myId', 'myDisplayId', 'myContent', 'query');

            sinon.stub(fileService, 'getQueryFile');
            sinon.stub(fileService, 'createQueryFile').returns('myQueryFile');

            let mockQueryManager = {
                setQueryFile: sinon.stub()
            };

            businessNetworkDefMock.getQueryManager.returns(mockQueryManager);

            fileService['currentBusinessNetwork'] = businessNetworkDefMock;

            fileService.updateBusinessNetwork('oldId', editorFile);

            mockQueryManager.setQueryFile.should.have.been.calledWith('myQueryFile');
        }));

        it('should update read me', inject([FileService], (fileService: FileService) => {
            let editorFile = new EditorFile('myId', 'myDisplayId', 'myContent', 'readme');

            fileService.updateBusinessNetwork('oldId', editorFile);

            updateBusinessNetworkFileStub.should.have.been.calledWith('oldId', 'myContent', 'readme');
        }));

        it('should update package json', inject([FileService], (fileService: FileService) => {
            let editorFile = new EditorFile('myId', 'myDisplayId', 'myContent', 'package');

            fileService.updateBusinessNetwork('oldId', editorFile);

            updateBusinessNetworkFileStub.should.have.been.calledWith('oldId', 'myContent', 'package');
        }));

        it('should throw an error when no match with provided file type', inject([FileService], (fileService: FileService) => {
            let editorFile = new EditorFile('octopusId', 'octopusDisplayId', 'octopusContent', 'octopus');

            (() => {
                fileService.updateBusinessNetwork('oldId', editorFile);
            }).should.throw(/Attempted update of unknown file of type: octopus/);

            fileService['dirty'].should.equal(false);
        }));
    });

    describe('createAclFile', () => {
        let mockBusinessNetwork;

        beforeEach(() => {
            mockBusinessNetwork = sinon.createStubInstance(BusinessNetworkDefinition);
        });

        it('should create an ACL file', fakeAsync(inject([FileService], (service: FileService) => {
            service['currentBusinessNetwork'] = mockBusinessNetwork;
            let allRule = 'rule SystemACL {description: "System ACL to permit all access" participant: "org.hyperledger.composer.system.Participant" operation: ALL resource: "org.hyperledger.composer.system.**" action: ALLOW}';
            let aclFile = service.createAclFile('permissions', allRule);
            aclFile.should.be.instanceOf(AclFile);
            mockBusinessNetwork.getModelManager.should.have.been.called;
        })));
    });

    describe('getModelFile', () => {
        it('should get the model file', inject([FileService], (service: FileService) => {
            service['currentBusinessNetwork'] = businessNetworkDefMock;
            let modelManagerMock = {
                getModelFile: sinon.stub().returns(modelFileMock)
            };
            businessNetworkDefMock.getModelManager.returns(modelManagerMock);

            let result = service.getModelFile('testId');

            result.should.deep.equal(modelFileMock);
            modelManagerMock.getModelFile.should.have.been.calledWith('testId');
        }));
    });

    describe('updateBusinessNetworkFile', () => {
        let businessNetworkChangedSpy;
        let modelManagerMock;
        let namespaceChangedSpy;
        let mockNamespaceCollide;

        beforeEach(inject([FileService], (service: FileService) => {
            service['currentBusinessNetwork'] = businessNetworkDefMock;
            mockNamespaceCollide = sinon.stub(service, 'modelNamespaceCollides').returns(false);
            businessNetworkChangedSpy = sinon.spy(service.businessNetworkChanged$, 'next');
            namespaceChangedSpy = sinon.spy(service.namespaceChanged$, 'next');

            modelManagerMock = {
                addModelFile: sinon.stub(),
                updateModelFile: sinon.stub(),
                deleteModelFile: sinon.stub(),
                getModelFile: sinon.stub().returns(modelFileMock),
            };
        }));

        it('should update a model file if id matches namespace', inject([FileService], (service: FileService) => {
            modelFileMock.getNamespace.returns('model-ns');
            modelFileMock.getName.returns('model.cto');
            businessNetworkDefMock.getModelManager.returns(modelManagerMock);

            let mockCreateModelFile = sinon.stub(service, 'createModelFile').returns(modelFileMock);

            let result = service.updateBusinessNetworkFile('model-ns', 'my-model-content', 'model');

            modelManagerMock.updateModelFile.should.have.been.calledWith(modelFileMock);
            modelManagerMock.addModelFile.should.not.have.been.called;
            should.not.exist(result);
        }));

        it('should replace a model file if id does not match namespace', inject([FileService], (service: FileService) => {
            businessNetworkDefMock.getModelManager.returns(modelManagerMock);
            modelFileMock.getNamespace.returns('model-ns');
            modelFileMock.getName.returns('model.cto');

            let mockCreateModelFile = sinon.stub(service, 'createModelFile').returns(modelFileMock);

            let result = service.updateBusinessNetworkFile('diff-model-ns', 'my-model-content', 'model');

            modelManagerMock.addModelFile.should.have.been.calledWith(modelFileMock);
            should.not.exist(result);
        }));

        it('should notify if model file namespace changes', inject([FileService], (service: FileService) => {

            businessNetworkDefMock.getModelManager.returns(modelManagerMock);
            modelFileMock.getNamespace.returns('new-model-ns');
            modelManagerMock.getModelFile.returns(modelFileMock);

            let mockCreateModelFile = sinon.stub(service, 'createModelFile').returns(modelFileMock);

            service.updateBusinessNetworkFile('model-ns', 'my-model-content', 'model');

            namespaceChangedSpy.should.have.been.calledWith('new-model-ns');
        }));

        it('should update a script file', inject([FileService], (service: FileService) => {
            let scriptManagerMock = {
                createScript: sinon.stub().returns(scriptFileMock),
                addScript: sinon.stub()
            };

            businessNetworkDefMock.getScriptManager.returns(scriptManagerMock);

            let result = service.updateBusinessNetworkFile('script', 'my-script', 'script');

            scriptManagerMock.createScript.should.have.been.calledWith('script', 'JS', 'my-script');
            scriptManagerMock.addScript.should.have.been.calledWith(scriptFileMock);
            should.not.exist(result);
        }));

        it('should update a acl file', inject([FileService], (service: FileService) => {
            let aclManagerMock = {
                setAclFile: sinon.stub()
            };

            businessNetworkDefMock.getAclManager.returns(aclManagerMock);

            let mockCreateAclFile = sinon.stub(service, 'createAclFile').returns(aclFileMock);

            let result = service.updateBusinessNetworkFile('acl', 'my-acl', 'acl');

            aclManagerMock.setAclFile.should.have.been.calledWith(aclFileMock);
            should.not.exist(result);
        }));

        it('should update a query file', inject([FileService], (service: FileService) => {
            let queryManagerMock = {
                setQueryFile: sinon.stub()
            };

            businessNetworkDefMock.getQueryManager.returns(queryManagerMock);

            let mockCreateQueryFile = sinon.stub(service, 'createQueryFile').returns(queryFileMock);

            // call function
            let result = service.updateBusinessNetworkFile('query', 'my-query', 'query');

            queryManagerMock.setQueryFile.should.have.been.calledWith(queryFileMock);
            should.not.exist(result);
        }));

        it('should update a package.json file', inject([FileService], (service: FileService) => {
            let mockSetPackage = sinon.stub(service, 'setBusinessNetworkPackageJson');
            let packageJson = JSON.stringify({name: 'my name'});

            // call function
            let result = service.updateBusinessNetworkFile('package', packageJson, 'package');

            mockSetPackage.should.have.been.calledWith(packageJson);
        }));

        it('should update a readme file', inject([FileService], (service: FileService) => {
            let mockSetReadme = sinon.stub(service, 'setBusinessNetworkReadme');

            // call function
            let result = service.updateBusinessNetworkFile('readme.md', 'read this', 'readme');

            mockSetReadme.should.have.been.calledWith('read this');
        }));

        it('should not replace a model file if id does not match namespace and file is invalid', inject([FileService], (service: FileService) => {

            let error = new Error('invalid');
            modelManagerMock = {
                addModelFile: sinon.stub().throws(error),
                updateModelFile: sinon.stub().throws(error),
                deleteModelFile: sinon.stub(),
                getModelFile: sinon.stub().returns(modelFileMock)
            };

            businessNetworkDefMock.getModelManager.returns(modelManagerMock);

            modelFileMock.getNamespace.returns('new-model');
            let mockCreateModelFile = sinon.stub(service, 'createModelFile').returns(modelFileMock);

            try {
                service.updateBusinessNetworkFile('model', 'my-model', 'model');
            } catch (e) {
                e.should.deep.equal(error);
            }
        }));

        it('should not update an invalid script file', inject([FileService], (service: FileService) => {
            let error = new Error('invalid');
            let scriptManagerMock = {
                createScript: sinon.stub().throws(error),
                addScript: sinon.stub()
            };

            businessNetworkDefMock.getScriptManager.returns(scriptManagerMock);

            try {
                service.updateBusinessNetworkFile('script', 'my-script', 'script');
            } catch (e) {
                e.should.deep.equal(error);
            }
        }));

        it('should not update an invalid acl file', inject([FileService], (service: FileService) => {
            let error = new Error('invalid');

            let aclManagerMock = {
                setAclFile: sinon.stub().throws(error)
            };

            businessNetworkDefMock.getAclManager.returns(aclManagerMock);
            let mockCreateAclFile = sinon.stub(service, 'createAclFile').returns(aclFileMock);

            try {
                service.updateBusinessNetworkFile('acl', 'my-acl', 'acl');
            } catch (e) {
                e.should.deep.equal(error);
            }
        }));

        it('should not update a model file if namespace collision detected', inject([FileService], (service: FileService) => {
            let error = new Error('The namespace collides with existing model namespace new-model');

            modelManagerMock = {
                addModelFile: sinon.stub(),
                updateModelFile: sinon.stub(),
                deleteModelFile: sinon.stub(),
                getModelFile: sinon.stub().returns(modelFileMock)
            };

            mockNamespaceCollide.returns(true);
            businessNetworkDefMock.getModelManager.returns(modelManagerMock);

            modelFileMock.getNamespace.returns('new-model');
            let mockCreateModelFile = sinon.stub(service, 'createModelFile').returns(modelFileMock);

            try {
                service.updateBusinessNetworkFile('model', 'my-model', 'model');
            } catch (e) {
                e.toString().should.equal(error.toString());
            }

            modelManagerMock.updateModelFile.should.not.have.been.called;
        }));

        it('should return error message if type is invalid', inject([FileService], (service: FileService) => {
            let error = new Error('Attempted update of unknown file of type: wombat');

            try {
                service.updateBusinessNetworkFile('bad.file', 'content of wombat type', 'wombat');
            } catch (e) {
                e.toString().should.equal(error.toString());
            }
        }));
    });

    describe('replaceBusinessNetworkFile', () => {
        it('should handle error case by notifying and returning error message in string', inject([FileService], (service: FileService) => {
            service['currentBusinessNetwork'] = businessNetworkDefMock;
            (service['currentBusinessNetwork'].getModelManager as any).throws(new Error('Forced Error'));
            let businessNetworkChangedSpy = sinon.spy(service.businessNetworkChanged$, 'next');

            let response = service.replaceBusinessNetworkFile('oldId', 'newId', 'content', 'model');

            businessNetworkChangedSpy.should.have.been.calledWith(false);
            response.should.equal('Error: Forced Error');

        }));

        it('should replace a model file by model manager update', inject([FileService], (service: FileService) => {

            let modelManagerMock = {
                updateModelFile: sinon.stub()
            };
            businessNetworkDefMock.getModelManager.returns(modelManagerMock);
            service['currentBusinessNetwork'] = businessNetworkDefMock;

            let mockCreateModelFile = sinon.stub(service, 'createModelFile').returns(modelFileMock);

            let businessNetworkChangedSpy = sinon.spy(service.businessNetworkChanged$, 'next');

            // Call the method (model)
            let response = service.replaceBusinessNetworkFile('oldId', 'newId', 'content', 'model');

            // Check correct items were called with correct parameters
            modelManagerMock.updateModelFile.should.have.been.calledWith(modelFileMock, 'newId');
            businessNetworkChangedSpy.should.have.been.calledWith(true);
            should.not.exist(response);
        }));

        it('should replace a script file by deletion and addition', inject([FileService], (service: FileService) => {

            let scriptManagerMock = {
                createScript: sinon.stub().returns(scriptFileMock),
                addScript: sinon.stub(),
                deleteScript: sinon.stub()
            };
            businessNetworkDefMock.getScriptManager.returns(scriptManagerMock);
            service['currentBusinessNetwork'] = businessNetworkDefMock;

            let businessNetworkChangedSpy = sinon.spy(service.businessNetworkChanged$, 'next');

            // Call the method (script)
            let response = service.replaceBusinessNetworkFile('oldId', 'newId', 'content', 'script');

            // Check correct items were called with correct parameters
            scriptManagerMock.addScript.should.have.been.calledWith(scriptFileMock);
            scriptManagerMock.deleteScript.should.have.been.calledWith('oldId');
            businessNetworkChangedSpy.should.have.been.calledWith(true);
            should.not.exist(response);
        }));

        it('should return error message if type is invalid', inject([FileService], (service: FileService) => {
            let result = service.replaceBusinessNetworkFile('oldId', 'newId', 'content', 'wombat');
            result.should.equal('Error: Attempted replace of ununsupported file type: wombat');
        }));
    });

    describe('modelNamespaceCollides', () => {

        let modelManagerMock;
        let mockCreateBusinessNetwork;
        let mockFile0 = sinon.createStubInstance(ModelFile);
        mockFile0.getNamespace.returns('name0');
        let mockFile1 = sinon.createStubInstance(ModelFile);
        mockFile1.getNamespace.returns('name1');
        let mockFile2 = sinon.createStubInstance(ModelFile);
        mockFile2.getNamespace.returns('name2');
        let mockFile3 = sinon.createStubInstance(ModelFile);
        mockFile3.getNamespace.returns('name3');
        let mockFile4 = sinon.createStubInstance(ModelFile);
        mockFile4.getNamespace.returns('name4');

        beforeEach(inject([FileService], (service: FileService) => {
            modelManagerMock = {
                getModelFiles: sinon.stub().returns([mockFile0, mockFile1, mockFile2, mockFile3, mockFile4])
            };

            businessNetworkDefMock.getModelManager.returns(modelManagerMock);
            service['currentBusinessNetwork'] = businessNetworkDefMock;
        }));

        it('should return true if namespace collision detected', inject([FileService], (service: FileService) => {

            let result = service.modelNamespaceCollides('name1', 'something-different');
            result.should.be.equal(true);

        }));

        it('should return false if no namespace collision detected with new name', inject([FileService], (service: FileService) => {

            let result = service.modelNamespaceCollides('not-in-list', 'something-different');
            result.should.be.equal(false);

        }));

        it('should handle no previousNamespace being passed', inject([FileService], (service: FileService) => {

            let result = service.modelNamespaceCollides('new-namespace', null);
            result.should.be.equal(false);

        }));

        it('should handle no model files existing in BND', inject([FileService], (service: FileService) => {
            modelManagerMock = {
                getModelFiles: sinon.stub().returns([])
            };

            let result = service.modelNamespaceCollides('not-in-list', 'something-different');
            result.should.be.equal(false);
        }));

    });

    describe('getScriptFile', () => {
        it('should get the script file', inject([FileService], (service: FileService) => {
            let scriptManagerMock = {
                getScript: sinon.stub().returns(scriptFileMock)
            };
            businessNetworkDefMock.getScriptManager.returns(scriptManagerMock);
            service['currentBusinessNetwork'] = businessNetworkDefMock;

            let result = service.getScriptFile('testId');

            result.should.deep.equal(scriptFileMock);
            scriptManagerMock.getScript.should.have.been.calledWith('testId');
        }));
    });

    describe('getAclFile', () => {
        it('should get the acl file', inject([FileService], (service: FileService) => {
            let aclManagerMock = {
                getAclFile: sinon.stub().returns(aclFileMock)
            };
            businessNetworkDefMock.getAclManager.returns(aclManagerMock);
            service['currentBusinessNetwork'] = businessNetworkDefMock;

            let result = service.getAclFile();

            result.should.deep.equal(aclFileMock);
            aclManagerMock.getAclFile.should.have.been.called;
        }));
    });

    describe('getQueryFile', () => {
        it('should get the query file', inject([FileService], (service: FileService) => {
            let queryManagerMock = {
                getQueryFile: sinon.stub().returns(queryFileMock)
            };

            businessNetworkDefMock.getQueryManager.returns(queryManagerMock);
            service['currentBusinessNetwork'] = businessNetworkDefMock;

            let result = service.getQueryFile();

            result.should.deep.equal(queryFileMock);
            queryManagerMock.getQueryFile.should.have.been.called;
        }));
    });

    describe('createQueryFile', () => {
        let mockBusinessNetwork;

        beforeEach(() => {
            mockBusinessNetwork = sinon.createStubInstance(BusinessNetworkDefinition);
        });

        it('should create a Query file', fakeAsync(inject([FileService], (service: FileService) => {
            service['currentBusinessNetwork'] = mockBusinessNetwork;
            let queryFile = service.createQueryFile('query', '');
            queryFile.should.be.instanceOf(QueryFile);
            mockBusinessNetwork.getModelManager.should.have.been.called;
        })));

    });

    describe('setBusinessNetwork...', () => {
        beforeEach(inject([FileService], (service: FileService) => {
            let modelManagerMock = {
                getModelFiles: sinon.stub().returns([modelFileMock, modelFileMock]),
                addModelFiles: sinon.stub()
            };

            let aclManagerMock = {
                setAclFile: sinon.stub(),
                getAclFile: sinon.stub().returns(aclFileMock)
            };

            let scriptManagerMock = {
                getScripts: sinon.stub().returns([scriptFileMock, scriptFileMock]),
                addScript: sinon.stub()
            };

            let queryManagerMock = {
                setQueryFile: sinon.stub(),
                getQueryFile: sinon.stub().returns(queryFileMock)
            };

            businessNetworkDefMock.getModelManager.returns(modelManagerMock);
            businessNetworkDefMock.getScriptManager.returns(scriptManagerMock);
            businessNetworkDefMock.getAclManager.returns(aclManagerMock);
            businessNetworkDefMock.getQueryManager.returns(queryManagerMock);

            service['currentBusinessNetwork'] = businessNetworkDefMock;
        }));

        it('should set business network readme', inject([FileService], (service: FileService) => {
            let businessNetworkChangedSpy = sinon.spy(service.businessNetworkChanged$, 'next');

            businessNetworkDefMock.getMetadata.returns({
                setReadme: sinon.stub()
            });

            service.setBusinessNetworkReadme('my readme');

            businessNetworkDefMock.setReadme.should.have.been.calledWith('my readme');
        }));

        it('should set business network packageJson', inject([FileService], (service: FileService) => {
            businessNetworkDefMock.getMetadata.returns({
                getName: sinon.stub().returns('my name')
            });

            let packageJson = {name: 'my name', version: 'my version', description: 'my description'};

            service.setBusinessNetworkPackageJson(JSON.stringify(packageJson, null, 2));

            businessNetworkDefMock.setPackageJson.should.have.been.calledWith(packageJson);
        }));
    });

    describe('getModelFiles', () => {
        it('should get model files', inject([FileService], (service: FileService) => {
            let modelManagerMock = {
                getModelFiles: sinon.stub().returns([modelFileMock, modelFileMock])
            };
            businessNetworkDefMock.getModelManager.returns(modelManagerMock);
            sinon.stub(service, 'getBusinessNetwork').returns(businessNetworkDefMock);

            let result = service.getModelFiles();

            result.length.should.equal(2);
            result[0].should.deep.equal(modelFileMock);
            result[1].should.deep.equal(modelFileMock);
        }));

        it('should not get sys model files', inject([FileService], (service: FileService) => {
            let sysModel = sinon.createStubInstance(ModelFile);

            sysModel.systemModelFile = true;

            let modelManagerMock = {
                getModelFiles: sinon.stub().returns([modelFileMock, modelFileMock, sysModel])
            };
            businessNetworkDefMock.getModelManager.returns(modelManagerMock);
            sinon.stub(service, 'getBusinessNetwork').returns(businessNetworkDefMock);

            let result = service.getModelFiles(false);

            result.length.should.equal(2);
            result[0].should.deep.equal(modelFileMock);
            result[1].should.deep.equal(modelFileMock);
        }));
    });

    describe('getScripts', () => {
        it('should get script files', inject([FileService], (service: FileService) => {
            let scriptManagerMock = {
                getScripts: sinon.stub().returns([scriptFileMock, scriptFileMock])
            };
            businessNetworkDefMock.getScriptManager.returns(scriptManagerMock);
            service['currentBusinessNetwork'] = businessNetworkDefMock;

            let result = service.getScripts();

            result.length.should.equal(2);
            result[0].should.deep.equal(scriptFileMock);
            result[1].should.deep.equal(scriptFileMock);
        }));
    });

    describe('getMetaData', () => {
        it('should get the metadata', inject([FileService], (service: FileService) => {

            businessNetworkDefMock.getMetadata.returns({metadata: 'my metadata'});
            service['currentBusinessNetwork'] = businessNetworkDefMock;

            let result = service.getMetaData();

            result.should.deep.equal({metadata: 'my metadata'});
            businessNetworkDefMock.getMetadata.should.have.been.called;
        }));
    });

    describe('getBusinessNetworkName', () => {
        it('should get the name', inject([FileService], (service: FileService) => {
            sinon.stub(service, 'getBusinessNetwork').returns(businessNetworkDefMock);

            businessNetworkDefMock.getMetadata.returns({
                getName: sinon.stub().returns('my name')
            });

            let result = service.getBusinessNetworkName();

            result.should.equal('my name');
        }));
    });

    describe('getBusinessNetworkVersion', () => {
        it('should get the name', inject([FileService], (service: FileService) => {
            sinon.stub(service, 'getBusinessNetwork').returns(businessNetworkDefMock);

            businessNetworkDefMock.getMetadata.returns({
                getVersion: sinon.stub().returns('1.0.0')
            });

            let result = service.getBusinessNetworkVersion();

            result.should.equal('1.0.0');
        }));
    });

    describe('getBusinessNetworkDescription', () => {
        it('should get the description', inject([FileService], (service: FileService) => {
            sinon.stub(service, 'getBusinessNetwork').returns(businessNetworkDefMock);

            businessNetworkDefMock.getMetadata.returns({
                getDescription: sinon.stub().returns('my description')
            });

            let result = service.getBusinessNetworkDescription();

            result.should.equal('my description');
        }));
    });

    describe('getBusinessNetwork', () => {
        it('should get the businessNetwork', inject([FileService], (service: FileService) => {
            service['currentBusinessNetwork'] = businessNetworkDefMock;

            let result = service.getBusinessNetwork();
            result.should.deep.equal(businessNetworkDefMock);
        }));
    });

    describe('changesDeployed', () => {
      it('should set dirty to false', inject([FileService], (service: FileService) => {
          service['dirty'] = true;

          service.changesDeployed();

          service['dirty'].should.deep.equal(false);
      }));
    });

    describe('isDirty', () => {
      it('should return dirty', inject([FileService], (service: FileService) => {
          service['dirty'] = true;

          service.isDirty().should.deep.equal(true);
      }));

      it('should return dirty', inject([FileService], (service: FileService) => {
          service['dirty'] = false;

          service.isDirty().should.deep.equal(false);
      }));
    });
});
