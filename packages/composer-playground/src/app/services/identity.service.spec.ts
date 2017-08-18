/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { TestBed, async, inject, fakeAsync, tick } from '@angular/core/testing';
import { IdentityService } from './identity.service';
import { LocalStorageService } from 'angular-2-local-storage';
import { WalletService } from './wallet.service';
import * as sinon from 'sinon';
import { FileWallet } from 'composer-common';

describe('IdentityService', () => {

    let mockLocalStorageService;
    let mockWalletService;
    let mockFileWallet;

    beforeEach(() => {
        mockLocalStorageService = sinon.createStubInstance(LocalStorageService);
        mockWalletService = sinon.createStubInstance(WalletService);

        mockFileWallet = sinon.createStubInstance(FileWallet);
        mockFileWallet.list.returns(Promise.resolve(['identity2', 'identity1']));
        mockWalletService.getWallet.returns(mockFileWallet);

        TestBed.configureTestingModule({
            providers: [IdentityService,
                {provide: LocalStorageService, useValue: mockLocalStorageService},
                {provide: WalletService, useValue: mockWalletService}]
        });
    });

    describe('getIdentities', () => {
        it('should get identities', fakeAsync(inject([IdentityService], (service: IdentityService) => {

            service.getIdentities('xxx-profile').then((identities) => {
                tick();
                identities.should.deep.equal(['identity1', 'identity2']);
                mockWalletService.getWallet.should.be.calledWith('xxx-profile');
                mockFileWallet.list.should.be.called;
            });

            tick();

        })));
    });

    describe('setCurrentIdentity', () => {
        it('should set current identity', fakeAsync(inject([IdentityService], (service: IdentityService) => {
            let nextCurrentIdentitySpy = sinon.stub(service['_currentIdentity'], 'next');
            service.setCurrentIdentity('identity1');

            tick();

            nextCurrentIdentitySpy.should.have.been.called;
        })));
    });

    describe('getLoggedIn', () => {
        it('should get logged in flag from local storage', inject([IdentityService], (service: IdentityService) => {
            mockLocalStorageService.get.returns(true);

            let result = service.getLoggedIn();

            result.should.equal(true);
        }));
    });

    describe('setLoggedIn', () => {
        it('should set logged in flag from local storage', inject([IdentityService], (service: IdentityService) => {
            service.setLoggedIn(true);

            mockLocalStorageService.set.should.have.been.called;
        }));
    });
});
