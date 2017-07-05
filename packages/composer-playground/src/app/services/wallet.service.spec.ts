/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { TestBed, inject, fakeAsync, tick } from '@angular/core/testing';
import { WalletService } from './wallet.service';
import * as sinon from 'sinon';
import { FileWallet } from 'composer-common';

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
