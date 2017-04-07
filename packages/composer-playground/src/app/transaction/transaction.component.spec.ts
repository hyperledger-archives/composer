/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement, Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { TransactionComponent } from './transaction.component';
import { CodemirrorComponent } from 'ng2-codemirror';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ClientService } from './../services/client.service';
import { InitializationService } from './../initialization.service';

import {
  TransactionDeclaration,
  BusinessNetworkDefinition,
  Serializer,
  Factory,
  Resource,
  ModelFile,
  Introspector
} from 'composer-common';
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

describe('TransactionComponent', () => {
  let component: TransactionComponent;
  let fixture: ComponentFixture<TransactionComponent>;
  let mockNgbActiveModal;
  let mockClientService;
  let mockInitializationService;
  let mockTransaction;
  let mockBusinessNetwork;
  let mockBusinessNetworkConnection;
  let mockSerializer;
  let mockIntrospector;
  let mockFactory;
  let mockResource;

  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    mockNgbActiveModal = sinon.createStubInstance(NgbActiveModal);
    mockClientService = sinon.createStubInstance(ClientService);
    mockInitializationService = sinon.createStubInstance(InitializationService);
    mockBusinessNetwork = sinon.createStubInstance(BusinessNetworkDefinition);
    mockBusinessNetworkConnection = sinon.createStubInstance(BusinessNetworkConnection);
    mockSerializer = sinon.createStubInstance(Serializer);
    mockIntrospector = sinon.createStubInstance(Introspector);
    mockFactory = sinon.createStubInstance(Factory);
    mockResource = sinon.createStubInstance(Resource);
    mockClientService.getBusinessNetworkConnection.returns(mockBusinessNetworkConnection);
    mockClientService.getBusinessNetwork.returns(mockBusinessNetwork);
    mockBusinessNetwork.getSerializer.returns(mockSerializer);
    mockBusinessNetwork.getFactory.returns(mockFactory);
    mockBusinessNetwork.getIntrospector.returns(mockIntrospector);
    mockSerializer.toJSON.returns({
      '$class': 'mock.class',
      'timestamp': 'now',
      'transactionId': 'A'
    });
    mockBusinessNetworkConnection.submitTransaction = sandbox.stub();
    mockTransaction = sinon.createStubInstance(TransactionDeclaration);
    mockNgbActiveModal.close = sandbox.stub();
    mockInitializationService.initialize.returns(Promise.resolve());

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
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('#CodeMirror', () => {
    it('should call the correct functions', () => {
      let cm = {
        foldCode: sandbox.stub(),
        getCursor: sandbox.stub()
      };

      component['codeConfig'].extraKeys['Ctrl-Q'](cm);
      cm.foldCode.should.be.called;
      cm.getCursor.should.be.called;
    });
  });

  describe('#ngOnInit', () => {

    it('should set transactionTypes, selectedTransaction and hiddenTransactionItems',
    fakeAsync(() => {
      sandbox.stub(component, 'generateTransactionDeclaration');
      mockTransaction.isAbstract.returns(false);
      mockIntrospector.getClassDeclarations.returns([mockTransaction]);
      component.ngOnInit();
      tick();
      mockBusinessNetwork.getIntrospector.should.be.called;
      component['transactionTypes'].length.should.equal(1);
      component['generateTransactionDeclaration'].should.be.called;
    }));

    it('should not set transactionTypes, selectedTransaction and hiddenTransactionItems',
    fakeAsync(() => {
      mockIntrospector.getClassDeclarations.returns([]);
      component.ngOnInit();
      tick();
      mockBusinessNetwork.getIntrospector.should.be.called;
      component['transactionTypes'].length.should.equal(0);
    }));

    it('should not set transactionTypes when abstract class', fakeAsync(() => {
      sandbox.stub(component, 'generateTransactionDeclaration');
      mockTransaction.isAbstract.returns(true);
      mockIntrospector.getClassDeclarations.returns([mockTransaction]);
      component.ngOnInit();
      tick();
      mockBusinessNetwork.getIntrospector.should.be.called;
      component['transactionTypes'].length.should.equal(0);
    }));
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
    let mockModelFile;
    beforeEach(() => {
      mockModelFile = sinon.createStubInstance(ModelFile);
      mockModelFile.getNamespace.returns('com.test');
    });

    it('should generate valid transaction definition', () => {
      sandbox.stub(JSON, 'stringify');
      component['selectedTransaction'] = mockTransaction;
      mockTransaction.getIdentifierFieldName.returns('transactionId');
      mockTransaction.getModelFile.returns(mockModelFile);
      mockResource = sinon.createStubInstance(Resource);
      component['generateTransactionDeclaration']();

      mockSerializer.toJSON.should.be.called;
      JSON.stringify.should.be.called;
    });

    it('should remove hidden transactions', () => {
      component['selectedTransaction'] = mockTransaction;
      mockTransaction.getIdentifierFieldName.returns('transactionId');
      mockTransaction.getModelFile.returns(mockModelFile);
      mockResource = sinon.createStubInstance(Resource);
      component['hiddenTransactionItems'].set('transactionId', 'transactionId');
      component['hiddenTransactionItems'].set('timestamp', 'transactionId');

      component['generateTransactionDeclaration']();

      let resourceDefenition = component['resourceDefinition'];
      resourceDefenition = JSON.parse(resourceDefenition);

      mockSerializer.toJSON.should.be.called;
      should.not.exist(resourceDefenition['timestamp']);
      should.not.exist(resourceDefenition['transactionId']);
    });

    it('should set definitionError', () => {
      component['selectedTransaction'] = mockTransaction;
      mockTransaction.getIdentifierFieldName.returns('transactionId');
      mockTransaction.getModelFile.returns(mockModelFile);
      mockResource = sinon.createStubInstance(Resource);
      mockSerializer.toJSON = () => {
        throw new Error();
      };

      component['generateTransactionDeclaration']();
      component['definitionError'].should.not.be.null;

    });
  });

  describe('#onDefinitionChanged', () => {
    it('should validate a resource', () => {
      mockResource.validate = sandbox.stub();
      mockSerializer.fromJSON.returns(mockResource);
      component['resourceDefinition'] = JSON.stringify({
        '$class': 'mock.class',
        'timestamp':
        'now',
        'transactionId': 'A'
      });
      component['hiddenTransactionItems'].set('transactionId', 'transactionId');
      component['hiddenTransactionItems'].set('timestamp', 'transactionId');

      component['onDefinitionChanged']();
      should.not.exist(component['definitionError']);
      mockResource.validate.should.be.called;
    });

    it('should set definitionError', () => {
      mockSerializer.fromJSON = () => {
        throw new Error();
      };
      component['resourceDefinition'] = JSON.stringify({
        '$class': 'mock.class',
        'timestamp':
        'now',
        'transactionId': 'A'
      });
      component['hiddenTransactionItems'].set('transactionId', 'transactionId');
      component['hiddenTransactionItems'].set('timestamp', 'transactionId');

      component['onDefinitionChanged']();
      should.exist(component['definitionError']);
    });
  });

  describe('#submitTransaction', () => {
    it('should submit a transaction', fakeAsync(() => {
      mockSerializer.fromJSON.returns(mockResource);
      component['resourceDefinition'] = JSON.stringify({
        '$class': 'mock.class',
        'timestamp':
        'now',
        'transactionId': 'A'
      });
      component['selectedTransaction'] = mockTransaction;
      component['submitTransaction']();
      component['submitInProgress'].should.be.true;
      tick();
      tick();
      component['submitInProgress'].should.be.false;
      should.not.exist(component['definitionError']);
      mockNgbActiveModal.close.should.be.called;
    }));
  });

  it('should give set definitionError', fakeAsync(() => {
    component['resourceDefinition'] = 'error';
    component['submitTransaction']();
    tick();
    tick();
    should.exist(component['definitionError']);
    component['submitInProgress'].should.be.false;
  }));
});
