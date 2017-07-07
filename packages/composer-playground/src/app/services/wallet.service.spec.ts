/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { TestBed, inject, fakeAsync, tick } from '@angular/core/testing';
import { WalletService } from './wallet.service';
import * as sinon from 'sinon';
import { FileWallet } from 'composer-common';
import { Logger } from 'composer-common';

describe('WalletService', () => {

    let mockFileWallet;
    let mockFileWallets;

    beforeEach(() => {
        mockFileWallet = sinon.createStubInstance(FileWallet);
        mockFileWallet.list.returns(Promise.resolve(['identity2', 'identity1']));

        mockFileWallets = sinon.createStubInstance(Map);

        TestBed.configureTestingModule({
            providers: [WalletService]
        });
    });

    describe('getWallet', () => {
        beforeEach(() => {
            // webpack can't handle dymanically creating a logger
            Logger.setFunctionalLogger({
                log: sinon.stub()
            });
        });

        it('should get a wallet', fakeAsync(inject([WalletService], (service: WalletService) => {
            service['fileWallets'] = mockFileWallets;
            mockFileWallets.has.returns(true);

            service.getWallet('identity1');

            tick();

            mockFileWallets.set.should.not.have.been.called;
            mockFileWallets.get.should.have.been.calledWith('identity1');
        })));

        it('should create a new wallet if it doesn\'t already exist', fakeAsync(inject([WalletService], (service: WalletService) => {
            service['fileWallets'] = mockFileWallets;

            service.getWallet('secrectIdentity');

            tick();

            mockFileWallets.set.should.have.been.calledWith('secrectIdentity');
        })));
    });

    describe('removeFromWallet', () => {
        it('should remove an identity from the wallet', fakeAsync(inject([WalletService], (service: WalletService) => {
            let mockGetWallet = sinon.stub(service, 'getWallet').returns(mockFileWallet);
            service.removeFromWallet('myProfile', 'bob');

            tick();

            mockGetWallet.should.have.been.calledWith('myProfile');

            mockFileWallet.remove.should.have.been.calledWith('bob');
        })));
    });
});
