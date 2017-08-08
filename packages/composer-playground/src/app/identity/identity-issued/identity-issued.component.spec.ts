/* tslint:disable:no-unused-variable */
/* tslint:disable:no-unused-expression */
/* tslint:disable:no-var-requires */
/* tslint:disable:max-classes-per-file */
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import * as sinon from 'sinon';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { IdentityIssuedComponent } from './identity-issued.component';
import { IdentityCardService } from '../../services/identity-card.service';
import { WalletService } from '../../services/wallet.service';

describe('IdentityIssuedComponent', () => {
  let component: IdentityIssuedComponent;
  let fixture: ComponentFixture<IdentityIssuedComponent>;

  let mockActiveModal = sinon.createStubInstance(NgbActiveModal);
  let mockIdentityCardService = sinon.createStubInstance(IdentityCardService);
  mockIdentityCardService.getCurrentConnectionProfile.returns({name: 'myProfile'});
  mockIdentityCardService.getQualifiedProfileName.returns('xxx-myProfile');
  let mockWalletService = sinon.createStubInstance(WalletService);

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ IdentityIssuedComponent ],
      providers: [
        { provide: NgbActiveModal, useValue: mockActiveModal },
        { provide: IdentityCardService, useValue: mockIdentityCardService },
        { provide: WalletService, useValue: mockWalletService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IdentityIssuedComponent);
    component = fixture.componentInstance;
  });

  it('should be created', () => {
    expect(component).should.be.ok;
  });

  describe('addToWallet', () => {
    it('should add to wallet', fakeAsync(() => {
      let walletStub = {contains : sinon.stub().returns(Promise.resolve(false)), add : sinon.stub().returns(Promise.resolve())};
      mockWalletService.getWallet.returns(walletStub);

      component['userID'] = 'myId';
      component['userSecret'] = 'mySecret';

      component.addToWallet();

      tick();

      mockWalletService.getWallet.should.have.been.calledWith('xxx-myProfile');
      walletStub.contains.should.have.been.calledWith('myId');
      walletStub.add.should.have.been.calledWith('myId', 'mySecret');
      mockActiveModal.close.should.have.been.called;
    }));

    it('should update wallet if exists', fakeAsync(() => {
      let walletStub = {contains : sinon.stub().returns(Promise.resolve(true)), update : sinon.stub().returns(Promise.resolve())};
      mockWalletService.getWallet.returns(walletStub);

      component['userID'] = 'myId';
      component['userSecret'] = 'mySecret';

      component.addToWallet();

      tick();

      mockWalletService.getWallet.should.have.been.calledWith('xxx-myProfile');
      walletStub.contains.should.have.been.calledWith('myId');
      walletStub.update.should.have.been.calledWith('myId', 'mySecret');
      mockActiveModal.close.should.have.been.called;
    }));

    it('should handle error', fakeAsync(() => {
      let walletStub = {contains : sinon.stub().returns(Promise.reject('some error')), add : sinon.stub().returns(Promise.resolve())};
      mockWalletService.getWallet.returns(walletStub);

      component['userID'] = 'myId';
      component['userSecret'] = 'mySecret';

      component.addToWallet();

      tick();

      mockWalletService.getWallet.should.have.been.calledWith('xxx-myProfile');
      walletStub.contains.should.have.been.calledWith('myId');
      walletStub.add.should.not.have.been.called;
      mockActiveModal.dismiss.should.have.been.called;
    }));
  });
});
