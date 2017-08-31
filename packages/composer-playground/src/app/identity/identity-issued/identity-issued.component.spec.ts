/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { IdentityIssuedComponent } from './identity-issued.component';
import { IdentityCardService } from '../../services/identity-card.service';

import * as sinon from 'sinon';

describe('IdentityIssuedComponent', () => {
    let component: IdentityIssuedComponent;
    let fixture: ComponentFixture<IdentityIssuedComponent>;

    let mockActiveModal;
    let mockIdentityCard;

    beforeEach(() => {
        mockActiveModal = sinon.createStubInstance(NgbActiveModal);
        mockIdentityCard = sinon.createStubInstance(IdentityCardService);

        TestBed.configureTestingModule({
            declarations: [IdentityIssuedComponent],
            providers: [
                {provide: NgbActiveModal, useValue: mockActiveModal},
                {provide: IdentityCardService, useValue: mockIdentityCard},
            ]
        });

        fixture = TestBed.createComponent(IdentityIssuedComponent);
        component = fixture.componentInstance;
    });

    it('should be created', () => {
        component.should.be.ok;
    });

    describe('addToWallet', () => {
        let mockCard;

        beforeEach(() => {
            mockCard = {
                getConnectionProfile: sinon.stub().returns({name: 'myProfile'}),
                getBusinessNetworkName: sinon.stub().returns('myNetwork')
            };

            mockIdentityCard.getCurrentIdentityCard.returns(mockCard);

            mockIdentityCard.createIdentityCard.returns(Promise.resolve());

            component['userID'] = 'myId';
            component['userSecret'] = 'mySecret';
        });

        it('should add to wallet', fakeAsync(() => {
            component.addToWallet();

            tick();

            mockIdentityCard.getCurrentIdentityCard.should.have.been.calledThrice;
            mockCard.getConnectionProfile.should.have.been.called;
            mockCard.getBusinessNetworkName.should.have.been.called;

            mockIdentityCard.createIdentityCard.should.have.been.calledWith('myId', 'myNetwork', 'myId', 'mySecret', {name: 'myProfile'});

            mockActiveModal.close.should.have.been.called;
        }));

        it('should handle error', fakeAsync(() => {
            mockIdentityCard.createIdentityCard.returns(Promise.reject('some error'));

            component.addToWallet();

            tick();

            mockIdentityCard.getCurrentIdentityCard.should.have.been.calledThrice;
            mockCard.getConnectionProfile.should.have.been.called;
            mockCard.getBusinessNetworkName.should.have.been.called;

            mockIdentityCard.createIdentityCard.should.have.been.calledWith('myId', 'myNetwork', 'myId', 'mySecret', {name: 'myProfile'});
            mockActiveModal.dismiss.should.have.been.called;
        }));
    });
});
