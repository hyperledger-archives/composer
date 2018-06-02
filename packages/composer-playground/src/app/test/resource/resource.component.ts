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
import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ClientService } from '../../services/client.service';
import {
    AssetDeclaration,
    ClassDeclaration,
    Field,
    ParticipantDeclaration,
    TransactionDeclaration
} from 'composer-common';

import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/brace-fold';
import 'codemirror/addon/fold/comment-fold';
import 'codemirror/addon/fold/markdown-fold';
import 'codemirror/addon/fold/xml-fold';
import 'codemirror/addon/scroll/simplescrollbars';
import leftPad = require('left-pad');

@Component({
    selector: 'resource-modal',
    templateUrl: './resource.component.html',
    styleUrls: ['./resource.component.scss'.toString()]
})

export class ResourceComponent implements OnInit {

    @Input() registryId: string;
    @Input() resource: any = null;

    private resourceAction: string = null;
    private resourceType: string = null;
    private resourceDefinition: string = null;
    private resourceDeclaration: ClassDeclaration = null;
    private actionInProgress: boolean = false;
    private definitionError: string = null;
    private includeOptionalFields: boolean = false;

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
        // Determine what resource declaration we are using and stub json decription
        let introspector = this.clientService.getBusinessNetwork().getIntrospector();
        let modelClassDeclarations = introspector.getClassDeclarations();

        modelClassDeclarations.forEach((modelClassDeclaration) => {
            if (this.registryId === modelClassDeclaration.getFullyQualifiedName()) {

                // Set resource declaration
                this.resourceDeclaration = modelClassDeclaration;
                this.resourceType = this.retrieveResourceType(modelClassDeclaration);

                if (this.editMode()) {
                    this.resourceAction = 'Update';
                    let serializer = this.clientService.getBusinessNetwork().getSerializer();
                    this.resourceDefinition = JSON.stringify(serializer.toJSON(this.resource), null, 2);
                } else {
                    // Stub out json definition
                    this.resourceAction = 'Create New';
                    this.generateResource();
                }
            }
        });
    }

    /**
     * Validate json definition of resource
     */
    onDefinitionChanged() {
        try {
            let json = JSON.parse(this.resourceDefinition);
            let serializer = this.clientService.getBusinessNetwork().getSerializer();
            let resource = serializer.fromJSON(json);
            resource.validate();
            this.definitionError = null;
        } catch (error) {
            this.definitionError = error.toString();
        }
    }

    private editMode(): boolean {
        return (this.resource ? true : false);
    }

    /**
     * Returns true if the Identifying field of the Class that is being created has
     * a validator associated with it ie. its ID field must conform to a regex
     */
    private idFieldHasRegex() {
        // a non-null validator on an identifying field returns true
        let idf: Field = this.resourceDeclaration.getProperty(this.resourceDeclaration.getIdentifierFieldName());
        return idf.getValidator() ? true : false;
    }

    /**
     * Generate the json description of a resource
     */
    private generateResource(withSampleData ?: boolean): void {
        let businessNetworkDefinition = this.clientService.getBusinessNetwork();
        let factory = businessNetworkDefinition.getFactory();

        let id = '';
        if (!this.idFieldHasRegex()) {
            let idx = Math.round(Math.random() * 9999).toString();
            id = leftPad(idx, 4, '0');
        }

        try {
            const generateParameters = {
                generate: withSampleData ? 'sample' : 'empty',
                includeOptionalFields: this.includeOptionalFields,
                disableValidation: true,
                allowEmptyId: true
            };
            let resource = factory.newResource(
                this.resourceDeclaration.getModelFile().getNamespace(),
                this.resourceDeclaration.getName(),
                id,
                generateParameters);
            let serializer = this.clientService.getBusinessNetwork().getSerializer();
            const serializeValidationOptions = {
                validate: false
            };
            let replacementJSON = serializer.toJSON(resource, serializeValidationOptions);
            let existingJSON = JSON.parse(this.resourceDefinition);
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
     *  Create resource via json serialisation
     */
    private addOrUpdateResource(): void {
        this.actionInProgress = true;
        return this.retrieveResourceRegistry(this.resourceType)
            .then((registry) => {
                let json = JSON.parse(this.resourceDefinition);
                let serializer = this.clientService.getBusinessNetwork().getSerializer();
                let resource = serializer.fromJSON(json);
                resource.validate();
                if (this.editMode()) {
                    return registry.update(resource);
                } else {
                    return registry.add(resource);
                }
            })
            .then(() => {
                this.actionInProgress = false;
                this.activeModal.close();
            })
            .catch((error) => {
                this.definitionError = error.toString();
                this.actionInProgress = false;
            });
    }

    /**
     * Retrieve string description of resource type instance
     */
    private retrieveResourceType(modelClassDeclaration): string {
        if (modelClassDeclaration instanceof TransactionDeclaration) {
            return 'Transaction';
        } else if (modelClassDeclaration instanceof AssetDeclaration) {
            return 'Asset';
        } else if (modelClassDeclaration instanceof ParticipantDeclaration) {
            return 'Participant';
        }
    }

    /**
     * Retrieve a ResourceRegistry for the passed string resource type instance
     */
    private retrieveResourceRegistry(type) {

        let client = this.clientService;
        let id = this.registryId;

        function isAsset() {
            return client.getBusinessNetworkConnection().getAssetRegistry(id);
        }

        function isTransaction() {
            return client.getBusinessNetworkConnection().getTransactionRegistry(id);
        }

        function isParticipant() {
            return client.getBusinessNetworkConnection().getParticipantRegistry(id);
        }

        let types = {
            Asset: isAsset,
            Participant: isParticipant,
            Transaction: isTransaction
        };

        return types[type]();
    }
}
