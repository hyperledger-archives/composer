/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { ComponentFixture, TestBed, async, fakeAsync, tick } from '@angular/core/testing';
import { Directive, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import * as sinon from 'sinon';
import * as chai from 'chai';

let should = chai.should();

import { EditCardCredentialsComponent } from './edit-card-credentials.component';
import { IdentityCardService } from '../../services/identity-card.service';
import { AlertService } from '../../basic-modals/alert.service';

@Directive({
    selector: 'credentials'
})
class MockCredentialsDirective {
    @Output()
    public credentials: EventEmitter<any> = new EventEmitter<any>();
}

describe('EditCardCredentialsComponent', () => {
    let component: EditCardCredentialsComponent;
    let fixture: ComponentFixture<EditCardCredentialsComponent>;

    let sandbox;
    let mockIdentityCardService;
    let mockAlertService;

    beforeEach(() => {
        mockIdentityCardService = sinon.createStubInstance(IdentityCardService);
        mockAlertService = sinon.createStubInstance(AlertService);

        mockAlertService.successStatus$ = {next: sinon.stub()};
        mockAlertService.busyStatus$ = {next: sinon.stub()};
        mockAlertService.errorStatus$ = {next: sinon.stub()};

        sandbox = sinon.sandbox.create();

        TestBed.configureTestingModule({
            imports: [FormsModule],
            declarations: [
                EditCardCredentialsComponent, MockCredentialsDirective
            ],
            providers: [
                {provide: AlertService, useValue: mockAlertService},
                {provide: IdentityCardService, useValue: mockIdentityCardService}
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(EditCardCredentialsComponent);
        component = fixture.componentInstance;
    });

    it('should be created', () => {
        component.should.be.ok;
    });

    describe('#submitCard', () => {

        let mockValidate;
        let mockAddCard;
        let event;

        beforeEach(() => {
            mockValidate = sinon.stub(component, 'validContents').returns(false);
            mockAddCard = sinon.stub(component, 'addIdentityCard');
            event = document.createEvent('Events');
            event.initEvent('keydown"', true, true);
            event.keyCode = 40;
        });

        it('should not call addCard if no event', () => {
            component.submitCard(null);
            mockAddCard.should.not.have.been.called;
        });

        it('should not call addCard if invalid key press', () => {
            component.submitCard(event);
            mockAddCard.should.not.have.been.called;
        });

        it('should not call addCard if form contents invalid', () => {
            event.keyCode = 13;
            component.submitCard(event);
            mockValidate.should.have.been.called;
            mockAddCard.should.not.have.been.called;
        });

        it('should call addCard if valid keypress and form contents are valid', () => {
            event.keyCode = 13;
            mockValidate.returns(true);
            component.submitCard(event);
            mockValidate.should.have.been.called;
            mockAddCard.should.have.been.called;
        });

    });

    describe('#addIdentityCard', () => {

        beforeEach(() => {
            component['userId'] = 'bob';
            component['userSecret'] = 'suchSecret';
            component['busNetName'] = 'network';
            component['connectionProfile'] = {theProfile: 'muchProfile'};
            component['addInProgress'] = false;
            component['useCerts'] = false;
            component['cardName'] = 'myCardName';
        });

        it('should set busy status upon entry', fakeAsync(() => {
            mockIdentityCardService.createIdentityCard.returns(Promise.resolve());

            component.addIdentityCard();

            tick();

            mockAlertService.busyStatus$.next.should.have.been.calledWith({
                title: 'Adding ID card',
                text: 'Adding ID card'
            });

        }));

        it('should call createIdentityCard(~) and inform success', fakeAsync(() => {
            mockIdentityCardService.createIdentityCard.returns(Promise.resolve());
            let spy = sinon.spy(component.idCardAdded, 'emit');

            component.addIdentityCard();

            tick();

            mockIdentityCardService.createIdentityCard.should.have.been.calledWith('bob', 'myCardName', 'network', 'suchSecret', {theProfile: 'muchProfile'}, null, []);
            mockAlertService.successStatus$.next.should.have.been.calledWith({
                title: 'ID Card Added',
                text: 'The ID card was successfully added to My Wallet.',
                icon: '#icon-role_24'
            });
            spy.should.have.been.calledWith(true);
        }));

        it('should call createIdentityCard(~) and inform success using certs', fakeAsync(() => {
            component['userSecret'] = null;
            component['useCerts'] = true;
            component['addedPublicCertificate'] = 'my-public-cert';
            component['addedPrivateCertificate'] = 'my-private-cert';

            mockIdentityCardService.createIdentityCard.returns(Promise.resolve());
            let spy = sinon.spy(component.idCardAdded, 'emit');

            component.addIdentityCard();

            tick();

            let certs = {
                certificate: 'my-public-cert',
                privateKey: 'my-private-cert'
            };

            mockIdentityCardService.createIdentityCard.should.have.been.calledWith('bob', 'myCardName', 'network', null, {theProfile: 'muchProfile'}, certs, []);
            mockAlertService.successStatus$.next.should.have.been.calledWith({
                title: 'ID Card Added',
                text: 'The ID card was successfully added to My Wallet.',
                icon: '#icon-role_24'
            });
            spy.should.have.been.calledWith(true);
        }));

        it('should call createIdentityCard(~) with roles and inform success', fakeAsync(() => {
            component['busNetName'] = null;
            component['peerAdmin'] = true;
            component['channelAdmin'] = true;

            mockIdentityCardService.createIdentityCard.returns(Promise.resolve());
            let spy = sinon.spy(component.idCardAdded, 'emit');

            component.addIdentityCard();

            tick();

            mockIdentityCardService.createIdentityCard.should.have.been.calledWith('bob', 'myCardName', null, 'suchSecret', {theProfile: 'muchProfile'}, null, ['PeerAdmin', 'ChannelAdmin']);
            mockAlertService.successStatus$.next.should.have.been.calledWith({
                title: 'ID Card Added',
                text: 'The ID card was successfully added to My Wallet.',
                icon: '#icon-role_24'
            });
            spy.should.have.been.calledWith(true);
        }));

        it('should handle an error from createIdentityCard(~) inform the user', fakeAsync(() => {
            mockIdentityCardService.createIdentityCard.returns(Promise.reject({message: 'test error'}));
            let spy = sinon.spy(component.idCardAdded, 'emit');

            component.addIdentityCard();

            tick();

            component['addInProgress'].should.be.false;
            mockAlertService.errorStatus$.next.should.have.been.calledWith({message: 'test error'});
            spy.should.have.been.calledWith(false);
        }));

        it('should handle an error from createIdentityCard(~) with cardName and inform the user', fakeAsync(() => {
            mockIdentityCardService.createIdentityCard.returns(Promise.reject({message: 'Card already exists: bob'}));
            let spy = sinon.spy(component.idCardAdded, 'emit');

            component.addIdentityCard();

            tick();

            component['addInProgress'].should.be.false;
            mockAlertService.errorStatus$.next.should.not.have.been.called;
            spy.should.not.have.been.called;
            component['cardNameValid'].should.equal(false);
        }));
    });

    describe('#validContents', () => {
        it('should not enable validation if trying to set certificates', () => {
            // Certs path
            component['useCerts'] = true;
            component['validContents']().should.be.false;
        });

        it('should not validate if an add is in progress when using certificates', () => {
            // Certs path
            component['useCerts'] = true;
            component['addInProgress'] = true;
            component['addedPublicCertificate'] = 'publicKey';
            component['addedPrivateCertificate'] = 'privateKey';
            component['userId'] = 'userID';
            component['busNetName'] = 'myName';

            component['validContents']().should.be.false;
        });

        it('should not validate if the public certificate is empty when using certificates', () => {
            // Certs path
            component['useCerts'] = true;
            component['addedPublicCertificate'] = null;
            component['addedPrivateCertificate'] = 'privateKey';
            component['userId'] = 'userID';
            component['busNetName'] = 'myName';

            component['validContents']().should.be.false;
        });

        it('it should not validate if the private certificate is empty when using certificates', () => {
            // Certs path
            component['useCerts'] = true;
            component['addedPublicCertificate'] = 'publicKey';
            component['addedPrivateCertificate'] = null;
            component['userId'] = 'userID';
            component['busNetName'] = 'myName';

            component['validContents']().should.be.false;
        });

        it('it should not validate if the user ID is empty when using certificates', () => {
            // Certs path
            component['useCerts'] = true;
            component['addedPublicCertificate'] = 'publicKey';
            component['addedPrivateCertificate'] = 'privateKey';
            component['userId'] = null;
            component['busNetName'] = 'myName';

            component['validContents']().should.be.false;
        });

        it('it should not validate if the business network name is empty when using certificates and participant card', () => {
            // Certs path
            component['useCerts'] = true;
            component['addInProgress'] = false;
            component['addedPublicCertificate'] = 'publicKey';
            component['addedPrivateCertificate'] = 'privateKey';
            component['userId'] = 'userID';
            component['busNetName'] = null;
            component['useParticipantCard'] = false;

            component['validContents']().should.be.false;
        });

        it('it should not validate if has no roles when using certificates and admin card', () => {
            // Certs path
            component['useCerts'] = true;
            component['addInProgress'] = false;
            component['addedPublicCertificate'] = 'publicKey';
            component['addedPrivateCertificate'] = 'privateKey';
            component['userId'] = 'userID';
            component['peerAdmin'] = false;
            component['channelAdmin'] = false;
            component['useParticipantCard'] = false;

            component['validContents']().should.be.false;
        });

        it('it should not validate if card name is invalid', () => {
            // Certs path
            component['useCerts'] = true;
            component['addInProgress'] = false;
            component['addedPublicCertificate'] = 'publicKey';
            component['addedPrivateCertificate'] = 'privateKey';
            component['userId'] = 'userID';
            component['busNetName'] = 'my-network';
            component['useParticipantCard'] = true;
            component['cardNameValid'] = false;

            component['validContents']().should.be.false;
        });

        it('it should validate when using certificates and participant card', () => {
            // Certs path
            component['useCerts'] = true;
            component['addInProgress'] = false;
            component['addedPublicCertificate'] = 'publicKey';
            component['addedPrivateCertificate'] = 'privateKey';
            component['userId'] = 'userID';
            component['busNetName'] = 'my-network';
            component['useParticipantCard'] = true;

            component['validContents']().should.be.true;
        });

        it('it should validate when using certificates and admin card', () => {
            // Certs path
            component['useCerts'] = true;
            component['addInProgress'] = false;
            component['addedPublicCertificate'] = 'publicKey';
            component['addedPrivateCertificate'] = 'privateKey';
            component['userId'] = 'userID';
            component['useParticipantCard'] = false;
            component['peerAdmin'] = true;

            component['validContents']().should.be.true;
        });

        it('should not validate if an add is in progress when specifying user ID/Secret', () => {
            // Secret/ID path
            component['useCerts'] = false;
            component['addInProgress'] = true;
            component['userId'] = 'myId';
            component['userSecret'] = 'mySecret';
            component['busNetName'] = 'myName';

            component['validContents']().should.be.false;
        });

        it('should not validate if a userID field is empty when specifying user ID/Secret', () => {
            // Secret/ID path
            component['useCerts'] = false;
            component['addInProgress'] = false;
            component['userId'] = null;
            component['userSecret'] = 'mySecret';
            component['busNetName'] = 'myName';

            component['validContents']().should.be.false;
        });

        it('should not validate if a userSecret field is empty when specifying user ID/Secret', () => {
            // Secret/ID path
            component['useCerts'] = false;
            component['addInProgress'] = false;
            component['userId'] = 'myID';
            component['userSecret'] = null;
            component['busNetName'] = 'myName';

            component['validContents']().should.be.false;
        });

        it('should not validate if a Business Network Name field is empty when specifying user ID/Secret', () => {
            // Secret/ID path
            component['useCerts'] = false;
            component['addInProgress'] = false;
            component['userId'] = 'myID';
            component['userSecret'] = 'mySecret';
            component['busNetName'] = null;

            component['validContents']().should.be.false;
        });

        it('should not validate if a Business Network Name field is empty when specifying user ID/Secret and participant card', () => {
            // Secret/ID path
            component['useCerts'] = false;
            component['addInProgress'] = false;
            component['userId'] = 'myID';
            component['userSecret'] = 'mySecret';
            component['busNetName'] = null;
            component['useParticipantCard'] = true;

            component['validContents']().should.be.false;
        });

        it('should not validate if no role when specifying user ID/Secret and admin card', () => {
            // Secret/ID path
            component['useCerts'] = false;
            component['addInProgress'] = false;
            component['userId'] = 'myID';
            component['userSecret'] = 'mySecret';
            component['peerAdmin'] = false;
            component['channelAdmin'] = false;
            component['useParticipantCard'] = false;

            component['validContents']().should.be.false;
        });

        it('should validate if all text fields are added when specifying user ID/Secret and participant card', () => {
            // Secret/ID path
            component['useCerts'] = false;
            component['addInProgress'] = false;
            component['userId'] = 'myID';
            component['userSecret'] = 'mySecret';
            component['busNetName'] = 'myName';
            component['useParticipantCard'] = true;

            component['validContents']().should.be.true;
        });

        it('should validate if all text fields are added when specifying user ID/Secret and admin card', () => {
            // Secret/ID path
            component['useCerts'] = false;
            component['addInProgress'] = false;
            component['userId'] = 'myID';
            component['userSecret'] = 'mySecret';
            component['useParticipantCard'] = false;
            component['channelAdmin'] = true;

            component['validContents']().should.be.true;
        });
    });

    describe('#useParticipantCardType', () => {
        it('should set flag to false when passed false', () => {
            component['useParticipantCardType'](false);
            component['useParticipantCard'].should.be.false;
        });

        it('should set flag to true when passed true', () => {
            component['useParticipantCardType'](true);
            component['useParticipantCard'].should.be.true;
        });
    });

    describe('#close', () => {
        it('should emit on close', () => {
            let spy = sinon.spy(component.idCardAdded, 'emit');
            component['close']();
            spy.should.have.been.calledWith(false);
        });
    });

    describe('updateCredentials', () => {
        it('should set details to null if no event', () => {
            component.updateCredentials(null);

            should.not.exist(component['userId']);
            should.not.exist(component['userSecret']);
            should.not.exist(component['addedPrivateCertificate']);
            should.not.exist(component['addedPublicCertificate']);
        });

        it('should set the userId and secret', () => {
            let event = {userId: 'myUserId', secret: 'mySecret'};

            component.updateCredentials(event);

            component['userId'].should.equal('myUserId');
            component['userSecret'].should.equal('mySecret');

            should.not.exist(component['addedPrivateCertificate']);
            should.not.exist(component['addedPublicCertificate']);
        });

        it('should set the credentials', () => {
            let event = {userId: 'myUserId', cert: 'myCert', key: 'myKey'};

            component.updateCredentials(event);

            component['userId'].should.equal('myUserId');
            component['addedPrivateCertificate'].should.equal('myKey');
            component['addedPublicCertificate'].should.equal('myCert');

            should.not.exist(component['userSecret']);
        });
    });

    describe('setCardName', () => {
        it('should set the card name and cardNameValid to true', () => {
            component['setCardName']('myCardName');

            component['cardName'].should.equal('myCardName');
            component['cardNameValid'].should.equal(true);
        });

        it('should not set the card name if it hasn\'t changed and not update cardNameValid', () => {
            component['cardNameValid'] = false;
            component['cardName'] = 'myCardName';
            component['setCardName']('myCardName');

            component['cardName'].should.equal('myCardName');
            component['cardNameValid'].should.equal(false);
        });
    });
});
