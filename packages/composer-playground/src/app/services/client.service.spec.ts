/* tslint:disable:no-unused-variable */
import {TestBed, inject, fakeAsync, tick} from '@angular/core/testing';
import {ClientService} from './client.service';

import * as sinon from 'sinon';
import * as chai from 'chai';

let should = chai.should();

import {AdminService} from './admin.service';
import {AlertService} from './alert.service';
import {BusinessNetworkDefinition, ModelFile, Script, AclFile} from 'composer-common';
import {ConnectionProfileService} from './connectionprofile.service';
import {BusinessNetworkConnection} from 'composer-client';
import {IdentityService} from './identity.service';

describe('ClientService', () => {

  let adminMock = sinon.createStubInstance(AdminService);
  let alertMock = sinon.createStubInstance(AlertService);
  let connectionProfileMock = sinon.createStubInstance(ConnectionProfileService);
  let businessNetworkDefMock = sinon.createStubInstance(BusinessNetworkDefinition);
  let identityMock = sinon.createStubInstance(IdentityService);
  let businessNetworkConMock = sinon.createStubInstance(BusinessNetworkConnection);
  let modelFileMock = sinon.createStubInstance(ModelFile);
  let scriptFileMock = sinon.createStubInstance(Script);
  let aclFileMock = sinon.createStubInstance(AclFile);

  beforeEach(() => {
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
    let mockBusinessNetwork;
    let businessNetworkChangedSpy;

    beforeEach(inject([ClientService], (service: ClientService) => {
      mockBusinessNetwork = sinon.stub(service, 'getBusinessNetwork').returns(businessNetworkDefMock);
      businessNetworkChangedSpy = sinon.spy(service.businessNetworkChanged$, 'next');
    }));

    it('should update a model file', inject([ClientService], (service: ClientService) => {
      let modelManagerMock = {
        addModelFile: sinon.stub()
      };

      businessNetworkDefMock.getModelManager.returns(modelManagerMock);

      modelFileMock.getNamespace.returns('model');
      let mockCreateModelFile = sinon.stub(service, 'createModelFile').returns(modelFileMock);

      let result = service.updateFile('model', 'my-model', 'model');

      modelManagerMock.addModelFile.should.have.been.calledWith(modelFileMock);
      should.not.exist(result);
      businessNetworkChangedSpy.should.have.been.calledWith(true);
    }));

    it('should not update model file if namespace changed', inject([ClientService], (service: ClientService) => {
      let modelManagerMock = {
        addModelFile: sinon.stub()
      };

      businessNetworkDefMock.getModelManager.returns(modelManagerMock);
      modelFileMock.getNamespace.returns('different');
      let mockCreateModelFile = sinon.stub(service, 'createModelFile').returns(modelFileMock);

      let result = service.updateFile('model', 'my-model', 'model');

      modelManagerMock.addModelFile.should.not.have.been.called;
      result.should.equal('Error: The namespace cannot be changed and must be set to model');
      businessNetworkChangedSpy.should.have.been.calledWith(false);
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
});
