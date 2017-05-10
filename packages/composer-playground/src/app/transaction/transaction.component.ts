import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ClientService } from '../services/client.service';
import { InitializationService } from '../services/initialization.service';
import { TransactionDeclaration } from 'composer-common';
import leftPad = require('left-pad');

import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/brace-fold';
import 'codemirror/addon/fold/comment-fold';
import 'codemirror/addon/fold/markdown-fold';
import 'codemirror/addon/fold/xml-fold';
import 'codemirror/addon/scroll/simplescrollbars';

/* tslint:disable-next-line:no-var-requires */
const uuid = require('uuid');

@Component({
    selector: 'transaction-modal',
    templateUrl: './transaction.component.html',
    styleUrls: ['./transaction.component.scss'.toString()]
})

export class TransactionComponent implements OnInit {

    private transactionTypes: TransactionDeclaration[] = [];
    private selectedTransaction = null;
    private selectedTransactionName: string = null;
    private hiddenTransactionItems = new Map();

    private resourceDefinition: string = null;
    private submitInProgress: boolean = false;
    private definitionError: string = null;

    private codeConfig = {
        lineNumbers: true,
        lineWrapping: true,
        readOnly: false,
        mode: 'javascript',
        autofocus: true,
        extraKeys: {
            'Ctrl-Q': (cm) => {
                cm.foldCode(cm.getCursor());
            }
        },
        foldGutter: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
        scrollbarStyle: 'simple'
    };

    constructor(public activeModal: NgbActiveModal,
                private clientService: ClientService,
                private initializationService: InitializationService) {
    }

    ngOnInit(): Promise<any> {
        return this.initializationService.initialize()
        .then(() => {

            let introspector = this.clientService.getBusinessNetwork().getIntrospector();
            let modelClassDeclarations = introspector.getClassDeclarations();

            modelClassDeclarations.forEach((modelClassDeclaration) => {
                // Generate list of all known (non-abstract) transaction types
                if (!modelClassDeclaration.isAbstract() && modelClassDeclaration instanceof TransactionDeclaration) {
                    this.transactionTypes.push(modelClassDeclaration);
                }
            });

            // Set first in list as selectedTransaction
            if (this.transactionTypes && this.transactionTypes.length > 0) {
                this.selectedTransaction = this.transactionTypes[0];
                this.selectedTransactionName = this.selectedTransaction.getName();

                // We wish to hide certain items in a transaction, set these here
                this.hiddenTransactionItems.set(this.selectedTransaction.getIdentifierFieldName(), uuid.v4());
                this.hiddenTransactionItems.set('timestamp', new Date());

                // Create a resource definition for the base item
                this.generateTransactionDeclaration();
            }

        });
    }

    /**
     * Process the user selection of a TransactionType
     * @param {TransactionDeclaration} transactionType - the user selected TransactionDeclaration
     */
    onTransactionSelect(transactionType) {
        this.selectedTransaction = transactionType;
        this.selectedTransactionName = this.selectedTransaction.getName();
        this.generateTransactionDeclaration();
    }

    /**
     * Validate the definition of the TransactionDeclaration, accounting for hidden fields.
     */
    onDefinitionChanged() {
        try {
            let json = JSON.parse(this.resourceDefinition);
            // Add required items that are hidden from user
            this.hiddenTransactionItems.forEach((value, key) => {
                json[key] = value;
            });
            let serializer = this.clientService.getBusinessNetwork().getSerializer();
            let resource = serializer.fromJSON(json);
            resource.validate();
            this.definitionError = null;
        } catch (error) {
            this.definitionError = error.toString();
        }
    }

    /**
     * Generate a TransactionDeclaration definition, accounting for need to hide fields
     */
    private generateTransactionDeclaration(withSampleData?: boolean): void {
        let businessNetworkDefinition = this.clientService.getBusinessNetwork();
        let factory = businessNetworkDefinition.getFactory();
        const generateParameters = {generate: withSampleData ? 'sample' : 'empty'};
        let resource = factory.newTransaction(
            this.selectedTransaction.getModelFile().getNamespace(),
            this.selectedTransaction.getName(),
            undefined,
            generateParameters);
        let serializer = this.clientService.getBusinessNetwork().getSerializer();
        try {
            let json = serializer.toJSON(resource);
            // remove hidden items from json
            this.hiddenTransactionItems.forEach((value, key) => {
                delete json[key];
            });
            this.resourceDefinition = JSON.stringify(json, null, 2);
            this.onDefinitionChanged();
        } catch (error) {
            // We can't generate a sample instance for some reason.
            this.definitionError = error.toString();
        }
    }

    /**
     * Submit the TransactionDeclaration definition
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
            this.definitionError = null;
            this.activeModal.close();
        })
        .catch((error) => {
            this.definitionError = error.toString();
            this.submitInProgress = false;
        });
    }

}
