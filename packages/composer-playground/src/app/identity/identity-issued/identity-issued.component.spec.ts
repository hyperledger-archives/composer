/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Component, Directive, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { IdentityIssuedComponent } from './identity-issued.component';
import { IdentityCardService } from '../../services/identity-card.service';

import { IdCard } from 'composer-common';

import * as sinon from 'sinon';

@Directive({
    selector: '[ngxClipboard]'
})
class MockClipboardDirective {
    @Input() cbContent: any;
}

@Component({
    selector: 'ngb-accordion',
    template: ''
})
class MockAccordionComponent {
    @Input() closeOthers: boolean;
}

@Component({
    selector: 'ngb-panel',
    template: ''
})
class MockPanelComponent {
}

@Component({
    selector: 'identity-card',
    template: ''
})
class MockIdentityCardComponent {
    @Input() identity: any;
    @Input() preview: boolean;
}

describe('IdentityIssuedComponent', () => {
    let component: IdentityIssuedComponent;
    let fixture: ComponentFixture<IdentityIssuedComponent>;

    let mockActiveModal;
    let mockIdentityCardService;
    let mockIdCard;
    let mockConnectionProfile;

    beforeEach(() => {
        mockActiveModal = sinon.createStubInstance(NgbActiveModal);
        mockIdentityCardService = sinon.createStubInstance(IdentityCardService);
        mockIdCard = sinon.createStubInstance(IdCard);
        mockIdCard.getBusinessNetworkName.returns('dan-net');
        mockConnectionProfile = {
            name: 'dan-profile'
        };
        mockIdCard.getConnectionProfile.returns(mockConnectionProfile);
        mockIdentityCardService.getCurrentIdentityCard.returns(mockIdCard);

        TestBed.configureTestingModule({
            imports: [FormsModule],
            declarations: [
                IdentityIssuedComponent,
                MockClipboardDirective,
                MockAccordionComponent,
                MockPanelComponent,
                MockIdentityCardComponent
            ],
            providers: [
                {provide: NgbActiveModal, useValue: mockActiveModal},
                {provide: IdentityCardService, useValue: mockIdentityCardService},
            ]
        });

        fixture = TestBed.createComponent(IdentityIssuedComponent);
        component = fixture.componentInstance;
    });

    it('should be created', () => {
        component.should.be.ok;
    });

    describe('ngOnInit', () => {
        it('should', fakeAsync(() => {
            component.userID = 'dan';
            component.userSecret = 'wotnodolphin';

            component.ngOnInit();

            tick();

            component['newCard'].getUserName().should.equal('dan');
            component['newCard'].getEnrollmentCredentials().should.deep.equal({secret: 'wotnodolphin'});
            component['newCard'].getBusinessNetworkName().should.equal('dan-net');
            component['newCard'].getConnectionProfile().should.deep.equal({name: 'dan-profile'});
        }));
    });

    describe('addToWallet', () => {
        it('should close the modal with the add to wallet option', fakeAsync(() => {
            mockIdentityCardService.addIdentityCard.returns(Promise.resolve('1234'));
            component.addToWallet();

            tick();

            mockActiveModal.close.should.have.been.calledWith({cardRef: '1234', choice: 'add'});
        }));

        it('should handle error with card name', fakeAsync(() => {
            mockIdentityCardService.addIdentityCard.returns(Promise.reject({message: 'Card already exists: bob'}));
            component.addToWallet();

            tick();

            mockActiveModal.close.should.not.have.been.called;
            mockActiveModal.dismiss.should.not.have.been.called;

            component['cardNameValid'].should.equal(false);
        }));

        it('should handle error', fakeAsync(() => {
            mockIdentityCardService.addIdentityCard.returns(Promise.reject({message: 'some error'}));
            component.addToWallet();

            tick();

            mockActiveModal.dismiss.should.have.been.calledWith({message: 'some error'});
        }));
    });

    describe('export', () => {
        it('should close the modal with the export option', () => {
            component.export();

            mockActiveModal.close.should.have.been.calledWith({card: undefined, choice: 'export'});
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
