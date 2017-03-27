/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement, Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { TransactionComponent } from './transaction.component';
import { CodemirrorComponent } from 'ng2-codemirror';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ClientService } from './../services/client.service';
import { InitializationService } from './../initialization.service';

import { TransactionDeclaration, BusinessNetworkDefinition, Serializer, Factory, Resource } from 'composer-common';
import { BusinessNetworkConnection, AssetRegistry, TransactionRegistry } from 'composer-client';

import * as chai from 'chai';
import * as sinon from 'sinon';
let should = chai.should();

@Component({
  selector: 'codemirror',
  template: ''
})
class MockCodeMirrorComponent {
  @Input() config: any;
}

fdescribe('TransactionComponent', () => {
  let component: TransactionComponent;
  let fixture: ComponentFixture<TransactionComponent>;
  let mockNgbActiveModal;
  let mockClientService;
  let mockInitializationService;
  let mockTransaction;
  let mockBusinessNetwork;
  let mockSerializer;
  let mockFactory;
  let mockResource;

  let sandbox;

  beforeEach(() => {
    mockNgbActiveModal = sinon.createStubInstance(NgbActiveModal);
    mockClientService = sinon.createStubInstance(ClientService);
    mockInitializationService = sinon.createStubInstance(InitializationService);
    mockBusinessNetwork = sinon.createStubInstance(BusinessNetworkDefinition);
    mockSerializer = sinon.createStubInstance(Serializer);
    mockFactory = sinon.createStubInstance(Factory);
    mockResource = sinon.createStubInstance(Resource);

    mockClientService.getBusinessNetwork.returns(mockBusinessNetwork);
    mockBusinessNetwork.getSerializer.returns(mockSerializer);
    mockSerializer.toJSON.returns({'$class': 'mock.class'});

    mockTransaction = sinon.createStubInstance(TransactionDeclaration);

    TestBed.configureTestingModule({
      imports: [
        FormsModule
      ],
      declarations: [
        TransactionComponent,
        MockCodeMirrorComponent
      ],
      providers: [
        { provide: NgbActiveModal, useValue: mockNgbActiveModal },
        { provide: ClientService, useValue: mockClientService },
        { provide: InitializationService, useValue: mockInitializationService },
      ]
    });
    fixture = TestBed.createComponent(TransactionComponent);
    component = fixture.componentInstance;
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('#ngOnInit', () => {

  });

  describe('#onTransactionSelect', () => {
    it('should call generateTransactionDeclaration', () => {
      sandbox.stub(component, 'generateTransactionDeclaration');
      let transactionName = 'mockTransaction';
      let transactionType = 'Transaction';
      mockTransaction.getName.returns(transactionName);

      component.onTransactionSelect(mockTransaction);
      component['selectedTransaction'].should.equal(mockTransaction);
      component['selectedTransactionName'].should.equal(transactionName);
      component['generateTransactionDeclaration'].should.be.called;
    });
  });

  describe('#generateTransactionDeclaration', () => {

  });

  describe('#onDefinitionChanged', () => {

  });

  describe('#submitTransaction', () => {

  });
});
