import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbActiveModal, NgbDropdown } from '@ng-bootstrap/ng-bootstrap';
import { ClientService } from '../../services/client.service';
import { InitializationService } from '../../initialization.service';
import { ClassDeclaration,  TransactionDeclaration } from 'composer-common';
import leftPad = require('left-pad');

import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/brace-fold';
import 'codemirror/addon/fold/comment-fold';
import 'codemirror/addon/fold/markdown-fold';
import 'codemirror/addon/fold/xml-fold';
import 'codemirror/addon/scroll/simplescrollbars';

const fabricComposerOwner = 'fabric-composer';
const fabricComposerRepository = 'sample-networks';

@Component({
  selector: 'transaction-modal',
  templateUrl: './transaction.component.html',
  styleUrls: ['./transaction.component.scss'.toString()]
})

export class TransactionComponent implements OnInit {

  private transactionTypes: TransactionDeclaration[] = [];
  private selectedTransaction = null;
  private selectedTransactionName: string = null;

  private resourceDefinition: string = null;
  private submitInProgress: boolean = false;
  private defitionError: string = null;

  private codeConfig = {
    lineNumbers: true,
    lineWrapping: true,
    readOnly: false,
    mode: 'javascript',
    autofocus: true,
    extraKeys: {
      'Ctrl-Q': function (cm) {
        cm.foldCode(cm.getCursor());
      }
    },
    foldGutter: true,
    gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
    scrollbarStyle: 'simple'
  };

  constructor(
    public activeModal: NgbActiveModal,
    private clientService: ClientService,
    private initializationService: InitializationService) {
  }

  ngOnInit(): Promise<any> {
    return this.initializationService.initialize()
      .then(() => {

        let introspector = this.clientService.getBusinessNetwork().getIntrospector();
        let modelClassDeclarations = introspector.getClassDeclarations();

        modelClassDeclarations.forEach((modelClassDeclaration) => {
          // Generate list of all known transaction types
          if (modelClassDeclaration instanceof TransactionDeclaration) {
            this.transactionTypes.push(modelClassDeclaration);
          }
        });

        // Set first in list as selectedTransaction
        if (this.transactionTypes) {
          this.selectedTransaction = this.transactionTypes[0];
          this.selectedTransactionName = this.selectedTransaction.getName();
        }

        // Stub out json definition
        this.resourceDefinition = this.generateResourceStub(this.selectedTransaction);

        // Run validator on json definition
        this.onDefinitionChanged();

      });
  }

  /**
   * Process the user selection of a TransactionType
   */
  onTransactionSelect(transactionType) {
    this.selectedTransaction = transactionType;
    this.selectedTransactionName = this.selectedTransaction.getName();
    this.resourceDefinition = this.generateResourceStub(this.selectedTransaction);
  }

  /**
   * Generate a stub resource definition
   */
  private generateResourceStub(transactionDeclaration)  : string {
    let stub = '';
    stub = '{\n  "$class": "' + transactionDeclaration.getFullyQualifiedName() + '"';
    let resourceProperties = transactionDeclaration.getProperties();
    resourceProperties.forEach((property) => {
      stub += ',\n  "' + property.getName() + '": ""';
    });
    stub += '\n}';
    return stub;
  }

  /**
   * Generate the json description of a resource
   */
  private generateResource(): void {
    let businessNetworkDefinition = this.clientService.getBusinessNetwork();
    let introspector = businessNetworkDefinition.getIntrospector();
    let factory = businessNetworkDefinition.getFactory();
    let idx = Math.round(Math.random() * 9999).toString();
    idx = leftPad(idx, 4, '0');
    let id = `${this.selectedTransaction.getIdentifierFieldName()}:${idx}`;
    let resource = factory.newResource(this.selectedTransaction.getModelFile().getNamespace(), this.selectedTransaction.getName(), id, { generate: true });
    let serializer = this.clientService.getBusinessNetwork().getSerializer();
    try {
      let json = serializer.toJSON(resource);
      this.resourceDefinition = JSON.stringify(json, null, 2);
      this.onDefinitionChanged();
    } catch (error) {
      // We can't generate a sample instance for some reason.
      this.defitionError = error.toString();
    }
  }

  /**
   * Validate json definition of resource
   */
  private onDefinitionChanged() {
    try {
      let json = JSON.parse(this.resourceDefinition);
      let serializer = this.clientService.getBusinessNetwork().getSerializer();
      let resource = serializer.fromJSON(json);
      resource.validate();
      this.defitionError = null;
    } catch (error) {
      this.defitionError = error.toString();
    }
  }

  /**
   * Submit the Transaction
   */
  private submitTransaction() {
    this.submitInProgress = true;
    return Promise.resolve()
      .then(() => {
        let json = JSON.parse(this.resourceDefinition);
        let serializer = this.clientService.getBusinessNetwork().getSerializer();
        let resource = serializer.fromJSON(json);
        return this.clientService.getBusinessNetworkConnection().submitTransaction(resource);
      })
      .then(() => {
        this.submitInProgress = false;
        this.defitionError = null;
        this.activeModal.close();
      })
      .catch((error) => {
        this.defitionError = error.toString();
        this.submitInProgress = false;
      })
  }

}
