/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { IdentityService } from './identity.service';
import { LocalStorageService } from 'angular-2-local-storage';
import { ConnectionProfileService } from './connectionprofile.service';
import { ClientService } from './client.service';
import { WalletService } from './wallet.service';
import * as sinon from 'sinon';
import {FileWallet} from 'composer-common';

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
      {provide: WalletService, useValue:mockWalletService}]
    });
  });

  describe('getCurrentIdentities', () =>{
    it('should get current identities', inject([IdentityService], (service: IdentityService) => {
      mockConnectionProfileService.getCurrentConnectionProfile.returns("{'name':'profile','type': 'hlf'}")
      let stubGetIdentities = sinon.stub(service,'getIdentities');
      stubGetIdentities.returns(Promise.resolve(['identity1','identity2']))
      service.getCurrentIdentities().then((currentIdentities) => {
        currentIdentities.should.equal(['identity1','identity2']);
      })
      stubGetIdentities.should.be.calledWith("{'name':'profile','type': 'hlf'}")
    }));
  })

  describe('getIdentities', () =>{
    it('should get identities', inject([IdentityService], (service: IdentityService) => {

      let stubFileWallet = sinon.createStubInstance(FileWallet)
      stubFileWallet.list.returns(Promise.resolve(['identity2','identity1']));


      mockWalletService.getWallet.returns(stubFileWallet);

      service.getIdentities("{'name':'profile','type': 'hlf'}").then((identities) => {
        identities.should.deep.equal(['identity1','identity2']);
        mockWalletService.getWallet.should.be.calledWith("{'name':'profile','type': 'hlf'}")
        mockWalletService.getWallet.list.sort.should.be.called;
      });

    }));
  })

  describe('getCurrentIdentity', () => {
    it('should get current identity', inject([IdentityService], (service: IdentityService) => {
      let stubGetIdentity = sinon.stub(service,'getIdentity');
      stubGetIdentity.returns(Promise.resolve('identity1'))
      mockConnectionProfileService.getCurrentConnectionProfile.returns("{'name':'profile','type': 'hlf'}")
      service.getCurrentIdentity().then((currentIdentity) => {
        stubGetIdentity.should.be.calledWith("{'name':'profile','type': 'hlf'}");
        currentIdentity.should.equal('identity1');
      })


    }))
  })


  describe('getIdentity', () => {
    it('should get an identity if it exists', inject([IdentityService], (service: IdentityService) => {
      mockLocalStorageService.get.returns('identity1');
      let stubGetIdentities = sinon.stub(service,'getIdentities');
      stubGetIdentities.returns(Promise.resolve(['identity1','identity2']));

      service.getIdentity("{'name':'profile','type': 'hlf'}").then((identity) => {
          stubGetIdentities.should.be.calledWith("{'name':'profile','type': 'hlf'}");
      })

    }))
    it('should return another identity if the wanted identity doesnt exist', inject([IdentityService], (service: IdentityService) => {
      mockLocalStorageService.get.returns('identity3');
      let stubGetIdentities = sinon.stub(service,'getIdentities');
      stubGetIdentities.returns(Promise.resolve(['identity1','identity2']));

      service.getIdentity("{'name':'profile','type': 'hlf'}").then((identity) => {
          stubGetIdentities.should.be.calledWith("{'name':'profile','type': 'hlf'}");
      })

    }))
    it('should return null if no identites exist', inject([IdentityService], (service: IdentityService) => {
      mockLocalStorageService.get.returns('identity3');
      let stubGetIdentities = sinon.stub(service,'getIdentities');
      stubGetIdentities.returns(Promise.resolve([]));

      service.getIdentity("{'name':'profile','type': 'hlf'}").then((identity) => {
          stubGetIdentities.should.be.calledWith("{'name':'profile','type': 'hlf'}");
      })

    }))
  })

  describe('setCurrentIdentity', () => {
    it('should set current identity', inject([IdentityService], (service: IdentityService) => {
      let stubSetIdentity = sinon.stub(service,'setIdentity');
      mockConnectionProfileService.getCurrentConnectionProfile.returns("{'name':'profile','type': 'hlf'}")

      service.setCurrentIdentity('identity1');
      stubSetIdentity.should.be.calledWith("{'name':'profile','type': 'hlf'}",'identity1');

    }))
  })

  describe('setIdentity', () => {
    it('should set identity', inject([IdentityService], (service: IdentityService) => {

      service.setIdentity("{'name':'profile','type': 'hlf'}",'identity1');
      mockLocalStorageService.set.should.be.calledWith("currentIdentity:{'name':'profile','type': 'hlf'}",'identity1')

    }))
  })

  describe('getUserID', () => {
    it('should get user id', inject([IdentityService], (service: IdentityService) => {
      let stubGetCurrentIdentity = sinon.stub(service, 'getCurrentIdentity');
      stubGetCurrentIdentity.returns(Promise.resolve('currentIdentity'))
      service.getUserID().then((userID) => {
        stubGetCurrentIdentity.should.be.called;
        userID.should.equal('currentIdentity');

      })

    }))
  })

  describe('getUserSecret', () => {
    it('should get user secret', inject([IdentityService], (service: IdentityService) => {
      let stubGetCurrentIdentity = sinon.stub(service, 'getCurrentIdentity');
      stubGetCurrentIdentity.returns(Promise.resolve('currentIdentity'));

      mockConnectionProfileService.getCurrentConnectionProfile.returns("{'name':'profile','type': 'hlf'}");

      let stubFileWallet = sinon.createStubInstance(FileWallet)
      stubFileWallet.get.returns(Promise.resolve('secret2'));
      mockWalletService.getWallet.returns(stubFileWallet);


      service.getUserSecret().then((userID) => {
        stubGetCurrentIdentity.should.be.called;
        mockConnectionProfileService.should.be.called;
        userID.should.equal('currentIdentity');
        mockWalletService.getWallet.should.be.calledWith("{'name':'profile','type': 'hlf'}")

      })

    }))
  })

});
