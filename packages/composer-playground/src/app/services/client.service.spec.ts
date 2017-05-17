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
import { AlertService } from './alert.service';
import { BusinessNetworkDefinition, ModelFile, Script, AclFile } from 'composer-common';
import { ConnectionProfileService } from './connectionprofile.service';
import { BusinessNetworkConnection } from 'composer-client';
import { IdentityService } from './identity.service';

describe('ClientService', () => {

    let adminMock;
    let alertMock;
    let connectionProfileMock;
    let businessNetworkDefMock;
    let identityMock;
    let businessNetworkConMock;
    let modelFileMock;
    let scriptFileMock;
    let aclFileMock;

    beforeEach(() => {

        adminMock = sinon.createStubInstance(AdminService);
        alertMock = sinon.createStubInstance(AlertService);
        connectionProfileMock = sinon.createStubInstance(ConnectionProfileService);
        businessNetworkDefMock = sinon.createStubInstance(BusinessNetworkDefinition);
        identityMock = sinon.createStubInstance(IdentityService);
        businessNetworkConMock = sinon.createStubInstance(BusinessNetworkConnection);
        modelFileMock = sinon.createStubInstance(ModelFile);
        scriptFileMock = sinon.createStubInstance(Script);
        aclFileMock = sinon.createStubInstance(AclFile);

        TestBed.configureTestingModule({
            providers: [ClientService,
                {provide: AdminService, useValue: adminMock},
                {provide: AlertService, useValue: alertMock},
                {provide: ConnectionProfileService, useValue: connectionProfileMock},
                {provide: IdentityService, useValue: identityMock}]
        });
    });

    describe('getBusinessNetworkConnection', () => {
        it('should get business network connection', inject([ClientService], (service: ClientService) => {
            service['businessNetworkConnection'] = businessNetworkConMock;
            let result = service.getBusinessNetworkConnection();

            result.should.deep.equal(businessNetworkConMock);
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
        let businessNetworkChangedSpy;

        beforeEach(inject([ClientService], (service: ClientService) => {
           businessNetworkChangedSpy = sinon.spy(service.businessNetworkChanged$, 'next');
        }));

        it('should call validateFile', inject([ClientService], (service: ClientService) => {
            let mockValidate = sinon.stub(service, 'validateFile').returns(null);

            service.updateFile('model', 'my-model', 'model');

            mockValidate.should.have.been.called;
        }));

        it('should notify if error message recieved', inject([ClientService], (service: ClientService) => {
            let mockValidate = sinon.stub(service, 'validateFile').returns('some error');

            let response = service.updateFile('model', 'my-model', 'model');

            mockValidate.should.have.been.called;
            businessNetworkChangedSpy.should.have.been.calledWith(false);
            response.should.equal('some error');
        }));

        it('should notify if fileupdate succeeded', inject([ClientService], (service: ClientService) => {
            let mockValidate = sinon.stub(service, 'validateFile').returns(null);

            let response = service.updateFile('model', 'my-model', 'model');

            mockValidate.should.have.been.called;
            businessNetworkChangedSpy.should.have.been.calledWith(true);
        }));
     });

    describe('validateFile', () => {
        let mockBusinessNetwork;

        beforeEach(inject([ClientService], (service: ClientService) => {
            mockBusinessNetwork = sinon.stub(service, 'getBusinessNetwork').returns(businessNetworkDefMock);
        }));

        it('should validate a model file', inject([ClientService], (service: ClientService) => {
            let modelManagerMock = {
                addModelFile: sinon.stub()
            };

            businessNetworkDefMock.getModelManager.returns(modelManagerMock);

            modelFileMock.getNamespace.returns('model');
            let mockCreateModelFile = sinon.stub(service, 'createModelFile').returns(modelFileMock);

            let result = service.validateFile('model', 'my-model', 'model');

            modelManagerMock.addModelFile.should.have.been.calledWith(modelFileMock);
            should.not.exist(result);
        }));

        it('should not validate model file if namespace changed', inject([ClientService], (service: ClientService) => {
            let modelManagerMock = {
                addModelFile: sinon.stub()
            };

            businessNetworkDefMock.getModelManager.returns(modelManagerMock);
            modelFileMock.getNamespace.returns('different');
            let mockCreateModelFile = sinon.stub(service, 'createModelFile').returns(modelFileMock);

            let result = service.validateFile('model', 'my-model', 'model');

            modelManagerMock.addModelFile.should.not.have.been.called;
            result.should.equal('Error: The namespace cannot be changed and must be set to model');
        }));

        it('should validate a script file', inject([ClientService], (service: ClientService) => {
            let scriptManagerMock = {
                createScript: sinon.stub().returns(scriptFileMock),
                addScript: sinon.stub()
            };

            businessNetworkDefMock.getScriptManager.returns(scriptManagerMock);

            let result = service.validateFile('script', 'my-script', 'script');

            scriptManagerMock.createScript.should.have.been.calledWith('script', 'JS', 'my-script');
            scriptManagerMock.addScript.should.have.been.calledWith(scriptFileMock);
            should.not.exist(result);
        }));

        it('should validate a acl file', inject([ClientService], (service: ClientService) => {
            let aclManagerMock = {
                setAclFile: sinon.stub()
            };

            businessNetworkDefMock.getAclManager.returns(aclManagerMock);

            let mockCreateAclFile = sinon.stub(service, 'createAclFile').returns(aclFileMock);

            let result = service.validateFile('acl', 'my-acl', 'acl');

            aclManagerMock.setAclFile.should.have.been.calledWith(aclFileMock);
            should.not.exist(result);
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
        let mockCreateBusinessNetwork;

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

            businessNetworkDefMock.getModelManager.returns(modelManagerMock);
            businessNetworkDefMock.getScriptManager.returns(scriptManagerMock);
            businessNetworkDefMock.getAclManager.returns(aclManagerMock);

            sinon.stub(service, 'getBusinessNetwork').returns(businessNetworkDefMock);

            mockCreateBusinessNetwork = sinon.stub(service, 'createBusinessNetwork').returns(businessNetworkDefMock);
        }));

        it('should set business network name', inject([ClientService], (service: ClientService) => {
            let businessNetworkChangedSpy = sinon.spy(service.businessNetworkChanged$, 'next');

            businessNetworkDefMock.getMetadata.returns({
                getVersion: sinon.stub().returns('my version'),
                getDescription: sinon.stub().returns('my description'),
                getPackageJson: sinon.stub().returns({}),
                getREADME: sinon.stub().returns('my readme')
            });

            service.setBusinessNetworkName('my name');

            mockCreateBusinessNetwork.should.have.been.calledWith('my name@my version', 'my description', {name: 'my name'}, 'my readme');
            businessNetworkChangedSpy.should.have.been.calledWith(true);
        }));

        it('should set business network version', inject([ClientService], (service: ClientService) => {
            let businessNetworkChangedSpy = sinon.spy(service.businessNetworkChanged$, 'next');

            businessNetworkDefMock.getMetadata.returns({
                getName: sinon.stub().returns('my name'),
                getDescription: sinon.stub().returns('my description'),
                getPackageJson: sinon.stub().returns({}),
                getREADME: sinon.stub().returns('my readme')
            });

            service.setBusinessNetworkVersion('my version');

            mockCreateBusinessNetwork.should.have.been.calledWith('my name@my version', 'my description', {version: 'my version'}, 'my readme');
            businessNetworkChangedSpy.should.have.been.calledWith(true);
        }));

        it('should set business network packageJson', inject([ClientService], (service: ClientService) => {
            let businessNetworkChangedSpy = sinon.spy(service.businessNetworkChanged$, 'next');

            businessNetworkDefMock.getMetadata.returns({
                getREADME: sinon.stub().returns('my readme')
            });

            let packageJson = {name: 'my name', version: 'my version', description: 'my description'};

            service.setBusinessNetworkPackageJson(packageJson);

            mockCreateBusinessNetwork.should.have.been.calledWith('my name@my version', 'my description', packageJson, 'my readme');
            businessNetworkChangedSpy.should.have.been.calledWith(true);
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

            service.ensureConnected(false);

            connectionProfileMock.getCurrentConnectionProfile.should.not.have.been.called;
        })));

        it('should return if connecting', fakeAsync(inject([ClientService], (service: ClientService) => {
            service['connectingPromise'] = Promise.resolve();

            service.ensureConnected();

            connectionProfileMock.getCurrentConnectionProfile.should.not.have.been.called;
        })));

        it('should connect if not connected', fakeAsync(inject([ClientService], (service: ClientService) => {
            adminMock.ensureConnected.returns(Promise.resolve());
            let refreshMock = sinon.stub(service, 'refresh').returns(Promise.resolve());

            service.ensureConnected(false);

            tick();

            adminMock.ensureConnected.should.have.been.calledWith(false);
            refreshMock.should.have.been.called;

            service['isConnected'].should.equal(true);
            should.not.exist(service['connectingPromise']);
        })));

        it('should send alert if error thrown', fakeAsync(inject([ClientService], (service: ClientService) => {
            adminMock.ensureConnected.returns(Promise.resolve());
            let refreshMock = sinon.stub(service, 'refresh').returns(Promise.reject('forced error'));
            alertMock.errorStatus$ = { next: sinon.stub() };

            service.ensureConnected(false);
            tick();

            alertMock.errorStatus$.next.should.have.been.called;

        })));

        it('should set connection variables if error thrown', fakeAsync(inject([ClientService], (service: ClientService) => {
            adminMock.ensureConnected.returns(Promise.resolve());
            let refreshMock = sinon.stub(service, 'refresh').returns(Promise.reject('forced error'));
            alertMock.errorStatus$ = { next: sinon.stub() };

            service.ensureConnected(false);
            tick();

            service['isConnected'].should.be.false;
            expect(service['connectingPromise']).to.be.null;
        })));

    });

    describe('refresh', () => {
        it('should diconnect and reconnect the business network connection', fakeAsync(inject([ClientService], (service: ClientService) => {
            let businessNetworkConnectionMock = sinon.stub(service, 'getBusinessNetworkConnection').returns(businessNetworkConMock);
            businessNetworkConMock.disconnect.returns(Promise.resolve());
            identityMock.getUserID.returns(Promise.resolve());
            identityMock.getUserSecret.returns(Promise.resolve());

            service.refresh();

            tick();

            businessNetworkConMock.disconnect.should.have.been.calledOnce;
            businessNetworkConMock.connect.should.have.been.calledOnce;
        })));
    });
});
