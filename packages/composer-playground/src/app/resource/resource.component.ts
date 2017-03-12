import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ClientService } from '../services/client.service';
import { InitializationService } from '../initialization.service';
import { ClassDeclaration, AssetDeclaration, ParticipantDeclaration, TransactionDeclaration } from 'composer-common';
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
  selector: 'resource-modal',
  templateUrl: './resource.component.html',
  styleUrls: ['./resource.component.scss'.toString()]
})

export class ResourceComponent implements OnInit {

  @Input() registryID: string;
  @Input() resource: any = null;

  private resourceAction: string = null;
  private resourceType: string = null;
  private resourceDefinition: string = null;
  private resourceDeclaration: ClassDeclaration = null;
  private actionInProgress: boolean = false;
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
    private route: ActivatedRoute,
    private clientService: ClientService,
    private initializationService: InitializationService) {
  }

  private editMode(): boolean {
      return (this.resource ? true : false);
  }

  ngOnInit(): Promise<any> {
    return this.initializationService.initialize()
      .then(() => {

        // Determine what resource declaration we are using and stub json decription
        let introspector = this.clientService.getBusinessNetwork().getIntrospector();
        let modelClassDeclarations = introspector.getClassDeclarations();

        modelClassDeclarations.forEach((modelClassDeclaration) => {
          if (this.registryID === modelClassDeclaration.getFullyQualifiedName()) {

            // Set resource declaration
            this.resourceDeclaration = modelClassDeclaration;
            this.resourceType = this.retrieveResourceType(modelClassDeclaration)

            if (this.editMode()) {
                this.resourceAction = 'Update';
                this.resourceDefinition = this.getResourceJSON();
            } else {
                // Stub out json definition
                this.resourceAction = 'Create New';
                this.resourceDefinition = this.generateDefinitionStub(this.registryID, modelClassDeclaration);
            }

            // Run validator on json definition
            this.onDefinitionChanged();
          }
        });

      });
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
    let id = `${this.resourceDeclaration.getIdentifierFieldName()}:${idx}`;
    let resource = factory.newResource(this.resourceDeclaration.getModelFile().getNamespace(), this.resourceDeclaration.getName(), id, { generate: true });
    let serializer = this.clientService.getBusinessNetwork().getSerializer();
    try {
      let json = serializer.toJSON(resource);
      this.resourceDefinition = JSON.stringify(json, null, 2);
      this.onDefinitionChanged();
    } catch (error) {
      // We can't generate a sample instance for some reason.
      this.defitionError = error.toString();
      this.resourceDefinition = this.generateDefinitionStub(this.registryID, this.resourceDeclaration);
    }
  }

  private getResourceJSON(): any {
    let serializer = this.clientService.getBusinessNetwork().getSerializer();
    return JSON.stringify(serializer.toJSON(this.resource), null, 2);
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
        if(this.editMode()) {
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
        this.defitionError = error.toString();
        this.actionInProgress = false;
      })
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
    } catch (e) {
      this.defitionError = e.toString();
    }
  }

  /**
   * Retrieve string description of resource type instance
   */
  private retrieveResourceType(modelClassDeclaration): string {
    if (modelClassDeclaration instanceof TransactionDeclaration) {
      return "Transaction";
    } else if (modelClassDeclaration instanceof AssetDeclaration) {
      return "Asset";
    } else if (modelClassDeclaration instanceof ParticipantDeclaration) {
      return "Participant";
    }
  }

  /**
   * Generate a stub resource definition
   */
  private generateDefinitionStub(registryID, modelClassDeclaration)  : string {
    let stub = '';
    stub = '{\n  "$class": "' + registryID + '"';
    let resourceProperties = modelClassDeclaration.getProperties();
    resourceProperties.forEach((property) => {
      stub += ',\n  "' + property.getName() + '": ""';
    });
    stub += '\n}';
    return stub;
  }

  /**
   * Retrieve a ResourceRegistry for the passed string resource type instance
   */
  private retrieveResourceRegistry(type) {

    let client =this.clientService;
    let id = this.registryID;

    function isAsset() {
      return client.getBusinessNetworkConnection().getAssetRegistry(id);
    }

    function isTransaction() {
      return client.getBusinessNetworkConnection().getTransactionRegistry();
    }

    function isParticipant() {
      return client.getBusinessNetworkConnection().getParticipantRegistry(id);
    }

    var types = {
      'Asset': isAsset,
      'Participant': isParticipant,
      'Transaction': isTransaction
    };

    return types[type]();

  }

}
