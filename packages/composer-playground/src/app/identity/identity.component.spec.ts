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
import { ClientService } from '../services/client.service';
import { IdentityCardService } from '../services/identity-card.service';
import { BusinessNetworkConnection } from 'composer-client';
import { IdCard } from 'composer-common';

import * as chai from 'chai';

import * as sinon from 'sinon';

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
    let mockBusinessNetworkConnection;
    let mockCard;
    let mockIDCards: Map<string, IdCard>;

    beforeEach(() => {

        mockCard = sinon.createStubInstance(IdCard);
        mockCard.getBusinessNetworkName.returns('myNetwork');
        mockCard.getConnectionProfile.returns({name: 'myProfile'});
        mockCard.getUserName.returns('myName');

        mockIDCards = new Map<string, IdCard>();
        mockIDCards.set('1234', mockCard);

        mockModal = sinon.createStubInstance(NgbModal);
        mockAlertService = sinon.createStubInstance(AlertService);
        mockIdentityCardService = sinon.createStubInstance(IdentityCardService);
        mockClientService = sinon.createStubInstance(ClientService);
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
                {provide: ClientService, useValue: mockClientService},
                {provide: IdentityCardService, useValue: mockIdentityCardService},
            ]
        });

        fixture = TestBed.createComponent(IdentityComponent);

        component = fixture.componentInstance;
    });

    describe('ngOnInit', () => {
        it('should create the component', () => {
            component.should.be.ok;
        });

        it('should load the component', fakeAsync(() => {
            let loadMock = sinon.stub(component, 'loadAllIdentities').returns(Promise.resolve());

            component.ngOnInit();

            tick();

            loadMock.should.have.been.called;
        }));
    });

    describe('load all identities', () => {
        it('should load the identities', fakeAsync(() => {
            mockClientService.getMetaData.returns({getName: sinon.stub().returns('myNetwork')});
            let myIdentityMock = sinon.stub(component, 'loadMyIdentities');

            mockIdentityCardService.getCurrentIdentityCard.returns({
                getConnectionProfile: sinon.stub().returns({name: 'myProfile'})
            });

            mockIdentityCardService.getQualifiedProfileName.returns('qpn');
            mockIdentityCardService.getCardRefFromIdentity.onFirstCall().returns('1234');
            mockIdentityCardService.getCardRefFromIdentity.onSecondCall().returns('4321');

            component.loadAllIdentities();

            tick();

            component['businessNetworkName'].should.equal('myNetwork');
            myIdentityMock.should.have.been.called;

            mockIdentityCardService.getCurrentIdentityCard.should.have.been.called;
            mockIdentityCardService.getQualifiedProfileName.should.have.been.calledWith({name : 'myProfile'});
            mockIdentityCardService.getCardRefFromIdentity.should.have.been.calledTwice;
            mockIdentityCardService.getCardRefFromIdentity.firstCall.should.have.been.calledWith('idOne', 'myNetwork', 'qpn');
            mockIdentityCardService.getCardRefFromIdentity.secondCall.should.have.been.calledWith('idTwo', 'myNetwork', 'qpn');
            component['allIdentities'].should.deep.equal([{name: 'idOne', ref : '1234'}, {name: 'idTwo', ref: '4321'}]);
        }));

        it('should give an alert if there is an error', fakeAsync(() => {

            mockBusinessNetworkConnection.getIdentityRegistry.returns(Promise.reject('some error'));
            let myIdentityMock = sinon.stub(component, 'loadMyIdentities');

            component.loadAllIdentities();

            tick();

            myIdentityMock.should.have.been.called;
            mockBusinessNetworkConnection.getIdentityRegistry.should.have.been.called;

            mockAlertService.errorStatus$.next.should.have.been.calledWith('some error');
        }));
    });

    describe('loadMyIdentities', () => {
        it('should load identities for a business network', () => {
            mockIdentityCardService.currentCard = '1234';

            mockIdentityCardService.getCurrentIdentityCard.returns(mockCard);
            mockIdentityCardService.getQualifiedProfileName.returns('web-profile');

            mockIdentityCardService.getAllCardsForBusinessNetwork.returns(mockIDCards);

            component.loadMyIdentities();

            component['currentIdentity'].should.equal('1234');
            mockIdentityCardService.getCurrentIdentityCard.should.have.been.calledTwice;

            mockCard.getBusinessNetworkName.should.have.been.called;
            mockCard.getConnectionProfile.should.have.been.called;

            mockIdentityCardService.getQualifiedProfileName.should.have.been.calledWith({name: 'myProfile'});

            mockIdentityCardService.getAllCardsForBusinessNetwork.should.have.been.calledWith('myNetwork', 'web-profile');
            component['identityCards'].should.deep.equal(mockIDCards);

            component['cardRefs'].should.deep.equal(['1234']);
        });
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
            let loadAllIdentities = sinon.stub(component, 'loadAllIdentities');
            mockIdentityCardService.setCurrentIdentityCard.returns(Promise.resolve());
            mockClientService.ensureConnected.returns(Promise.resolve());

            component.setCurrentIdentity('1234');

            tick();

            component['currentIdentity'].should.equal('1234');
            mockIdentityCardService.setCurrentIdentityCard.should.have.been.calledWith('1234');
            mockClientService.ensureConnected.should.have.been.calledWith(null, true);
            mockAlertService.busyStatus$.next.should.have.been.calledTwice;
            loadAllIdentities.should.have.been.called;
        }));

        it('should do nothing if the new identity matches the current identity', fakeAsync(() => {
            let loadAllIdentities = sinon.stub(component, 'loadAllIdentities');
            component['currentIdentity'] = '1234';

            component.setCurrentIdentity('1234');

            tick();

            component['currentIdentity'].should.equal('1234');
            loadAllIdentities.should.not.have.been.called;
            mockIdentityCardService.setCurrentIdentityCard.should.not.have.been.called;
            mockClientService.ensureConnected.should.not.have.been.called;
            mockAlertService.busyStatus$.next.should.not.have.been.called;
        }));

        it('should handle errors', fakeAsync(() => {
            mockClientService.ensureConnected.returns(Promise.reject('Testing'));
            mockIdentityCardService.setCurrentIdentityCard.returns(Promise.resolve());
            component.setCurrentIdentity('1234');

            tick();

            mockAlertService.busyStatus$.next.should.have.been.calledTwice;
            mockAlertService.busyStatus$.next.should.have.been.calledWith(null);
            mockAlertService.errorStatus$.next.should.have.been.called;
        }));
    });

    describe('removeIdentity', () => {
        it('should open the delete-confirm modal', fakeAsync(() => {
            component['identityCards'] = mockIDCards;
            let loadMock = sinon.stub(component, 'loadAllIdentities');

            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.resolve()
            });

            component.removeIdentity('1234');
            tick();

            mockModal.open.should.have.been.called;
        }));

        it('should open the delete-confirm modal and handle error', fakeAsync(() => {
            component['identityCards'] = mockIDCards;
            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.reject('some error')
            });

            component.removeIdentity('1234');
            tick();

            mockAlertService.busyStatus$.next.should.have.been.called;
            mockAlertService.errorStatus$.next.should.have.been.called;
        }));

        it('should open the delete-confirm modal and handle cancel', fakeAsync(() => {
            component['identityCards'] = mockIDCards;
            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.reject(null)
            });

            component.removeIdentity('1234');
            tick();

            mockAlertService.busyStatus$.next.should.not.have.been.called;
            mockAlertService.errorStatus$.next.should.not.have.been.called;
        }));

        it('should remove the identity from the wallet', fakeAsync(() => {
            component['identityCards'] = mockIDCards;
            mockIdentityCardService.deleteIdentityCard.returns(Promise.resolve());

            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.resolve(true)
            });

            let mockLoadAllIdentities = sinon.stub(component, 'loadAllIdentities');

            component.removeIdentity('1234');

            tick();

            mockAlertService.busyStatus$.next.should.have.been.called;
            mockIdentityCardService.deleteIdentityCard.should.have.been.calledWith('1234');
            mockLoadAllIdentities.should.have.been.called;

            mockAlertService.busyStatus$.next.should.have.been.called;
            mockAlertService.successStatus$.next.should.have.been.called;
            mockAlertService.errorStatus$.next.should.not.have.been.called;
        }));

        it('should handle error when removing from wallet', fakeAsync(() => {
            component['identityCards'] = mockIDCards;
            mockIdentityCardService.deleteIdentityCard.returns(Promise.reject('some error'));

            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.resolve(true)
            });

            let mockLoadAllIdentities = sinon.stub(component, 'loadAllIdentities');

            component.removeIdentity('1234');

            tick();

            mockIdentityCardService.deleteIdentityCard.should.have.been.calledWith('1234');
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

        it('should revoke the identity from the client service and then remove the identity from the wallet if in wallet', fakeAsync(() => {
            component['cardRefs'] = ['1234'];
            component['businessNetworkName'] = 'myNetwork';
            component['myIdentities'] = ['fred'];
            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.resolve(true)
            });

            mockClientService.revokeIdentity.returns(Promise.resolve());

            let mockRemoveIdentity = sinon.stub(component, 'removeIdentity').returns(Promise.resolve());
            let mockLoadAllIdentities = sinon.stub(component, 'loadAllIdentities').returns(Promise.resolve());

            component.revokeIdentity({name: 'fred', ref: '1234'});

            tick();

            mockClientService.revokeIdentity.should.have.been.called;
            mockRemoveIdentity.should.have.been.calledWith('1234');
            mockLoadAllIdentities.should.have.been.called;

            mockAlertService.busyStatus$.next.should.have.been.called;
            mockAlertService.successStatus$.next.should.have.been.called;
        }));

        it('should revoke the identity from the client service not remove from wallet', fakeAsync(() => {
            component['cardRefs'] = [];
            component['businessNetworkName'] = 'myNetwork';
            component['myIdentities'] = ['bob'];
            mockModal.open = sinon.stub().returns({
                componentInstance: {},
                result: Promise.resolve(true)
            });

            let mockRemoveIdentity = sinon.stub(component, 'removeIdentity').returns(Promise.resolve());
            let mockLoadAllIdentities = sinon.stub(component, 'loadAllIdentities').returns(Promise.resolve());
            mockClientService.revokeIdentity.returns(Promise.resolve());

            component.revokeIdentity({name: 'fred', ref: '1234'});

            tick();

            mockClientService.revokeIdentity.should.have.been.called;
            mockRemoveIdentity.should.not.have.been.called;
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
