import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ClientService } from '../../services/client.service';
import { InitializationService } from '../../services/initialization.service';
import {
    ClassDeclaration,
    AssetDeclaration,
    ParticipantDeclaration,
    TransactionDeclaration
} from 'composer-common';
import leftPad = require('left-pad');

import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/brace-fold';
import 'codemirror/addon/fold/comment-fold';
import 'codemirror/addon/fold/markdown-fold';
import 'codemirror/addon/fold/xml-fold';
import 'codemirror/addon/scroll/simplescrollbars';

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
     * Generate the json description of a resource
     */
    private generateResource(withSampleData?: boolean): void {
        let businessNetworkDefinition = this.clientService.getBusinessNetwork();
        let factory = businessNetworkDefinition.getFactory();
        let idx = Math.round(Math.random() * 9999).toString();
        idx = leftPad(idx, 4, '0');
        let id = '';
        try {
            const generateParameters = {
                generate: withSampleData ? 'sample' : 'empty',
                includeOptionalFields: this.includeOptionalFields,
                disableValidation: true,
                allowEmptyStringId: true
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

            let json = serializer.toJSON(resource, serializeValidationOptions);
            this.resourceDefinition = JSON.stringify(json, null, 2);
            this.onDefinitionChanged();
        } catch (error) {
            // We can't generate a sample instance for some reason.
            this.definitionError = error.toString();
            this.resourceDefinition = '';
        }
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
