/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { TestBed, inject, fakeAsync, tick } from '@angular/core/testing';
import { ClientService } from './client.service';

import * as sinon from 'sinon';
import * as chai from 'chai';

let should = chai.should();
let expect = chai.expect;

import { AdminService } from './admin.service';
import { AlertService } from '../basic-modals/alert.service';
import { BusinessNetworkDefinition, ModelFile, Script, AclFile, QueryFile } from 'composer-common';
import { ConnectionProfileService } from './connectionprofile.service';
import { BusinessNetworkConnection } from 'composer-client';
import { IdentityService } from './identity.service';
import { LocalStorageService } from 'angular-2-local-storage';

describe('ClientService', () => {

    let sandbox;

    let adminMock;
    let alertMock;
    let connectionProfileMock;
    let businessNetworkDefMock;
    let identityMock;
    let businessNetworkConMock;
    let modelFileMock;
    let scriptFileMock;
    let aclFileMock;
    let mockLocalStorage;
    let queryFileMock;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();

        businessNetworkDefMock = sinon.createStubInstance(BusinessNetworkDefinition);
        adminMock = sinon.createStubInstance(AdminService);
        alertMock = sinon.createStubInstance(AlertService);
        connectionProfileMock = sinon.createStubInstance(ConnectionProfileService);
        identityMock = sinon.createStubInstance(IdentityService);
        businessNetworkConMock = sinon.createStubInstance(BusinessNetworkConnection);
        modelFileMock = sinon.createStubInstance(ModelFile);
        scriptFileMock = sinon.createStubInstance(Script);
        aclFileMock = sinon.createStubInstance(AclFile);
        queryFileMock = sinon.createStubInstance(QueryFile);
        mockLocalStorage = sinon.createStubInstance(LocalStorageService);
        queryFileMock = sinon.createStubInstance(QueryFile);

        alertMock.errorStatus$ = {next: sinon.stub()};
        alertMock.busyStatus$ = {next: sinon.stub()};

        TestBed.configureTestingModule({
            providers: [ClientService,
                {provide: AdminService, useValue: adminMock},
                {provide: AlertService, useValue: alertMock},
                {provide: ConnectionProfileService, useValue: connectionProfileMock},
                {provide: IdentityService, useValue: identityMock},
                {provide: LocalStorageService, useValue: mockLocalStorage}]
        });
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('getBusinessNetworkConnection', () => {
        it('should get business network connection', inject([ClientService], (service: ClientService) => {
            service['businessNetworkConnection'] = businessNetworkConMock;
            let result = service.getBusinessNetworkConnection();

            result.should.deep.equal(businessNetworkConMock);
        }));

        it('should create a new business network connection if none exist', inject([ClientService], (service: ClientService) => {
            let mockCreate = sinon.stub(service, 'createBusinessNetworkConnection');
            let result = service.getBusinessNetworkConnection();

            mockCreate.should.have.been.called;
        }));
    });

    describe('getBusinessNetwork', () => {
        it('should get the buisness network', inject([ClientService], (service: ClientService) => {
            service['currentBusinessNetwork'] = businessNetworkDefMock;

            let result = service.getBusinessNetwork();

            result.should.deep.equal(businessNetworkDefMock);
        }));

        it('should create business network if it doesn\'t exist', inject([ClientService], (service: ClientService) => {
            businessNetworkConMock.getBusinessNetwork.returns(businessNetworkDefMock);
            let businessNetworkConnectionMock = sinon.stub(service, 'getBusinessNetworkConnection').returns(businessNetworkConMock);
            let result = service.getBusinessNetwork();

            businessNetworkConnectionMock.should.have.been.called;
            result.should.deep.equal(businessNetworkDefMock);
        }));
    });

    describe('getModelFile', () => {
        it('should get the model file', inject([ClientService], (service: ClientService) => {
            let modelManagerMock = {
                getModelFile: sinon.stub().returns(modelFileMock)
            };
            businessNetworkDefMock.getModelManager.returns(modelManagerMock);
            sinon.stub(service, 'getBusinessNetwork').returns(businessNetworkDefMock);

            let result = service.getModelFile('testId');

            result.should.deep.equal(modelFileMock);
            modelManagerMock.getModelFile.should.have.been.calledWith('testId');
        }));
    });

    describe('getModelFiles', () => {
        it('should get model files', inject([ClientService], (service: ClientService) => {
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
    });

    describe('updateFile', () => {
        let mockBusinessNetwork;
        let businessNetworkChangedSpy;
        let modelManagerMock;
        let namespaceChangedSpy;
        let mockNamespaceCollide;

        beforeEach(inject([ClientService], (service: ClientService) => {
            mockBusinessNetwork = sinon.stub(service, 'getBusinessNetwork').returns(businessNetworkDefMock);
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

        it('should update a model file if id matches namespace', inject([ClientService], (service: ClientService) => {
            modelFileMock.getNamespace.returns('model-ns');
            modelFileMock.getName.returns('model.cto');
            businessNetworkDefMock.getModelManager.returns(modelManagerMock);

            let mockCreateModelFile = sinon.stub(service, 'createModelFile').returns(modelFileMock);

            let result = service.updateFile('model-ns', 'my-model-content', 'model');

            modelManagerMock.updateModelFile.should.have.been.calledWith(modelFileMock);
            modelManagerMock.addModelFile.should.not.have.been.called;
            should.not.exist(result);
            businessNetworkChangedSpy.should.have.been.calledWith(true);
        }));

        it('should replace a model file if id does not match namespace', inject([ClientService], (service: ClientService) => {
            businessNetworkDefMock.getModelManager.returns(modelManagerMock);
            modelFileMock.getNamespace.returns('model-ns');
            modelFileMock.getName.returns('model.cto');

            let mockCreateModelFile = sinon.stub(service, 'createModelFile').returns(modelFileMock);

            let result = service.updateFile('diff-model-ns', 'my-model-content', 'model');

            modelManagerMock.addModelFile.should.have.been.calledWith(modelFileMock);
            should.not.exist(result);
            businessNetworkChangedSpy.should.have.been.calledWith(true);
        }));

        it('should notify if model file namespace changes', inject([ClientService], (service: ClientService) => {

            businessNetworkDefMock.getModelManager.returns(modelManagerMock);
            modelFileMock.getNamespace.returns('new-model-ns');
            modelManagerMock.getModelFile.returns(modelFileMock);

            let mockCreateModelFile = sinon.stub(service, 'createModelFile').returns(modelFileMock);

            service.updateFile('model-ns', 'my-model-content', 'model');

            namespaceChangedSpy.should.have.been.calledWith('new-model-ns');
        }));

        it('should update a script file', inject([ClientService], (service: ClientService) => {
            let scriptManagerMock = {
                createScript: sinon.stub().returns(scriptFileMock),
                addScript: sinon.stub()
            };

            businessNetworkDefMock.getScriptManager.returns(scriptManagerMock);

            let result = service.updateFile('script', 'my-script', 'script');

            scriptManagerMock.createScript.should.have.been.calledWith('script', 'JS', 'my-script');
            scriptManagerMock.addScript.should.have.been.calledWith(scriptFileMock);
            should.not.exist(result);
            businessNetworkChangedSpy.should.have.been.calledWith(true);
        }));

        it('should update a acl file', inject([ClientService], (service: ClientService) => {
            let aclManagerMock = {
                setAclFile: sinon.stub()
            };

            businessNetworkDefMock.getAclManager.returns(aclManagerMock);

            let mockCreateAclFile = sinon.stub(service, 'createAclFile').returns(aclFileMock);

            let result = service.updateFile('acl', 'my-acl', 'acl');

            aclManagerMock.setAclFile.should.have.been.calledWith(aclFileMock);
            should.not.exist(result);
            businessNetworkChangedSpy.should.have.been.calledWith(true);
        }));

        it('should update a query file', inject([ClientService], (service: ClientService) => {
            let queryManagerMock = {
                setQueryFile: sinon.stub()
            };

            businessNetworkDefMock.getQueryManager.returns(queryManagerMock);

            let mockCreateQueryFile = sinon.stub(service, 'createQueryFile').returns(queryFileMock);

            // call function
            let result = service.updateFile('query', 'my-query', 'query');

            queryManagerMock.setQueryFile.should.have.been.calledWith(queryFileMock);
            should.not.exist(result);
            businessNetworkChangedSpy.should.have.been.calledWith(true);
        }));

        it('should not update a model file if invalid with a matching namespace', inject([ClientService], (service: ClientService) => {

            modelManagerMock = {
                addModelFile: sinon.stub().throws('invalid'),
                updateModelFile: sinon.stub().throws('invalid'),
                deleteModelFile: sinon.stub(),
                getModelFile: sinon.stub().returns(modelFileMock)
            };

            businessNetworkDefMock.getModelManager.returns(modelManagerMock);
            modelFileMock.getNamespace.returns('model-ns');

            let mockCreateModelFile = sinon.stub(service, 'createModelFile').returns(modelFileMock);

            let result = service.updateFile('model-ns', 'my-model-content', 'model');

            result.should.equal('invalid');
            businessNetworkChangedSpy.should.have.been.calledWith(false);
        }));

        it('should not replace a model file if id does not match namespace and file is invalid', inject([ClientService], (service: ClientService) => {

            modelManagerMock = {
                addModelFile: sinon.stub().throws('invalid'),
                updateModelFile: sinon.stub().throws('invalid'),
                deleteModelFile: sinon.stub(),
                getModelFile: sinon.stub().returns(modelFileMock)
            };

            businessNetworkDefMock.getModelManager.returns(modelManagerMock);

            modelFileMock.getNamespace.returns('new-model');
            let mockCreateModelFile = sinon.stub(service, 'createModelFile').returns(modelFileMock);

            let result = service.updateFile('model', 'my-model', 'model');

            result.should.equal('invalid');
            businessNetworkChangedSpy.should.have.been.calledWith(false);
        }));

        it('should not update an invalid script file', inject([ClientService], (service: ClientService) => {
            let scriptManagerMock = {
                createScript: sinon.stub().throws('invalid'),
                addScript: sinon.stub()
            };

            businessNetworkDefMock.getScriptManager.returns(scriptManagerMock);

            let result = service.updateFile('script', 'my-script', 'script');

            result.should.equal('invalid');
            businessNetworkChangedSpy.should.have.been.calledWith(false);
        }));

        it('should not update an invalid acl file', inject([ClientService], (service: ClientService) => {
            let aclManagerMock = {
                setAclFile: sinon.stub().throws('invalid')
            };

            businessNetworkDefMock.getAclManager.returns(aclManagerMock);
            let mockCreateAclFile = sinon.stub(service, 'createAclFile').returns(aclFileMock);

            let result = service.updateFile('acl', 'my-acl', 'acl');

            businessNetworkChangedSpy.should.have.been.calledWith(false);
            result.should.equal('invalid');
        }));

        it('should not update a model file if namespace collision detected', inject([ClientService], (service: ClientService) => {
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

            let result = service.updateFile('model', 'my-model', 'model');

            result.should.equal('Error: The namespace collides with existing model namespace new-model');
            modelManagerMock.updateModelFile.should.not.have.been.called;
            businessNetworkChangedSpy.should.have.been.calledWith(false);
        }));
    });

    describe('validateFile', () => {
        let mockBusinessNetwork;

        beforeEach(inject([ClientService], (service: ClientService) => {
            mockBusinessNetwork = sinon.stub(service, 'getBusinessNetwork').returns(businessNetworkDefMock);
        }));

        it('should validate a model file', inject([ClientService], (service: ClientService) => {
            let modelManagerMock = {
                validateModelFile: sinon.stub()
            };

            businessNetworkDefMock.getModelManager.returns(modelManagerMock);

            modelFileMock.getNamespace.returns('model');
            let mockCreateModelFile = sinon.stub(service, 'createModelFile').returns(modelFileMock);

            let result = service.validateFile('model', 'my-model', 'model');

            modelManagerMock.validateModelFile.should.have.been.calledWith(modelFileMock);
            should.not.exist(result);
        }));

        it('should validate a script file', inject([ClientService], (service: ClientService) => {
            let scriptManagerMock = {
                createScript: sinon.stub().returns(scriptFileMock),
                addScript: sinon.stub()
            };

            businessNetworkDefMock.getScriptManager.returns(scriptManagerMock);

            let result = service.validateFile('script', 'my-script', 'script');

            scriptManagerMock.createScript.should.have.been.calledWith('script', 'JS', 'my-script');
            scriptManagerMock.addScript.should.not.have.been.called;
            should.not.exist(result);
        }));

        it('should validate an acl file', inject([ClientService], (service: ClientService) => {
            let modelManagerMock = {
                validateModelFile: sinon.stub()
            };

            businessNetworkDefMock.getModelManager.returns(modelManagerMock);

            aclFileMock = {
                validate: sinon.stub()
            };

            sinon.stub(service, 'createAclFile').returns(aclFileMock);

            let result = service.validateFile('acl', 'my-acl', 'acl');

            aclFileMock.validate.should.have.been.called;
            should.not.exist(result);
        }));

        it('should validate a query file', inject([ClientService], (service: ClientService) => {
            let queryManagerMock = {
                validateQueryFile: sinon.stub()
            };

            businessNetworkDefMock.getQueryManager.returns(queryFileMock);

            queryFileMock = {
                validate: sinon.stub()
            };

            sinon.stub(service, 'createQueryFile').returns(queryFileMock);

            let result = service.validateFile('query', 'my-query', 'query');

            queryFileMock.validate.should.have.been.called;
            should.not.exist(result);
        }));

        it('should return error message if a model file is invalid', inject([ClientService], (service: ClientService) => {
            let modelManagerMock = {
                validateModelFile: sinon.stub().throws('invalid')
            };

            businessNetworkDefMock.getModelManager.returns(modelManagerMock);

            modelFileMock.getNamespace.returns('model');
            let mockCreateModelFile = sinon.stub(service, 'createModelFile').returns(modelFileMock);

            let result = service.validateFile('model', 'my-model', 'model');

            modelManagerMock.validateModelFile.should.have.been.calledWith(modelFileMock);
            result.should.equal('invalid');

        }));

        it('should return error message if a script file is invalid', inject([ClientService], (service: ClientService) => {
            let scriptManagerMock = {
                createScript: sinon.stub().throws('invalid'),
                addScript: sinon.stub()
            };

            businessNetworkDefMock.getScriptManager.returns(scriptManagerMock);

            let result = service.validateFile('script', 'my-script', 'script');

            scriptManagerMock.createScript.should.have.been.calledWith('script', 'JS', 'my-script');
            scriptManagerMock.addScript.should.not.have.been.called;
            result.should.equal('invalid');
        }));

        it('should return error message if an acl file is invalid', inject([ClientService], (service: ClientService) => {
            let modelManagerMock = {
                validateModelFile: sinon.stub()
            };

            businessNetworkDefMock.getModelManager.returns(modelManagerMock);

            aclFileMock = {
                validate: sinon.stub().throws('invalid')
            };

            sinon.stub(service, 'createAclFile').returns(aclFileMock);

            let result = service.validateFile('acl', 'my-acl', 'acl');

            aclFileMock.validate.should.have.been.called;
            result.should.equal('invalid');
        }));

        it('should return error message if an query file is invalid', inject([ClientService], (service: ClientService) => {
            let queryManagerMock = {
                validateQueryFile: sinon.stub()
            };

            businessNetworkDefMock.getQueryManager.returns(queryManagerMock);

            queryFileMock = {
                validate: sinon.stub().throws('invalid')
            };

            sinon.stub(service, 'createQueryFile').returns(queryFileMock);

            let result = service.validateFile('query', 'my-query', 'query');

            queryFileMock.validate.should.have.been.called;
            result.should.equal('invalid');
        }));

    });

    describe('replaceFile', () => {
        // replaceFile(oldId: string, newId: string, content: any, type: string)
        it('should handle error case by notifying and returning error message in string', inject([ClientService], (service: ClientService) => {
            sinon.stub(service, 'getBusinessNetwork').throws(new Error('Forced Error'));
            let businessNetworkChangedSpy = sinon.spy(service.businessNetworkChanged$, 'next');

            let response = service['replaceFile']('oldId', 'newId', 'content', 'model');

            businessNetworkChangedSpy.should.have.been.calledWith(false);
            response.should.equal('Error: Forced Error');

        }));

        it('should replace a model file by model manager update', inject([ClientService], (service: ClientService) => {

            let modelManagerMock = {
                updateModelFile: sinon.stub()
            };
            businessNetworkDefMock.getModelManager.returns(modelManagerMock);
            sinon.stub(service, 'getBusinessNetwork').returns(businessNetworkDefMock);

            let mockCreateModelFile = sinon.stub(service, 'createModelFile').returns(modelFileMock);

            let businessNetworkChangedSpy = sinon.spy(service.businessNetworkChanged$, 'next');

            // Call the method (model)
            let response = service['replaceFile']('oldId', 'newId', 'content', 'model');

            // Check correct items were called with correct parameters
            modelManagerMock.updateModelFile.should.have.been.calledWith(modelFileMock, 'newId');
            businessNetworkChangedSpy.should.have.been.calledWith(true);
            should.not.exist(response);
        }));

        it('should replace a script file by deletion and addition', inject([ClientService], (service: ClientService) => {

            let scriptManagerMock = {
                createScript: sinon.stub().returns(scriptFileMock),
                addScript: sinon.stub(),
                deleteScript: sinon.stub()
            };
            businessNetworkDefMock.getScriptManager.returns(scriptManagerMock);
            let businessNetworkMock = sinon.stub(service, 'getBusinessNetwork').returns(businessNetworkDefMock);

            let businessNetworkChangedSpy = sinon.spy(service.businessNetworkChanged$, 'next');

            // Call the method (script)
            let response = service['replaceFile']('oldId', 'newId', 'content', 'script');

            // Check correct items were called with correct parameters
            scriptManagerMock.addScript.should.have.been.calledWith(scriptFileMock);
            scriptManagerMock.deleteScript.should.have.been.calledWith('oldId');
            businessNetworkChangedSpy.should.have.been.calledWith(true);
            should.not.exist(response);
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

        beforeEach(inject([ClientService], (service: ClientService) => {
            modelManagerMock = {
                getModelFiles: sinon.stub().returns([mockFile0, mockFile1, mockFile2, mockFile3, mockFile4])
            };

            businessNetworkDefMock.getModelManager.returns(modelManagerMock);
            sinon.stub(service, 'getBusinessNetwork').returns(businessNetworkDefMock);
            mockCreateBusinessNetwork = sinon.stub(service, 'createBusinessNetwork').returns(businessNetworkDefMock);
            service['currentBusinessNetwork'] = businessNetworkDefMock;
        }));

        it('should return true if namespace collision detected', inject([ClientService], (service: ClientService) => {

            let result = service.modelNamespaceCollides('name1', 'something-different');
            result.should.be.equal(true);

        }));

        it('should return false if no namespace collision detected with new name', inject([ClientService], (service: ClientService) => {

            let result = service.modelNamespaceCollides('not-in-list', 'something-different');
            result.should.be.equal(false);

        }));

        it('should handle no previousNamespace being passed', inject([ClientService], (service: ClientService) => {

            let result = service.modelNamespaceCollides('new-namespace', null);
            result.should.be.equal(false);

        }));

        it('should handle no model files existing in BND', inject([ClientService], (service: ClientService) => {
            modelManagerMock = {
                getModelFiles: sinon.stub().returns([])
            };

            let result = service.modelNamespaceCollides('not-in-list', 'something-different');
            result.should.be.equal(false);
        }));

    });

    describe('getScriptFile', () => {
        it('should get the script file', inject([ClientService], (service: ClientService) => {
            let scriptManagerMock = {
                getScript: sinon.stub().returns(scriptFileMock)
            };
            businessNetworkDefMock.getScriptManager.returns(scriptManagerMock);
            let businessNetworkMock = sinon.stub(service, 'getBusinessNetwork').returns(businessNetworkDefMock);

            let result = service.getScriptFile('testId');

            result.should.deep.equal(scriptFileMock);
            scriptManagerMock.getScript.should.have.been.calledWith('testId');
        }));
    });

    describe('getScriptFiles', () => {
        it('should get script files', inject([ClientService], (service: ClientService) => {
            let scriptManagerMock = {
                getScripts: sinon.stub().returns([scriptFileMock, scriptFileMock])
            };
            businessNetworkDefMock.getScriptManager.returns(scriptManagerMock);
            let businessNetworkMock = sinon.stub(service, 'getBusinessNetwork').returns(businessNetworkDefMock);

            let result = service.getScripts();

            result.length.should.equal(2);
            result[0].should.deep.equal(scriptFileMock);
            result[1].should.deep.equal(scriptFileMock);
        }));
    });

    describe('getAclFile', () => {
        it('should get the acl file', inject([ClientService], (service: ClientService) => {
            let aclManagerMock = {
                getAclFile: sinon.stub().returns(aclFileMock)
            };
            businessNetworkDefMock.getAclManager.returns(aclManagerMock);
            let businessNetworkMock = sinon.stub(service, 'getBusinessNetwork').returns(businessNetworkDefMock);

            let result = service.getAclFile();

            result.should.deep.equal(aclFileMock);
            aclManagerMock.getAclFile.should.have.been.called;
        }));
    });

    describe('getQueryFile', () => {
        it('should get the query file', inject([ClientService], (service: ClientService) => {
            let queryManagerMock = {
                getQueryFile: sinon.stub().returns(queryFileMock)
            };

            businessNetworkDefMock.getQueryManager.returns(queryManagerMock);
            let businessNetworkMock = sinon.stub(service, 'getBusinessNetwork').returns(businessNetworkDefMock);

            let result = service.getQueryFile();

            result.should.deep.equal(queryFileMock);
            queryManagerMock.getQueryFile.should.have.been.called;
        }));
    });

    describe('getMetaData', () => {
        it('should get the metadata', inject([ClientService], (service: ClientService) => {
            businessNetworkDefMock.getMetadata.returns({metadata: 'my metadata'});
            let businessNetworkMock = sinon.stub(service, 'getBusinessNetwork').returns(businessNetworkDefMock);

            let result = service.getMetaData();

            result.should.deep.equal({metadata: 'my metadata'});
            businessNetworkDefMock.getMetadata.should.have.been.called;
        }));
    });

    describe('setBusinessNetwork...', () => {

        beforeEach(inject([ClientService], (service: ClientService) => {
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

            sinon.stub(service, 'getBusinessNetwork').returns(businessNetworkDefMock);
        }));

        it('should set business network readme', inject([ClientService], (service: ClientService) => {
            let businessNetworkChangedSpy = sinon.spy(service.businessNetworkChanged$, 'next');

            businessNetworkDefMock.getMetadata.returns({
                setReadme: sinon.stub()
            });

            service.setBusinessNetworkReadme('my readme');

            businessNetworkDefMock.setReadme.should.have.been.calledWith('my readme');
            businessNetworkChangedSpy.should.have.been.calledWith(true);
        }));

        it('should set business network version', inject([ClientService], (service: ClientService) => {
            let businessNetworkChangedSpy = sinon.spy(service.businessNetworkChanged$, 'next');

            businessNetworkDefMock.getMetadata.returns({
                getName: sinon.stub().returns('my name'),
                getPackageJson: sinon.stub().returns({version: '0.0'}),
                setPackageJson: sinon.stub()
            });

            service.setBusinessNetworkVersion('new_version');

            businessNetworkDefMock.setPackageJson.should.have.been.calledWith({version: 'new_version'});
            businessNetworkChangedSpy.should.have.been.calledWith(true);
        }));

        it('should set business network packageJson', inject([ClientService], (service: ClientService) => {
            let businessNetworkChangedSpy = sinon.spy(service.businessNetworkChanged$, 'next');

            businessNetworkDefMock.getMetadata.returns({
                getName: sinon.stub().returns('my name')
            });

            let packageJson = {name: 'my name', version: 'my version', description: 'my description'};

            service.setBusinessNetworkPackageJson(packageJson);

            businessNetworkDefMock.setPackageJson.should.have.been.calledWith(packageJson);
            businessNetworkChangedSpy.should.have.been.calledWith(true);
        }));

        it('should prevent setting the business network packageJson to change the BND name', inject([ClientService], (service: ClientService) => {
            let businessNetworkChangedSpy = sinon.spy(service.businessNetworkChanged$, 'next');

            businessNetworkDefMock.getMetadata.returns({
                getName: sinon.stub().returns('my name')
            });

            let packageJson = {name: 'my different name', version: 'my version', description: 'my description'};

            try {
                service.setBusinessNetworkPackageJson(packageJson);
                throw new Error('should not get here');
            } catch (error) {
                businessNetworkDefMock.setPackageJson.should.not.have.been.called;
                businessNetworkChangedSpy.should.not.have.been.called;
                error.toString().should.equal('Error: Unsupported attempt to update Business Network Name.');
            }
        }));
    });

    describe('getBusinessNetworkName', () => {
        it('should get the name', inject([ClientService], (service: ClientService) => {
            sinon.stub(service, 'getBusinessNetwork').returns(businessNetworkDefMock);

            businessNetworkDefMock.getMetadata.returns({
                getName: sinon.stub().returns('my name')
            });

            let result = service.getBusinessNetworkName();

            result.should.equal('my name');
        }));
    });

    describe('ensureConnected', () => {
        it('should return if connected when not forced', fakeAsync(inject([ClientService], (service: ClientService) => {
            service['isConnected'] = true;

            service.ensureConnected();

            identityMock.getUserID.should.not.have.been.called;
        })));

        it('should return if connecting', fakeAsync(inject([ClientService], (service: ClientService) => {
            service['connectingPromise'] = Promise.resolve();

            service.ensureConnected();

            identityMock.getUserID.should.not.have.been.called;
        })));

        it('should connect if not connected', fakeAsync(inject([ClientService], (service: ClientService) => {

            identityMock.getUserID.returns(Promise.resolve('myId'));

            connectionProfileMock.getCurrentConnectionProfile.returns('myProfile');
            adminMock.connect.returns(Promise.resolve());
            let refreshMock = sinon.stub(service, 'refresh').returns(Promise.resolve());
            let setBusinessNetworkMock = sinon.stub(service, 'setSavedBusinessNetworkName');

            let businessNetworkNameMock = sinon.stub(service, 'getBusinessNetworkName').returns('myNetwork');

            service.ensureConnected(null, false);

            tick();

            identityMock.getUserID.should.have.been.called;

            connectionProfileMock.getCurrentConnectionProfile.should.have.been.called;

            alertMock.busyStatus$.next.should.have.been.calledTwice;
            alertMock.busyStatus$.next.firstCall.should.have.been.calledWith({
                title: 'Establishing connection',
                text: 'Using the connection profile myProfile'
            });

            adminMock.connect.should.have.been.calledWith('myNetwork', false);

            refreshMock.should.have.been.calledWith('myNetwork');

            alertMock.busyStatus$.next.secondCall.should.have.been.calledWith(null);

            setBusinessNetworkMock.should.have.been.calledWith('myId');

            service['isConnected'].should.equal(true);
            should.not.exist(service['connectingPromise']);
        })));

        it('should connect if not connected to specified business network', fakeAsync(inject([ClientService], (service: ClientService) => {

            identityMock.getUserID.returns(Promise.resolve('myId'));

            connectionProfileMock.getCurrentConnectionProfile.returns('myProfile');
            adminMock.connect.returns(Promise.resolve());
            let refreshMock = sinon.stub(service, 'refresh').returns(Promise.resolve());
            let setBusinessNetworkMock = sinon.stub(service, 'setSavedBusinessNetworkName');

            let businessNetworkNameMock = sinon.stub(service, 'getBusinessNetworkName');

            service.ensureConnected('myNetwork', false);

            tick();

            identityMock.getUserID.should.have.been.called;

            connectionProfileMock.getCurrentConnectionProfile.should.have.been.called;

            alertMock.busyStatus$.next.should.have.been.calledTwice;
            alertMock.busyStatus$.next.firstCall.should.have.been.calledWith({
                title: 'Establishing connection',
                text: 'Using the connection profile myProfile'
            });

            adminMock.connect.should.have.been.calledWith('myNetwork', false);

            refreshMock.should.have.been.calledWith('myNetwork');

            alertMock.busyStatus$.next.secondCall.should.have.been.calledWith(null);

            setBusinessNetworkMock.should.have.been.called;

            businessNetworkNameMock.should.not.have.been.called;

            service['isConnected'].should.equal(true);
            should.not.exist(service['connectingPromise']);
        })));

        it('should connect if not connected with business network from local storage', fakeAsync(inject([ClientService], (service: ClientService) => {

            identityMock.getUserID.returns(Promise.resolve('myId'));

            connectionProfileMock.getCurrentConnectionProfile.returns('myProfile');
            adminMock.connect.returns(Promise.resolve());
            let refreshMock = sinon.stub(service, 'refresh').returns(Promise.resolve());

            let setBusinessNetworkMock = sinon.stub(service, 'setSavedBusinessNetworkName');
            let getBusinessNetworkMock = sinon.stub(service, 'getSavedBusinessNetworkName').returns('myNetwork');

            let businessNetworkNameMock = sinon.stub(service, 'getBusinessNetworkName').throws();

            service.ensureConnected(null, false);

            tick();

            identityMock.getUserID.should.have.been.called;

            connectionProfileMock.getCurrentConnectionProfile.should.have.been.called;

            alertMock.busyStatus$.next.should.have.been.calledTwice;
            alertMock.busyStatus$.next.firstCall.should.have.been.calledWith({
                title: 'Establishing connection',
                text: 'Using the connection profile myProfile'
            });

            getBusinessNetworkMock.should.have.been.calledWith('myId');

            adminMock.connect.should.have.been.calledWith('myNetwork', false);

            refreshMock.should.have.been.calledWith('myNetwork');

            alertMock.busyStatus$.next.secondCall.should.have.been.calledWith(null);

            setBusinessNetworkMock.should.have.been.calledWith('myId');

            service['isConnected'].should.equal(true);
            should.not.exist(service['connectingPromise']);
        })));

        it('should send alert if error thrown', fakeAsync(inject([ClientService], (service: ClientService) => {
            identityMock.getUserID.returns(Promise.resolve('myId'));
            adminMock.connect.returns(Promise.resolve());
            let refreshMock = sinon.stub(service, 'refresh').returns(Promise.reject('forced error'));

            service.ensureConnected('myNetwork', false)
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    error.should.equal('forced error');
                    alertMock.busyStatus$.next.should.have.been.calledWith(null);
                });
        })));

        it('should set connection variables if error thrown', fakeAsync(inject([ClientService], (service: ClientService) => {
            identityMock.getUserID.returns(Promise.resolve('myId'));
            adminMock.connect.returns(Promise.resolve());
            let refreshMock = sinon.stub(service, 'refresh').returns(Promise.reject('forced error'));
            alertMock.errorStatus$ = {next: sinon.stub()};

            service.ensureConnected('myNetwork', false)
                .then(() => {
                    throw new Error('should not get here');
                })
                .catch((error) => {
                    alertMock.busyStatus$.next.should.have.been.calledWith(null);
                    error.should.equal('forced error');
                    service['isConnected'].should.be.false;
                    expect(service['connectingPromise']).to.be.null;
                });
        })));

    });

    describe('refresh', () => {
        it('should diconnect and reconnect the business network connection', fakeAsync(inject([ClientService], (service: ClientService) => {
            let businessNetworkConnectionMock = sinon.stub(service, 'getBusinessNetworkConnection').returns(businessNetworkConMock);
            connectionProfileMock.getCurrentConnectionProfile.returns('myProfile');
            businessNetworkConMock.disconnect.returns(Promise.resolve());
            identityMock.getUserID.returns(Promise.resolve('myUser'));
            identityMock.getUserSecret.returns(Promise.resolve('mySecret'));

            service.refresh('myNetwork');

            tick();

            businessNetworkConMock.disconnect.should.have.been.calledOnce;
            businessNetworkConMock.connect.should.have.been.calledOnce;
            businessNetworkConMock.connect.should.have.been.calledWith('myProfile', 'myNetwork', 'myUser', 'mySecret');
            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Refreshing Connection',
                text: 'refreshing the connection to myProfile'
            });
        })));
    });

    describe('getBusinessNetworkFromArchive', () => {
        it('should get a business network from an archive', fakeAsync(inject([ClientService], (service: ClientService) => {
            let buffer = Buffer.from('a buffer');

            let businessNetworkFromArchiveMock = sandbox.stub(BusinessNetworkDefinition, 'fromArchive').returns(Promise.resolve({name: 'myNetwork'}));

            service.getBusinessNetworkFromArchive(buffer).then((result) => {
                result.should.deep.equal({name: 'myNetwork'});
            });

            tick();

            businessNetworkFromArchiveMock.should.have.been.calledWith(buffer);
        })));
    });

    describe('it should deployInitial sample', () => {
        it('should deploy the initial sample', fakeAsync(inject([ClientService], (service: ClientService) => {
            let resetMock = sinon.stub(service, 'reset');

            adminMock.createNewBusinessNetwork.returns(Promise.resolve());
            adminMock.isInitialDeploy.returns(true);

            let businessNetworkMock = sinon.stub(service, 'getBusinessNetworkConnection').returns(businessNetworkConMock);
            let businessNetworkFromArchiveMock = sandbox.stub(BusinessNetworkDefinition, 'fromArchive').returns(Promise.resolve({
                name: 'bob',
                getName: sinon.stub().returns('myNetwork'),
                getDescription: sinon.stub().returns('myDescription')
            }));

            service.deployInitialSample();

            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Deploying Business Network',
                text: 'deploying sample business network'
            });

            tick();

            businessNetworkFromArchiveMock.should.have.been.called;

            adminMock.createNewBusinessNetwork.should.have.been.calledWith('myNetwork', 'myDescription');

            adminMock.isInitialDeploy.should.have.been.called;

            adminMock.update.should.have.been.calledWith({
                name: 'bob',
                getName: sinon.match.func,
                getDescription: sinon.match.func
            });
            resetMock.should.have.been.called;

            businessNetworkConMock.disconnect.should.have.been.called;
            businessNetworkConMock.connect.should.have.been.calledWith('$default', 'myNetwork', 'admin', 'adminpw');
        })));

        it('should not deploy if already deployed', fakeAsync(inject([ClientService], (service: ClientService) => {
            let resetMock = sinon.stub(service, 'reset');

            adminMock.createNewBusinessNetwork.returns(Promise.reject({message: 'businessNetwork with name myNetwork already exists'}));
            adminMock.isInitialDeploy.returns(false);

            let businessNetworkMock = sinon.stub(service, 'getBusinessNetworkConnection').returns(businessNetworkConMock);
            let businessNetworkFromArchiveMock = sandbox.stub(BusinessNetworkDefinition, 'fromArchive').returns(Promise.resolve({
                name: 'bob',
                getName: sinon.stub().returns('myNetwork'),
                getDescription: sinon.stub().returns('myDescription')
            }));

            service.deployInitialSample();

            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Deploying Business Network',
                text: 'deploying sample business network'
            });

            tick();

            businessNetworkFromArchiveMock.should.have.been.called;

            adminMock.createNewBusinessNetwork.should.have.been.calledWith('myNetwork', 'myDescription');

            adminMock.isInitialDeploy.should.have.been.called;

            adminMock.update.should.not.have.been.called;
            resetMock.should.have.been.called;

            businessNetworkConMock.disconnect.should.have.been.called;
            businessNetworkConMock.connect.should.have.been.calledWith('$default', 'myNetwork', 'admin', 'adminpw');
        })));

        it('should handle error', fakeAsync(inject([ClientService], (service: ClientService) => {
            let resetMock = sinon.stub(service, 'reset');

            adminMock.createNewBusinessNetwork.returns(Promise.reject('some error'));
            adminMock.isInitialDeploy.returns(true);

            let businessNetworkMock = sinon.stub(service, 'getBusinessNetworkConnection').returns(businessNetworkConMock);
            let businessNetworkFromArchiveMock = sandbox.stub(BusinessNetworkDefinition, 'fromArchive').returns(Promise.resolve({
                name: 'bob',
                getName: sinon.stub().returns('myNetwork'),
                getDescription: sinon.stub().returns('myDescription')
            }));

            service.deployInitialSample()
                .then(() => {
                    throw new Error('should not have got here');
                })
                .catch((error) => {
                    error.should.equal('some error');
                });

            alertMock.busyStatus$.next.should.have.been.calledWith({
                title: 'Deploying Business Network',
                text: 'deploying sample business network'
            });

            tick();

            businessNetworkFromArchiveMock.should.have.been.called;

            adminMock.createNewBusinessNetwork.should.have.been.calledWith('myNetwork', 'myDescription');

            adminMock.isInitialDeploy.should.not.have.been.called;

            alertMock.busyStatus$.next.should.have.been.calledWith(null);
        })));
    });

    describe('issueIdentity', () => {

        it('should generate and return an identity using internally held state information', fakeAsync(inject([ClientService], (service: ClientService) => {
            connectionProfileMock.getProfile.returns(Promise.resolve('bob'));
            businessNetworkConMock.issueIdentity.returns(Promise.resolve({
                participant: 'uniqueName',
                userID: 'userId',
                options: {issuer: false, affiliation: undefined}
            }));
            let businessNetworkConnectionMock = sinon.stub(service, 'getBusinessNetworkConnection').returns(businessNetworkConMock);

            service.issueIdentity('userId', 'uniqueName', {issuer: false, affiliation: undefined}).then((identity) => {
                let expected = {
                    participant: 'uniqueName',
                    userID: 'userId',
                    options: {issuer: false, affiliation: undefined}
                };
                identity.should.deep.equal(expected);
            });

            tick();

            connectionProfileMock.getCurrentConnectionProfile.should.have.been.called;
            businessNetworkConnectionMock.should.have.been.called;
        })));

        it('should generate and return an identity, detecting blockchain.ibm.com URLs', fakeAsync(inject([ClientService], (service: ClientService) => {
            connectionProfileMock.getProfile.returns(Promise.resolve({
                membershipServicesURL: 'memberURL\.blockchain\.ibm\.com',
                peerURL: 'peerURL\.blockchain\.ibm\.com',
                eventHubURL: 'eventURL\.blockchain\.ibm\.com'
            }));

            businessNetworkConMock.issueIdentity.returns(Promise.resolve({
                participant: 'uniqueName',
                userID: 'userId',
                options: {issuer: false, affiliation: 'group1'}
            }));

            let businessNetworkConnectionMock = sinon.stub(service, 'getBusinessNetworkConnection').returns(businessNetworkConMock);

            service.issueIdentity('userId', 'uniqueName', {issuer: false, affiliation: undefined}).then((identity) => {
                let expected = {
                    participant: 'uniqueName',
                    userID: 'userId',
                    options: {issuer: false, affiliation: 'group1'}
                };
                identity.should.deep.equal(expected);
            });

            tick();

            connectionProfileMock.getCurrentConnectionProfile.should.have.been.called;
            businessNetworkConnectionMock.should.have.been.called;
        })));
    });

    describe('revokeIdentity', () => {
        it('should call the revokeIdentity() function for the relevant BusinessNetworkConnection', fakeAsync(inject([ClientService], (service: ClientService) => {

            // (1).should.equal(1);

            let mockGetBusinessNetwork = sinon.stub(service, 'getBusinessNetworkConnection').returns({
                revokeIdentity: sinon.stub().returns(Promise.resolve())
            });

            service.revokeIdentity({fake : 'identity'});

            tick();

            mockGetBusinessNetwork().revokeIdentity.should.have.been.calledWith({fake : 'identity'});
        })));
    });

    describe('disconnect', () => {
        it('should disconnect', inject([ClientService], (service: ClientService) => {
            let businessNetworkMock = sinon.stub(service, 'getBusinessNetworkConnection').returns(businessNetworkConMock);
            service.disconnect();

            service['isConnected'].should.equal(false);
            adminMock.disconnect.should.have.been.called;
            businessNetworkConMock.disconnect.should.have.been.called;
        }));
    });

    describe('getSavedBusinessNetworkName', () => {
        it('should get saved the business network name', inject([ClientService], (service: ClientService) => {
            service['getSavedBusinessNetworkName']('bob');

            mockLocalStorage.get.should.have.been.calledWith('currentBusinessNetwork:bob');
        }));
    });

    describe('setSavedBusinessNetworkName', () => {
        it('should save the business network name', inject([ClientService], (service: ClientService) => {
            let businessNetworkMock = sinon.stub(service, 'getBusinessNetworkName').returns('myNetwork');
            service['setSavedBusinessNetworkName']('bob');

            mockLocalStorage.set.should.have.been.calledWith('currentBusinessNetwork:bob', 'myNetwork');
        }));
    });

    describe('#revokeIdentity', () => {
        it('should revokeIdentity', inject([ClientService], (service: ClientService) => {
            let businessNetworkMock = sinon.stub(service, 'getBusinessNetworkConnection').returns(businessNetworkConMock);
            service['revokeIdentity']('testID');
            businessNetworkConMock.revokeIdentity.should.have.been.calledWith('testID');
        }));
     });

    describe('#filterModelFiles', () => {
        it('should filter passed model files', inject([ClientService], (service: ClientService) => {

            let mockFile0 = sinon.createStubInstance(ModelFile);
            mockFile0.isSystemModelFile.returns(true);
            let mockFile1 = sinon.createStubInstance(ModelFile);
            mockFile1.isSystemModelFile.returns(true);
            let mockFile2 = sinon.createStubInstance(ModelFile);
            mockFile2.isSystemModelFile.returns(false);
            let mockFile3 = sinon.createStubInstance(ModelFile);
            mockFile3.isSystemModelFile.returns(false);
            let mockFile4 = sinon.createStubInstance(ModelFile);
            mockFile4.isSystemModelFile.returns(true);

            let modelManagerMock = {
                getModelFiles: sinon.stub().returns([mockFile0, mockFile1, mockFile2, mockFile3, mockFile4]),
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

            sinon.stub(service, 'getBusinessNetwork').returns(businessNetworkDefMock);

            let mockCreateBusinessNetwork = sinon.stub(service, 'createBusinessNetwork').returns(businessNetworkDefMock);
            mockFile3.isSystemModelFile.returns(true);

            let allFiles = [mockFile0, mockFile1, mockFile2, mockFile3];

            let filteredFiles = service['filterModelFiles'](allFiles);

            filteredFiles.length.should.be.equal(1);
        }));

    });
    describe('createQueryFile', () => {
        let mockBusinessNetwork;

        beforeEach(() => {
            mockBusinessNetwork = sinon.createStubInstance(BusinessNetworkDefinition);
        });

        it('should create a Query file', fakeAsync(inject([ClientService], (service: ClientService) => {
            service['currentBusinessNetwork'] = mockBusinessNetwork;
            let queryFile = service.createQueryFile('query', '');
            queryFile.should.be.instanceOf(QueryFile);
            mockBusinessNetwork.getModelManager.should.have.been.called;
        })));

    });
});
