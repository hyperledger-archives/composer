/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { TestBed, async, inject, fakeAsync, tick } from '@angular/core/testing';
import { IdentityService } from './identity.service';
import { LocalStorageService } from 'angular-2-local-storage';
import { ConnectionProfileService } from './connectionprofile.service';
import { WalletService } from './wallet.service';
import * as sinon from 'sinon';
import { FileWallet } from 'composer-common';

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
            mockConnectionProfileService.getCurrentConnectionProfile.returns("{'name':'profile','type': 'hlf'}");
            let stubGetIdentities = sinon.stub(service, 'getIdentities');
            stubGetIdentities.returns(Promise.resolve(['identity1', 'identity2']));
            service.getCurrentIdentities().then((currentIdentities) => {
                currentIdentities.should.deep.equal(['identity1', 'identity2']);
            });

            tick();

            stubGetIdentities.should.be.calledWith("{'name':'profile','type': 'hlf'}");
        })));
    });

    describe('getIdentities', () => {
        it('should get identities', fakeAsync(inject([IdentityService], (service: IdentityService) => {

            let stubFileWallet = sinon.createStubInstance(FileWallet);
            stubFileWallet.list.returns(Promise.resolve(['identity2', 'identity1']));
            mockWalletService.getWallet.returns(stubFileWallet);

            service.getIdentities("{'name':'profile','type': 'hlf'}").then((identities) => {
                tick();
                identities.should.deep.equal(['identity1', 'identity2']);
                mockWalletService.getWallet.should.be.calledWith("{'name':'profile','type': 'hlf'}");
                stubFileWallet.list.should.be.called;
            });

            tick();

        })));
    });

    describe('getCurrentIdentity', () => {
        it('should get current identity', fakeAsync(inject([IdentityService], (service: IdentityService) => {
            let stubGetIdentity = sinon.stub(service, 'getIdentity');
            stubGetIdentity.returns(Promise.resolve('identity1'));
            mockConnectionProfileService.getCurrentConnectionProfile.returns("{'name':'profile','type': 'hlf'}");

            service.getCurrentIdentity().then((currentIdentity) => {
                currentIdentity.should.equal('identity1');
            });

            tick();

            stubGetIdentity.should.be.calledWith("{'name':'profile','type': 'hlf'}");

        })));
    });

    describe('getIdentity', () => {
        it('should get an identity if it exists', fakeAsync(inject([IdentityService], (service: IdentityService) => {
            mockLocalStorageService.get.returns('identity1');
            let stubGetIdentities = sinon.stub(service, 'getIdentities');
            stubGetIdentities.returns(Promise.resolve(['identity1', 'identity2']));

            service.getIdentity("{'name':'profile','type': 'hlf'}");

            tick();

            stubGetIdentities.should.be.calledWith("{'name':'profile','type': 'hlf'}");

        })));

        it('should return another identity if the wanted identity doesnt exist', fakeAsync(inject([IdentityService], (service: IdentityService) => {
            mockLocalStorageService.get.returns('identity3');
            let stubGetIdentities = sinon.stub(service, 'getIdentities');
            stubGetIdentities.returns(Promise.resolve(['identity1', 'identity2']));

            service.getIdentity("{'name':'profile','type': 'hlf'}");

            tick();

            stubGetIdentities.should.be.calledWith("{'name':'profile','type': 'hlf'}");

        })));

        it('should return null if no identites exist', fakeAsync(inject([IdentityService], (service: IdentityService) => {
            mockLocalStorageService.get.returns('identity3');
            let stubGetIdentities = sinon.stub(service, 'getIdentities');
            stubGetIdentities.returns(Promise.resolve([]));

            service.getIdentity("{'name':'profile','type': 'hlf'}");

            tick();

            stubGetIdentities.should.be.calledWith("{'name':'profile','type': 'hlf'}");

        })));
    });

    describe('setCurrentIdentity', () => {
        it('should set current identity', fakeAsync(inject([IdentityService], (service: IdentityService) => {
            let stubSetIdentity = sinon.stub(service, 'setIdentity');
            mockConnectionProfileService.getCurrentConnectionProfile.returns("{'name':'profile','type': 'hlf'}");

            service.setCurrentIdentity('identity1');

            tick();

            stubSetIdentity.should.be.calledWith("{'name':'profile','type': 'hlf'}", 'identity1');

        })));
    });

    describe('setIdentity', () => {
        it('should set identity', fakeAsync(inject([IdentityService], (service: IdentityService) => {

            service.setIdentity("{'name':'profile','type': 'hlf'}", 'identity1');
            tick();
            mockLocalStorageService.set.should.be.calledWith("currentIdentity:{'name':'profile','type': 'hlf'}", 'identity1');

        })));
    });

    describe('getUserID', () => {
        it('should get user id', fakeAsync(inject([IdentityService], (service: IdentityService) => {
            let stubGetCurrentIdentity = sinon.stub(service, 'getCurrentIdentity');
            stubGetCurrentIdentity.returns(Promise.resolve('currentIdentity'));
            service.getUserID().then((userID) => {
                userID.should.equal('currentIdentity');
            });

            tick();

            stubGetCurrentIdentity.should.be.called;

        })));
    });

    describe('getUserSecret', () => {
        it('should get user secret', fakeAsync(inject([IdentityService], (service: IdentityService) => {
            let stubGetCurrentIdentity = sinon.stub(service, 'getCurrentIdentity');
            stubGetCurrentIdentity.returns(Promise.resolve('currentIdentity'));
            mockConnectionProfileService.getCurrentConnectionProfile.returns("{'name':'profile','type': 'hlf'}");
            let stubFileWallet = sinon.createStubInstance(FileWallet);
            stubFileWallet.get.returns(Promise.resolve('secret2'));
            mockWalletService.getWallet.returns(stubFileWallet);

            service.getUserSecret().then((result) => {
                result.should.equal('secret2');
                stubGetCurrentIdentity.should.be.called;
                mockConnectionProfileService.getCurrentConnectionProfile.should.be.called;
                mockWalletService.getWallet.should.be.calledWith("{'name':'profile','type': 'hlf'}");
            });

            tick();

        })));
    });
});
