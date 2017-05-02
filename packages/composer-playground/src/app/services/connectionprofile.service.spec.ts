/* tslint:disable:no-unused-variable */

import {TestBed, async, inject} from '@angular/core/testing';
import {ConnectionProfileService} from './connectionprofile.service';
import {LocalStorageService} from 'angular-2-local-storage';
import {WalletService} from '../wallet.service';
import { FileWallet } from 'composer-common';
import { AdminConnection } from 'composer-admin';
import * as sinon from 'sinon';
import { expect } from 'chai';

class LocalStorageMock {
  private values: Object = {};

  public get(key: string): Object {
    return this.values[key] || null;
  }

  public set(key: string, val: Object) {
    this.values[key] = val;
  }
}

const mockWalletService = sinon.createStubInstance(WalletService);

describe('ConnectionProfileService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConnectionProfileService,
        {provide: LocalStorageService, useClass: LocalStorageMock},
        {provide: WalletService, useValue:mockWalletService }]
    });
  });

  it('should return $default when no connection profile has been set',
    inject([ConnectionProfileService, LocalStorageService],
      (connectionProfileService, mockLocalStorage) => {
        connectionProfileService.should.be.ok;
        let result = connectionProfileService.getCurrentConnectionProfile();
        result.should.equal('$default');
      }));

  it('should set the connection profile',
    inject([ConnectionProfileService, LocalStorageService],
      (connectionProfileService, mockLocalStorage) => {
        connectionProfileService.should.be.ok;
        connectionProfileService.setCurrentConnectionProfile('new');
        connectionProfileService.getCurrentConnectionProfile().should.equal('new');
      }));

  it('should have no certificate if not set',
    inject([ConnectionProfileService, LocalStorageService],
      (connectionProfileService, mockLocalStorage) => {
        connectionProfileService.should.be.ok;
        expect(connectionProfileService.getCertificate()).to.not.exist;
      }
    ));

  it('should set certificate',
    inject([ConnectionProfileService, LocalStorageService],
      (connectionProfileService, mockLocalStorage) => {
        connectionProfileService.should.be.ok;
        const certificate: string = 'CERTIFICATE_STRING';
        connectionProfileService.setCertificate(certificate);
        connectionProfileService.getCertificate().should.equal(certificate);
      }
    ));

  it('should have no hostname if not set',
    inject([ConnectionProfileService, LocalStorageService],
      (connectionProfileService, mockLocalStorage) => {
        connectionProfileService.should.be.ok;
        expect(connectionProfileService.getHostname()).to.not.exist;
      }
    ));

  it('should set hostname',
    inject([ConnectionProfileService, LocalStorageService],
      (connectionProfileService, mockLocalStorage) => {
        connectionProfileService.should.be.ok;
        const hostname: string = 'HOSTNAME_STRING';
        connectionProfileService.setHostname(hostname);
        connectionProfileService.getHostname().should.equal(hostname);
      }
    ));

  it('should return admin connection if set',
    inject([ConnectionProfileService, LocalStorageService],
      (connectionProfileService, mockLocalStorage) => {
        connectionProfileService.should.be.ok;
        const adminConnectionStub = sinon.createStubInstance(AdminConnection);
        connectionProfileService['adminConnection'] = adminConnectionStub;
        connectionProfileService.getAdminConnection().should.equal(adminConnectionStub);
      }
    ));

  it('should get result of createProfile from admin connection',
    inject([ConnectionProfileService, LocalStorageService],
      (connectionProfileService, mockLocalStorage) => {
        connectionProfileService.should.be.ok;

        const nameArg: string = 'NAME';
        const connectionProfileArg: string = "CONNECTION_PROFILE";
        const expectedResult: string = 'EXPECTED_RESULT';

        const adminConnectionStub = sinon.createStubInstance(AdminConnection);
        adminConnectionStub.createProfile
          .withArgs(nameArg, connectionProfileArg)
          .returns(Promise.resolve(expectedResult));
        sinon.stub(connectionProfileService, 'getAdminConnection')
          .returns(adminConnectionStub);

        return connectionProfileService.createProfile(nameArg, connectionProfileArg).then((result) => {
          result.should.equal(expectedResult);
        });
      }
    ));

  it('should get result of getProfile from admin connection',
    inject([ConnectionProfileService, LocalStorageService],
      (connectionProfileService, mockLocalStorage) => {
        connectionProfileService.should.be.ok;

        const nameArg: string = 'NAME';
        const expectedResult: string = 'EXPECTED_RESULT';

        const adminConnectionStub = sinon.createStubInstance(AdminConnection);
        adminConnectionStub.getProfile
          .withArgs(nameArg)
          .returns(Promise.resolve(expectedResult));
        sinon.stub(connectionProfileService, 'getAdminConnection')
          .returns(adminConnectionStub);

        return connectionProfileService.getProfile(nameArg).then((result) => {
          result.should.equal(expectedResult);
        });
      }
    ));

  it('should get result of deleteProfile from admin connection',
    inject([ConnectionProfileService, LocalStorageService],
      (connectionProfileService, mockLocalStorage) => {
        connectionProfileService.should.be.ok;

        const nameArg: string = 'NAME';
        const expectedResult: string = 'EXPECTED_RESULT';

        const adminConnectionStub = sinon.createStubInstance(AdminConnection);
        adminConnectionStub.deleteProfile
          .withArgs(nameArg)
          .returns(Promise.resolve(expectedResult));
        sinon.stub(connectionProfileService, 'getAdminConnection')
          .returns(adminConnectionStub);

        return connectionProfileService.deleteProfile(nameArg).then((result) => {
          result.should.equal(expectedResult);
        });
      }
    ));

  it('should get result of getProfile from admin connection if default profile exists',
    inject([ConnectionProfileService, LocalStorageService],
      (connectionProfileService, mockLocalStorage) => {
        connectionProfileService.should.be.ok;

        const expectedResult: string = 'EXPECTED_RESULT';

        const adminConnectionStub = sinon.createStubInstance(AdminConnection);
        adminConnectionStub.getProfile
          .withArgs('$default')
          .returns(Promise.resolve(expectedResult));
        sinon.stub(connectionProfileService, 'getAdminConnection').returns(adminConnectionStub);

        return connectionProfileService.createDefaultProfile().then((result) => {
          result.should.equal(expectedResult);
        });
      }
    ));

  it('should add a new default profile to Wallet if none exists when createDefaultProfile invoked',
    inject([ConnectionProfileService, LocalStorageService, WalletService],
      (connectionProfileService, mockLocalStorage, walletServiceStub) => {
        connectionProfileService.should.be.ok;

        const expectedResult: string = 'EXPECTED_RESULT';
        const profileName: string = '$default';

        const adminConnectionStub = sinon.createStubInstance(AdminConnection);
        adminConnectionStub.getProfile
          .withArgs(profileName)
          .returns(Promise.reject(''));
        adminConnectionStub.createProfile
          .returns(Promise.resolve(''));
        sinon.stub(connectionProfileService, 'getAdminConnection')
          .returns(adminConnectionStub);
        const fileWalletStub = sinon.createStubInstance(FileWallet);
        fileWalletStub.add.returns(expectedResult);
        walletServiceStub.getWallet
          .withArgs(profileName)
          .returns(fileWalletStub);

        return connectionProfileService.createDefaultProfile().then((result) => {
          result.should.equal(expectedResult);
        });
      }
    ));

  it('should get result of getAllProfiles from admin connection',
    inject([ConnectionProfileService, LocalStorageService],
      (connectionProfileService, mockLocalStorage) => {
        connectionProfileService.should.be.ok;

        const expectedResult: string = 'EXPECTED_RESULT';

        const adminConnectionStub = sinon.createStubInstance(AdminConnection);
        adminConnectionStub.getAllProfiles
          .returns(Promise.resolve(expectedResult));
        sinon.stub(connectionProfileService, 'getAdminConnection')
          .returns(adminConnectionStub);

        return connectionProfileService.getAllProfiles().then((result) => {
          result.should.equal(expectedResult);
        });
      }
    ));

});
