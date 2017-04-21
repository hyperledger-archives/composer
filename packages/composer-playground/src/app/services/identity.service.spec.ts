/* tslint:disable:no-unused-variable */

import {TestBed, inject, fakeAsync, tick} from '@angular/core/testing';
import {IdentityService} from './identity.service';
import {LocalStorageService} from 'angular-2-local-storage';
import {ConnectionProfileService} from './connectionprofile.service';
import {WalletService} from './wallet.service';
import * as sinon from 'sinon';


describe('IdentityService', () => {

  let mockLocalStorageService;
  let mockConnectionProfileService;
  let mockWalletService;

  beforeEach(() => {
    mockLocalStorageService = sinon.createStubInstance(LocalStorageService);
    mockConnectionProfileService = sinon.createStubInstance(ConnectionProfileService);
    mockWalletService = sinon.createStubInstance(WalletService);

    TestBed.configureTestingModule({
      providers: [IdentityService,
        {provide: LocalStorageService, useValue: mockLocalStorageService},
        {provide: ConnectionProfileService, useValue: mockConnectionProfileService},
        {provide: WalletService, useValue: mockWalletService}]
    });
  });

  describe('getCurrentIdentities', () => {
    it('should get current identities', fakeAsync(inject([IdentityService], (service: IdentityService) => {
      mockConnectionProfileService.getCurrentConnectionProfile.returns('bob');
      let stubGetIdentities = sinon.stub(service, 'getIdentities');

      service.getCurrentIdentities();

      tick();

      mockConnectionProfileService.getCurrentConnectionProfile.should.have.been.called;
      stubGetIdentities.should.have.been.calledWith('bob');

    })));
  });

  describe('getIdentities', () => {
    it('should get identities', fakeAsync(inject([IdentityService], (service: IdentityService) => {

      let stubFileWallet = {list: sinon.stub().returns(Promise.resolve(['identity2', 'identity1']))};

      mockWalletService.getWallet.returns(stubFileWallet);

      service.getIdentities("{'name':'profile','type': 'hlf'}");

      tick();

      mockWalletService.getWallet.should.have.been.calledWith("{'name':'profile','type': 'hlf'}");

      stubFileWallet.list.should.have.been.called;
    })));
  });

  describe('getCurrentIdentity', () => {
    it('should get current identity', fakeAsync(inject([IdentityService], (service: IdentityService) => {
      let stubGetIdentity = sinon.stub(service, 'getIdentity');
      stubGetIdentity.returns(Promise.resolve('identity1'));
      mockConnectionProfileService.getCurrentConnectionProfile.returns("{'name':'profile','type': 'hlf'}");
      service.getCurrentIdentity().then((currentIdentity) => {
        stubGetIdentity.should.be.calledWith("{'name':'profile','type': 'hlf'}");
        currentIdentity.should.equal('identity1');
      });

      tick();
    })));
  });

  describe('getIdentity', () => {
    it('should get an identity if it exists', fakeAsync(inject([IdentityService], (service: IdentityService) => {
      mockLocalStorageService.get.returns('identity1');
      let stubGetIdentities = sinon.stub(service, 'getIdentities');
      stubGetIdentities.returns(Promise.resolve(['identity1', 'identity2']));

      service.getIdentity("{'name':'profile','type': 'hlf'}").then((identity) => {
        stubGetIdentities.should.be.calledWith("{'name':'profile','type': 'hlf'}");
      });

      tick();

    })));

    it('should return another identity if the wanted identity doesnt exist', fakeAsync(inject([IdentityService], (service: IdentityService) => {
      mockLocalStorageService.get.returns('identity3');
      let stubGetIdentities = sinon.stub(service, 'getIdentities');
      stubGetIdentities.returns(Promise.resolve(['identity1', 'identity2']));

      service.getIdentity("{'name':'profile','type': 'hlf'}").then((identity) => {
        stubGetIdentities.should.be.calledWith("{'name':'profile','type': 'hlf'}");
      });

      tick();

    })));

    it('should return null if no identites exist', fakeAsync(inject([IdentityService], (service: IdentityService) => {
      mockLocalStorageService.get.returns('identity3');
      let stubGetIdentities = sinon.stub(service, 'getIdentities');
      stubGetIdentities.returns(Promise.resolve([]));

      service.getIdentity("{'name':'profile','type': 'hlf'}").then((identity) => {
        stubGetIdentities.should.be.calledWith("{'name':'profile','type': 'hlf'}");
      });

      tick();

    })));
  });

  describe('setCurrentIdentity', () => {
    it('should set current identity', inject([IdentityService], (service: IdentityService) => {
      let stubSetIdentity = sinon.stub(service, 'setIdentity');
      mockConnectionProfileService.getCurrentConnectionProfile.returns("{'name':'profile','type': 'hlf'}");

      service.setCurrentIdentity('identity1');
      stubSetIdentity.should.be.calledWith("{'name':'profile','type': 'hlf'}", 'identity1');
    }));
  });

  describe('setIdentity', () => {
    it('should set identity', inject([IdentityService], (service: IdentityService) => {

      service.setIdentity("{'name':'profile','type': 'hlf'}", 'identity1');
      mockLocalStorageService.set.should.be.calledWith("currentIdentity:{'name':'profile','type': 'hlf'}", 'identity1')

    }));
  });

  describe('getUserID', () => {
    it('should get user id', fakeAsync(inject([IdentityService], (service: IdentityService) => {
      let stubGetCurrentIdentity = sinon.stub(service, 'getCurrentIdentity');
      stubGetCurrentIdentity.returns(Promise.resolve('currentIdentity'));
      service.getUserID().then((userID) => {
        stubGetCurrentIdentity.should.be.called;
        userID.should.equal('currentIdentity');
      });

      tick();

    })));
  });

  describe('getUserSecret', () => {
    it('should get user secret', fakeAsync(inject([IdentityService], (service: IdentityService) => {
      let stubGetCurrentIdentity = sinon.stub(service, 'getCurrentIdentity');
      stubGetCurrentIdentity.returns(Promise.resolve('currentIdentity'));

      mockConnectionProfileService.getCurrentConnectionProfile.returns('bob');

      let stubFileWallet = {get: sinon.stub().returns(Promise.resolve('secret2'))};

      mockWalletService.getWallet.returns(stubFileWallet);

      service.getUserSecret();

      tick();
      mockConnectionProfileService.getCurrentConnectionProfile.should.have.been.called;
      mockWalletService.getWallet.should.be.calledWith('bob');

      stubFileWallet.get.should.have.been.calledWith('currentIdentity');
    })));
  });
});
