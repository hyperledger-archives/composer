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
import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ClientService } from '../../services/client.service';
import { TransactionDeclaration } from 'composer-common';

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
    private submittedTransaction = null;
    private includeOptionalFields: boolean = false;

    private resourceDefinition: string = null;
    private submitInProgress: boolean = false;
    private definitionError: string = null;

    private codeConfig = {
        lineNumbers: true,
        lineWrapping: true,
        readOnly: false,
        mode: 'application/ld+json',
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
                private clientService: ClientService) {
    }

    ngOnInit() {
        let introspector = this.clientService.getBusinessNetwork().getIntrospector();
        this.transactionTypes = introspector.getClassDeclarations()
            .filter((modelClassDeclaration) => {
                // Non-abstract, non-system transactions only please!
                return !modelClassDeclaration.isAbstract() &&
                    !modelClassDeclaration.isSystemType() &&
                    modelClassDeclaration instanceof TransactionDeclaration;
            })
            .sort((a, b) => {
                if (a.getName() < b.getName()) {
                  return -1;
                } else if (a.getName() > b.getName()) {
                  return 1;
                } else {
                  return 0;
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
    }

    /**
     * Process the user selection of a TransactionType
     * @param {TransactionDeclaration} transactionType - the user selected TransactionDeclaration
     */
    onTransactionSelect(transactionType) {
        this.selectedTransaction = transactionType;
        this.selectedTransactionName = this.selectedTransaction.getName();
        this.resourceDefinition = null;
        this.includeOptionalFields = false;
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
        const generateParameters = {
            generate: withSampleData ? 'sample' : 'empty',
            includeOptionalFields: this.includeOptionalFields
        };
        let resource = factory.newTransaction(
            this.selectedTransaction.getModelFile().getNamespace(),
            this.selectedTransaction.getName(),
            undefined,
            generateParameters);
        let serializer = this.clientService.getBusinessNetwork().getSerializer();
        try {
            let replacementJSON = serializer.toJSON(resource);
            let existingJSON = JSON.parse(this.resourceDefinition);
            // remove hidden items from json
            this.hiddenTransactionItems.forEach((value, key) => {
                delete replacementJSON[key];
            });
            if (existingJSON) {
                this.resourceDefinition = JSON.stringify(this.updateExistingJSON(existingJSON, replacementJSON), null, 2);
            } else {
                // Initial popup, no previous data to protect
                this.resourceDefinition = JSON.stringify(replacementJSON, null, 2);
            }
            this.onDefinitionChanged();
        } catch (error) {
            // We can't generate a sample instance for some reason.
            this.definitionError = error.toString();
        }
    }

    private updateExistingJSON(previousJSON, toUpdateWithJSON): object {
        for (let key in toUpdateWithJSON) {
            if (previousJSON.hasOwnProperty(key) && toUpdateWithJSON.hasOwnProperty(key)) {
                if (previousJSON[key] !== null && typeof previousJSON[key] === 'object' && toUpdateWithJSON[key] !== null && typeof toUpdateWithJSON[key] === 'object') {
                    toUpdateWithJSON[key] = this.updateExistingJSON(previousJSON[key], toUpdateWithJSON[key]);
                } else if (previousJSON[key].toString().length > 0 && previousJSON[key] !== 0) {
                    toUpdateWithJSON[key] = previousJSON[key];
                }
            }
        }
        return toUpdateWithJSON;
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
                this.submittedTransaction = serializer.fromJSON(json);
                return this.clientService.getBusinessNetworkConnection().submitTransaction(this.submittedTransaction);
            })
            .then(() => {
                this.submitInProgress = false;
                this.definitionError = null;
                this.activeModal.close(this.submittedTransaction);
            })
            .catch((error) => {
                this.definitionError = error.toString();
                this.submitInProgress = false;
            });
    }
}
