/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { IdentityComponent } from './identity.component';
import { AlertService } from '../basic-modals/alert.service';
import { IdentityCardService } from '../services/identity-card.service';
import { ClientService } from '../services/client.service';
import { BusinessNetworkConnection } from 'composer-client';

import * as chai from 'chai';

import * as sinon from 'sinon';
import { WalletService } from '../services/wallet.service';

let should = chai.should();

@Component({
    selector: 'app-footer',
    template: ''
})
class MockFooterComponent {

}

describe(`IdentityComponent`, () => {

    let component: IdentityComponent;
    let fixture: ComponentFixture<IdentityComponent>;

    let mockModal;
    let mockAlertService;
    let mockIdentityCardService;
    let mockClientService;
    let mockWalletService;
    let mockBusinessNetworkConnection;

    beforeEach(() => {

        mockModal = sinon.createStubInstance(NgbModal);
        mockAlertService = sinon.createStubInstance(AlertService);
        mockIdentityCardService = sinon.createStubInstance(IdentityCardService);
        mockClientService = sinon.createStubInstance(ClientService);
        mockWalletService = sinon.createStubInstance(WalletService);
        mockBusinessNetworkConnection = sinon.createStubInstance(BusinessNetworkConnection);

        mockAlertService.errorStatus$ = {next: sinon.stub()};
        mockAlertService.successStatus$ = {next: sinon.stub()};
        mockAlertService.busyStatus$ = {next: sinon.stub()};

        mockClientService.ensureConnected.returns(Promise.resolve(true));
        mockBusinessNetworkConnection.getIdentityRegistry.returns(Promise.resolve({
            getAll: sinon.stub().returns([{name: 'idOne'}, {name: 'idTwo'}])
        }));
        mockClientService.getBusinessNetworkConnection.returns(mockBusinessNetworkConnection);

        mockClientService.getMetaData.returns({
            getName: sinon.stub().returns('name')
        });

        TestBed.configureTestingModule({
            imports: [FormsModule],
            declarations: [
                IdentityComponent,
                MockFooterComponent
            ],
            providers: [
                {provide: NgbModal, useValue: mockModal},
                {provide: AlertService, useValue: mockAlertService},
                {provide: IdentityCardService, useValue: mockIdentityCardService},
                {provide: ClientService, useValue: mockClientService},
                {provide: WalletService, useValue: mockWalletService}
            ]
        });

        fixture = TestBed.createComponent(IdentityComponent);

        component = fixture.componentInstance;
    });

    describe('ngOnInit', () => {
        it('should create the component', () => {
            component.should.be.ok;
        });

        it('should load the component', () => {
            let loadMock = sinon.stub(component, 'loadAllIdentities');

            component.ngOnInit();

            loadMock.should.have.been.called;
        });
    });

    describe('load all identities', () => {
        it('should load the identities', fakeAsync(() => {
            mockIdentityCardService.getCurrentEnrollmentCredentials.returns({id: 'myId'});

            component.loadAllIdentities();

            tick();

            component['myIdentities'].should.deep.equal([]);
            component['allIdentities'].should.deep.equal([{name: 'idOne'}, {name: 'idTwo'}]);
            component['currentIdentity'].should.equal('myId');
        }));

        it('should give an alert if there is an error', fakeAsync(() => {
            mockBusinessNetworkConnection.getIdentityRegistry.returns(Promise.reject('some error'));

            component.loadAllIdentities();

            tick();

            should.not.exist(component['allIdentities']);
            mockAlertService.errorStatus$.next.should.have.been.called;
        }));
    });

    describe('issueNewId', () => {
        beforeEach(() => {
            mockModal.open.reset();
        });

        it('should issue id', fakeAsync(() => {
            let mockLoadAllIdentities = sinon.stub(component, 'loadAllIdentities');
            mockModal.open.onFirstCall().returns({
                result: Promise.resolve({userID: 'myId', userSecret: 'mySecret'})
            });

            mockModal.open.onSecondCall().returns({
                componentInstance: {},
                result: Promise.resolve()
            });

            component.issueNewId();

            tick();

            mockLoadAllIdentities.should.have.been.called;
        }));

        it('should handle error in id creation', fakeAsync(() => {
            let mockLoadAllIdentities = sinon.stub(component, 'loadAllIdentities');

            mockModal.open.onFirstCall().returns({
                result: Promise.reject('some error')
            });

            component.issueNewId();

            tick();

            mockModal.open.should.have.been.calledOnce;

            mockAlertService.errorStatus$.next.should.have.been.called;

            mockLoadAllIdentities.should.have.been.called;
        }));

        it('should handle escape being pressed', fakeAsync(() => {
            let mockLoadAllIdentities = sinon.stub(component, 'loadAllIdentities');

            mockModal.open.onFirstCall().returns({
                result: Promise.reject(1)
            });

            component.issueNewId();

            tick();

            mockModal.open.should.have.been.calledOnce;

            mockAlertService.errorStatus$.next.should.not.have.been.called;

            mockLoadAllIdentities.should.have.been.called;
        }));

        it('should handle id in id displaying', fakeAsync(() => {
            let mockLoadAllIdentities = sinon.stub(component, 'loadAllIdentities');

            mockModal.open.onFirstCall().returns({
                result: Promise.resolve({userID: 'myId', userSecret: 'mySecret'})
            });

            mockModal.open.onSecondCall().returns({
                componentInstance: {},
                result: Promise.reject('some error')
            });

            component.issueNewId();

            tick();

            mockLoadAllIdentities.should.not.have.been.called;

            mockAlertService.errorStatus$.next.should.have.been.called;
        }));

        it('should not issue identity if cancelled', fakeAsync(() => {
            let mockLoadAllIdentities = sinon.stub(component, 'loadAllIdentities');

            mockModal.open.onFirstCall().returns({
                result: Promise.resolve()
            });

            component.issueNewId();

            tick();

            mockAlertService.errorStatus$.next.should.not.have.been.called;
            mockLoadAllIdentities.should.have.been.called;

        }));
    });

    describe('setCurrentIdentity', () => {
        it('should set the current identity', fakeAsync(() => {
            component.loadAllIdentities = sinon.stub();
            mockClientService.ensureConnected.returns(Promise.resolve());

            component.setCurrentIdentity('bob');

            tick();

            component['currentIdentity'].should.equal('bob');
        }));
    });

    describe('removeIdentity', () => {
        beforeEach(() => {
            mockIdentityCardService.getCurrentConnectionProfile.returns({name: 'myProfile'});
            mockIdentityCardService.getQualifiedProfileName.returns('xxx-myProfile');
        });

        it('should open the delete-confirm modal', fakeAsync(() => {

            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.resolve()
            });

            component.removeIdentity('fred');
            tick();

            mockModal.open.should.have.been.called;
        }));

        it('should open the delete-confirm modal and handle error', fakeAsync(() => {

            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.reject('some error')
            });

            component.removeIdentity('fred');
            tick();

            mockAlertService.busyStatus$.next.should.have.been.called;
            mockAlertService.errorStatus$.next.should.have.been.called;
        }));

        it('should open the delete-confirm modal and handle cancel', fakeAsync(() => {

            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.reject(null)
            });

            component.removeIdentity('fred');
            tick();

            mockAlertService.busyStatus$.next.should.not.have.been.called;
            mockAlertService.errorStatus$.next.should.not.have.been.called;
        }));

        it('should remove the identity from the wallet', fakeAsync(() => {

            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.resolve(true)
            });

            mockWalletService.removeFromWallet.returns(Promise.resolve());

            let mockLoadAllIdentities = sinon.stub(component, 'loadAllIdentities');

            component.removeIdentity('fred');

            tick();

            mockWalletService.removeFromWallet.should.have.been.calledWith('xxx-myProfile', 'fred');
            mockLoadAllIdentities.should.have.been.called;

            mockAlertService.busyStatus$.next.should.have.been.called;
            mockAlertService.successStatus$.next.should.have.been.called;
            mockAlertService.errorStatus$.next.should.not.have.been.called;
        }));

        it('should handle error when remvoing from wallet', fakeAsync(() => {

            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.resolve(true)
            });

            mockWalletService.removeFromWallet.returns(Promise.reject('some error'));

            let mockLoadAllIdentities = sinon.stub(component, 'loadAllIdentities');

            component.removeIdentity('fred');

            tick();

            mockWalletService.removeFromWallet.should.have.been.calledWith('xxx-myProfile', 'fred');
            mockLoadAllIdentities.should.not.have.been.called;

            mockAlertService.busyStatus$.next.should.have.been.called;
            mockAlertService.errorStatus$.next.should.have.been.calledWith('some error');
        }));
    });

    describe('revokeIdentity', () => {
        it('should open the delete-confirm modal', fakeAsync(() => {

            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.resolve()
            });

            component.revokeIdentity({name: 'fred'});
            tick();

            mockModal.open.should.have.been.called;
        }));

        it('should open the delete-confirm modal and handle error', fakeAsync(() => {

            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.reject('some error')
            });

            component.revokeIdentity({name: 'fred'});
            tick();

            mockAlertService.busyStatus$.next.should.have.been.called;
            mockAlertService.errorStatus$.next.should.have.been.called;
        }));

        it('should open the delete-confirm modal and handle cancel', fakeAsync(() => {

            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.reject(null)
            });

            component.revokeIdentity({name: 'fred'});
            tick();

            mockAlertService.busyStatus$.next.should.not.have.been.called;
            mockAlertService.errorStatus$.next.should.not.have.been.called;
        }));

        it('should revoke the identity from the client service and then remove the identity from the wallet', fakeAsync(() => {

            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.resolve(true)
            });

            mockClientService.revokeIdentity.returns(Promise.resolve());

            let mockRemoveIdentity = sinon.stub(component, 'removeIdentity').returns(Promise.resolve());
            let mockLoadAllIdentities = sinon.stub(component, 'loadAllIdentities').returns(Promise.resolve());

            component.revokeIdentity({name: 'fred'});

            tick();

            mockClientService.revokeIdentity.should.have.been.called;
            mockRemoveIdentity.should.have.been.calledWith('fred');
            mockLoadAllIdentities.should.have.been.called;

            mockAlertService.busyStatus$.next.should.have.been.called;
            mockAlertService.successStatus$.next.should.have.been.called;

        }));

        it('should handle error', fakeAsync(() => {
            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.resolve(true)
            });

            mockClientService.revokeIdentity.returns(Promise.reject('some error'));

            let mockRemoveIdentity = sinon.stub(component, 'removeIdentity');
            let mockLoadAllIdentities = sinon.stub(component, 'loadAllIdentities');

            component.revokeIdentity({name: 'fred'});

            tick();

            mockClientService.revokeIdentity.should.have.been.called;
            mockRemoveIdentity.should.not.have.been.called;
            mockLoadAllIdentities.should.not.have.been.called;

            mockAlertService.busyStatus$.next.should.have.been.called;
            mockAlertService.errorStatus$.next.should.have.been.called;
        }));
    });
});
