/* tslint:disable:no-unused-variable */

import {TestBed, async, inject} from '@angular/core/testing';
import {ConnectionProfileService} from './connectionprofile.service';
import {LocalStorageService} from 'angular-2-local-storage';
import {WalletService} from '../wallet.service';
import * as sinon from 'sinon';

class LocalStorageMock {
  val: Object = '$default';

  public get(key: string): Object {
    return this.val;
  }

  public set(key: string, val: Object) {
    this.val = val;
  }
}

let mockWalletService = sinon.createStubInstance(WalletService);

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
});
