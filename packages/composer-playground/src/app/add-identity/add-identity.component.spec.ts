/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as sinon from 'sinon';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { Wallet } from 'composer-common';
import { AddIdentityComponent } from './add-identity.component';
import { ConnectionProfileService } from '../services/connectionprofile.service';
import { WalletService } from '../services/wallet.service';

describe('AddIdentityComponent', () => {
    let sandbox;
    let component: AddIdentityComponent;
    let fixture: ComponentFixture<AddIdentityComponent>;

    let mockActiveModal;
    let mockConnectionProfileService;
    let mockWalletService;

    beforeEach(() => {
        mockActiveModal = sinon.createStubInstance(NgbActiveModal);
        mockConnectionProfileService = sinon.createStubInstance(ConnectionProfileService);
        mockWalletService = sinon.createStubInstance(WalletService);

        TestBed.configureTestingModule({
            imports: [FormsModule],
            declarations: [AddIdentityComponent],
            providers: [
                {provide: NgbActiveModal, useValue: mockActiveModal},
                {provide: ConnectionProfileService, useValue: mockConnectionProfileService},
                {provide: WalletService, useValue: mockWalletService}
            ]
        })
        .compileComponents();

        sandbox = sinon.sandbox.create();
        fixture = TestBed.createComponent(AddIdentityComponent);
        component = fixture.componentInstance;
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should be created', () => {
        expect(component).should.be.ok;
    });

    describe('#addIdentity', () => {
        let mockWallet;

        beforeEach(() => {
            mockWallet = sinon.createStubInstance(Wallet);
            mockWalletService.getWallet.returns(mockWallet);
        });

        it('should add an identity to the wallet', fakeAsync(() => {
            mockWallet.contains.returns(Promise.resolve(false));

            component.addIdentity();

            tick();

            mockWallet.update.should.not.have.been.called;
            mockWallet.add.should.have.been.called.once;
            // TODO called with?
        }));

        it('should update an identity in the wallet', fakeAsync(() => {
            mockWallet.contains.returns(Promise.resolve(true));

            component.addIdentity();

            tick();

            mockWallet.add.should.not.have.been.called;
            mockWallet.update.should.have.been.called.once;
            // TODO called with?
        }));

        it('should handle an error', fakeAsync(() => {
            mockWallet.contains.returns(Promise.reject('test error'));

            component.addIdentity();

            tick();

            mockWallet.add.should.not.have.been.called;
            mockWallet.update.should.not.have.been.called;
            mockActiveModal.dismiss.should.have.been.called.once;
            // TODO called with?
        }));
    });
});
