/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import * as sinon from 'sinon';

import * as chai from 'chai';

let should = chai.should();

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { SwitchIdentityComponent } from './switch-identity.component';
import { ConnectionProfileService } from '../../services/connectionprofile.service';
import { WalletService } from '../../services/wallet.service';
import { ClientService } from '../../services/client.service';
import { IdentityService } from '../../services/identity.service';

describe('SwitchIdentityComponent', () => {
    let component: SwitchIdentityComponent;
    let fixture: ComponentFixture<SwitchIdentityComponent>;

    let mockActiveModal;
    let mockConnectionProfileService;
    let mockWalletService;
    let mockClientService;
    let mockIdentityService;

    beforeEach(() => {
        mockActiveModal = sinon.createStubInstance(NgbActiveModal);
        mockConnectionProfileService = sinon.createStubInstance(ConnectionProfileService);
        mockWalletService = sinon.createStubInstance(WalletService);
        mockClientService = sinon.createStubInstance(ClientService);
        mockIdentityService = sinon.createStubInstance(IdentityService);

        TestBed.configureTestingModule({
            imports: [FormsModule],
            declarations: [SwitchIdentityComponent],
            providers: [
                {provide: NgbActiveModal, useValue: mockActiveModal},
                {provide: ConnectionProfileService, useValue: mockConnectionProfileService},
                {provide: WalletService, useValue: mockWalletService},
                {provide: ClientService, useValue: mockClientService},
                {provide: IdentityService, useValue: mockIdentityService}
            ]
        });

        fixture = TestBed.createComponent(SwitchIdentityComponent);
        component = fixture.componentInstance;
    });

    describe('ngOnInit', () => {
        it('should be created', () => {
            expect(component).should.be.ok;
        });

        it('should load the identities for the connection profile being changed to', fakeAsync(() => {
            mockIdentityService.getIdentities.returns(Promise.resolve(['bob', 'fred']));

            component.ngOnInit();

            tick();

            component['identities'].length.should.equal(2);
            component['identities'].should.deep.equal(['bob', 'fred']);

            component['chosenIdentity'].should.equal('bob');
        }));

        it('should handle error', fakeAsync(() => {
            mockIdentityService.getIdentities.returns(Promise.reject('some error'));

            component.ngOnInit();

            tick();

            mockActiveModal.dismiss.should.have.been.called;
        }));

        it('should not set the chosen identity if no identities', fakeAsync(() => {
            mockIdentityService.getIdentities.returns(Promise.resolve());

            component.ngOnInit();

            tick();

            should.not.exist(component['identities']);
            should.not.exist(component['chosenIdentity']);
        }));
    });

    describe('switch identities', () => {
        it('should switch to the chosen profile with the chosen identity when in wallet view', fakeAsync(() => {
            component['showWalletView'] = true;
            component['connectionProfileName'] = 'myProfile';
            component['chosenIdentity'] = 'bob';

            mockClientService.ensureConnected.returns(Promise.resolve());

            component.switchIdentity();

            component['switchInProgress'].should.equal(true);

            tick();

            mockConnectionProfileService.setCurrentConnectionProfile.should.have.been.calledWith('myProfile');
            mockIdentityService.setCurrentIdentity.should.have.been.calledWith('bob');
            mockClientService.ensureConnected.should.have.been.calledWith(null, true);

            component['switchInProgress'].should.equal(false);
            mockActiveModal.close.should.have.been.called;
        }));

        it('should switch to the chosen profile with the chosen identity when not in wallet view wallet contains id', fakeAsync(() => {
            component['showWalletView'] = false;
            component['connectionProfileName'] = 'myProfile';
            component['userID'] = 'bob';
            component['userSecret'] = 'mySecret';

            let mockWallet = {
                contains: sinon.stub().returns(Promise.resolve(true)),
                update: sinon.stub().returns(Promise.resolve())
            };

            mockWalletService.getWallet.returns(mockWallet);

            mockClientService.ensureConnected.returns(Promise.resolve());

            component.switchIdentity();

            component['switchInProgress'].should.equal(true);

            tick();

            mockWalletService.getWallet.should.have.been.calledWith('myProfile');
            mockWallet.contains.should.have.been.calledWith('bob');
            mockWallet.update.should.have.been.calledWith('bob', 'mySecret');

            mockConnectionProfileService.setCurrentConnectionProfile.should.have.been.calledWith('myProfile');
            mockIdentityService.setCurrentIdentity.should.have.been.calledWith('bob');
            mockClientService.ensureConnected.should.have.been.calledWith(null, true);

            component['switchInProgress'].should.equal(false);
            mockActiveModal.close.should.have.been.called;
        }));

        it('should switch to the chosen profile with the chosen identity when not in wallet view wallet doesn\'tcontains id', fakeAsync(() => {
            component['showWalletView'] = false;
            component['connectionProfileName'] = 'myProfile';
            component['userID'] = 'bob';
            component['userSecret'] = 'mySecret';

            let mockWallet = {
                contains: sinon.stub().returns(Promise.resolve(false)),
                add: sinon.stub().returns(Promise.resolve())
            };

            mockWalletService.getWallet.returns(mockWallet);

            mockClientService.ensureConnected.returns(Promise.resolve());

            component.switchIdentity();

            component['switchInProgress'].should.equal(true);

            tick();

            mockWalletService.getWallet.should.have.been.calledWith('myProfile');
            mockWallet.contains.should.have.been.calledWith('bob');
            mockWallet.add.should.have.been.calledWith('bob', 'mySecret');

            mockConnectionProfileService.setCurrentConnectionProfile.should.have.been.calledWith('myProfile');
            mockIdentityService.setCurrentIdentity.should.have.been.calledWith('bob');
            mockClientService.ensureConnected.should.have.been.calledWith(null, true);

            component['switchInProgress'].should.equal(false);
            mockActiveModal.close.should.have.been.called;
        }));

        it('should handle error', fakeAsync(() => {
            component['showWalletView'] = true;
            component['connectionProfileName'] = 'myProfile';
            component['chosenUser'] = 'bob';

            mockClientService.ensureConnected.returns(Promise.reject('some error'));

            component.switchIdentity();

            component['switchInProgress'].should.equal(true);

            tick();

            mockClientService.ensureConnected.should.have.been.calledWith(null, true);

            component['switchInProgress'].should.equal(false);
            mockActiveModal.dismiss.should.have.been.called;
        }));
    });

    describe('showWallet', () => {
        it('should show the wallet', () => {
            component.showWallet(true);

            component['showWalletView'].should.equal(true);
        });

        it('shouldn\'t show the wallet', () => {
            component.showWallet(false);

            component['showWalletView'].should.equal(false);
        });
    });
});
