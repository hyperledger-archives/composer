/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import * as sinon from 'sinon';

import { EditCardCredentialsComponent } from './edit-card-credentials.component';
import { IdentityCardService } from '../../services/identity-card.service';
import { AlertService } from '../../basic-modals/alert.service';

describe('EditCardCredentialsComponent', () => {
    let component: EditCardCredentialsComponent;
    let fixture: ComponentFixture<EditCardCredentialsComponent>;

    let mockActiveModal;
    let mockIdentityCardService;
    let mockAlertService;

    beforeEach(() => {
        mockIdentityCardService = sinon.createStubInstance(IdentityCardService);
        mockAlertService = sinon.createStubInstance(AlertService);

        mockAlertService.successStatus$ = {next: sinon.stub()};
        mockAlertService.busyStatus$ = {next: sinon.stub()};
        mockAlertService.errorStatus$ = {next: sinon.stub()};

        TestBed.configureTestingModule({
            imports: [FormsModule],
            declarations: [EditCardCredentialsComponent],
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

        beforeAll(() => {
            component['userId'] = 'bob';
            component['userSecret'] = 'suchSecret';
            component['busNetName'] = 'network';
            component['connectionProfile'] = { theProfile: 'muchProfile' };
            component['addInProgress'] = false;
            component['useCerts'] = false;
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

            mockIdentityCardService.createIdentityCard.calledWith('bob', 'network', 'bob', 'suchSecret', { theProfile: 'muchProfile' });
            mockAlertService.successStatus$.next.should.have.been.calledWith({
                                title: 'ID Card Added',
                                text: 'The ID card was successfully added to My Wallet.',
                                icon: '#icon-role_24'
                            });
            spy.should.have.been.calledWith(true);
        }));

        it('should handle an error from createIdentityCard(~) inform the user', fakeAsync(() => {
            mockIdentityCardService.createIdentityCard.returns(Promise.reject('test error'));
            let spy = sinon.spy(component.idCardAdded, 'emit');

            component.addIdentityCard();

            tick();

            component['addInProgress'].should.be.false;
            mockAlertService.errorStatus$.next.should.have.been.calledWith('test error');
            spy.should.have.been.calledWith(false);
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

        it('it should not validate if the business network name is empty when using certificates', () => {
            // Certs path
            component['useCerts'] = true;
            component['addInProgress'] = false;
            component['addedPublicCertificate'] = 'publicKey';
            component['addedPrivateCertificate'] = 'privateKey';
            component['userId'] = 'userID';
            component['busNetName'] = null;

            component['validContents']().should.be.false;
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

        it('should validate if all text fields are added when specifying user ID/Secret', () => {
            // Secret/ID path
            component['useCerts'] = false;
            component['addInProgress'] = false;
            component['userId'] = 'myID';
            component['userSecret'] = 'mySecret';
            component['busNetName'] = 'myName';

            component['validContents']().should.be.true;
        });
    });

    describe('#useCertificates', () => {
        it('should set flag to false when passed false', () => {
            component['useCertificates'](false);
            component['useCerts'].should.be.false;
        });

        it('should set flag to true when passed true', () => {
            component['useCertificates'](true);
            component['useCerts'].should.be.true;
        });
    });

    describe('#close', () => {
        it('should emit on close', () => {
            let spy = sinon.spy(component.idCardAdded, 'emit');
            component['close']();
            spy.should.have.been.calledWith(false);
        });
    });
});
