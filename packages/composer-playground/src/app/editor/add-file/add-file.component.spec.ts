/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { ComponentFixture, TestBed, async, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { BehaviorSubject, Subject } from 'rxjs/Rx';

import { BusinessNetworkDefinition } from 'composer-admin';
import { ModelFile, ModelManager, ScriptManager, Script, AclFile, AclManager, AssetDeclaration, QueryFile, QueryManager } from 'composer-common';

import { AddFileComponent } from './add-file.component';
import { FileImporterComponent } from '../../common/file-importer';
import { FileDragDropDirective } from '../../common/file-importer/file-drag-drop';

import { AdminService } from '../../services/admin.service';
import { AlertService } from '../../basic-modals/alert.service';
import { ClientService } from '../../services/client.service';

import * as sinon from 'sinon';

import { expect } from 'chai';
import { FileService } from '../../services/file.service';

class MockAdminService {
    ensureConnection(): Promise<any> {
        return new Promise((resolve, reject) => {
            resolve(true);
        });
    }

    deploy(): Promise<any> {
        return new Promise((resolve, reject) => {
            resolve(new BusinessNetworkDefinition('org-acme-biznet@0.0.1', 'Acme Business Network'));
        });
    }

    update(): Promise<any> {
        return new Promise((resolve, reject) => {
            resolve(new BusinessNetworkDefinition('org-acme-biznet@0.0.1', 'Acme Business Network'));
        });
    }

    generateDefaultBusinessNetwork(): BusinessNetworkDefinition {
        return new BusinessNetworkDefinition('org-acme-biznet@0.0.1', 'Acme Business Network');
    }

    isInitialDeploy(): boolean {
        return true;
    }
}

class MockAlertService {
    public errorStatus$: Subject<string> = new BehaviorSubject<string>(null);
    public busyStatus$: Subject<string> = new BehaviorSubject<string>(null);
}

describe('AddFileComponent', () => {
    let sandbox;
    let component: AddFileComponent;
    let fixture: ComponentFixture<AddFileComponent>;
    let mockBusinessNetwork;
    let mockModelManager;
    let mockScriptManager;
    let mockAclManager;
    let mockSystemModelFile;
    let mockSystemAsset;
    let mockAclFile;
    let mockQueryManager;
    let mockQueryFile;
    let mockFileService;

    beforeEach(() => {

        mockFileService = sinon.createStubInstance(FileService);

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
                {provide: AdminService, useClass: MockAdminService},
                {provide: AlertService, useClass: MockAlertService},
                {provide: FileService, useValue: mockFileService},
                NgbActiveModal
            ]
        });

        sandbox = sinon.sandbox.create();

        fixture = TestBed.createComponent(AddFileComponent);
        component = fixture.componentInstance;

        mockScriptManager = sinon.createStubInstance(ScriptManager);
        mockBusinessNetwork = sinon.createStubInstance(BusinessNetworkDefinition);
        mockBusinessNetwork.getModelManager.returns(mockModelManager);
        mockBusinessNetwork.getScriptManager.returns(mockScriptManager);
        mockBusinessNetwork.getAclManager.returns(mockAclManager);

        mockSystemModelFile = sinon.createStubInstance(ModelFile);
        mockSystemModelFile.isLocalType.withArgs('Asset').returns(true);
        mockSystemModelFile.getNamespace.returns('org.hyperledger.composer.system');
        mockModelManager = sinon.createStubInstance(ModelManager);
        mockModelManager.getModelFile.withArgs('org.hyperledger.composer.system').returns(mockSystemModelFile);
        mockSystemAsset = sinon.createStubInstance(AssetDeclaration);
        mockSystemAsset.getFullyQualifiedName.returns('org.hyperledger.composer.system.Asset');
        mockModelManager.getSystemTypes.returns([mockSystemAsset]);

        mockAclFile = sinon.createStubInstance(AclFile);
        mockAclManager = sinon.createStubInstance(AclManager);
        mockAclManager.getAclFile.returns(mockAclFile);

        mockQueryFile = sinon.createStubInstance(QueryFile);
        mockQueryManager = sinon.createStubInstance(QueryManager);
        mockQueryManager.getQueryFile.returns(mockQueryFile);

    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('#fileDetected', () => {
        it('should change this.expandInput to true', () => {
            component.fileDetected();
            component.expandInput.should.equal(true);
        });
    });

    describe('#fileLeft', () => {
        it('should change this.expectedInput to false', () => {
            component.fileLeft();
            component.expandInput.should.equal(false);
        });
    });

    describe('#fileAccepted', () => {
        it('should call this.createModel if model file detected', fakeAsync(() => {
            let b = new Blob(['/**CTO File*/'], {type: 'text/plain'});
            let file = new File([b], 'newfile.cto');

            let createMock = sandbox.stub(component, 'createModel');
            let dataBufferMock = sandbox.stub(component, 'getDataBuffer')
            .returns(Promise.resolve('some data'));

            // Run method
            component.fileAccepted(file);
            tick();

            // Assertions
            createMock.should.have.been.called;
        }));

        it('should call this.createScript if script file detected', fakeAsync(() => {

            let b = new Blob(['/**JS File*/'], {type: 'text/plain'});
            let file = new File([b], 'newfile.js');

            let createMock = sandbox.stub(component, 'createScript');
            let dataBufferMock = sandbox.stub(component, 'getDataBuffer')
            .returns(Promise.resolve('some data'));

            // Run method
            component.fileAccepted(file);
            tick();

            // Assertions
            createMock.should.have.been.called;
        }));

        it('should call this.createRules if ACL file detected', fakeAsync(() => {

            let b = new Blob(['/**ACL File*/'], {type: 'text/plain'});
            let file = new File([b], 'newfile.acl');

            let createMock = sandbox.stub(component, 'createRules');
            let dataBufferMock = sandbox.stub(component, 'getDataBuffer')
            .returns(Promise.resolve('some data'));

            // Run method
            component.fileAccepted(file);
            tick();

            // Assertions
            createMock.should.have.been.called;
        }));

        it('should call this.createReadme if readme file detected', fakeAsync(() => {

            let b = new Blob(['/**README File*/'], {type: 'text/plain'});
            let file = new File([b], 'README.md');

            let createMock = sandbox.stub(component, 'createReadme');
            let dataBufferMock = sandbox.stub(component, 'getDataBuffer')
            .returns(Promise.resolve('some data'));

            // Run method
            component.fileAccepted(file);
            tick();

            // Assertions
            createMock.should.have.been.called;
        }));

        it('should call this.createQuery if query file detected', fakeAsync(() => {

            let b = new Blob(['/**QUERY File*/'], {type: 'text/plain'});
            let file = new File([b], 'newfile.qry');

            let createMock = sandbox.stub(component, 'createQuery');
            let dataBufferMock = sandbox.stub(component, 'getDataBuffer')
            .returns(Promise.resolve('some data'));

            // Run method
            component.fileAccepted(file);
            tick();

            // Assertions
            createMock.should.have.been.called;
        }));

        it('should call this.fileRejected when there is an error reading the file', fakeAsync(() => {

            let b = new Blob(['/**CTO File*/'], {type: 'text/plain'});
            let file = new File([b], 'newfile.cto');

            let createMock = sandbox.stub(component, 'fileRejected');
            let dataBufferMock = sandbox.stub(component, 'getDataBuffer')
            .returns(Promise.reject('some data'));

            // Run method
            component.fileAccepted(file);
            tick();

            // Assertions
            createMock.called;
        }));

        it('should throw when given incorrect file type', fakeAsync(() => {

            let b = new Blob(['/**PNG File*/'], {type: 'text/plain'});
            let file = new File([b], 'newfile.png');

            let createMock = sandbox.stub(component, 'fileRejected');
            let dataBufferMock = sandbox.stub(component, 'getDataBuffer')
            .returns(Promise.resolve('some data'));

            // Run method
            component.fileAccepted(file);
            tick();

            // Assertions
            createMock.calledWith('Unexpected File Type: png');
        }));
    });

    describe('#fileRejected', () => {
        it('should return an error status', async(() => {
            component.fileRejected('long reason to reject file');

            component['alertService'].errorStatus$.subscribe(
                (message) => {
                    expect(message).to.be.equal('long reason to reject file');
                }
            );
        }));
    });

    describe('#createScript', () => {
        it('should create a new script file', async(() => {
            let mockScript = sinon.createStubInstance(Script);
            mockScript.getIdentifier.returns('newfile.js');
            mockFileService.createScriptFile.returns(mockScript);

            let b = new Blob(['/**JS File*/'], {type: 'text/plain'});
            let file = new File([b], 'newfile.js');

            // Run method
            component.createScript(file, file);

            // Assertions
            component.fileType.should.equal('js');
            mockFileService.createScriptFile.calledWith(file.name, 'JS', file.toString());
            component.currentFile.should.deep.equal(mockScript);
            component.currentFileName.should.equal(mockScript.getIdentifier());
        }));

        it('should use the addScriptFileName variable as the file name if none passed in', () => {
            let fileName = 'testFileName.js';
            component.addScriptFileName = fileName;
            let mockScript = sinon.createStubInstance(Script);
            mockScript.getIdentifier.returns(fileName);
            mockFileService.createScriptFile.returns(mockScript);

            let b = new Blob(['/**JS File*/'], {type: 'text/plain'});
            let file = new File([b], '');

            // Run method
            component.createScript(null, file);

            // Assertions
            component.fileType.should.equal('js');
            mockFileService.createScriptFile.calledWith(fileName, 'JS', file.toString());
            component.currentFile.should.deep.equal(mockScript);
            component.currentFileName.should.equal(mockScript.getIdentifier());
            component.currentFileName.should.equal(fileName);
        });
    });

    describe('#createModel', () => {
        it('should create a new model file', async(() => {
            let b = new Blob(
                [`/**CTO File**/ namespace test`],
                {type: 'text/plain'}
            );
            let file = new File([b], 'newfile.cto');
            let dataBuffer = new Buffer('/**CTO File**/ namespace test');
            let mockModel = new ModelFile(mockModelManager, dataBuffer.toString(), 'models/' + file.name);
            mockFileService.createModelFile.returns(mockModel);

            // Run method
            component.createModel(file, dataBuffer);

            // Assertions
            component.fileType.should.equal('cto');
            mockFileService.createModelFile.should.have.been.calledWith(dataBuffer.toString(), 'models/' + file.name);
            component.currentFile.should.deep.equal(mockModel);
            component.currentFileName.should.equal(mockModel.getName());
        }));

        it('should use the addModelFileName variable as the file name if none passed in', async(() => {
            let fileName = 'models/testFileName.cto';
            component.addModelFileName = fileName;
            let b = new Blob(
                [`/**CTO File**/ namespace test`],
                {type: 'text/plain'}
            );
            let file = new File([b], '');
            let dataBuffer = new Buffer('/**CTO File**/ namespace test');
            let mockModel = new ModelFile(mockModelManager, dataBuffer.toString(), fileName);
            mockFileService.createModelFile.returns(mockModel);

            // Run method
            component.createModel(null, dataBuffer);

            // Assertions
            component.fileType.should.equal('cto');
            mockFileService.createModelFile.should.have.been.calledWith(dataBuffer.toString(), fileName);
            component.currentFile.should.deep.equal(mockModel);
            component.currentFileName.should.equal(mockModel.getName());
            component.currentFileName.should.equal(fileName);
        }));
    });

    describe('#createRules', () => {
        it('should create a new ACL file named permissions.acl', async(() => {
            let dataBuffer = new Buffer('/**RULE File**/ all the rules');
            let filename = 'permissions.acl';
            let mockRuleFile = sinon.createStubInstance(AclFile);
            mockFileService.createAclFile.returns(mockRuleFile);

            // Run method
            component.createRules(dataBuffer);

            // Assertions
            component.fileType.should.equal('acl');
            mockFileService.createAclFile.should.have.been.calledWith(filename, dataBuffer.toString());
            component.currentFile.should.deep.equal(mockRuleFile);
            component.currentFileName.should.equal(filename);
        }));
    });

    describe('#createQuery', () => {
        it('should create a new query file named queries.qry', async(() => {
            let dataBuffer = new Buffer('/**QUERY File**/ query things');
            let filename = 'queries.qry';
            mockFileService.createQueryFile.returns(mockQueryFile);

            // Run method
            component.createQuery(dataBuffer);

            // Assertions
            component.fileType.should.equal('qry');
            mockFileService.createQueryFile.should.have.been.calledWith(filename, dataBuffer.toString());
            component.currentFile.should.deep.equal(mockQueryFile);
            component.currentFileName.should.equal(filename);
        }));
    });

    describe('#createReadme', () => {
        it('should establish a readme file', async(() => {
            let dataBuffer = new Buffer('/**README File**/ read all the things');

            // Run method
            component.createReadme(dataBuffer);

            // Assertions
            component.fileType.should.equal('md');
            component.currentFileName.should.equal('README.md');
            component.currentFile.should.equal(dataBuffer.toString());
        }));

    });

    describe('#changeCurrentFileType', () => {
        it('should set current file to a script file, created by calling createScript with correct parameters', async(() => {
            let mockScript = sinon.createStubInstance(Script);
            mockScript.getIdentifier.returns('lib/script.js');
            mockFileService.getScripts.returns([]);
            mockFileService.createScriptFile.returns(mockScript);
            component.fileType = 'js';

            // Run method
            component.changeCurrentFileType();

            // Assertions
            mockFileService.createScriptFile.getCall(0).args[0].should.equal('lib/script.js');
        }));

        it('should increment a script file name if one already exists', async(() => {
            let mockScript = sinon.createStubInstance(Script);
            let mockScript0 = sinon.createStubInstance(Script);
            let mockScript1 = sinon.createStubInstance(Script);
            mockScript.getIdentifier.returns('lib/script.js');
            mockScript0.getIdentifier.returns('lib/script0.js');
            mockScript1.getIdentifier.returns('lib/script1.js');
            mockFileService.getScripts.returns([mockScript, mockScript0, mockScript1]);
            mockFileService.createScriptFile.returns(mockScript);

            component.fileType = 'js';

            // Run method
            component.changeCurrentFileType();

            // Assertions
            mockFileService.createScriptFile.getCall(0).args[0].should.equal('lib/script2.js');
        }));

        it('should change this.currentFileType to a cto file', async(() => {
            mockFileService.getModelFiles.returns([]);
            let b = new Blob(
                [`/**
 * New model file
 */

namespace org.acme.model`],
                {type: 'text/plain'}
            );
            let file = new File([b], 'models/org.acme.model.cto');
            let dataBuffer = new Buffer(`/**
 * New model file
 */

namespace org.acme.model`);
            let mockModel = new ModelFile(mockModelManager, dataBuffer.toString(), file.name);
            mockFileService.createModelFile.returns(mockModel);
            component.fileType = 'cto';

            // Run method
            component.changeCurrentFileType();

            // Assertions
            component.currentFileName.should.equal('models/org.acme.model.cto');
            component.currentFile.should.deep.equal(mockModel);
        }));

        it('should append the file number to the cto file name', () => {

            let b = new Blob(
                [`/**
 * New model file
 */

namespace org.acme.model`],
                {type: 'text/plain'}
            );
            let file = new File([b], 'org.acme.model.cto');
            let dataBuffer = new Buffer(`/**
 * New model file
 */

namespace org.acme.model`);
            let mockModel = new ModelFile(mockModelManager, dataBuffer.toString(), file.name);

            // One element, so the number 0 should be appended
            mockFileService.getModelFiles.returns([mockModel]);

            component.fileType = 'cto';

            // Run method
            component.changeCurrentFileType();

            // Assertions
            mockFileService.createModelFile.getCall(0).args[1].should.be.equal('models/org.acme.model0.cto');
            component.currentFileName.should.equal('models/org.acme.model0.cto');
        });

        it('should fill in template model name indices for a cto file name', async(() => {
            let mockFile = sinon.createStubInstance(ModelFile);
            mockFile.getNamespace.returns('org.acme.model');
            let mockFile0 = sinon.createStubInstance(ModelFile);
            mockFile0.getNamespace.returns('org.acme.model0');
            let mockFile1 = sinon.createStubInstance(ModelFile);
            mockFile1.getNamespace.returns('org.acme.model1');
            let mockFile3 = sinon.createStubInstance(ModelFile);
            mockFile3.getNamespace.returns('org.acme.model3');
            let mockFile4 = sinon.createStubInstance(ModelFile);
            mockFile4.getNamespace.returns('org.acme.model4');
            mockFileService.getModelFiles.returns([mockFile, mockFile0, mockFile1, mockFile3, mockFile4]);

            let b = new Blob(
                [`/**
 * New model file
 */

namespace org.acme.model`],
                {type: 'text/plain'}
            );
            let file = new File([b], 'org.acme.model.cto');
            let dataBuffer = new Buffer(`/**
 * New model file
 */

namespace org.acme.model`);

            let mockModel = new ModelFile(mockModelManager, dataBuffer.toString(), file.name);
            mockFileService.createModelFile.returns(mockModel);
            component.fileType = 'cto';

            // Run method
            component.changeCurrentFileType();

            // Assertions
            component.currentFileName.should.equal('models/org.acme.model2.cto');
        }));

        it('should change current file to a query file upon calling createQueryFile', () => {

            let dataBuffer = new Buffer(`/**
 * New query file
 */`);

            let mockQuery = new QueryFile('queries.qry', mockQueryManager, dataBuffer.toString());
            mockFileService.createAclFile.returns(mockQuery);
            component.fileType = 'qry';

            component.changeCurrentFileType();

            component.currentFileName.should.equal('queries.qry');

        });

        it('should change current file to an acl file upon calling createAclFile', () => {

            let dataBuffer = new Buffer(`/**
 * New access control file
 */
 rule AllAccess {
     description: "AllAccess - grant everything to everybody."
     participant: "org.hyperledger.composer.system.Participant"
     operation: ALL
     resource: "org.hyperledger.composer.system.**"
     action: ALLOW
 }`);

            let mockAcl = new AclFile('permissions.acl', mockAclManager, dataBuffer.toString());
            mockFileService.createAclFile.returns(mockAcl);
            component.fileType = 'acl';

            component.changeCurrentFileType();

            component.currentFileName.should.equal('permissions.acl');
        });
    });

    describe('#removeFile', () => {
        it('should reset back to default values', async(() => {
            component.expandInput = true;
            component.currentFile = true;
            component.currentFileName = true;
            component.fileType = 'js';

            // Run method
            component.removeFile();

            // Assertions
            component.expandInput.should.not.be.true;
            expect(component.currentFile).to.be.null;
            expect(component.currentFileName).to.be.null;
            component.fileType.should.equal('');
        }));
    });

    describe('#getDataBuffer', () => {
        let file;
        let mockFileReadObj;
        let mockBuffer;
        let mockFileRead;
        let content;

        beforeEach(() => {
            content = 'hello world';
            let data = new Blob([content], {type: 'text/plain'});
            file = new File([data], 'mock.bna');

            mockFileReadObj = {
                readAsArrayBuffer: sandbox.stub(),
                result: content,
                onload: sinon.stub(),
                onerror: sinon.stub()
            };

            mockFileRead = sinon.stub((<any> window), 'FileReader');
            mockFileRead.returns(mockFileReadObj);
        });

        afterEach(() => {
            mockFileRead.restore();
        });

        it('should return data from a file', () => {
            let promise = component.getDataBuffer(file);
            mockFileReadObj.onload();
            return promise
            .then((data) => {
                // Assertions
                data.toString().should.equal(content);
            });
        });

        it('should give error in promise chain', () => {
            let promise = component.getDataBuffer(file);
            mockFileReadObj.onerror('error');
            return promise
            .then((data) => {
                // Assertions
                data.should.be.null;
            })
            .catch((err) => {
                // Assertions
                err.should.equal('error');
            });
        });
    });

    describe('#aclExists', () => {

        it('should return true if an acl file is present', () => {
            let fileArray = [];
            fileArray.push({acl: true, id: 'acl file', displayID: 'acl0'});
            fileArray.push({script: true, id: 'script 0', displayID: 'script0'});
            component['files'] = fileArray;

            let result = component['aclExists']();
            result.should.equal(true);

        });

        it('should return false if an acl file is not present', () => {
            let fileArray = [];
            fileArray.push({script: true, id: 'script 0', displayID: 'script0'});
            fileArray.push({script: true, id: 'script 0', displayID: 'script1'});
            component['files'] = fileArray;

            let result = component['aclExists']();
            result.should.equal(false);
        });

    });

    describe('#queryExists', () => {

        it('should return true if a query file is present', () => {
            let fileArray = [];
            fileArray.push({query: true, id: 'query file', displayID: 'query0'});
            fileArray.push({script: true, id: 'script 0', displayID: 'script0'});
            component['files'] = fileArray;

            let result = component['queryExists']();
            result.should.equal(true);
        });

        it('should return true if a query file is not present', () => {
            let fileArray = [];
            fileArray.push({script: true, id: 'script 0', displayID: 'script0'});
            fileArray.push({script: true, id: 'script 0', displayID: 'script1'});
            component['files'] = fileArray;

            let result = component['queryExists']();
            result.should.equal(false);
        });

    });

});
